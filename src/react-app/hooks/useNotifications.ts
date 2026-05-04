import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { apiCall } = useApi();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiCall<Notification[]>('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiCall(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiCall('/notifications/mark-all-read', {
        method: 'POST',
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(), // Temporary ID
      user_id: 0, // Will be set by server
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);
    if (!newNotification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
};
