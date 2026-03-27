import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Award, Receipt, Calendar, DollarSign, Wallet, AlertCircle, CheckCircle2, History, X } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/Button';

export const CustomerProfilePage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const token = useAuthStore((state) => state.token);
    const [customer, setCustomer] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [pointsHistory, setPointsHistory] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [paymentSaleId, setPaymentSaleId] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();
    const { formatCurrency } = useCurrency();

    useEffect(() => {
        const loadCustomer = async () => {
            if (!id || !token) return;
            try {
                const response = await fetch(getApiUrl(`/customers/${id}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to load customer');
                const payload = await response.json();
                setCustomer(payload);
                setTransactions(payload.sales || []);
                setPointsHistory(payload.pointsLedger || []);

                const payRes = await fetch(getApiUrl(`/customers/${id}/payments`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (payRes.ok) setPayments(await payRes.json());
            } catch (error) {
                console.error('Failed to load customer profile', error);
            }
        };

        loadCustomer();
    }, [id, token]);

    const handleProcessPayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            addToast('Please enter a valid amount', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch(getApiUrl(`/customers/${id}/payments`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount,
                    paymentMethod,
                    note: paymentNote,
                    saleId: paymentSaleId || undefined
                })
            });

            if (!response.ok) throw new Error('Payment failed');

            addToast('Payment recorded successfully', 'success');
            setIsPaymentModalOpen(false);
            setPaymentAmount('');
            setPaymentNote('');

            // Reload data
            const custResponse = await fetch(getApiUrl(`/customers/${id}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (custResponse.ok) {
                const payload = await custResponse.json();
                setCustomer(payload);
                setTransactions(payload.sales || []);
            }
            const payRes = await fetch(getApiUrl(`/customers/${id}/payments`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (payRes.ok) setPayments(await payRes.json());
        } catch (error) {
            console.error('Payment processing failed', error);
            addToast('Failed to record payment', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const transactionItemsMap = useMemo(() => {
        const map = new Map<string, { count: number }>();
        (transactions || []).forEach((t) => {
            const count = (t.items || []).length || 0;
            map.set(String(t.id || t.transaction_id), { count });
        });
        return map;
    }, [transactions]);

    const outstandingDue = Number(customer?.stats?.outstandingDue ?? customer?.totalDue ?? 0);

    if (!customer) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/admin/customers')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Customer Profile</h1>
                </div>
                <div className="text-gray-500 dark:text-gray-400">Customer not found.</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/customers')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Profile</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">CUS-{String(customer.id || customer.customer_id).padStart(4, '0')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm text-white/80">Customer</div>
                            <div className="text-2xl font-bold">{customer.name}</div>
                            <div className="text-sm text-white/80">CUS-{String(customer.id || customer.customer_id).padStart(4, '0')}</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                        <div className="bg-white/15 px-3 py-2 rounded-lg flex items-center gap-2">
                            <Phone size={14} /> {customer.phone}
                        </div>
                        <div className="bg-white/15 px-3 py-2 rounded-lg flex items-center gap-2">
                            <Mail size={14} /> {customer.email || '-'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Points Balance</div>
                    <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                        <Award size={20} /> {customer.pointsBalance ?? customer.loyalty_points_balance}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Credit Balance</div>
                    <div className={`mt-2 text-2xl font-bold flex items-center gap-2 ${outstandingDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        <Wallet size={20} /> {formatCurrency(outstandingDue)}
                    </div>
                    {outstandingDue > 0 && (
                        <button
                            onClick={() => {
                                setPaymentAmount(String(outstandingDue));
                                setPaymentNote('General debt repayment');
                                setPaymentSaleId(null);
                                setIsPaymentModalOpen(true);
                            }}
                            className="mt-2 w-full py-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold uppercase hover:bg-red-100 transition-colors border border-red-100 dark:border-red-900/30"
                        >
                            Pay Due Amount
                        </button>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total Spend</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign size={20} /> {Number(customer.totalSpend ?? customer.total_spend_to_date ?? 0).toFixed(2)}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Transactions</div>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {transactions?.length || 0}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Last Purchase</div>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {transactions?.[0] ? new Date(transactions[0].createdAt || transactions[0].timestamp).toLocaleString() : 'No purchases'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Receipt size={16} /> Sales History
                    </h2>
                    <div className="max-h-105 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-2 text-left">Bill #</th>
                                    <th className="py-2 text-left">Date</th>
                                    <th className="py-2 text-left">Method</th>
                                    <th className="py-2 text-right">Items</th>
                                    <th className="py-2 text-right">Total</th>
                                    <th className="py-2 text-right">Due</th>
                                    <th className="py-2 text-center pl-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {transactions?.map(t => (
                                    <tr
                                        key={t.id || t.transaction_id}
                                        className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                        onClick={() => navigate(`/admin/transactions/${t.id || t.transaction_id}`)}
                                    >
                                        <td className="py-2">#{t.id || t.transaction_id}</td>
                                        <td className="py-2 text-xs">{new Date(t.createdAt || t.timestamp).toLocaleString()}</td>
                                        <td className="py-2 capitalize">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.paymentMethod === 'credit' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                                    t.paymentMethod === 'split' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {t.paymentMethod || 'cash'}
                                            </span>
                                        </td>
                                        <td className="py-2 text-right font-medium">{transactionItemsMap.get(String(t.id || t.transaction_id))?.count || 0}</td>
                                        <td className="py-2 text-right font-medium">{formatCurrency(Number(t.total || t.total_amount || 0))}</td>
                                        <td className={`py-2 text-right font-bold ${Math.max(0, Number(t.dueAmount || 0)) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {formatCurrency(Math.max(0, Number(t.dueAmount || 0)))}
                                        </td>
                                        <td className="py-2 text-right pl-4">
                                            {Math.max(0, Number(t.dueAmount || 0)) > 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPaymentAmount(String(Math.max(0, Number(t.dueAmount || 0))));
                                                        setPaymentNote(`Payment for Bill #${t.id || t.transaction_id}`);
                                                        setPaymentSaleId(t.id || t.transaction_id);
                                                        setIsPaymentModalOpen(true);
                                                    }}
                                                    className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold uppercase hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                                                >
                                                    Pay Bill
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactions?.length === 0 && (
                            <div className="text-gray-500 text-sm py-4">No sales history</div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Award size={16} /> Points History
                    </h2>
                    <div className="max-h-105 overflow-y-auto space-y-2 text-sm">
                        {pointsHistory?.map(p => (
                            <div key={p.id} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                <span className="flex items-center gap-2">
                                    <Calendar size={12} /> {new Date(p.createdAt || p.timestamp).toLocaleString()}
                                </span>
                                <span className={Number(p.points || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {Number(p.points || 0) >= 0 ? '+' : ''}{p.points}
                                </span>
                            </div>
                        ))}
                        {pointsHistory?.length === 0 && (
                            <div className="text-gray-500">No points history</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Repayment History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <History size={16} /> Repayment History
                </h2>
                <div className="max-h-75 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="py-2 text-left">Date</th>
                                <th className="py-2 text-left">Bill #</th>
                                <th className="py-2 text-left">Method</th>
                                <th className="py-2 text-right">Amount</th>
                                <th className="py-2 text-left pl-4">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {payments?.map(p => (
                                <tr key={p.id} className="text-gray-700 dark:text-gray-300">
                                    <td className="py-2 text-xs">{new Date(p.createdAt).toLocaleString()}</td>
                                    <td className="py-2">
                                        {p.saleId ? (
                                            <span className="text-blue-600 dark:text-blue-400 font-medium">#{p.saleId}</span>
                                        ) : (
                                            <span className="text-gray-400">General</span>
                                        )}
                                    </td>
                                    <td className="py-2 capitalize">{p.paymentMethod}</td>
                                    <td className="py-2 text-right font-bold text-green-600">{formatCurrency(Number(p.amount))}</td>
                                    <td className="py-2 pl-4 text-xs italic text-gray-400">{p.note || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {payments?.length === 0 && (
                        <div className="text-gray-500 text-sm py-4">No repayment history</div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                    <DialogContent className="w-full max-w-md p-6" showCloseButton={false}>
                        <DialogHeader className="mb-6">
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Wallet className="text-blue-500" /> Record Payment
                                </DialogTitle>
                                <Button type="button" onClick={() => setIsPaymentModalOpen(false)} variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Amount</label>
                                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(Math.max(0, outstandingDue))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Amount</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter amount"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['cash', 'card', 'bank'].map(m => (
                                        <Button
                                            key={m}
                                            type="button"
                                            onClick={() => setPaymentMethod(m)}
                                            variant={paymentMethod === m ? 'primary' : 'ghost'}
                                            size="sm"
                                            className={`py-2 text-sm font-bold capitalize border ${paymentMethod === m
                                                ? 'border-blue-600 text-white shadow-md'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900'
                                                }`}
                                        >
                                            {m}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
                                <textarea
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={2}
                                />
                            </div>

                            <Button
                                type="button"
                                onClick={handleProcessPayment}
                                disabled={isProcessing || !paymentAmount}
                                fullWidth
                                className="py-3 font-bold shadow-lg disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Repayment'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};
