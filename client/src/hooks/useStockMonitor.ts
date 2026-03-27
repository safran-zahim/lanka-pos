import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { getApiUrl } from '../config/api';

export const useStockMonitor = () => {
    const token = useAuthStore((state) => state.token);
    const { addNotification } = useNotificationStore();
    const lastCheckRef = useRef<number>(0);

    useEffect(() => {
        if (!token) return;

        const checkStock = async () => {
            // Only check every 5 minutes to avoid spamming the API
            if (Date.now() - lastCheckRef.current < 5 * 60 * 1000) return;
            
            try {
                const res = await fetch(getApiUrl('/reports/dashboard'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) return;

                const data = await res.json();
                const lowStockItems = data?.inventory?.lowStockItems || [];

                if (lowStockItems.length > 0) {
                    const count = lowStockItems.length;
                    addNotification({
                        type: 'warning',
                        title: 'Low Stock Alert',
                        message: `${count} item${count > 1 ? 's are' : ' is'} below reorder levels.`,
                        link: '/admin/low-stock'
                    });
                }
                
                lastCheckRef.current = Date.now();
            } catch (error) {
                console.error('Stock monitor failed', error);
            }
        };

        checkStock();
        const interval = setInterval(checkStock, 10 * 60 * 1000); // Check every 10 min
        return () => clearInterval(interval);
    }, [token, addNotification]);
};
