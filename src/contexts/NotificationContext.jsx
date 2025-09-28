import React, { createContext, useContext, useState, useMemo } from 'react';
import { useNotificationsData } from '../hooks/use-notifications-data';
const NotificationContext = createContext(undefined);
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
export const NotificationProvider = ({ children }) => {
    // Get real-time notifications from API data
    const { notifications: realTimeNotifications } = useNotificationsData();
    // Use real-time notifications but allow manual marking as read/deleting
    const [readNotifications, setReadNotifications] = useState(new Set());
    const [deletedNotifications, setDeletedNotifications] = useState(new Set());
    // Compute filtered notifications using useMemo to avoid infinite re-renders
    const notifications = useMemo(() => {
        if (!realTimeNotifications || realTimeNotifications.length === 0) {
            return [];
        }
        return realTimeNotifications
            .filter(notification => !deletedNotifications.has(notification.id))
            .map(notification => ({
            ...notification,
            isRead: readNotifications.has(notification.id)
        }));
    }, [realTimeNotifications, readNotifications, deletedNotifications]);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const addNotification = (notification) => {
        // For manual notifications, we can add them to a separate state if needed
        // For now, real-time notifications handle most cases
        console.log('Manual notification added:', notification);
    };
    const markAsRead = (id) => {
        try {
            setReadNotifications(prev => new Set(prev).add(id));
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };
    const markAllAsRead = () => {
        try {
            const allIds = notifications.map(n => n.id);
            setReadNotifications(new Set(allIds));
        }
        catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };
    const deleteNotification = (id) => {
        try {
            setDeletedNotifications(prev => new Set(prev).add(id));
        }
        catch (error) {
            console.error('Error deleting notification:', error);
        }
    };
    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };
    return (<NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>);
};
