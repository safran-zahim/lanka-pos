import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrency } from '../../hooks/useCurrency';
import { getApiUrl } from '../../config/api';
import { useToast } from '../../store/useToast';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Filter, Search } from 'lucide-react';

interface Transaction {
    id: string;
    date: string;
    type: 'IN' | 'OUT';
    category: string;
    amount: string | number;
    method: string;
    description: string;
}

export const TransactionsPage = () => {
    const { token } = useAuthStore();
    const { formatCurrency } = useCurrency();
    const { addToast } = useToast();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl('/transactions'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            } else {
                addToast('Failed to load transactions', 'error');
            }
        } catch (error) {
            addToast('Network error fetching transactions', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTransactions();
    }, [token]);

    const totalIn = transactions.filter(t => t.type === 'IN').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalOut = transactions.filter(t => t.type === 'OUT').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const netFlow = totalIn - totalOut;

    const filteredTransactions = transactions.filter(t => {
        if (filterType !== 'ALL' && t.type !== filterType) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return t.description.toLowerCase().includes(term) || t.category.toLowerCase().includes(term) || t.id.toLowerCase().includes(term);
        }
        return true;
    });

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto h-full flex flex-col pointer-events-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Money Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Unified view of all cash flow operations.</p>
                </div>
                <button
                    onClick={fetchTransactions}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium transition-colors shadow-sm text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 shrink-0">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                        <ArrowDownToLine className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Money IN</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalIn)}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                        <ArrowUpFromLine className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Money OUT</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalOut)}</p>
                    </div>
                </div>

                <div className={`rounded-xl p-5 shadow-sm flex items-center gap-4 text-white sm:col-span-2 lg:col-span-1 ${netFlow >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        {netFlow >= 0 ? <ArrowDownToLine className="w-6 h-6 text-white" /> : <ArrowUpFromLine className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                        <p className="text-sm font-medium opacity-90">Net Cash Flow</p>
                        <p className="text-2xl font-bold">{formatCurrency(Math.abs(netFlow))}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-t-xl border border-b-0 border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide shrink-0">
                    <button onClick={() => setFilterType('ALL')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'ALL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>All</button>
                    <button onClick={() => setFilterType('IN')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'IN' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Money IN</button>
                    <button onClick={() => setFilterType('OUT')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === 'OUT' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Money OUT</button>
                </div>
                <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-colors"
                    />
                </div>
            </div>

            {/* Unified Ledger Table */}
            <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1 h-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 shadow-sm z-10">
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                <th className="p-4 font-semibold">Date & ID</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold">Description</th>
                                <th className="p-4 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-10 dark:text-gray-400 text-sm">Loading ledger...</td></tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">No transactions found.</td></tr>
                            ) : (
                                filteredTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{tx.id}</div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${tx.type === 'IN'
                                                ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                                : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                                }`}>
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-900 dark:text-gray-300">{tx.description}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider">{tx.method}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`text-base font-bold ${tx.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {tx.type === 'IN' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
