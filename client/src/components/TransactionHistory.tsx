import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction } from '../db/db';
import { Search, RotateCcw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { ReturnModal } from './ReturnModal';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { useLocale } from '../hooks/useLocale';

export const TransactionHistory = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Get all transactions sorted by timestamp desc
    const transactions = useLiveQuery(() =>
        db.transactions.orderBy('timestamp').reverse().toArray()
    );

    const filteredTransactions = transactions?.filter(t =>
        t.transaction_id?.toString().includes(searchQuery)
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search ID..."
                        className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">ID</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Amount</th>
                            <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredTransactions?.map((txn) => (
                            <tr
                                key={txn.transaction_id}
                                onClick={() => navigate(`/admin/transactions/${txn.transaction_id}`)}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                            >
                                <td className="p-4 text-gray-900 dark:text-white">#{txn.transaction_id}</td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">
                                    {formatDateTime(new Date(txn.timestamp))}
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${txn.type === 'return'
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                        }`}>
                                        {txn.type === 'return' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                        {txn.type === 'return' ? 'Return' : 'Sale'}
                                    </span>
                                </td>
                                <td className={`p-4 text-right font-medium ${txn.type === 'return' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {formatCurrency(Math.abs(txn.total_amount))}
                                </td>
                                <td className="p-4 text-center">
                                    {txn.type === 'sale' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTransaction(txn);
                                            }}
                                            className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                            title="Return Items"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedTransaction && (
                <ReturnModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    onSuccess={() => {
                        setSelectedTransaction(null);
                        // Refresh logic if needed, but useLiveQuery handles it
                    }}
                />
            )}
        </div>
    );
};
