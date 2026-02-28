import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../hooks/useCurrency';
import { useToast } from '../../store/useToast';
import { useLocale } from '../../hooks/useLocale';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';

export const PurchaseHistory = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
    const [filterStatus, setFilterStatus] = useState<'all' | 'due'>('all');
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const token = useAuthStore((state) => state.token);
    const { addToast } = useToast();

    const [purchases, setPurchases] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;
        const loadData = async () => {
            try {
                const [purchasesRes, suppliersRes] = await Promise.all([
                    fetch(getApiUrl('/purchases'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/suppliers'), { headers: { Authorization: `Bearer ${token}` } })
                ]);
                if (purchasesRes.ok) {
                    const data = await purchasesRes.json();
                    // Enrich with product and supplier names
                    const enriched = data.map((p: any) => ({
                        ...p,
                        productName: p.product?.name || 'Unknown Product',
                        sku: p.product?.skuCode || p.product?.sku_code || 'N/A',
                        supplierName: p.supplier?.name || 'N/A',
                        timestamp: p.createdAt || p.timestamp
                    }));
                    setPurchases(enriched.sort((a: any, b: any) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    ));
                }
                if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
            } catch (error) {
                console.error('Failed to load purchase history', error);
            }
        };
        loadData();
    }, [token]);

    const bills = (purchases || []).map((p: any) => {
        const total = Number(p.totalAmount || p.total_amount || 0);
        const paid = Number(p.paidAmount || p.paid_amount || 0);
        const due = Math.max(0, total - paid);
        const rawId = p.id ?? p.purchase_id ?? p.purchaseId;
        const resolvedId = Number(rawId);
        return {
            id: Number.isFinite(resolvedId) ? resolvedId : null,
            ref_number: p.refNumber || p.ref_number || '-',
            supplierName: p.supplier?.name || p.supplierName || 'N/A',
            timestamp: p.createdAt || p.date || p.timestamp,
            status: p.status || 'PENDING',
            total,
            paid,
            due
        };
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
                                <option key={s.id || s.supplier_id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Ref No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Payment</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Paid</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-orange-600">Due</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredBills.map((bill: any) => (
                            <tr
                                key={bill.id ?? `bill-${bill.ref_number}-${bill.timestamp}`}
                                onClick={() => {
                                    if (!bill.id) {
                                        addToast('Purchase ID is missing for this record.', 'error');
                                        return;
                                    }
                                    navigate(`/admin/purchases/${bill.id}`);
                                }}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    <div className="md:hidden text-[10px] text-gray-400">{formatDateTime(new Date(bill.timestamp)).split(' ')[1]}</div>
                                    {formatDateTime(new Date(bill.timestamp)).split(' ')[0]}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                    {bill.ref_number || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    {bill.supplierName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bill.due > 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                        {bill.due > 0 ? 'Partial/Due' : 'Paid'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(bill.total)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 hidden lg:table-cell">
                                    {formatCurrency(bill.paid)}
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

        </div>
    );
};
