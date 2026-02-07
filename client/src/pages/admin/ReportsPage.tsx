import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { BarChart3, Calendar, Package, Users, Truck, TrendingDown, Download } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';

const formatDateInput = (d: Date) => d.toISOString().split('T')[0];

const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const endOfWeek = (date: Date) => {
    const d = startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const toCsv = (headers: string[], rows: (string | number)[][]) => {
    const escapeCell = (value: string | number) => {
        const str = String(value ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const lines = [headers.map(escapeCell).join(','), ...rows.map(r => r.map(escapeCell).join(','))];
    return lines.join('\n');
};

const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const ReportsPage = () => {
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const transactions = useLiveQuery(() => db.transactions.orderBy('timestamp').reverse().toArray());
    const transactionItems = useLiveQuery(() => db.transaction_items.toArray());
    const products = useLiveQuery(() => db.products.toArray());
    const customers = useLiveQuery(() => db.customers.toArray());
    const suppliers = useLiveQuery(() => db.suppliers.toArray());
    const purchases = useLiveQuery(() => db.purchases.toArray());

    const [salesMode, setSalesMode] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
    const [customFrom, setCustomFrom] = useState(formatDateInput(new Date()));
    const [customTo, setCustomTo] = useState(formatDateInput(new Date()));
    const [profitThreshold, setProfitThreshold] = useState(-1);
    const [supplierFilter, setSupplierFilter] = useState<number | ''>('');

    const productMap = useMemo(() => new Map((products || []).map(p => [p.product_id!, p])), [products]);
    const customerMap = useMemo(() => new Map((customers || []).map(c => [c.customer_id!, c])), [customers]);
    const supplierMap = useMemo(() => new Map((suppliers || []).map(s => [s.supplier_id!, s])), [suppliers]);

    const [fromDate, toDate] = useMemo(() => {
        const now = new Date();
        if (salesMode === 'daily') {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            return [start, end];
        }
        if (salesMode === 'weekly') {
            return [startOfWeek(now), endOfWeek(now)];
        }
        if (salesMode === 'monthly') {
            return [startOfMonth(now), endOfMonth(now)];
        }
        return [new Date(customFrom), new Date(customTo + 'T23:59:59')];
    }, [salesMode, customFrom, customTo]);

    const salesTransactions = (transactions || []).filter(t => t.type === 'sale');

    const filteredSales = salesTransactions.filter(t => {
        const ts = new Date(t.timestamp).getTime();
        return ts >= fromDate.getTime() && ts <= toDate.getTime();
    });

    const salesSummary = useMemo(() => {
        const total = filteredSales.reduce((sum, t) => sum + t.total_amount, 0);
        const tax = filteredSales.reduce((sum, t) => sum + t.tax_amount, 0);
        return { total, tax, count: filteredSales.length };
    }, [filteredSales]);

    const lowStockItems = useMemo(() => {
        return (products || []).filter(p => {
            const alertLevel = typeof p.alert_quantity === 'number' ? p.alert_quantity : (p.reorder_level ?? 0);
            const isManaged = p.manage_stock !== false;
            return isManaged && p.stock_quantity <= alertLevel;
        });
    }, [products]);

    const lowProfitItems = useMemo(() => {
        if (!transactionItems || !products) return [];
        const salesLineItems = transactionItems.filter(i => i.quantity > 0);
        const profitByProduct = new Map<number, { name: string; qty: number; profit: number }>();
        for (const item of salesLineItems) {
            const product = productMap.get(item.product_id);
            if (!product) continue;
            const profit = (item.price_at_sale - product.cost_price) * item.quantity;
            const current = profitByProduct.get(item.product_id) || { name: product.name, qty: 0, profit: 0 };
            current.qty += item.quantity;
            current.profit += profit;
            profitByProduct.set(item.product_id, current);
        }
        const result = Array.from(profitByProduct.entries()).map(([product_id, data]) => ({
            product_id,
            ...data
        }));
        return result
            .filter(r => r.profit <= profitThreshold)
            .sort((a, b) => a.profit - b.profit);
    }, [transactionItems, productMap, profitThreshold, products]);

    const customerReport = useMemo(() => {
        const data = new Map<number, { name: string; total: number; count: number }>();
        for (const txn of salesTransactions) {
            if (!txn.customer_id) continue;
            const customer = customerMap.get(txn.customer_id);
            if (!customer) continue;
            const current = data.get(txn.customer_id) || { name: customer.name, total: 0, count: 0 };
            current.total += txn.total_amount;
            current.count += 1;
            data.set(txn.customer_id, current);
        }
        return Array.from(data.entries())
            .map(([customer_id, d]) => ({ customer_id, ...d }))
            .sort((a, b) => b.total - a.total);
    }, [salesTransactions, customerMap]);

    const supplierReport = useMemo(() => {
        const filteredPurchases = (purchases || []).filter(p => (supplierFilter ? p.supplier_id === supplierFilter : true));
        const bySupplier = new Map<number, { name: string; total: number; items: number }>();
        const byProduct = new Map<number, { name: string; qty: number; total: number }>();

        for (const purchase of filteredPurchases) {
            if (!purchase.supplier_id) continue;
            const supplier = supplierMap.get(purchase.supplier_id);
            if (supplier) {
                const current = bySupplier.get(purchase.supplier_id) || { name: supplier.name, total: 0, items: 0 };
                current.total += purchase.cost_price * purchase.quantity;
                current.items += purchase.quantity;
                bySupplier.set(purchase.supplier_id, current);
            }

            const product = productMap.get(purchase.product_id);
            if (product) {
                const current = byProduct.get(purchase.product_id) || { name: product.name, qty: 0, total: 0 };
                current.qty += purchase.quantity;
                current.total += purchase.cost_price * purchase.quantity;
                byProduct.set(purchase.product_id, current);
            }
        }

        return {
            suppliers: Array.from(bySupplier.entries()).map(([supplier_id, d]) => ({ supplier_id, ...d })),
            products: Array.from(byProduct.entries()).map(([product_id, d]) => ({ product_id, ...d }))
        };
    }, [purchases, supplierFilter, supplierMap, productMap]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300">
                    <BarChart3 size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Centralized reporting dashboard</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-500">Sales Total</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(salesSummary.total)}</div>
                    <div className="text-xs text-gray-500">Transactions: {salesSummary.count}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-500">Tax Collected</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(salesSummary.tax)}</div>
                    <div className="text-xs text-gray-500">Period: {fromDate.toLocaleDateString()} - {toDate.toLocaleDateString()}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-500">Low Stock Items</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockItems.length}</div>
                    <div className="text-xs text-gray-500">Needs attention</div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                        <Calendar size={18} /> Sales Report
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => downloadCsv(
                                `sales-report-${formatDateInput(fromDate)}-to-${formatDateInput(toDate)}.csv`,
                                ['Transaction ID', 'Date', 'Customer', 'Total'],
                                filteredSales.map(txn => [
                                    `#${txn.transaction_id}`,
                                    formatDateTime(new Date(txn.timestamp)),
                                    txn.customer_id ? (customerMap.get(txn.customer_id)?.name || 'Unknown') : 'Walk-in',
                                    txn.total_amount.toFixed(2)
                                ])
                            )}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                        <select
                            value={salesMode}
                            onChange={(e) => setSalesMode(e.target.value as any)}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="custom">Custom</option>
                        </select>
                        {salesMode === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                                />
                                <input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="py-2 text-left">ID</th>
                                <th className="py-2 text-left">Date</th>
                                <th className="py-2 text-left">Customer</th>
                                <th className="py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredSales.map(txn => (
                                <tr key={txn.transaction_id} className="text-gray-700 dark:text-gray-300">
                                    <td className="py-2">#{txn.transaction_id}</td>
                                    <td className="py-2">{formatDateTime(new Date(txn.timestamp))}</td>
                                    <td className="py-2">{txn.customer_id ? (customerMap.get(txn.customer_id)?.name || 'Unknown') : 'Walk-in'}</td>
                                    <td className="py-2 text-right font-medium">{formatCurrency(txn.total_amount)}</td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-gray-500">No sales in this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                            <Package size={18} /> Low Stock Report
                        </div>
                        <button
                            onClick={() => downloadCsv(
                                `low-stock-report-${formatDateInput(new Date())}.csv`,
                                ['Product', 'Stock', 'Alert Level'],
                                lowStockItems.map(item => [
                                    item.name,
                                    item.stock_quantity,
                                    typeof item.alert_quantity === 'number' ? item.alert_quantity : (item.reorder_level ?? 0)
                                ])
                            )}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-2 text-left">Product</th>
                                    <th className="py-2 text-center">Stock</th>
                                    <th className="py-2 text-center">Alert</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {lowStockItems.map(item => (
                                    <tr key={item.product_id} className="text-gray-700 dark:text-gray-300">
                                        <td className="py-2">{item.name}</td>
                                        <td className="py-2 text-center">{item.stock_quantity}</td>
                                        <td className="py-2 text-center">{typeof item.alert_quantity === 'number' ? item.alert_quantity : (item.reorder_level ?? 0)}</td>
                                    </tr>
                                ))}
                                {lowStockItems.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-6 text-center text-gray-500">No low stock items.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                            <TrendingDown size={18} /> Low Profit Report
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                Profit ≤
                                <input
                                    type="number"
                                    className="w-24 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1"
                                    value={profitThreshold}
                                    onChange={(e) => setProfitThreshold(Number(e.target.value))}
                                />
                            </div>
                            <button
                                onClick={() => downloadCsv(
                                    `low-profit-report-${formatDateInput(new Date())}.csv`,
                                    ['Product', 'Qty', 'Profit'],
                                    lowProfitItems.map(item => [
                                        item.name,
                                        item.qty,
                                        item.profit.toFixed(2)
                                    ])
                                )}
                                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg"
                            >
                                <Download size={16} /> Export CSV
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-2 text-left">Product</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {lowProfitItems.map(item => (
                                    <tr key={item.product_id} className="text-gray-700 dark:text-gray-300">
                                        <td className="py-2">{item.name}</td>
                                        <td className="py-2 text-center">{item.qty}</td>
                                        <td className="py-2 text-right font-medium">{formatCurrency(item.profit)}</td>
                                    </tr>
                                ))}
                                {lowProfitItems.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-6 text-center text-gray-500">No low-profit items.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                            <Truck size={18} /> Supplier Report
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={supplierFilter}
                                onChange={(e) => setSupplierFilter(e.target.value ? Number(e.target.value) : '')}
                                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2"
                            >
                                <option value="">All Suppliers</option>
                                {suppliers?.map(s => (
                                    <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => downloadCsv(
                                    `supplier-report-${formatDateInput(new Date())}.csv`,
                                    ['Supplier', 'Total', 'Items'],
                                    supplierReport.suppliers.map(s => [
                                        s.name,
                                        s.total.toFixed(2),
                                        s.items
                                    ])
                                )}
                                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg"
                            >
                                <Download size={16} /> Export CSV
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {supplierReport.suppliers.map(s => (
                            <div key={s.supplier_id} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>{s.name}</span>
                                <span>{formatCurrency(s.total)} • {s.items} items</span>
                            </div>
                        ))}
                        {supplierReport.suppliers.length === 0 && (
                            <div className="text-sm text-gray-500">No supplier purchases.</div>
                        )}
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Product-wise</span>
                            <button
                                onClick={() => downloadCsv(
                                    `supplier-product-report-${formatDateInput(new Date())}.csv`,
                                    ['Product', 'Qty', 'Total'],
                                    supplierReport.products.map(p => [
                                        p.name,
                                        p.qty,
                                        p.total.toFixed(2)
                                    ])
                                )}
                                className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"
                            >
                                <Download size={12} /> Export
                            </button>
                        </div>
                        <div className="space-y-2 text-sm">
                            {supplierReport.products.map(p => (
                                <div key={p.product_id} className="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>{p.name}</span>
                                    <span>{p.qty} • {formatCurrency(p.total)}</span>
                                </div>
                            ))}
                            {supplierReport.products.length === 0 && (
                                <div className="text-sm text-gray-500">No product purchases.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                            <Users size={18} /> Customer Report
                        </div>
                        <button
                            onClick={() => downloadCsv(
                                `customer-report-${formatDateInput(new Date())}.csv`,
                                ['Customer', 'Orders', 'Total Spend'],
                                customerReport.map(c => [
                                    c.name,
                                    c.count,
                                        c.total.toFixed(2)
                                ])
                            )}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-2 text-left">Customer</th>
                                    <th className="py-2 text-center">Orders</th>
                                    <th className="py-2 text-right">Total Spend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {customerReport.map(c => (
                                    <tr key={c.customer_id} className="text-gray-700 dark:text-gray-300">
                                        <td className="py-2">{c.name}</td>
                                        <td className="py-2 text-center">{c.count}</td>
                                        <td className="py-2 text-right font-medium">{formatCurrency(c.total)}</td>
                                    </tr>
                                ))}
                                {customerReport.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-6 text-center text-gray-500">No customer sales.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
