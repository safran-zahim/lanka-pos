import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, Package, DollarSign, Calendar, Shield, Users, ArrowUpRight, ArrowDownRight, Activity, ShoppingCart, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl } from '../config/api';
import { Button } from '../components/ui/Button';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

export const Dashboard = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [shiftData, setShiftData] = useState<any>(null);
    const [subInfo, setSubInfo] = useState<any>(null);

    const subscriptionStatus = String(user?.subscription_status || 'active').toLowerCase();
    const isSubscriptionInactive = user?.role !== 'super_admin' && subscriptionStatus !== 'active';

    useEffect(() => {
        if (!token) return;

        const loadData = async () => {
            try {
                const [insightsRes, shiftRes, subRes] = await Promise.all([
                    fetch(getApiUrl('/reports/dashboard'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/shifts/active'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/subscription/status'), { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (insightsRes.ok) setInsights(await insightsRes.json());
                if (shiftRes.ok) setShiftData(await shiftRes.json());
                if (subRes.ok) setSubInfo(await subRes.json());
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const heatmapData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
            label: 'Today\'s Sales Revenue',
            data: insights?.heatmap || [],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const categoryData = {
        labels: insights?.categories?.map((c: any) => c.name) || [],
        datasets: [{
            label: 'Sales by Category',
            data: insights?.categories?.map((c: any) => c.value) || [],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(139, 92, 246, 0.8)',
            ],
            borderWidth: 0
        }]
    };

    const brandData = {
        labels: insights?.brands?.map((b: any) => b.name) || [],
        datasets: [{
            label: 'Sales by Brand',
            data: insights?.brands?.map((b: any) => b.value) || [],
            backgroundColor: [
                'rgba(14, 165, 233, 0.8)',
                'rgba(99, 102, 241, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(244, 63, 94, 0.8)',
            ],
            borderWidth: 0
        }]
    };

    const crmData = {
        labels: ['New Customers', 'Returning Customers'],
        datasets: [{
            data: [insights?.crm?.new || 0, insights?.crm?.returning || 0],
            backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)'],
            hoverOffset: 4
        }]
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 transition-colors">
            {/* Header & Insight Bar */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Dashboard</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Real-time business intelligence</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 sm:gap-3">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => navigate('/admin/purchases/new')}
                            className="gap-2 px-4 text-sm font-bold uppercase tracking-wide"
                        >
                            <Package size={16} />
                            <span>Purchase</span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={isSubscriptionInactive ? 'secondary' : 'success'}
                            onClick={() => !isSubscriptionInactive && navigate('/pos')}
                            className={`gap-2 px-4 text-sm font-bold uppercase tracking-wide ${isSubscriptionInactive ? 'cursor-not-allowed' : ''}`}
                            disabled={isSubscriptionInactive}
                        >
                            <DollarSign size={16} />
                            <span>{isSubscriptionInactive ? 'POS Locked' : 'POS'}</span>
                        </Button>
                    </div>
                </div>

                {/* THE PULSE (Stylized Summary Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-blue-100 dark:bg-blue-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Today's Revenue</h3>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(insights?.pulse?.todayRevenue || 0)}</p>
                                <ArrowUpRight size={14} className="text-green-500 font-bold" />
                            </div>
                        </div>
                    </div>

                    {/* Profit Card */}
                    <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 p-6 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-green-100 dark:bg-green-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Today's Profit</h3>
                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(insights?.pulse?.todayProfit || 0)}</p>
                        </div>
                    </div>

                    {/* ATV Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-indigo-100 dark:bg-indigo-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">ATV (Avg Ticket)</h3>
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <ShoppingCart size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(insights?.pulse?.atv || 0)}</p>
                        </div>
                    </div>

                    {/* Inventory Value Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 p-6 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-purple-100 dark:bg-purple-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Inventory Value</h3>
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Award size={20} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(insights?.pulse?.inventoryValue || 0)}</p>
                        </div>
                    </div>

                    {/* Stock Health Card */}
                    <div className={`p-6 rounded-xl border shadow-sm relative overflow-hidden group ${insights?.inventory?.lowStockCount > 0 ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 border-red-100 dark:border-red-900/30' : 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 border-emerald-100 dark:border-emerald-900/30'}`}>
                        <div className={`absolute right-0 top-0 w-16 h-16 ${insights?.inventory?.lowStockCount > 0 ? 'bg-red-100 dark:bg-red-800/20' : 'bg-emerald-100 dark:bg-emerald-800/20'} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Stock Health</h3>
                                <div className={`p-2 rounded-lg ${insights?.inventory?.lowStockCount > 0 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>
                                    {insights?.inventory?.lowStockCount > 0 ? <AlertTriangle size={20} /> : <Shield size={20} />}
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{insights?.inventory?.lowStockCount > 0 ? 'Warning' : 'Excellent'}</p>
                            {insights?.inventory?.lowStockCount > 0 && <p className="text-[10px] font-bold text-red-600 mt-1 uppercase">{insights?.inventory?.lowStockCount} Items Low</p>}
                        </div>
                    </div>
                </div>
            </div>

            {isSubscriptionInactive && (
                <div className="mb-6 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                    <h2 className="text-lg font-bold text-red-700 dark:text-red-300">Subscription Expired</h2>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">System is inactive. Contact developer to continue POS operations.</p>
                </div>
            )}

            {/* Top Performers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><Award size={20} />Top Performing Products</h3>
                        <span className="text-xs text-gray-400 uppercase font-bold">Last 30 Days</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="pb-3">Product</th>
                                    <th className="pb-3 text-right">Sold</th>
                                    <th className="pb-3 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {insights?.inventory?.topSellers?.map((p: any) => (
                                    <tr key={p.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                        <td className="py-3 font-bold text-sm text-gray-700 dark:text-gray-300">{p.name}</td>
                                        <td className="py-3 text-right font-black text-gray-900 dark:text-white">{p.quantity}</td>
                                        <td className="py-3 text-right font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(p.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-600 dark:text-orange-400"><Clock size={20} />Slow Movers</h3>
                        <div className="space-y-3">
                            {insights?.inventory?.slowMovers?.length === 0 ? (
                                <p className="text-xs text-gray-500">No slow movers identified.</p>
                            ) : (
                                insights?.inventory?.slowMovers?.map((p: any) => (
                                    <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium truncate w-32">{p.name}</span>
                                        <span className="font-bold text-orange-600">{p.stock} In Stock</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Sales Heatmap */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Calendar size={20} className="text-blue-500" />Peak Sales Hours</h3>
                        <span className="text-xs text-gray-400">Today's Traffic</span>
                    </div>
                    <div className="h-[250px]">
                        <Line
                            data={heatmapData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, grid: { display: false } },
                                    x: { grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Sub & Shift Summary */}
                <div className="space-y-6">
                    <div className={`p-6 rounded-xl border shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all ${subInfo?.isNeverEnd ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30' : (subInfo?.daysRemaining ?? 99) <= 7 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30'}`} onClick={() => navigate('/admin/plans')}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-gray-600 dark:text-gray-300">Subscription</h3>
                                <p className="text-2xl font-black">{subInfo?.isNeverEnd ? 'Lifetime' : `${subInfo?.daysRemaining ?? 0} Days Left`}</p>
                            </div>
                            <Shield size={32} className={subInfo?.isNeverEnd ? 'text-purple-600' : (subInfo?.daysRemaining ?? 0) <= 7 ? 'text-red-600' : 'text-green-600'} />
                        </div>
                        <p className="text-xs text-gray-500">{subInfo?.paymentCycle} billing · {subInfo?.status || 'Active'}</p>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" onClick={() => navigate('/pos')}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-gray-600 dark:text-gray-300">Register Drawer</h3>
                                <p className="text-2xl font-black">{shiftData ? formatCurrency(shiftData.expectedCash) : 'Closed'}</p>
                            </div>
                            <DollarSign size={32} className="text-green-600" />
                        </div>
                        <p className="text-xs text-gray-500">{shiftData ? 'Active shift estimated cash' : 'Open shift in POS to start selling'}</p>
                    </div>
                </div>
            </div>

            {/* Bottom Row Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Product Intelligence */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400"><TrendingUp size={20} />Category Mix</h3>
                    <div className="h-[200px]">
                        <Doughnut
                            data={categoryData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>

                {/* Brand Mix */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-purple-600 dark:text-purple-400"><Package size={20} />Brand Distribution</h3>
                    <div className="h-[200px]">
                        <Doughnut
                            data={brandData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>

                {/* Customer Insights */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><Users size={20} />CRM Insights</h3>
                    <div className="h-[200px]">
                        <Bar
                            data={crmData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { display: false } } }
                            }}
                        />
                    </div>
                </div>

                {/* Inventory Alerts moved out to satisfy space if needed, or keeping them here */}
            </div>
        </div>
    );
};
