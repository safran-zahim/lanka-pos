import React, { useState, useEffect } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuthStore } from '../store/useAuthStore';
import { SubscriptionIndicator } from '../components/shared/SubscriptionIndicator';
import { Button } from '../components/ui/Button';
import { NotificationCenter } from '../components/NotificationCenter';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../hooks/useLocale';
import { useStockMonitor } from '../hooks/useStockMonitor';
import { getApiUrl } from '../config/api';
import { PageShell } from '../components/layout/PageShell';

import { APP_CONFIG } from '../config/appConfig';

export const POSLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [time, setTime] = useState(new Date());
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    useStockMonitor();
    const token = useAuthStore((state) => state.token);
    const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
    useEffect(() => {
        const loadSettings = async () => {
            if (!token) return;
            try {
                const response = await fetch(getApiUrl('/settings'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) return;
                const settingsList = await response.json();
                const map = (settingsList || []).reduce((acc: Record<string, any>, setting: any) => {
                    acc[setting.key] = setting.value;
                    return acc;
                }, {});
                setSettingsMap(map);
            } catch (error) {
                console.error('Failed to load settings', error);
            }
        };

        loadSettings();
    }, [token]);
    const brandName = settingsMap['companyName'] || settingsMap['receiptHeader'] || APP_CONFIG.appName;
    const logoUrl = settingsMap['companyLogo'] || settingsMap['receiptLogo'] || '';
    const showLogo = Boolean(logoUrl) || settingsMap['showLogo'] || false;
    const { formatTime } = useLocale();
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col overflow-hidden">
            {/* Header / Status Bar */}
            <header className="fixed top-0 left-0 right-0 h-12 bg-white dark:bg-gray-800 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 z-50">
                <div className="flex items-center space-x-3">
                    {showLogo && logoUrl && (
                        <img src={logoUrl} alt="Logo" className="h-7 w-7 object-contain" />
                    )}
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{brandName}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Staff: <span className="text-gray-900 dark:text-white font-medium">{user?.username || 'Guest'}</span> ({user?.role})
                    </span>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                    {/* Admin Dashboard Link */}
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            size="sm"
                            className="h-8 text-xs font-bold"
                        >
                            Dashboard
                        </Button>
                    )}

                    <SubscriptionIndicator />
                    <NotificationCenter />
                    <ThemeToggle />


                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-300 font-mono">
                        <Clock size={16} />
                        <span className="hidden sm:inline">{formatTime(time)}</span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="h-8 px-2 text-red-600 dark:text-red-400 border-0"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden pt-12">
                <PageShell className="max-w-none p-0 sm:p-0">
                    {children}
                </PageShell>
            </main>
        </div>
    );
};
