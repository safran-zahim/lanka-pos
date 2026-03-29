import { useMemo, useState, useEffect } from 'react';
import { BarChart3, Calendar, Package, Users, Truck, TrendingDown, Download, ArrowLeft, PieChart, ShoppingBag, DollarSign, Printer, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getApiUrl } from '../../config/api';
import { ReceiptModal } from '../../components/ReceiptModal';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/Button';

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
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const token = useAuthStore((state) => state.token);
    const { taxEnabled } = useSettingsStore();

    // API-fetched data instead of Dexie
    const [transactions, setTransactions] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [salesMode, setSalesMode] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
    const [customFrom, setCustomFrom] = useState(formatDateInput(new Date()));
    const [customTo, setCustomTo] = useState(formatDateInput(new Date()));
    const [profitThreshold, setProfitThreshold] = useState(-1);
    const [supplierFilter, setSupplierFilter] = useState<number | ''>('');
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'inventory' | 'customers' | 'suppliers' | 'reconciliation'>('overview');
    const [selectedPrintTxn, setSelectedPrintTxn] = useState<any | null>(null);
    const [reconciliationData, setReconciliationData] = useState<any[]>([]);

    // Fetch all report data from API
    useEffect(() => {
        if (!token) return;
        const loadData = async () => {
            setLoading(true);
            try {
                const [salesRes, productsRes, customersRes, purchasesRes, suppliersRes] = await Promise.all([
                    fetch(getApiUrl('/sales?includeItems=true&limit=200'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/products'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/customers'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/purchases'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/suppliers'), { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (salesRes.ok) {
                    const rawSales = await salesRes.json();
                    setTransactions(rawSales.map((t: any) => ({
                        ...t,
                        transaction_id: t.id,
                        timestamp: t.createdAt,
                        customer_id: t.customerId,
                        total_amount: Number(t.total || 0),
                        tax_amount: Number(t.tax || 0),
                        type: t.parentSaleId ? 'return' : 'sale',
                        status: t.status || 'completed',
                        parent_sale_id: t.parentSaleId || undefined,
                        items: (t.items || []).map((i: any) => ({
                            ...i,
                            product_id: i.productId,
                            price_at_sale: Number(i.price || 0),
                            quantity: Number(i.quantity || 0)
                        }))
                    })));
                }
                if (productsRes.ok) {
                    const rawProducts = await productsRes.json();
                    setProducts(rawProducts.map((p: any) => ({
                        ...p,
                        product_id: p.id,
                        stock_quantity: Number(p.stock || 0),
                        reorder_level: Number(p.reorderLevel || 0)
                    })));
                }
                if (customersRes.ok) setCustomers(await customersRes.json());
                if (purchasesRes.ok) {
                    const rawPurchases = await purchasesRes.json();
                    setPurchases(rawPurchases.map((p: any) => ({
                        ...p,
                        supplier_id: p.supplierId,
                        items: (p.items || []).map((i: any) => ({
                            ...i,
                            product_id: i.productId,
                            cost_price: Number(i.costPrice || 0),
                            quantity: Number(i.quantity || 0)
                        }))
                    })));
                }
                if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
            } catch (error) {
                console.error('Failed to load report data', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [token]);

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

    // Fetch Reconciliation data separately or only when tab active
    useEffect(() => {
        if (!token || activeTab !== 'reconciliation') return;
        const fetchReconciliation = async () => {
            try {
                const res = await fetch(getApiUrl(`/reports/reconciliation?start=${formatDateInput(fromDate)}&end=${formatDateInput(toDate)}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setReconciliationData(await res.json());
                }
            } catch (error) {
                console.error('Failed to load reconciliation data', error);
            }
        };
        fetchReconciliation();
    }, [token, activeTab, fromDate, toDate]);

    const productMap = useMemo(() => new Map((products || []).map(p => [p.id || p.product_id, p])), [products]);
    const customerMap = useMemo(() => new Map((customers || []).map(c => [c.id || c.customer_id, c])), [customers]);
    const supplierMap = useMemo(() => new Map((suppliers || []).map(s => [s.id || s.supplier_id, s])), [suppliers]);

    const salesTransactions = (transactions || []).filter(t => t.type === 'sale' || t.type === 'return' || !t.type);

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
        // Calculate profit from sales and products
        // Since we get sales data, we estimate profit as (retail_price - cost_price) * quantity from products
        const profitByProduct = new Map<string | number, { name: string; qty: number; profit: number }>();

        for (const sale of filteredSales) {
            // If sale has items, use them; otherwise skip
            if (sale.items && Array.isArray(sale.items)) {
                for (const item of sale.items) {
                    const product = productMap.get(item.product_id);
                    if (!product) continue;
                    const costPrice = Number(product.costPrice || product.cost_price || 0);
                    const salePrice = Number(item.price_at_sale || 0);
                    const profit = (salePrice - costPrice) * Number(item.quantity || 0);

                    const current = profitByProduct.get(item.product_id) || {
                        name: product.name,
                        qty: 0,
                        profit: 0
                    };
                    current.qty += Number(item.quantity || 0);
                    current.profit += profit;
                    profitByProduct.set(item.product_id, current);
                }
            }
        }

        const result = Array.from(profitByProduct.entries()).map(([product_id, data]) => ({
            product_id,
            ...data
        }));
        return result
            .filter(r => r.profit <= profitThreshold)
            .sort((a, b) => a.profit - b.profit);
    }, [filteredSales, productMap, profitThreshold]);

    const customerReport = useMemo(() => {
        const data = new Map<string | number, { name: string; total: number; count: number }>();
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
        const filteredPurchases = (purchases || []).filter(p => (supplierFilter ? p.supplierId === supplierFilter || p.supplier_id === supplierFilter : true));
        const bySupplier = new Map<string | number, { name: string; total: number; items: number }>();
        const byProduct = new Map<string | number, { name: string; qty: number; total: number }>();

        for (const purchase of filteredPurchases) {
            const supplierId = purchase.supplierId || purchase.supplier_id;
            if (!supplierId) continue;

            const supplier = supplierMap.get(supplierId);
            const supplierName = supplier?.name || (typeof supplier === 'string' ? supplier : 'Unknown');

            // Get items array (handle both nested items and flat structure)
            const items = purchase.items || (purchase.product_id ? [purchase] : []);

            for (const item of items) {
                const productId = item.productId || item.product_id;
                const quantity = Number(item.quantity || 0);
                const costPrice = Number(item.costPrice || item.cost_price || 0);
                const itemTotal = quantity * costPrice;

                // Aggregate by supplier
                const supplierCurrent = bySupplier.get(supplierId) || { name: supplierName, total: 0, items: 0 };
                supplierCurrent.total += itemTotal;
                supplierCurrent.items += quantity;
                bySupplier.set(supplierId, supplierCurrent);

                // Aggregate by product
                if (productId) {
                    const product = productMap.get(productId);
                    const productName = product?.name || (typeof product === 'string' ? product : 'Unknown');
                    const productCurrent = byProduct.get(productId) || { name: productName, qty: 0, total: 0 };
                    productCurrent.qty += quantity;
                    productCurrent.total += itemTotal;
                    byProduct.set(productId, productCurrent);
                }
            }
        }

        return {
            suppliers: Array.from(bySupplier.entries()).map(([supplier_id, d]) => ({ supplier_id, ...d })),
            products: Array.from(byProduct.entries()).map(([product_id, d]) => ({ product_id, ...d }))
        };
    }, [purchases, supplierFilter, supplierMap, productMap]);

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all font-medium text-sm ${activeTab === id
                ? 'border-blue-600 text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-muted text-foreground p-6 transition-colors font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/pos')} className="p-2 bg-card text-card-foreground rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-border transition-colors">
                            <ArrowLeft size={24} className="text-gray-600 dark:text-white" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Reports Dashboard</h1>
                            <p className="text-muted-foreground text-sm">Analyze your business performance</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-card text-card-foreground text-muted-foreground px-4 py-2 rounded-lg border border-border flex items-center gap-2 shadow-sm hover:bg-accent hover:text-accent-foreground transition-all font-medium text-sm"
                        >
                            <Calendar size={18} />
                            Today: {new Date().toLocaleDateString()}
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm mb-8 sticky top-0 z-20 overflow-x-auto no-scrollbar">
                    <div className="flex px-4">
                        <TabButton id="overview" label="Overview" icon={BarChart3} />
                        <TabButton id="sales" label="Sales History" icon={DollarSign} />
                        <TabButton id="inventory" label="Inventory/Stock" icon={Package} />
                        <TabButton id="customers" label="Customers" icon={Users} />
                        <TabButton id="suppliers" label="Purchases" icon={Truck} />
                        <TabButton id="reconciliation" label="Reconciliation" icon={Calculator} />
                    </div>
                </div>

                {loading && (
                    <div className="bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center mb-8">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-muted-foreground font-medium">Loading report metrics...</p>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-linear-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-primary/20/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-600 dark:text-blue-300 font-bold">Total Sales</h3>
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-primary">
                                            <DollarSign size={24} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-foreground">{formatCurrency(salesSummary.total)}</p>
                                    <p className="text-xs text-primary mt-2">{salesSummary.count} Transactions in period</p>
                                </div>
                            </div>

                            {taxEnabled && (
                                <div className="bg-linear-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-100 dark:bg-indigo-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-gray-600 dark:text-indigo-300 font-bold">Tax Collected</h3>
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <ShoppingBag size={24} />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-foreground">{formatCurrency(salesSummary.tax)}</p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Period: {fromDate.toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-linear-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 p-6 rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-sm relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-orange-100 dark:bg-orange-800/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-600 dark:text-orange-300 font-bold">Low Stock Items</h3>
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400">
                                            <Package size={24} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-foreground">{lowStockItems.length}</p>
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">Inventory needs attention</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-table */}
                        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center space-x-2 text-foreground">
                                    <Calendar size={20} className="text-primary" />
                                    <span>Recent Sales</span>
                                </h2>
                                <button
                                    onClick={() => setActiveTab('sales')}
                                    className="text-primary text-sm font-medium hover:underline"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                        <tr>
                                            <th className="p-4">ID</th>
                                            <th className="p-4">Time</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredSales.slice(0, 5).map(txn => {
                                            const isReturn = txn.type === 'return';
                                            return (
                                                <tr key={txn.transaction_id} className={`hover:bg-accent hover:text-accent-foreground/50 transition-colors ${isReturn ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}>
                                                    <td className="p-4 text-foreground font-medium">#{txn.transaction_id} {isReturn && <span className="text-[10px] text-destructive font-bold uppercase ml-1">Return</span>}</td>
                                                    <td className="p-4 text-muted-foreground">{formatDateTime(new Date(txn.timestamp))}</td>
                                                    <td className="p-4 text-muted-foreground">{txn.customer_id ? (customerMap.get(txn.customer_id)?.name || 'Unknown') : 'Walk-in'}</td>
                                                    <td className={`p-4 text-right font-bold ${isReturn ? 'text-destructive' : 'text-foreground'}`}>{formatCurrency(txn.total_amount)}</td>
                                                </tr>
                                            )
                                        })}
                                        {filteredSales.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                    No sales activity recorded in this period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/20">
                            <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                                <DollarSign size={20} className="text-green-500" />
                                <span>Sales History</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-border p-1">
                                    {(['daily', 'weekly', 'monthly', 'custom'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setSalesMode(mode)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${salesMode === mode
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                {salesMode === 'custom' && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={customFrom}
                                            onChange={(e) => setCustomFrom(e.target.value)}
                                            className="bg-white dark:bg-gray-700 border border-border text-foreground rounded-lg px-3 py-1.5 text-sm"
                                        />
                                        <span className="text-gray-400">to</span>
                                        <input
                                            type="date"
                                            value={customTo}
                                            onChange={(e) => setCustomTo(e.target.value)}
                                            className="bg-white dark:bg-gray-700 border border-border text-foreground rounded-lg px-3 py-1.5 text-sm"
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        const headers = ['Transaction ID', 'Date', 'Customer', 'Total'];
                                        const rows = filteredSales.map(txn => [
                                            `#${txn.transaction_id}`,
                                            formatDateTime(new Date(txn.timestamp)),
                                            txn.customer_id ? (customerMap.get(txn.customer_id)?.name || 'Unknown') : 'Walk-in',
                                            txn.total_amount.toFixed(2)
                                        ]);
                                        if (taxEnabled) {
                                            headers.push('Tax');
                                            rows.forEach((row, idx) => {
                                                row.push((filteredSales[idx].tax_amount || 0).toFixed(2));
                                            });
                                        }
                                        downloadCsv(`sales-report-${formatDateInput(fromDate)}-to-${formatDateInput(toDate)}.csv`, headers, rows);
                                    }}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
                                >
                                    <Download size={16} /> Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="p-4 text-left">Transaction ID</th>
                                        <th className="p-4 text-left">Date & Time</th>
                                        <th className="p-4 text-left">Customer</th>
                                        <th className="p-4 text-right">Total Amount</th>
                                        <th className="p-4 text-right">Due Amount</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredSales.map(txn => {
                                        const isReturn = txn.type === 'return';
                                        return (
                                            <tr
                                                key={txn.transaction_id}
                                                onClick={() => navigate(`/admin/transactions/${txn.transaction_id}`)}
                                                className={`hover:bg-accent hover:text-accent-foreground/30 transition-colors cursor-pointer ${isReturn ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}
                                            >
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${isReturn ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                            #{txn.transaction_id}
                                                        </span>
                                                        {isReturn && (
                                                            <span className="text-[10px] text-destructive font-bold uppercase tracking-wider flex flex-col gap-0.5 mt-0.5">
                                                                <span>Return</span>
                                                                {txn.parent_sale_id && (
                                                                    <span className="text-muted-foreground font-medium normal-case">
                                                                        Ref: #{txn.parent_sale_id}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-muted-foreground">{formatDateTime(new Date(txn.timestamp))}</td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    {txn.customer_id ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isReturn ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-blue-100 text-primary dark:bg-blue-900/40 dark:text-blue-400'}`}>
                                                                {(customerMap.get(txn.customer_id)?.name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            {customerMap.get(txn.customer_id)?.name || 'Unknown User'}
                                                        </div>
                                                    ) : <span className="text-gray-400">Walk-in Customer</span>}
                                                </td>
                                                <td className={`p-4 text-right font-bold ${isReturn ? 'text-destructive' : 'text-foreground'}`}>
                                                    {formatCurrency(txn.total_amount)}
                                                </td>
                                                <td className={`p-4 text-right font-bold ${Number(txn.dueAmount || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {formatCurrency(Number(txn.dueAmount || 0))}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPrintTxn(txn);
                                                        }}
                                                        className="p-1 px-2 text-primary hover:bg-blue-50 rounded transition-colors"
                                                        title="Print Receipt"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredSales.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-gray-400 italic">No transactions found for the selected period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Low Stock Card */}
                            <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-border flex items-center justify-between bg-orange-50/30 dark:bg-orange-900/10">
                                    <div className="flex items-center gap-2 text-foreground font-bold">
                                        <Package size={18} className="text-accent" />
                                        <span>Low Stock Items</span>
                                    </div>
                                    <button
                                        onClick={() => downloadCsv(
                                            `low-stock-report-${formatDateInput(new Date())}.csv`,
                                            ['Product', 'Stock', 'Alert Level'],
                                            lowStockItems.map(item => [
                                                item.name,
                                                item.stock_quantity,
                                                item.alert_quantity ?? item.reorder_level ?? 0
                                            ])
                                        )}
                                        className="p-2 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                        title="Export Low Stock"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                                            <tr>
                                                <th className="p-4 text-left">Product Name</th>
                                                <th className="p-4 text-center">In Stock</th>
                                                <th className="p-4 text-center">Min Level</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {lowStockItems.map(item => (
                                                <tr key={item.product_id} className="hover:bg-accent hover:text-accent-foreground/30 transition-colors">
                                                    <td className="p-4 text-foreground font-medium">{item.name}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-xs font-bold">
                                                            {item.stock_quantity}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center text-muted-foreground">{item.alert_quantity ?? item.reorder_level ?? 0}</td>
                                                </tr>
                                            ))}
                                            {lowStockItems.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="p-12 text-center text-gray-400 italic">No low stock items detected.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Low Profit Card */}
                            <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-border flex items-center justify-between bg-red-50/30 dark:bg-red-900/10">
                                    <div className="flex items-center gap-2 text-foreground font-bold">
                                        <TrendingDown size={18} className="text-red-500" />
                                        <span>Low Profit Estimate</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase font-bold mr-2">
                                            Threshold:
                                            <input
                                                type="number"
                                                className="w-16 bg-white dark:bg-gray-700 border border-border rounded px-1 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
                                                value={profitThreshold}
                                                onChange={(e) => setProfitThreshold(Number(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => downloadCsv(
                                                `low-profit-report-${formatDateInput(new Date())}.csv`,
                                                ['Product', 'Qty Sold', 'Profit'],
                                                lowProfitItems.map(item => [
                                                    item.name,
                                                    item.qty,
                                                    item.profit.toFixed(2)
                                                ])
                                            )}
                                            className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                            title="Export Low Profit"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                                            <tr>
                                                <th className="p-4 text-left">Product</th>
                                                <th className="p-4 text-center">Qty Sold</th>
                                                <th className="p-4 text-right">Est. Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {lowProfitItems.map(item => (
                                                <tr key={item.product_id} className="hover:bg-accent hover:text-accent-foreground/30 transition-colors">
                                                    <td className="p-4 text-foreground font-medium">{item.name}</td>
                                                    <td className="p-4 text-center text-muted-foreground">{item.qty}</td>
                                                    <td className="p-4 text-right font-bold text-destructive">{formatCurrency(item.profit)}</td>
                                                </tr>
                                            ))}
                                            {lowProfitItems.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="p-12 text-center text-gray-400 italic">No low-profit items for current threshold.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'customers' && (
                    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-5 border-b border-border flex items-center justify-between bg-blue-50/30 dark:bg-blue-900/10">
                            <div className="flex items-center gap-2 text-foreground font-bold">
                                <Users size={18} className="text-primary" />
                                <span>Customer Spending Analysis</span>
                            </div>
                            <button
                                onClick={() => downloadCsv(
                                    `customer-report-${formatDateInput(new Date())}.csv`,
                                    ['Customer', 'Orders', 'Total Spend'],
                                    customerReport.map(c => [c.name, c.count, c.total.toFixed(2)])
                                )}
                                className="p-2 text-gray-500 hover:text-primary dark:hover:text-blue-400 transition-colors"
                            >
                                <Download size={18} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="p-4 text-left">Customer</th>
                                        <th className="p-4 text-center">Orders</th>
                                        <th className="p-4 text-right">Total Spend</th>
                                        <th className="p-4 text-right">Outstanding Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {customerReport.map(c => (
                                        <tr key={c.customer_id} className="hover:bg-accent hover:text-accent-foreground/30 transition-colors">
                                            <td className="p-4 text-foreground font-medium">{c.name}</td>
                                            <td className="p-4 text-center text-muted-foreground">{c.count}</td>
                                            <td className="p-4 text-right font-bold text-foreground">{formatCurrency(c.total)}</td>
                                            <td className={`p-4 text-right font-bold ${Number(customerMap.get(c.customer_id)?.totalDue || 0) > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {formatCurrency(Number(customerMap.get(c.customer_id)?.totalDue || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                    {customerReport.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-12 text-center text-gray-400 italic">No customer data available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'suppliers' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-purple-50/30 dark:bg-purple-900/10">
                                <div className="flex items-center gap-2 text-foreground font-bold">
                                    <Truck size={18} className="text-purple-500" />
                                    <span>Supplier Purchases</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={supplierFilter}
                                        onChange={(e) => setSupplierFilter(e.target.value ? Number(e.target.value) : '')}
                                        className="bg-white dark:bg-gray-700 border border-border rounded-lg px-3 py-1.5 text-sm"
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
                                            supplierReport.suppliers.map(s => [s.name, s.total.toFixed(2), s.items])
                                        )}
                                        className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {supplierReport.suppliers.map(s => (
                                        <div key={s.supplier_id} className="p-4 bg-muted/40 rounded-lg border border-border flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{s.name}</p>
                                                <p className="text-lg font-bold text-foreground">{formatCurrency(s.total)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">{s.items} units</p>
                                            </div>
                                        </div>
                                    ))}
                                    {supplierReport.suppliers.length === 0 && (
                                        <div className="col-span-full p-8 text-center text-gray-400 italic">No supplier purchases recorded.</div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-border">
                                    <h3 className="text-sm font-bold text-foreground mb-4">Product-wise Breakdown</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-gray-400 text-[10px] uppercase font-bold border-b border-border">
                                                <tr>
                                                    <th className="pb-2 text-left">Product</th>
                                                    <th className="pb-2 text-center">Qty</th>
                                                    <th className="pb-2 text-right">Total Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                {supplierReport.products.map(p => (
                                                    <tr key={p.product_id}>
                                                        <td className="py-3 text-gray-700 dark:text-gray-300">{p.name}</td>
                                                        <td className="py-3 text-center text-muted-foreground">{p.qty}</td>
                                                        <td className="py-3 text-right font-medium text-foreground">{formatCurrency(p.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reconciliation' && (
                    <Card className="overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <CardHeader className="px-5 py-4 border-b border-border flex-row items-center justify-between gap-4 bg-emerald-50/30 dark:bg-emerald-900/10">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Calculator size={18} className="text-emerald-500" />
                                Shift Cash Reconciliation
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                {/* Period mode selector */}
                                <div className="flex items-center bg-card rounded-lg border border-border p-0.5">
                                    {(['daily', 'weekly', 'monthly', 'custom'] as const).map((mode) => (
                                        <Button
                                            key={mode}
                                            type="button"
                                            size="sm"
                                            variant={salesMode === mode ? 'primary' : 'ghost'}
                                            onClick={() => setSalesMode(mode)}
                                            className={`h-7 px-3 text-xs font-medium ${salesMode === mode ? '' : 'border-0'}`}
                                        >
                                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadCsv(
                                        `reconciliation-report-${formatDateInput(fromDate)}-to-${formatDateInput(toDate)}.csv`,
                                        ['Shift ID', 'Staff', 'End Time', 'Expected Cash', 'Counted Cash', 'Variance', 'Note'],
                                        reconciliationData.map(s => [
                                            s.id,
                                            s.staffName,
                                            s.endTime ? formatDateTime(new Date(s.endTime)) : 'N/A',
                                            s.expectedCash.toFixed(2),
                                            s.countedCash.toFixed(2),
                                            s.variance.toFixed(2),
                                            s.note || ''
                                        ])
                                    )}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
                                    title="Export CSV"
                                >
                                    <Download size={16} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="p-4 text-left">Shift & Staff</th>
                                        <th className="p-4 text-left">Period End</th>
                                        <th className="p-4 text-right">Expected Cash</th>
                                        <th className="p-4 text-right">Counted Cash</th>
                                        <th className="p-4 text-right">Variance</th>
                                        <th className="p-4 text-left">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {reconciliationData.map(s => (
                                        <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground">Shift #{s.id}</span>
                                                    <span className="text-xs text-muted-foreground">{s.staffName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {s.endTime ? formatDateTime(new Date(s.endTime)) : 'N/A'}
                                            </td>
                                            <td className="p-4 text-right font-medium text-foreground">
                                                {formatCurrency(s.expectedCash)}
                                            </td>
                                            <td className="p-4 text-right font-medium text-foreground">
                                                {formatCurrency(s.countedCash)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`font-bold ${s.variance < 0 ? 'text-red-500' : s.variance > 0 ? 'text-primary' : 'text-emerald-500'}`}>
                                                        {s.variance > 0 ? '+' : ''}{formatCurrency(s.variance)}
                                                    </span>
                                                    {s.variance !== 0 && (
                                                        <Badge
                                                            variant={s.variance < 0 ? 'destructive' : 'default'}
                                                            className="text-[9px] h-4 px-1"
                                                        >
                                                            {s.variance < 0 ? 'Shortage' : 'Overage'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-muted-foreground max-w-xs truncate" title={s.note}>
                                                {s.note || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {reconciliationData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
                                                No closed shifts found for the selected period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

            </div>
            {selectedPrintTxn && (
                <ReceiptModal
                    transaction={selectedPrintTxn}
                    items={(selectedPrintTxn.items || []).map((i: any) => ({
                        ...i,
                        name: productMap.get(i.product_id)?.name || 'Unknown Product'
                    }))}
                    customer={selectedPrintTxn.customer_id ? customerMap.get(selectedPrintTxn.customer_id) : null}
                    user={useAuthStore.getState().user}
                    onClose={() => setSelectedPrintTxn(null)}
                />
            )}
        </div>
    );
};

export default ReportsPage;
