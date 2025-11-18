import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const ConnectionContext = createContext(undefined);

export const ConnectionProvider = ({ children }) => {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const lastToastRef = useRef(null);

  // Test Supabase connection
  const testSupabaseConnection = useCallback(async () => {
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      return !error;
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      return false;
    }
  }, []);

  // Show toast with debouncing to avoid spam
  const showToast = useCallback((message, variant = 'default') => {
    const now = Date.now();
    if (!lastToastRef.current || now - lastToastRef.current > 3000) {
      toast({
        title: message,
        variant: variant,
      });
      lastToastRef.current = now;
    }
  }, [toast]);

  // Handle reconnection attempts with exponential backoff
  const attemptReconnection = useCallback(async () => {
    if (reconnecting) return;

    setReconnecting(true);
    reconnectAttemptsRef.current += 1;

    console.log(`Reconnection attempt ${reconnectAttemptsRef.current}...`);

    const isConnected = await testSupabaseConnection();

    if (isConnected) {
      setIsSupabaseConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      showToast('Connection restored', 'default');

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    } else {
      setReconnecting(false);

      // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);

      if (reconnectAttemptsRef.current <= 10) {
        reconnectTimerRef.current = setTimeout(() => {
          attemptReconnection();
        }, delay);
      } else {
        // After 10 attempts, stop and show error
        showToast('Unable to reconnect. Please check your connection.', 'destructive');
        reconnectAttemptsRef.current = 0;
      }
    }
  }, [reconnecting, testSupabaseConnection, showToast]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Network connection restored');
      setIsOnline(true);

      // Test Supabase connection when network comes back
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
        setIsSupabaseConnected(true);
        reconnectAttemptsRef.current = 0;
        showToast('Connection restored', 'default');
      } else {
        setIsSupabaseConnected(false);
        attemptReconnection();
      }
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      setIsOnline(false);
      setIsSupabaseConnected(false);
      showToast('Connection lost. Attempting to reconnect...', 'destructive');

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [testSupabaseConnection, attemptReconnection, showToast]);

  // Monitor Supabase connection periodically
  useEffect(() => {
    const checkConnection = async () => {
      if (!isOnline) return;

      const isConnected = await testSupabaseConnection();

      if (!isConnected && isSupabaseConnected) {
        console.log('Supabase connection lost');
        setIsSupabaseConnected(false);
        showToast('Connection lost. Attempting to reconnect...', 'destructive');
        attemptReconnection();
      } else if (isConnected && !isSupabaseConnected) {
        console.log('Supabase connection restored');
        setIsSupabaseConnected(true);
        reconnectAttemptsRef.current = 0;
        showToast('Connection restored', 'default');
      }
    };

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Initial check
    checkConnection();

    return () => clearInterval(interval);
  }, [isOnline, isSupabaseConnected, testSupabaseConnection, attemptReconnection, showToast]);

  // Listen to Supabase realtime connection status
  useEffect(() => {
    const channel = supabase.channel('connection-monitor');

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsSupabaseConnected(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setIsSupabaseConnected(false);
        if (isOnline) {
          attemptReconnection();
        }
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline, attemptReconnection]);

  const value = {
    isOnline,
    isSupabaseConnected,
    isConnected: isOnline && isSupabaseConnected,
    reconnecting,
    manualReconnect: attemptReconnection,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};
