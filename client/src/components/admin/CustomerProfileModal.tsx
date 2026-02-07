import { useMemo } from 'react';
import { X, User, Phone, Mail, Award, Receipt, Calendar } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer } from '../../db/db';

interface CustomerProfileModalProps {
    customer: Customer;
    onClose: () => void;
}

export const CustomerProfileModal = ({ customer, onClose }: CustomerProfileModalProps) => {
    const transactions = useLiveQuery(() => db.transactions.where('customer_id').equals(customer.customer_id!).reverse().sortBy('timestamp'));
    const items = useLiveQuery(() => db.transaction_items.toArray());
    const pointsHistory = useLiveQuery(() => db.customer_points.where('customer_id').equals(customer.customer_id!).reverse().sortBy('timestamp'));

    const transactionItemsMap = useMemo(() => {
        const map = new Map<number, { count: number }>();
        if (!transactions || !items) return map;
        const itemGroups = items.reduce((acc, item) => {
            const list = acc.get(item.transaction_id) || [];
            list.push(item);
            acc.set(item.transaction_id, list);
            return acc;
        }, new Map<number, typeof items>());
        transactions.forEach(t => {
            if (t.transaction_id == null) return;
            const count = itemGroups.get(t.transaction_id)?.length || 0;
            map.set(t.transaction_id, { count });
        });
        return map;
    }, [transactions, items]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[900px] max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="text-blue-500" />
                        Customer Profile
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Customer ID</div>
                        <div className="font-semibold text-gray-900 dark:text-white">CUS-{String(customer.customer_id).padStart(4, '0')}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Points Balance</div>
                        <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                            <Award size={16} /> {customer.loyalty_points_balance}
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Spend</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{customer.total_spend_to_date.toFixed(2)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <User size={16} /> Details
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><User size={14} /> {customer.name}</div>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Phone size={14} /> {customer.phone}</div>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail size={14} /> {customer.email || '-'}</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Award size={16} /> Points History
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
                            {pointsHistory?.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                    <span className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        {new Date(p.timestamp).toLocaleString()}
                                    </span>
                                    <span className={p.points >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {p.points >= 0 ? '+' : ''}{p.points}
                                    </span>
                                </div>
                            ))}
                            {pointsHistory?.length === 0 && (
                                <div className="text-gray-500">No points history</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Receipt size={16} /> Bills & Sales History
                    </h3>
                    <div className="max-h-72 overflow-y-auto">
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
                                    <tr key={t.transaction_id} className="text-gray-700 dark:text-gray-300">
                                        <td className="py-2">#{t.transaction_id}</td>
                                        <td className="py-2">{new Date(t.timestamp).toLocaleString()}</td>
                                        <td className="py-2 text-right">{transactionItemsMap.get(t.transaction_id!)?.count || 0}</td>
                                        <td className="py-2 text-right">{t.tax_amount.toFixed(2)}</td>
                                        <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">{t.total_amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactions?.length === 0 && (
                            <div className="text-gray-500 text-sm py-4">No sales history</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
