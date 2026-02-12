import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Truck, Receipt, DollarSign, MapPin, User } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';
import { useToast } from '../../store/useToast';

export const SupplierProfilePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const { addToast } = useToast();
    const [supplier, setSupplier] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSupplier = async () => {
            setLoading(true);
            try {
                const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/suppliers/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch supplier details');
                const data = await response.json();
                setSupplier(data);
            } catch (error) {
                console.error('Error fetching supplier:', error);
                addToast('Failed to load supplier details', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchSupplier();
    }, [id, addToast]);

    if (loading) return <div className="p-6 text-center text-gray-500">Loading profile...</div>;

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

    const { stats, purchases } = supplier;

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
                        <p className="text-sm text-gray-500 dark:text-gray-400">SUP-{String(supplier.id).slice(0, 8)}</p>
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
                            {supplier.contactPerson && (
                                <div className="text-sm text-white/80 flex items-center gap-1 mt-1">
                                    <User size={14} /> {supplier.contactPerson}
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
                        <Receipt size={20} className="text-blue-500" /> {stats?.totalPurchases || 0}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 font-bold text-blue-600 dark:text-blue-400">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total Spend</div>
                    <div className="mt-2 text-2xl flex items-center gap-2">
                        <DollarSign size={20} /> {formatCurrency(stats?.totalPurchased || 0)}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 font-bold text-green-600 dark:text-green-400">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total Paid</div>
                    <div className="mt-2 text-2xl flex items-center gap-2">
                        <DollarSign size={20} /> {formatCurrency(stats?.totalPaid || 0)}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 font-bold text-orange-600 dark:text-orange-400">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Balance Due</div>
                    <div className="mt-2 text-2xl flex items-center gap-2">
                        <DollarSign size={20} /> {formatCurrency(stats?.totalDue || 0)}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Receipt size={16} /> Recent Purchases
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-right">Paid</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {purchases && purchases.length > 0 ? (
                                purchases.map((purchase: any) => {
                                    const total = parseFloat(purchase.totalAmount);
                                    const paid = parseFloat(purchase.paidAmount);
                                    const due = total - paid;
                                    return (
                                        <tr
                                            key={purchase.id}
                                            className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group"
                                        // navigate to Purchase Details (if exists)
                                        >
                                            <td className="px-4 py-3">{formatDateTime(new Date(purchase.date))}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${purchase.status === 'COMPLETED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                                                    {purchase.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(total)}</td>
                                            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(paid)}</td>
                                            <td className="px-4 py-3 text-right text-orange-600 font-bold">{due > 0 ? formatCurrency(due) : '-'}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500">No recent purchases found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
