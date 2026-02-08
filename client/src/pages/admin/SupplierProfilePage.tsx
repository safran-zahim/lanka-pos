import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, Phone, Mail, Truck, Receipt, DollarSign, MapPin, User, ChevronRight } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';

export const SupplierProfilePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const supplierId = Number(id);
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();

    const supplier = useLiveQuery(() => (Number.isFinite(supplierId) ? db.suppliers.get(supplierId) : undefined), [supplierId]);

    const allPurchases = useLiveQuery(
        () => (Number.isFinite(supplierId) ? db.purchases.where('supplier_id').equals(supplierId).toArray() : []),
        [supplierId]
    );

    const groupedBills = useMemo(() => {
        if (!allPurchases) return [];

        const acc = new Map<string, any>();

        allPurchases.forEach(p => {
            const billKey = p.bill_id || (p.ref_number
                ? `ref:${p.ref_number}`
                : `ts:${new Date(p.timestamp).getTime()}|sup:${p.supplier_id ?? 'na'}`);

            if (!acc.has(billKey)) {
                acc.set(billKey, {
                    billKey,
                    ref_number: p.ref_number || '-',
                    timestamp: p.timestamp,
                    payment_status: p.payment_status || 'due',
                    payment_method: p.payment_method || 'cash',
                    shipping_cost: p.shipping_cost || 0,
                    discount: p.discount || 0,
                    bill_total: p.bill_total || 0,
                    amount_paid: p.amount_paid || 0,
                    itemCount: 1,
                    subtotal: p.quantity * p.cost_price
                });
            } else {
                const bill = acc.get(billKey)!;
                bill.itemCount += 1;
                bill.subtotal += p.quantity * p.cost_price;
            }
        });

        return Array.from(acc.values()).map(bill => {
            const total = bill.bill_total && bill.bill_total > 0
                ? bill.bill_total
                : bill.subtotal + (bill.shipping_cost || 0) - (bill.discount || 0);
            const due = Math.max(0, total - bill.amount_paid);
            return { ...bill, total, due };
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [allPurchases]);

    const stats = useMemo(() => {
        const totalPurchases = groupedBills.length;
        const totalSpend = groupedBills.reduce((sum, b) => sum + b.total, 0);
        const totalPaid = groupedBills.reduce((sum, b) => sum + b.amount_paid, 0);
        const totalDue = groupedBills.reduce((sum, b) => sum + b.due, 0);

        return { totalPurchases, totalSpend, totalPaid, totalDue };
    }, [groupedBills]);

    if (!supplier) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/admin/suppliers')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Supplier Profile</h1>
                </div>
                <div className="text-gray-500 dark:text-gray-400">Supplier not found.</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/suppliers')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supplier Profile</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">SUP-{String(supplier.supplier_id).padStart(4, '0')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                            <Truck size={32} />
                        </div>
                        <div>
                            <div className="text-sm text-white/80">Supplier</div>
                            <div className="text-2xl font-bold">{supplier.name}</div>
                            {supplier.contact_person && (
                                <div className="text-sm text-white/80 flex items-center gap-1 mt-1">
                                    <User size={14} /> {supplier.contact_person}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                        {supplier.phone && (
                            <div className="bg-white/15 px-3 py-2 rounded-lg flex items-center gap-2">
                                <Phone size={14} /> {supplier.phone}
                            </div>
                        )}
                        {supplier.email && (
                            <div className="bg-white/15 px-3 py-2 rounded-lg flex items-center gap-2">
                                <Mail size={14} /> {supplier.email}
                            </div>
                        )}
                        {supplier.address && (
                            <div className="bg-white/15 px-3 py-2 rounded-lg flex items-center gap-2">
                                <MapPin size={14} /> {supplier.address}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total Purchases</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Receipt size={20} className="text-blue-500" /> {stats.totalPurchases}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 font-bold text-blue-600 dark:text-blue-400">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total Spend</div>
                    <div className="mt-2 text-2xl flex items-center gap-2">
                        <DollarSign size={20} /> {formatCurrency(stats.totalSpend)}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 font-bold text-green-600 dark:text-green-400">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total Paid</div>
                    <div className="mt-2 text-2xl flex items-center gap-2">
                        <DollarSign size={20} /> {formatCurrency(stats.totalPaid)}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 font-bold text-orange-600 dark:text-orange-400">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Balance Due</div>
                    <div className="mt-2 text-2xl flex items-center gap-2">
                        <DollarSign size={20} /> {formatCurrency(stats.totalDue)}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Receipt size={16} /> Purchase History
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Ref No</th>
                                <th className="px-4 py-3">Items</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-right">Paid</th>
                                <th className="px-4 py-3 text-right">Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {groupedBills.map(bill => (
                                <tr
                                    key={bill.billKey}
                                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group"
                                    onClick={() => navigate('/admin/purchases')}
                                >
                                    <td className="px-4 py-3">{formatDateTime(new Date(bill.timestamp))}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{bill.ref_number}</td>
                                    <td className="px-4 py-3">{bill.itemCount}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bill.due > 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                            {bill.due > 0 ? 'Partial/Due' : 'Paid'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(bill.total)}</td>
                                    <td className="px-4 py-3 text-right text-green-600">{formatCurrency(bill.amount_paid)}</td>
                                    <td className="px-4 py-3 text-right text-orange-600 font-bold">{bill.due > 0 ? formatCurrency(bill.due) : '-'}</td>
                                    <td className="px-2 py-3 text-gray-400 group-hover:text-blue-500">
                                        <ChevronRight size={16} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {groupedBills.length === 0 && (
                        <div className="text-gray-500 text-center py-10">No purchase records found for this supplier.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
