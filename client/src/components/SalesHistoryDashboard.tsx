import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction } from '../db/db';
import { ArrowDownLeft, ArrowUpRight, Download, RotateCcw, Search } from 'lucide-react';
import { ReturnModal } from './ReturnModal';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { useLocale } from '../hooks/useLocale';
import * as XLSX from 'xlsx';

type PaymentFilter = 'all' | Transaction['payment_method'];

type DailySummary = {
    dateKey: string;
    dateLabel: string;
    salesCount: number;
    returnsCount: number;
    grossSales: number;
    returnsAmount: number;
    netSales: number;
};

const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getRangeBounds = (startValue: string, endValue: string) => {
    const start = new Date(`${startValue}T00:00:00`);
    const end = new Date(`${endValue}T23:59:59.999`);

    if (start > end) {
        return { start: end, end: start };
    }

    return { start, end };
};

const getSignedAmount = (transaction: Transaction) => {
    const value = Math.abs(transaction.total_amount);
    return transaction.type === 'return' ? -value : value;
};

export const SalesHistoryDashboard = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const { formatDate, formatDateTime } = useLocale();

    const todayValue = toDateInputValue(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentFilter>('all');
    const [startDate, setStartDate] = useState(todayValue);
    const [endDate, setEndDate] = useState(todayValue);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const transactions = useLiveQuery(() =>
        db.transactions.orderBy('timestamp').reverse().toArray()
    );

    const filteredTransactions = useMemo(() => {
        const list = transactions ?? [];
        const range = getRangeBounds(startDate, endDate);

        return list.filter((txn) => {
            const timestamp = new Date(txn.timestamp);
            const inRange = timestamp >= range.start && timestamp <= range.end;
            const matchesSearch = txn.transaction_id?.toString().includes(searchQuery.trim());
            const matchesPayment =
                paymentMethod === 'all' ? true : txn.payment_method === paymentMethod;

            return inRange && matchesSearch && matchesPayment;
        });
    }, [transactions, searchQuery, paymentMethod, startDate, endDate]);

    const dailySummaries = useMemo(() => {
        const map = new Map<string, DailySummary>();

        filteredTransactions.forEach((txn) => {
            const timestamp = new Date(txn.timestamp);
            const dateKey = toDateKey(timestamp);
            const dateLabel = formatDate(timestamp);
            const summary = map.get(dateKey) ?? {
                dateKey,
                dateLabel,
                salesCount: 0,
                returnsCount: 0,
                grossSales: 0,
                returnsAmount: 0,
                netSales: 0
            };

            if (txn.type === 'return') {
                summary.returnsCount += 1;
                summary.returnsAmount += Math.abs(txn.total_amount);
            } else {
                summary.salesCount += 1;
                summary.grossSales += Math.abs(txn.total_amount);
            }

            summary.netSales = summary.grossSales - summary.returnsAmount;
            map.set(dateKey, summary);
        });

        return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    }, [filteredTransactions, formatDate]);

    const totals = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, txn) => {
                const signedAmount = getSignedAmount(txn);
                acc.totalCount += 1;
                acc.netSales += signedAmount;
                acc.grossSales += txn.type === 'return' ? 0 : Math.abs(txn.total_amount);
                acc.returns += txn.type === 'return' ? Math.abs(txn.total_amount) : 0;
                return acc;
            },
            {
                totalCount: 0,
                netSales: 0,
                grossSales: 0,
                returns: 0
            }
        );
    }, [filteredTransactions]);

    const handleReset = () => {
        setSearchQuery('');
        setPaymentMethod('all');
        setStartDate(todayValue);
        setEndDate(todayValue);
    };

    const handleExport = () => {
        if (!filteredTransactions.length) {
            return;
        }

        const dailyRows = dailySummaries.map((summary) => ({
            Date: summary.dateLabel,
            SalesCount: summary.salesCount,
            ReturnsCount: summary.returnsCount,
            GrossSales: summary.grossSales,
            ReturnsAmount: summary.returnsAmount,
            NetSales: summary.netSales
        }));

        const transactionRows = filteredTransactions.map((txn) => ({
            TransactionId: txn.transaction_id ?? '',
            DateTime: formatDateTime(new Date(txn.timestamp)),
            Type: txn.type,
            Status: txn.status,
            PaymentMethod: txn.payment_method,
            Amount: getSignedAmount(txn),
            TaxAmount: txn.tax_amount,
            RoundOffDiscount: txn.round_off_discount ?? 0
        }));

        const workbook = XLSX.utils.book_new();
        const dailySheet = XLSX.utils.json_to_sheet(dailyRows);
        const transactionsSheet = XLSX.utils.json_to_sheet(transactionRows);

        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Sales');
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

        const fileName = `sales-history-${startDate}-to-${endDate}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Dashboard</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Daily sales overview with filters and export options.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleReset}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Reset Filters
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Download size={16} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Start date</label>
                        <input
                            type="date"
                            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">End date</label>
                        <input
                            type="date"
                            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment method</label>
                        <select
                            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                            value={paymentMethod}
                            onChange={(event) => setPaymentMethod(event.target.value as PaymentFilter)}
                        >
                            <option value="all">All</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="split">Split</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Search ID</label>
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search transaction ID"
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Net sales</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(totals.netSales)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{totals.totalCount} transactions</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Gross sales</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(totals.grossSales)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sales only</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Returns</p>
                    <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(totals.returns)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Returns only</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Sales</h3>
                </div>
                <div className="overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Sales</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Returns</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Net</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {dailySummaries.map((summary) => (
                                <tr key={summary.dateKey}>
                                    <td className="p-4 text-gray-900 dark:text-white">{summary.dateLabel}</td>
                                    <td className="p-4 text-right text-gray-900 dark:text-white">
                                        {formatCurrency(summary.grossSales)}
                                    </td>
                                    <td className="p-4 text-right text-orange-600 dark:text-orange-400">
                                        {formatCurrency(summary.returnsAmount)}
                                    </td>
                                    <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(summary.netSales)}
                                    </td>
                                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">
                                        {summary.salesCount + summary.returnsCount}
                                    </td>
                                </tr>
                            ))}
                            {!dailySummaries.length && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="p-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        No daily sales found for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex-1 min-h-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transactions</h3>
                </div>
                <div className="overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">ID</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Payment</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Amount</th>
                                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTransactions.map((txn) => {
                                const signedAmount = getSignedAmount(txn);
                                return (
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
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    txn.type === 'return'
                                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                }`}
                                            >
                                                {txn.type === 'return' ? (
                                                    <ArrowDownLeft size={12} />
                                                ) : (
                                                    <ArrowUpRight size={12} />
                                                )}
                                                {txn.type === 'return' ? 'Return' : 'Sale'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400">
                                            {txn.payment_method}
                                        </td>
                                        <td
                                            className={`p-4 text-right font-medium ${
                                                txn.type === 'return'
                                                    ? 'text-orange-600 dark:text-orange-400'
                                                    : 'text-gray-900 dark:text-white'
                                            }`}
                                        >
                                            {formatCurrency(signedAmount)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {txn.type === 'sale' && (
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
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
                                );
                            })}
                            {!filteredTransactions.length && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        No transactions found for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTransaction && (
                <ReturnModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    onSuccess={() => setSelectedTransaction(null)}
                />
            )}
        </div>
    );
};
