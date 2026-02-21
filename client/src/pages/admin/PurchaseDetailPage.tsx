import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign, FileText, Package, Truck } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';

export const PurchaseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const token = useAuthStore((state) => state.token);

    const [purchase, setPurchase] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const loadPurchase = async () => {
        if (!token || !id) return;
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(`/purchases/${id}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const payload = await response.json();
                setPurchase(payload);
                return;
            }
            if (response.status === 404) {
                const listResponse = await fetch(getApiUrl('/purchases'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (listResponse.ok) {
                    const listPayload = await listResponse.json();
                    const numericId = Number(id);
                    const fallback = (listPayload || []).find((p: any) => Number(p.id) === numericId);
                    if (fallback) {
                        setPurchase(fallback);
                        return;
                    }
                }
                throw new Error('Purchase not found');
            }
            throw new Error('Failed to load purchase');
        } catch (error) {
            console.error(error);
            addToast(error instanceof Error ? error.message : 'Failed to load purchase', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPurchase();
    }, [id, token]);

    const totals = useMemo(() => {
        const items = purchase?.items || [];
        const subtotal = items.reduce((sum: number, item: any) => {
            const qty = Number(item.quantity || 0);
            const cost = Number(item.costPrice || item.cost_price || 0);
            return sum + qty * cost;
        }, 0);
        const total = Number(purchase?.totalAmount || purchase?.total_amount || subtotal || 0);
        const paid = Number(purchase?.paidAmount || purchase?.paid_amount || 0);
        const due = Math.max(0, total - paid);
        return { subtotal, total, paid, due };
    }, [purchase]);

    const handlePayment = async () => {
        if (!token || !id) return;
        const amount = Number(paymentAmount);
        if (!paymentAmount || amount <= 0) {
            addToast('Enter a payment amount', 'error');
            return;
        }
        if (amount > totals.due) {
            addToast('Payment exceeds due amount', 'error');
            return;
        }
        try {
            const response = await fetch(getApiUrl(`/purchases/${id}/payments`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amount,
                    method: paymentMethod,
                    paid_at: paymentDate
                })
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to record payment');
            }
            addToast('Payment recorded', 'success');
            setPaymentAmount('');
            await loadPurchase();
        } catch (error: any) {
            console.error(error);
            addToast(error?.message || 'Failed to record payment', 'error');
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading purchase...</div>;
    }

    if (!purchase) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/admin/purchases')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Purchase Details</h1>
                </div>
                <div className="text-gray-500 dark:text-gray-400">Purchase not found.</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/purchases')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Details</h1>
                        <p className="text-gray-500 text-sm">#{purchase.id} • {formatDateTime(new Date(purchase.date))}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Truck className="text-blue-500" /> Supplier & Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Supplier</label>
                                <div className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                                    {purchase.supplier?.name || 'N/A'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Purchase Date</label>
                                <div className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                                    {formatDateTime(new Date(purchase.date))}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                <div className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                                    {String(purchase.status || 'PENDING').toUpperCase()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Reference</label>
                                <div className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                                    {purchase.refNumber || purchase.ref_number || '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Package className="text-green-500" /> Items
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Product Name</th>
                                        <th className="p-3 w-24 text-center">Qty</th>
                                        <th className="p-3 w-32 text-right">Unit Cost</th>
                                        <th className="p-3 w-32 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {(purchase.items || []).map((item: any) => (
                                        <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-3 font-medium">
                                                <div className="text-gray-900 dark:text-white">{item.product?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{item.product?.skuCode || item.product?.sku_code || '-'}</div>
                                            </td>
                                            <td className="p-3 text-center">{item.quantity}</td>
                                            <td className="p-3 text-right">{formatCurrency(Number(item.costPrice || item.cost_price || 0))}</td>
                                            <td className="p-3 text-right font-medium">
                                                {formatCurrency(Number(item.quantity || 0) * Number(item.costPrice || item.cost_price || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                    {(purchase.items || []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-10 text-center text-gray-400">
                                                No items found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <DollarSign className="text-green-500" /> Payment Summary
                        </h2>

                        <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="font-semibold text-gray-600 dark:text-gray-300">Payment Progress</span>
                                    <span className="font-semibold text-gray-600 dark:text-gray-300">{totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0}%</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all ${totals.due <= 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                                        style={{ width: `${totals.total > 0 ? (totals.paid / totals.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Amount Summary */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totals.total)}</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Paid</div>
                                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.paid)}</div>
                                </div>
                                <div className={`p-3 rounded-lg ${totals.due <= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Due</div>
                                    <div className={`text-lg font-bold ${totals.due <= 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{formatCurrency(totals.due)}</div>
                                </div>
                            </div>
                        </div>

                        {totals.due > 0 && (
                            <div className="space-y-3 pt-4">
                                {/* Quick Pay Buttons */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setPaymentAmount(String(totals.due))}
                                        className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        Pay All
                                    </button>
                                    <button
                                        onClick={() => setPaymentAmount((totals.due / 2).toFixed(2))}
                                        className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                        Pay Half
                                    </button>
                                    <button
                                        onClick={() => setPaymentAmount('')}
                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-2">Custom Amount</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                                            <input
                                                type="number"
                                                className="w-full pl-6 pr-3 py-2.5 bg-white dark:bg-gray-700 border-2 border-orange-200 dark:border-orange-800 rounded-lg outline-none focus:border-orange-500 font-bold text-lg text-orange-600 dark:text-orange-400 placeholder-gray-400"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                placeholder="0.00"
                                                step="0.01"
                                                max={totals.due}
                                            />
                                        </div>
                                        {paymentAmount && Number(paymentAmount) > totals.due && (
                                            <div className="text-right text-xs text-red-600 dark:text-red-400 font-semibold">
                                                Over by {formatCurrency(Number(paymentAmount) - totals.due)}
                                            </div>
                                        )}
                                    </div>
                                    {paymentAmount && Number(paymentAmount) > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Remaining: {formatCurrency(Math.max(0, totals.due - Number(paymentAmount)))}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-2">Payment Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase mb-2">Payment Method</label>
                                        <select
                                            className="w-full p-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg outline-none text-sm focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="cash">💵 Cash</option>
                                            <option value="bank">🏦 Bank Transfer</option>
                                            <option value="card">💳 Card</option>
                                            <option value="cheque">📄 Cheque</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        onClick={handlePayment}
                                        disabled={!paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > totals.due}
                                        className={`w-full py-3 rounded-lg font-bold text-white text-lg transition-all ${
                                            paymentAmount && Number(paymentAmount) > totals.due
                                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                                : !paymentAmount || Number(paymentAmount) <= 0
                                                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                                    : paymentAmount && Number(paymentAmount) === totals.due
                                                        ? 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/30'
                                                        : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30'
                                        }`}
                                    >
                                        {paymentAmount && Number(paymentAmount) === totals.due ? '✓ Pay Full Amount' : `Pay ${paymentAmount ? formatCurrency(Number(paymentAmount)) : '0.00'}`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {totals.due <= 0 && (
                            <div className="py-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                                <p className="text-green-700 dark:text-green-300 font-bold">✓ Payment Complete</p>
                                <p className="text-xs text-green-600 dark:text-green-400">All invoices paid</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="text-purple-500" /> Payment History
                        </h2>
                        <div className="space-y-3">
                            {(purchase.payments || []).length > 0 ? (
                                (purchase.payments || []).map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between text-sm">
                                        <div className="text-gray-600 dark:text-gray-400">
                                            {formatDateTime(new Date(payment.paidAt))} • {payment.method}
                                        </div>
                                        <div className="font-semibold text-green-600">{formatCurrency(Number(payment.amount))}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500">No payments recorded yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
