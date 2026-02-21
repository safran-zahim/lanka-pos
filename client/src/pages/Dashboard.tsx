import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, Package, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl } from '../config/api';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const token = useAuthStore((state) => state.token);
    const [totalSales, setTotalSales] = useState(0);
    const [transactionCount, setTransactionCount] = useState(0);
    const [topSellers, setTopSellers] = useState<{ name: string, count: number }[]>([]);
    const [dailySummary, setDailySummary] = useState<null | {
        date?: string;
        total_sales: number;
        transaction_count: number;
    }>(null);
    const [monthlySummary, setMonthlySummary] = useState<null | {
        current: { total_sales: number; transaction_count: number };
        previous: { total_sales: number; transaction_count: number };
        percent_change: { total_sales: number | null; transaction_count: number | null };
    }>(null);

    const [sales, setSales] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;

        const loadSummaries = async () => {
            try {
                const [monthlyRes, dailyRes] = await Promise.all([
                    fetch(getApiUrl('/sales/monthly-summary'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/sales/daily-summary'), { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (monthlyRes.ok) {
                    const data = await monthlyRes.json();
                    setMonthlySummary(data);
                }

                if (dailyRes.ok) {
                    const data = await dailyRes.json();
                    setDailySummary(data);
                }
            } catch (error) {
                console.error('Failed to load sales summaries', error);
            }
        };

        loadSummaries();
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const loadOverview = async () => {
            try {
                const [salesRes, productsRes, lowStockRes] = await Promise.all([
                    fetch(getApiUrl('/sales?limit=200&includeItems=true'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/products'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/products/low-stock'), { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (salesRes.ok) setSales(await salesRes.json());
                if (productsRes.ok) setProducts(await productsRes.json());
                if (lowStockRes.ok) setLowStockItems(await lowStockRes.json());
            } catch (error) {
                console.error('Failed to load dashboard overview', error);
            }
        };

        loadOverview();
    }, [token]);

    useEffect(() => {
        if (!sales) return;

        const total = sales.reduce((sum, t) => sum + Number(t.total || 0), 0);
        setTotalSales(total);
        setTransactionCount(sales.length);

        const productCounts: Record<string, number> = {};
        sales.forEach((sale) => {
            (sale.items || []).forEach((item: any) => {
                const key = String(item.productId);
                productCounts[key] = (productCounts[key] || 0) + Number(item.quantity || 0);
            });
        });

        const sortedIds = Object.keys(productCounts)
            .sort((a, b) => productCounts[b] - productCounts[a])
            .slice(0, 5);

        const productMap = new Map((products || []).map(p => [String(p.id), p.name]));
        const topProducts = sortedIds.map(id => ({
            name: productMap.get(id) || 'Unknown',
            count: productCounts[id]
        }));

        setTopSellers(topProducts);
    }, [sales, products]);

    // Filter low stock items to show only active products
    const activeLowStockItems = (lowStockItems || []).filter(item => item.isActive !== false);

    const displayedDailySales = dailySummary?.total_sales ?? 0;
    const displayedDailyTransactions = dailySummary?.transaction_count ?? 0;
    const displayedMonthlySales = monthlySummary?.current.total_sales ?? totalSales;
    const displayedTransactionCount = monthlySummary?.current.transaction_count ?? transactionCount;
    const salesChange = monthlySummary?.percent_change.total_sales ?? null;
    const salesChangeLabel = salesChange === null
        ? 'No data last month'
        : `${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(1)}% from last month`;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 transition-colors">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/pos')} className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                        <ArrowLeft size={24} className="text-gray-600 dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Overview of your business performance</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/admin/purchases/new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm font-medium"
                    >
                        <Package size={18} />
                        New Purchase
                    </button>
                    <button
                        onClick={() => navigate('/pos')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all text-sm font-medium"
                    >
                        <DollarSign size={18} />
                        Open POS
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div
                    onClick={() => navigate('/admin/transactions')}
                    className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-colors relative overflow-hidden group cursor-pointer hover:shadow-md"
                >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-100 dark:bg-indigo-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 dark:text-indigo-300 font-bold">Today's Sales</h3>
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <Calendar size={24} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(dailySummary?.total_sales ?? 0)}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
                            {dailySummary?.transaction_count ?? 0} transactions today
                        </p>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/transactions')}
                    className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 p-6 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm transition-colors relative overflow-hidden group cursor-pointer hover:shadow-md"
                >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-green-100 dark:bg-green-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 dark:text-green-300 font-medium font-bold">Today's Sales</h3>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(displayedDailySales)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {displayedDailyTransactions} transactions today
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                            <TrendingUp size={12} /> Month: {formatCurrency(displayedMonthlySales)}
                        </p>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/transactions')}
                    className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm transition-colors relative overflow-hidden group cursor-pointer hover:shadow-md"
                >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-100 dark:bg-blue-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 dark:text-blue-300 font-medium font-bold">Transactions</h3>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{displayedTransactionCount}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Processed orders</p>
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/low-stock')}
                    className="bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 p-6 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm transition-colors cursor-pointer hover:shadow-md relative overflow-hidden group"
                >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-100 dark:bg-red-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 dark:text-red-300 font-medium font-bold">Low Stock Alerts</h3>
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                                <AlertTriangle size={24} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeLowStockItems?.length || 0}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">Items require attention</p>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Low Stock Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center space-x-2 text-gray-900 dark:text-white">
                            <AlertTriangle size={20} className="text-red-500" />
                            <span>Low Stock Items</span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4">Product</th>
                                    <th className="p-4">SKU</th>
                                    <th className="p-4">Stock</th>
                                    <th className="p-4">Reorder Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {activeLowStockItems?.map(item => (
                                    <tr key={item.id || item.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400">{item.skuCode || item.sku_code}</td>
                                        <td className="p-4 text-red-600 dark:text-red-400 font-bold">{item.stock ?? item.stock_quantity ?? 0}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-500">{item.reorderLevel ?? item.reorder_level ?? 0}</td>
                                    </tr>
                                ))}
                                {activeLowStockItems?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            All inventory levels are healthy.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Sellers */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold flex items-center space-x-2 text-gray-900 dark:text-white">
                            <TrendingUp size={20} className="text-blue-500" />
                            <span>Top Selling Items</span>
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {topSellers.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-gray-400 font-mono font-medium">#{index + 1}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                                        <Package size={16} className="text-gray-400" />
                                        <span>{item.count} Sold</span>
                                    </div>
                                </div>
                            ))}
                            {topSellers.length === 0 && (
                                <div className="text-center text-gray-500 dark:text-gray-400">No sales data yet.</div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
