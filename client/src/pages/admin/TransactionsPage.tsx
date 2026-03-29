import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrency } from '../../hooks/useCurrency';
import { getApiUrl } from '../../config/api';
import { useToast } from '../../store/useToast';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Filter, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
                    <h1 className="text-2xl font-bold text-foreground">Money Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">Unified view of all cash flow operations.</p>
                </div>
                <Button
                    variant="secondary"
                    onClick={fetchTransactions}
                    disabled={isLoading}
                    className="flex items-center gap-2 font-medium"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 shrink-0">
                <div className="bg-card text-card-foreground rounded-xl p-5 border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                        <ArrowDownToLine className="w-6 h-6 text-success" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Money IN</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalIn)}</p>
                    </div>
                </div>

                <div className="bg-card text-card-foreground rounded-xl p-5 border border-border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                        <ArrowUpFromLine className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Money OUT</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(totalOut)}</p>
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
            <div className="bg-card text-card-foreground p-4 rounded-t-xl border border-b-0 border-border flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide shrink-0">
                    <Button variant={filterType === 'ALL' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilterType('ALL')} className="rounded-full">All</Button>
                    <Button variant={filterType === 'IN' ? 'success' : 'secondary'} size="sm" onClick={() => setFilterType('IN')} className="rounded-full">Money IN</Button>
                    <Button variant={filterType === 'OUT' ? 'danger' : 'secondary'} size="sm" onClick={() => setFilterType('OUT')} className="rounded-full">Money OUT</Button>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                    <Input
                        type="text"
                        placeholder="Search transactions..."
                        icon={<Search size={16} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Unified Ledger Table */}
            <div className="bg-card text-card-foreground rounded-b-xl shadow-sm border border-border flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1 h-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 bg-muted shadow-sm z-10">
                            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
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
                                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground text-sm">No transactions found.</td></tr>
                            ) : (
                                filteredTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-accent hover:text-accent-foreground/50 transition-colors">
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-foreground">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5 font-mono">{tx.id}</div>
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
                                            <div className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{tx.method}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`text-base font-bold ${tx.type === 'IN' ? 'text-success' : 'text-destructive'}`}>
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
