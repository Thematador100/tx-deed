import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/customSupabaseClient';
import { useAuth } from './SupabaseAuthContext';
import { useToast } from '../components/ui/use-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new;

          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
          });

          // Play notification sound (optional)
          playNotificationSound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new;

          // Update notification in list
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );

          // Update unread count
          setUnreadCount(prev => {
            const wasRead = payload.old?.read;
            const isNowRead = updatedNotification.read;
            if (!wasRead && isNowRead) return Math.max(0, prev - 1);
            if (wasRead && !isNowRead) return prev + 1;
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          const wasUnread = !payload.old.read;

          // Remove from notifications list
          setNotifications(prev => prev.filter(n => n.id !== deletedId));

          // Update unread count
          if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78O2VSBAOUZ/h8rplHgU3kdfy0IM3CBlpvO7omUwPDVCn4/C2YhwGOZHX8syQPgkUX7Xo66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78O2VSBAOUZ/h8rplHgU3kdfy0IM3CBlpvO7omUwPDVCn4/C2YhwGOZHX8syQPgkUX7Xo66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78O2VSBAOUZ/h8rplHgU3kdfy0IM3CBlpvO7omUwPDVCn4/C2YhwGOZHX8syQPgkUX7Xo66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78O2VSBAOUZ/h8rplHgU3kdfy0IM3CBlpvO7omUwPDVCn4/C2YhwGOZHX8syQPgkUX7Xo66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78O2VSBAOUZ/h8rplHgU3kdfy0IM3CBlpvO7omUwPDVCn4/C2YhwGOZHX8syQPgkUX7Xo66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78O2VSBAOUZ/h8rplHgU3kdfy0IM3CBlpvO7omUwPDVCn4/C2YhwGOZHX8syQPgkUX7Xo66hVFApGn+DyvmwhBSuBzvLZiTYIGWi78O2VSBAOUZ/h8rplHgU3kdfy0IM3CBlpvO7omUwPDVCn4/C2YhwGOJHY8s+PPwoVYLbp7KpWFApFn+DyvW0hBSuBzvLZizcJGGi77O+WShAOU6Di8bhkHgY4jtjy0IQ4ChVhuOrsq1YVCkWf4PK9bSEEK4HO8tmJNwkYaLvs75ZKD');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if browser blocks autoplay
    } catch (error) {
      // Silently fail if audio doesn't work
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notification as read',
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark all notifications as read',
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete notification',
      });
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'All notifications cleared',
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear notifications',
      });
    }
  };

  // Create a notification (for testing or manual triggers)
  const createNotification = async ({ type, title, message, link, metadata = {} }) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          link,
          metadata,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create notification',
      });
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createNotification,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
