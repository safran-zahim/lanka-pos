import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, LogOut, ShoppingCart, FileText, Truck, Settings, HelpCircle, Menu, X, AlertTriangle, BarChart3, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useToast } from '../store/useToast';
import { useLocale } from '../hooks/useLocale';

export const AdminLayout = () => {
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const addToast = useToast((state) => state.addToast);
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [time, setTime] = useState(new Date());
    const settings = useLiveQuery(() => db.settings.toArray());
    const settingsMap = settings?.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, any>) || {};
    const brandName = settingsMap['companyName'] || 'TapLanka POS';
    const brandLogo = settingsMap['companyLogo'] || '';
    const { formatTime } = useLocale();

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        addToast('Logged out successfully', 'success');
    };

    const handleNavClick = () => {
        setIsMobileMenuOpen(false);
    };

    const navItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/products', icon: <Package size={20} />, label: 'Products' },
        ...(user?.role === 'admin'
            ? [{ path: '/admin/users', icon: <Users size={20} />, label: 'Users' }]
            : []),
        { path: '/admin/customers', icon: <Users size={20} />, label: 'Customers' },
        { path: '/admin/transactions', icon: <FileText size={20} />, label: 'Transactions' },
        { path: '/admin/suppliers', icon: <Truck size={20} />, label: 'Suppliers' },
        { path: '/admin/purchases', icon: <Package size={20} />, label: 'Purchases' },
        { path: '/admin/low-stock', icon: <AlertTriangle size={20} />, label: 'Low Stock' },
        { path: '/admin/reports', icon: <BarChart3 size={20} />, label: 'Reports' },
        { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
        { path: '/admin/receipts', icon: <FileText size={20} />, label: 'Receipts' },
        ...(user?.role === 'super_admin'
            ? [{ path: '/admin/plans', icon: <Shield size={20} />, label: 'Subscription Plans' }]
            : []),
        { path: '/admin/help', icon: <HelpCircle size={20} />, label: 'Help' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200 overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
                        <Menu size={24} />
                    </button>
                    {brandLogo && <img src={brandLogo} alt="Logo" className="h-6 w-6 object-contain" />}
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-500">{brandName}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/pos')}
                        className="hidden sm:flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                        <ShoppingCart size={14} />
                        POS
                    </button>
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                        {user?.username}
                    </div>
                    <ThemeToggle />
                    <button
                        onClick={handleLogout}
                        className="p-2 text-red-500 hover:text-red-600"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 md:flex hidden justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            {brandLogo && <img src={brandLogo} alt="Logo" className="h-8 w-8 object-contain" />}
                            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500">{brandName}</h1>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Admin Control Center</p>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-200 dark:border-gray-700 md:hidden flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <span className="font-bold text-gray-700 dark:text-gray-200">Menu</span>
                    <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200 pt-16 md:pt-0">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Welcome</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{user?.username}</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {formatTime(time)}
                        </div>
                        <button
                            onClick={() => navigate('/pos')}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <ShoppingCart size={18} />
                            <span>POS Terminal</span>
                        </button>
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
                <Outlet />
            </main>
        </div>
    );
};
