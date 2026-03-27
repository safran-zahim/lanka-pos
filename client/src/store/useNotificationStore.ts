import { create } from 'zustand';

export interface AppNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    link?: string;
}

interface NotificationState {
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    addNotification: (notification) => set((state) => {
        // Prevent duplicate recent identical notifications
        const isDuplicate = state.notifications.slice(0, 5).some(
            n => n.title === notification.title && n.message === notification.message
        );
        if (isDuplicate) return state;

        return {
            notifications: [
                {
                    ...notification,
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date(),
                    read: false
                },
                ...state.notifications
            ].slice(0, 50) // Keep last 50
        };
    }),
    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),
    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
    })),
    clearAll: () => set({ notifications: [] })
}));
