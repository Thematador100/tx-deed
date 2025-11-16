import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, ArrowLeft, Filter } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../lib/utils';

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState('all');

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    let timeAgo;
    if (diffInSeconds < 60) timeAgo = 'Just now';
    else if (diffInSeconds < 3600) timeAgo = `${Math.floor(diffInSeconds / 60)}m ago`;
    else if (diffInSeconds < 86400) timeAgo = `${Math.floor(diffInSeconds / 3600)}h ago`;
    else if (diffInSeconds < 604800) timeAgo = `${Math.floor(diffInSeconds / 86400)}d ago`;
    else timeAgo = date.toLocaleDateString();

    const fullDate = date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return { timeAgo, fullDate };
  };

  const getNotificationIcon = (type) => {
    const icons = {
      property: '🏠',
      auction: '⚖️',
      deal: '💼',
      system: '🔔',
      message: '💬',
      payment: '💳',
      alert: '⚠️',
    };
    return icons[type] || '🔔';
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const notificationTypes = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'property', label: 'Properties' },
    { value: 'auction', label: 'Auctions' },
    { value: 'deal', label: 'Deals' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-b from-purple-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Notifications
                </h1>
                <p className="text-slate-600">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : "You're all caught up!"}
                </p>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all read
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearAllNotifications}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="grid grid-cols-6 w-full">
                  {notificationTypes.map((type) => (
                    <TabsTrigger key={type.value} value={type.value}>
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-slate-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bell className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No notifications
                </h3>
                <p className="text-slate-600 text-center">
                  {filter === 'unread'
                    ? "You don't have any unread notifications"
                    : filter === 'all'
                    ? "You don't have any notifications yet"
                    : `You don't have any ${filter} notifications`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const { timeAgo, fullDate } = formatDateTime(notification.created_at);
                const NotificationWrapper = notification.link ? Link : 'div';
                const wrapperProps = notification.link ? { to: notification.link } : {};

                return (
                  <NotificationWrapper
                    key={notification.id}
                    {...wrapperProps}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <Card
                      className={cn(
                        'transition-all hover:shadow-md cursor-pointer',
                        !notification.read && 'border-l-4 border-l-blue-600 bg-blue-50/50'
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="text-4xl flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h3
                                className={cn(
                                  'text-lg font-semibold text-slate-900',
                                  !notification.read && 'font-bold'
                                )}
                              >
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                            <p className="text-slate-700 mb-3">{notification.message}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span title={fullDate}>{timeAgo}</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                                {notification.type}
                              </span>
                            </div>
                            <div className="flex gap-3 mt-4">
                              {!notification.read && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark as read
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </NotificationWrapper>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
