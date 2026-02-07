import { useEffect, useState } from 'react';
import { db } from '../db/db';
import { ArrowLeft, TrendingUp, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { useLiveQuery } from 'dexie-react-hooks';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const [totalSales, setTotalSales] = useState(0);
    const [transactionCount, setTransactionCount] = useState(0);
    const [topSellers, setTopSellers] = useState<{ name: string, count: number }[]>([]);

    const transactions = useLiveQuery(() => db.transactions.filter(t => t.status === 'completed').toArray());
    const transactionItems = useLiveQuery(() => db.transaction_items.toArray());
    const products = useLiveQuery(() => db.products.toArray());

    // Fetch Low Stock Items
    const lowStockItems = useLiveQuery(
        () => db.products.filter(p => p.stock_quantity <= p.reorder_level).toArray()
    );

    useEffect(() => {
        if (!transactions || !transactionItems) return;

        const total = transactions.reduce((sum, t) => sum + t.total_amount, 0);
        setTotalSales(total);
        setTransactionCount(transactions.length);

        const productCounts: Record<number, number> = {};
        transactionItems.forEach(item => {
            productCounts[item.product_id] = (productCounts[item.product_id] || 0) + item.quantity;
        });

        const sortedIds = Object.keys(productCounts)
            .sort((a, b) => productCounts[Number(b)] - productCounts[Number(a)])
            .slice(0, 5);

        const productMap = new Map(products?.map(p => [p.product_id!, p.name]) || []);
        const topProducts = sortedIds.map(id => ({
            name: productMap.get(Number(id)) || 'Unknown',
            count: productCounts[Number(id)]
        }));

        setTopSellers(topProducts);
    }, [transactions, transactionItems, products]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 p-6 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm transition-colors relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-green-100 dark:bg-green-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 dark:text-green-300 font-medium font-bold">Total Sales</h3>
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSales)}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> +12% from last month
                        </p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm transition-colors relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-100 dark:bg-blue-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 dark:text-blue-300 font-medium font-bold">Transactions</h3>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{transactionCount}</p>
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
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{lowStockItems?.length || 0}</p>
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
                                {lowStockItems?.map(item => (
                                    <tr key={item.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400">{item.sku_code}</td>
                                        <td className="p-4 text-red-600 dark:text-red-400 font-bold">{item.stock_quantity}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-500">{item.reorder_level}</td>
                                    </tr>
                                ))}
                                {lowStockItems?.length === 0 && (
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
