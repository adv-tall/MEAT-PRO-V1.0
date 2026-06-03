import React, { createContext, useContext, useState, useEffect } from 'react';

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'qa';

export interface Notification {
  id: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  category: string;
  timestamp: Date;
  isRead: boolean;
  actionLink?: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    title: 'MIXER-A TEMPERATURE HIGH',
    description: 'Mixing Line 1 core motor is drawing 15% high current. Temperature reached 82°C (alert: 75°C). Please inspect before batch failure.',
    severity: 'critical',
    category: 'MACHINERY',
    timestamp: new Date(Date.now() - 4 * 60 * 1000), // 4 mins ago
    isRead: false,
    actionLink: '/problem/machine'
  },
  {
    id: 'n-2',
    title: 'NEW PRODUCTION ORDER RELEASED',
    description: 'Planning PL released Standard Formula Meatball Order #PL-2026-089 (Forming Line 2). Scheduled shift starts in 2 hours.',
    severity: 'info',
    category: 'PLANNING',
    timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
    isRead: false,
    actionLink: '/planning/pl'
  },
  {
    id: 'n-3',
    title: 'PASTEURIZE TEMP DROP LIMIT',
    description: 'Cooking Tank B report: temperature dropped below 84.5°C threshold during batch CK-102. Quality check initiated.',
    severity: 'qa',
    category: 'QUALITY',
    timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 mins ago
    isRead: false,
    actionLink: '/analytics/quality'
  },
  {
    id: 'n-4',
    title: 'PACKING CONVEYOR DELAY ALERT',
    description: 'Conveyor packing belt #3 reports speed sync mismatch. Automatic speed adjustment throttled. Backlog: 240 units.',
    severity: 'warning',
    category: 'PRODUCTION',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
    isRead: true,
    actionLink: '/board/packing'
  },
  {
    id: 'n-5',
    title: 'AI RUN COMPLETED: RESCHEDULING',
    description: 'AI Production Assistant has optimized Mixing sequence to minimize allergen cleaning downtime. Savings: +18 mins efficiency.',
    severity: 'info',
    category: 'AI PLANNER',
    timestamp: new Date(Date.now() - 3.5 * 3600 * 1000), // 3.5 hours ago
    isRead: true,
    actionLink: '/planning/ai'
  }
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('meatpro_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (e) {
      console.error("Error reading notifications from localStorage", e);
    }
    return SEED_NOTIFICATIONS;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    localStorage.setItem('meatpro_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Simulated engine: generate new realistic production alerts occasionally to feel live and interactive
  useEffect(() => {
    const alertTemplates = [
      {
        title: 'LINE 3 COOKING STEAM DEV',
        description: 'Quality sensor CK-3 reports 3% reduction in steam pressure. Monitor core temperature.',
        severity: 'qa' as const,
        category: 'QUALITY',
        actionLink: '/analytics/quality'
      },
      {
        title: 'MIXER-B CYCLE COMPLETED',
        description: 'Batch MX-082 finished mixing standard pork formula. Ready for discharge to Forming Line 1.',
        severity: 'info' as const,
        category: 'PRODUCTION',
        actionLink: '/board/mixing'
      },
      {
        title: 'PACKING FILM EXHAUSTION WARN',
        description: 'Line 2 packing machine wrapping film is critical (< 5% supply). Shift operator alerted.',
        severity: 'warning' as const,
        category: 'MACHINERY',
        actionLink: '/board/packing'
      },
      {
        title: 'UNPLANNED STOP DETECTED',
        description: 'Line 1 Sausage cutter experienced clear-feed block. Maintenance ticket #MT-488 logged.',
        severity: 'critical' as const,
        category: 'MACHINERY',
        actionLink: '/problem/machine'
      }
    ];

    const interval = setInterval(() => {
      // 15% chance to trigger an alert every 45s
      if (Math.random() < 0.15) {
        const randomIndex = Math.floor(Math.random() * alertTemplates.length);
        const template = alertTemplates[randomIndex];
        addNotification(template);
      }
    }, 45 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
