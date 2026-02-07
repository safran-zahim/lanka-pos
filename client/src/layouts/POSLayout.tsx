import React, { useState, useEffect } from 'react';
import { Clock, LogOut } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useLocale } from '../hooks/useLocale';

export const POSLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [time, setTime] = useState(new Date());
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const settings = useLiveQuery(() => db.settings.toArray());
    const settingsMap = settings?.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, any>) || {};
    const brandName = settingsMap['companyName'] || settingsMap['receiptHeader'] || 'Lanka POS';
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
        navigate('/login');
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
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                            Dashboard
                        </button>
                    )}

                    <ThemeToggle />


                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-300 font-mono">
                        <Clock size={16} />
                        <span className="hidden sm:inline">{formatTime(time)}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden pt-12">
                {children}
            </main>
        </div>
    );
};
