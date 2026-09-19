import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { NotificationItem, EngineStatus } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  engineStatus: EngineStatus | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [items, unreadData] = await Promise.all([
        api.getNotifications(50, 0),
        api.getUnreadNotificationCount()
      ]);
      setNotifications(items);
      setUnreadCount(unreadData.unread_count);
    } catch {
      // ignore
    }
  }, [user]);

  const refreshEngineStatus = useCallback(async () => {
    try {
      const status = await api.getEngineStatus();
      setEngineStatus(status);
    } catch {
      // fallback
      setEngineStatus({
        is_live: false,
        provider: 'offline_reasoning_engine',
        model: 'deterministic-academic-engine',
        display_badge: 'OFFLINE REASONING',
        description: 'Deterministic University Academic Reasoning Engine (Offline Safe)',
      });
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      refreshEngineStatus();
      const interval = setInterval(refreshNotifications, 15000); // 15s poll for alerts
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, refreshNotifications, refreshEngineStatus]);

  const markAsRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        engineStatus,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
