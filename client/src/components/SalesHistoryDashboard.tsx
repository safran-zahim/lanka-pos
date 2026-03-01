import { useEffect, useMemo, useState } from 'react';
import type { Transaction, Customer } from '../db/db';
import { ArrowDownLeft, ArrowUpRight, Download, RotateCcw, Search, Printer } from 'lucide-react';
import { ReturnModal } from './ReturnModal';
import { ReceiptModal } from './ReceiptModal';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { useLocale } from '../hooks/useLocale';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl } from '../config/api';

type PaymentFilter = 'all' | Transaction['payment_method'];

type DailySummary = {
    dateKey: string;
    dateLabel: string;
    salesCount: number;
    returnsCount: number;
    grossSales: number;
    returnsAmount: number;
    netSales: number;
    cashTotal: number;
    cardTotal: number;
    creditTotal: number;
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
    const token = useAuthStore((state) => state.token);

    const todayValue = toDateInputValue(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentFilter>('all');
    const [startDate, setStartDate] = useState(todayValue);
    const [endDate, setEndDate] = useState(todayValue);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedPrintTxn, setSelectedPrintTxn] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const isTransactionsRoute = window.location.pathname.includes('/transactions');
    const [activeTab, setActiveTab] = useState<'daily' | 'transactions' | 'products'>(isTransactionsRoute ? 'transactions' : 'daily');
    const [customers, setCustomers] = useState<Customer[]>([]);

    const range = useMemo(() => getRangeBounds(startDate, endDate), [startDate, endDate]);

    const [sales, setSales] = useState<any[]>([]);
    const saleItemsBySaleId = useMemo(() => {
        const map = new Map<string, any[]>();
        sales.forEach((sale) => {
            map.set(String(sale.id), sale.items || []);
        });
        return map;
    }, [sales]);

    useEffect(() => {
        if (!token) return;
        const loadSales = async () => {
            try {
                const url = getApiUrl(`/sales?start=${range.start.toISOString()}&end=${range.end.toISOString()}&includeItems=true&limit=200`);
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to load sales');
                const payload = await response.json();
                setSales(payload || []);

                const custResponse = await fetch(getApiUrl('/customers'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (custResponse.ok) setCustomers(await custResponse.json());
            } catch (error) {
                console.error('Failed to load sales', error);
            }
        };

        loadSales();
    }, [token, range.start, range.end]);

    const transactions = useMemo(() => {
        return (sales || []).map((sale: any) => ({
            transaction_id: sale.id,
            user_id: sale.staffId,
            customer_id: sale.customerId || undefined,
            timestamp: new Date(sale.createdAt),
            total_amount: Number(sale.total || 0),
            tax_amount: Number(sale.tax || 0),
            round_off_discount: Number(sale.roundOffDiscount || 0),
            payment_method: sale.paymentMethod || 'cash',
            status: 'completed',
            type: sale.parentSaleId ? 'return' : 'sale',
            parent_sale_id: sale.parentSaleId || undefined
        })) as Transaction[];
    }, [sales]);

    const filteredTransactions = useMemo(() => {
        const list = transactions ?? [];

        return list.filter((txn) => {
            const matchesSearch = txn.transaction_id?.toString().includes(searchQuery.trim()) ?? false;
            const matchesPayment = paymentMethod === 'all' ? true : txn.payment_method === paymentMethod;

            return matchesSearch && matchesPayment;
        });
    }, [transactions, searchQuery, paymentMethod]);

    const paginatedTransactions = useMemo(() => {
        return filteredTransactions
            .slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [filteredTransactions, currentPage, pageSize]);

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
                netSales: 0,
                cashTotal: 0,
                cardTotal: 0,
                creditTotal: 0
            };

            if (txn.type === 'return') {
                summary.returnsCount += 1;
                summary.returnsAmount += Math.abs(txn.total_amount);
                // For simplicity, returns are deducted from cash unless specified. 
                // But usually we just track net sales. 
                // Let's also track return payment methods if possible.
                if (txn.payment_method === 'cash') summary.cashTotal -= Math.abs(txn.total_amount);
                else if (txn.payment_method === 'card') summary.cardTotal -= Math.abs(txn.total_amount);
            } else {
                summary.salesCount += 1;
                summary.grossSales += Math.abs(txn.total_amount);

                if (txn.payment_method === 'split' && txn.payment_details) {
                    const details = txn.payment_details as any;
                    summary.cashTotal += Number(details.cashAmount || 0);
                    summary.cardTotal += Number(details.cardAmount || 0);
                } else if (txn.payment_method === 'cash') {
                    summary.cashTotal += txn.total_amount;
                } else if (txn.payment_method === 'card') {
                    summary.cardTotal += txn.total_amount;
                } else if (txn.payment_method === 'credit') {
                    summary.creditTotal += txn.total_amount;
                }
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

    const aggregatedProducts = useMemo(() => {
        const aggregation = new Map<string, {
            productId: string;
            name: string;
            sku: string;
            quantity: number;
            totalSales: number;
        }>();

        filteredTransactions.forEach((txn) => {
            const items = saleItemsBySaleId.get(String(txn.transaction_id)) || [];
            const multiplier = txn.type === 'return' ? -1 : 1;

            items.forEach((item: any) => {
                const productId = String(item.productId || item.product_id);
                const entry = aggregation.get(productId) ?? {
                    productId,
                    name: item.name || item.product?.name || 'Unknown Product',
                    sku: item.skuCode || item.sku_code || item.product?.skuCode || 'N/A',
                    quantity: 0,
                    totalSales: 0
                };

                entry.quantity += Number(item.quantity || 0) * multiplier;
                entry.totalSales += Number(item.quantity || 0) * Number(item.price || 0) * multiplier;
                aggregation.set(productId, entry);
            });
        });

        return Array.from(aggregation.values()).sort((a, b) => b.totalSales - a.totalSales);
    }, [filteredTransactions, saleItemsBySaleId]);

    const transactionsToDisplay = paginatedTransactions ?? [];

    const totalPages = Math.ceil(filteredTransactions.length / pageSize);

    const handleReset = () => {
        setSearchQuery('');
        setPaymentMethod('all');
        setStartDate(todayValue);
        setEndDate(todayValue);
        setCurrentPage(1);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
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

        const productRows = (aggregatedProducts ?? []).map((p) => ({
            ProductName: p.name,
            SKU: p.sku,
            QuantitySold: p.quantity,
            TotalSales: p.totalSales
        }));

        const workbook = XLSX.utils.book_new();
        const dailySheet = XLSX.utils.json_to_sheet(dailyRows);
        const transactionsSheet = XLSX.utils.json_to_sheet(transactionRows);
        const productsSheet = XLSX.utils.json_to_sheet(productRows);

        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Sales');
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products Sold');

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

            <div className="flex flex-col gap-4">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'daily'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        Daily Sales
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'transactions'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'products'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        Products Sold
                    </button>
                </div>

                {activeTab === 'daily' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Sales</h3>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[600px]">
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
                )}

                {activeTab === 'products' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Products Sold</h3>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Product</th>
                                        <th className="p-4 font-medium text-gray-500 dark:text-gray-400">SKU</th>
                                        <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Qty</th>
                                        <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {aggregatedProducts?.map((p) => (
                                        <tr key={p.productId}>
                                            <td className="p-4 text-gray-900 dark:text-white font-medium">{p.name}</td>
                                            <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{p.sku}</td>
                                            <td className="p-4 text-right text-gray-900 dark:text-white">
                                                {p.quantity % 1 === 0 ? p.quantity : p.quantity.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(p.totalSales)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!aggregatedProducts || aggregatedProducts.length === 0) && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="p-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                {!aggregatedProducts ? (
                                                    <div className="flex justify-center p-4">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                    </div>
                                                ) : "No products sold found for the selected filters."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex-1 min-h-0">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transactions</h3>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500 dark:text-gray-400">Show:</label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-sm text-gray-500 dark:text-gray-400">per page</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[800px]">
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
                                    {transactionsToDisplay.map((txn) => {
                                        const signedAmount = getSignedAmount(txn);
                                        const isReturn = txn.type === 'return';
                                        return (
                                            <tr
                                                key={txn.transaction_id}
                                                onClick={() => navigate(`/admin/transactions/${txn.transaction_id}`)}
                                                className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-0 ${isReturn ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${isReturn ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                            #{txn.transaction_id}
                                                        </span>
                                                        {isReturn && (
                                                            <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider flex flex-col gap-0.5 mt-0.5">
                                                                <span>Return</span>
                                                                {txn.parent_sale_id && (
                                                                    <span className="text-gray-500 dark:text-gray-400 font-medium normal-case">
                                                                        Ref: #{txn.parent_sale_id}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-500 dark:text-gray-400">
                                                    {formatDateTime(new Date(txn.timestamp))}
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isReturn
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                            }`}
                                                    >
                                                        {isReturn ? (
                                                            <ArrowDownLeft size={12} />
                                                        ) : (
                                                            <ArrowUpRight size={12} />
                                                        )}
                                                        {isReturn ? 'Return' : 'Sale'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 dark:text-gray-400">
                                                    {txn.payment_method}
                                                </td>
                                                <td
                                                    className={`p-4 text-right font-medium ${isReturn
                                                        ? 'text-red-600 dark:text-red-400 font-bold'
                                                        : 'text-gray-900 dark:text-white'
                                                        }`}
                                                >
                                                    {formatCurrency(signedAmount)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {!isReturn && (
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
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setSelectedPrintTxn(txn);
                                                        }}
                                                        className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors ml-2"
                                                        title="Print Receipt"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
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
                                                {(!paginatedTransactions && transactions) ? (
                                                    <div className="flex justify-center p-4">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                    </div>
                                                ) : "No transactions found for the selected filters."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {filteredTransactions.length > 0 && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`px-3 py-1 rounded-lg text-sm ${currentPage === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedTransaction && (
                <ReturnModal
                    saleId={selectedTransaction.transaction_id?.toString() || ''}
                    onClose={() => setSelectedTransaction(null)}
                    onSuccess={() => setSelectedTransaction(null)}
                />
            )}
            {selectedPrintTxn && (
                <ReceiptModal
                    transaction={{
                        ...selectedPrintTxn,
                        total_amount: Number(selectedPrintTxn.total_amount),
                        tax_amount: Number(selectedPrintTxn.tax_amount || 0),
                        payment_method: selectedPrintTxn.payment_method,
                        payment_details: selectedPrintTxn.payment_details
                    }}
                    items={(saleItemsBySaleId.get(String(selectedPrintTxn.transaction_id)) || []).map((i: any) => ({
                        ...i,
                        name: i.name || i.product?.name || 'Unknown Product',
                        price_at_sale: Number(i.price || 0)
                    }))}
                    customer={selectedPrintTxn.customer_id ? customers?.find(c => String(c.customer_id) === String(selectedPrintTxn.customer_id)) : null}
                    user={useAuthStore.getState().user}
                    onClose={() => setSelectedPrintTxn(null)}
                />
            )}
        </div>
    );
};
