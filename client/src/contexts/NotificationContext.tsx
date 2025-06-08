import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  category: 'system' | 'user' | 'inventory' | 'financial' | 'orders';
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'Panadol Advance is running low (only 15 units remaining)',
      timestamp: '2 minutes ago',
      isRead: false,
      category: 'inventory',
      priority: 'high',
      actionUrl: '/inventory'
    },
    {
      id: '2',
      type: 'success',
      title: 'Payment Received',
      message: 'Payment of EGP 15,240 received from Cairo Medical Center',
      timestamp: '15 minutes ago',
      isRead: false,
      category: 'financial',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'info',
      title: 'New User Registration',
      message: 'Ahmed Hassan has registered as a new Sales Representative',
      timestamp: '1 hour ago',
      isRead: true,
      category: 'user',
      priority: 'low'
    },
    {
      id: '4',
      type: 'error',
      title: 'Product Expired',
      message: 'Cataflam 500mg batch #CTF-456 has expired (expired 3 days ago)',
      timestamp: '2 hours ago',
      isRead: false,
      category: 'inventory',
      priority: 'high'
    },
    {
      id: '5',
      type: 'success',
      title: 'Order Completed',
      message: 'Production order #PO-2024-158 has been completed successfully',
      timestamp: '3 hours ago',
      isRead: true,
      category: 'orders',
      priority: 'medium'
    },
    {
      id: '6',
      type: 'warning',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight at 2:00 AM',
      timestamp: '4 hours ago',
      isRead: false,
      category: 'system',
      priority: 'medium'
    },
    {
      id: '7',
      type: 'error',
      title: 'Failed Payment',
      message: 'Payment from Alexandria Pharmacy failed - requires attention',
      timestamp: '5 hours ago',
      isRead: false,
      category: 'financial',
      priority: 'high'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: 'Just now'
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = () => {
    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};