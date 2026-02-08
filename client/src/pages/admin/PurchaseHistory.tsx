import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Search, Filter, Calendar, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';

export const PurchaseHistory = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
    const [selectedBill, setSelectedBill] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'due'>('all');
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();

    const purchases = useLiveQuery(async () => {
        const allPurchases = await db.purchases.toArray();
        // Enrich purchases with product and supplier details
        const enriched = await Promise.all(allPurchases.map(async (p) => {
            const product = await db.products.get(p.product_id);
            const supplier = p.supplier_id ? await db.suppliers.get(p.supplier_id) : null;
            return {
                ...p,
                productName: product?.name || 'Unknown Product',
                sku: product?.sku_code || 'N/A',
                supplierName: supplier?.name || 'N/A'
            };
        }));
        return enriched.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });

    const suppliers = useLiveQuery(() => db.suppliers.toArray());

    const groupedBills = purchases?.reduce((acc, p) => {
        const billKey = p.bill_id || (p.ref_number
            ? `ref:${p.ref_number}`
            : `ts:${new Date(p.timestamp).getTime()}|sup:${p.supplier_id ?? 'na'}`);

        if (!acc.has(billKey)) {
            acc.set(billKey, {
                billKey,
                ref_number: p.ref_number || '-',
                supplierName: p.supplierName,
                supplier_id: p.supplier_id,
                timestamp: p.timestamp,
                payment_status: p.payment_status || 'due',
                payment_method: p.payment_method || 'cash',
                shipping_cost: p.shipping_cost || 0,
                discount: p.discount || 0,
                bill_total: p.bill_total || 0,
                amount_paid: p.amount_paid || 0,
                items: [p]
            });
        } else {
            acc.get(billKey)!.items.push(p);
        }
        return acc;
    }, new Map<string, any>());

    const bills = Array.from(groupedBills?.values() || []).map(bill => {
        const subtotal = bill.items.reduce((sum: number, i: any) => sum + i.quantity * i.cost_price, 0);
        const total = bill.bill_total && bill.bill_total > 0
            ? bill.bill_total
            : subtotal + (bill.shipping_cost || 0) - (bill.discount || 0);
        const due = Math.max(0, total - bill.amount_paid);
        return { ...bill, subtotal, total, due };
    });

    const filteredBills = bills.filter(b => {
        const matchesSearch =
            (b.ref_number && b.ref_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
            b.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSupplier = selectedSupplier === 'All' || b.supplierName === selectedSupplier;
        const matchesStatus = filterStatus === 'all' || b.due > 0;
        return matchesSearch && matchesSupplier && matchesStatus;
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Calendar className="text-blue-600" />
                    Purchase History (Stock In)
                </h1>
                <button
                    onClick={() => navigate('/admin/purchases/new')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Purchase
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Supplier or Ref No..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${filterStatus === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus('due')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${filterStatus === 'due' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
                    >
                        Due Only
                    </button>
                </div>

                <div className="md:w-64">
                    <div className="relative">
                        <Filter className="absolute left-3 top-3 text-gray-400" size={20} />
                        <select
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                        >
                            <option value="All">All Suppliers</option>
                            <option value="N/A">No Supplier</option>
                            {suppliers?.map(s => (
                                <option key={s.supplier_id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ref No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paid</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-orange-600">Due</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredBills.map((bill: any) => (
                            <tr
                                key={bill.billKey}
                                onClick={() => setSelectedBill(bill.billKey)}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {formatDateTime(new Date(bill.timestamp))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {bill.ref_number || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {bill.supplierName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bill.due > 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                        {bill.due > 0 ? 'Partial/Due' : 'Paid'}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-400">{bill.payment_method}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(bill.total)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                                    {formatCurrency(bill.amount_paid)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                                    {bill.due > 0 ? formatCurrency(bill.due) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredBills.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No purchase history found.
                    </div>
                )}
            </div>

            {selectedBill && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 w-[720px] max-h-[80vh] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Purchase Bill Details</h3>
                                <p className="text-xs text-gray-500">Click outside to close</p>
                            </div>
                            <button onClick={() => setSelectedBill(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            {filteredBills
                                .filter((b: any) => b.billKey === selectedBill)
                                .map((bill: any) => (
                                    <div key={bill.billKey}>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <div className="text-xs text-gray-500">Supplier</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{bill.supplierName}</div>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <div className="text-xs text-gray-500">Ref No</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{bill.ref_number || '-'}</div>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <div className="text-xs text-gray-500">Payment</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{String(bill.payment_status).toUpperCase()} • {bill.payment_method}</div>
                                            </div>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead className="text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                                <tr>
                                                    <th className="py-2 text-left">Product</th>
                                                    <th className="py-2 text-left">SKU</th>
                                                    <th className="py-2 text-right">Qty</th>
                                                    <th className="py-2 text-right">Unit Cost</th>
                                                    <th className="py-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {bill.items.map((item: any) => (
                                                    <tr key={item.purchase_id} className="text-gray-700 dark:text-gray-300">
                                                        <td className="py-2">{item.productName}</td>
                                                        <td className="py-2">{item.sku}</td>
                                                        <td className="py-2 text-right">{item.quantity}</td>
                                                        <td className="py-2 text-right">{formatCurrency(item.cost_price)}</td>
                                                        <td className="py-2 text-right">{formatCurrency(item.quantity * item.cost_price)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="flex justify-end mt-4 text-sm">
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-6 text-gray-600 dark:text-gray-400">
                                                    <span>Subtotal</span>
                                                    <span>{formatCurrency(bill.subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 text-gray-600 dark:text-gray-400">
                                                    <span>Shipping</span>
                                                    <span>{formatCurrency(bill.shipping_cost || 0)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 text-gray-600 dark:text-gray-400">
                                                    <span>Discount</span>
                                                    <span>-{formatCurrency(bill.discount || 0)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 font-semibold text-gray-900 dark:text-white">
                                                    <span>Total</span>
                                                    <span>{formatCurrency(bill.total)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 text-green-600">
                                                    <span>Paid</span>
                                                    <span>{formatCurrency(bill.amount_paid)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 font-bold text-orange-600 pt-1 border-t border-gray-200 dark:border-gray-700">
                                                    <span>Outstanding Due</span>
                                                    <span>{formatCurrency(bill.due)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
