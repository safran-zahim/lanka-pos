import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Award, Receipt, Calendar, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';

export const CustomerProfilePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const token = useAuthStore((state) => state.token);
    const [customer, setCustomer] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [pointsHistory, setPointsHistory] = useState<any[]>([]);

    useEffect(() => {
        if (!id || !token) return;
        const loadCustomer = async () => {
            try {
                const response = await fetch(getApiUrl(`/customers/${id}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to load customer');
                const payload = await response.json();
                setCustomer(payload);
                setTransactions(payload.sales || []);
                setPointsHistory(payload.pointsLedger || []);
            } catch (error) {
                console.error('Failed to load customer profile', error);
            }
        };

        loadCustomer();
    }, [id, token]);

    const transactionItemsMap = useMemo(() => {
        const map = new Map<string, { count: number }>();
        (transactions || []).forEach((t) => {
            const count = (t.items || []).length || 0;
            map.set(String(t.id || t.transaction_id), { count });
        });
        return map;
    }, [transactions]);

    if (!customer) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/admin/customers')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Customer Profile</h1>
                </div>
                <div className="text-gray-500 dark:text-gray-400">Customer not found.</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/customers')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Profile</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">CUS-{String(customer.id || customer.customer_id).padStart(4, '0')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm text-white/80">Customer</div>
                            <div className="text-2xl font-bold">{customer.name}</div>
                            <div className="text-sm text-white/80">CUS-{String(customer.id || customer.customer_id).padStart(4, '0')}</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                        <div className="bg-white/15 px-3 py-2 rounded-lg flex items-center gap-2">
                            <Phone size={14} /> {customer.phone}
                        </div>
                        <div className="bg-white/15 px-3 py-2 rounded-lg flex items-center gap-2">
                            <Mail size={14} /> {customer.email || '-'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Points Balance</div>
                    <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                        <Award size={20} /> {customer.pointsBalance ?? customer.loyalty_points_balance}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total Spend</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign size={20} /> {Number(customer.totalSpend ?? customer.total_spend_to_date ?? 0).toFixed(2)}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Transactions</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {transactions?.length || 0}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Last Purchase</div>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {transactions?.[0] ? new Date(transactions[0].createdAt || transactions[0].timestamp).toLocaleString() : 'No purchases'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Receipt size={16} /> Sales History
                    </h2>
                    <div className="max-h-[420px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-2 text-left">Bill #</th>
                                    <th className="py-2 text-left">Date</th>
                                    <th className="py-2 text-right">Items</th>
                                    <th className="py-2 text-right">Tax</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {transactions?.map(t => (
                                    <tr
                                        key={t.id || t.transaction_id}
                                        className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                        onClick={() => navigate(`/admin/transactions/${t.id || t.transaction_id}`)}
                                    >
                                        <td className="py-2">#{t.id || t.transaction_id}</td>
                                        <td className="py-2">{new Date(t.createdAt || t.timestamp).toLocaleString()}</td>
                                        <td className="py-2 text-right">{transactionItemsMap.get(String(t.id || t.transaction_id))?.count || 0}</td>
                                        <td className="py-2 text-right">{Number(t.tax || t.tax_amount || 0).toFixed(2)}</td>
                                        <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{Number(t.total || t.total_amount || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactions?.length === 0 && (
                            <div className="text-gray-500 text-sm py-4">No sales history</div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Award size={16} /> Points History
                    </h2>
                    <div className="max-h-[420px] overflow-y-auto space-y-2 text-sm">
                        {pointsHistory?.map(p => (
                            <div key={p.id} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                <span className="flex items-center gap-2">
                                    <Calendar size={12} /> {new Date(p.createdAt || p.timestamp).toLocaleString()}
                                </span>
                                <span className={Number(p.points || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {Number(p.points || 0) >= 0 ? '+' : ''}{p.points}
                                </span>
                            </div>
                        ))}
                        {pointsHistory?.length === 0 && (
                            <div className="text-gray-500">No points history</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
