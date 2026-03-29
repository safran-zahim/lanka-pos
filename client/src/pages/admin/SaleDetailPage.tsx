import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Printer, Receipt, User, Users, CreditCard, Wallet,
    Tag, Star, RotateCcw, FileText, AlertTriangle, CheckCircle,
    Clock, XCircle, ChevronRight, Banknote
} from 'lucide-react';
import { ReceiptModal } from '../../components/ReceiptModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrency } from '../../hooks/useCurrency';
import { getApiUrl } from '../../config/api';
import { useToast } from '../../store/useToast';

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { icon: any; label: string; cls: string }> = {
        completed: { icon: CheckCircle, label: 'Completed', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
        voided: { icon: XCircle, label: 'Voided', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
        parked: { icon: Clock, label: 'Parked', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    };
    const cfg = map[status] || map['completed'];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
            <Icon size={12} /> {cfg.label}
        </span>
    );
};

const PaymentBadge = ({ method }: { method: string }) => {
    const map: Record<string, { label: string; cls: string }> = {
        cash: { label: 'Cash', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
        card: { label: 'Card', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
        split: { label: 'Split', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
        credit: { label: 'Credit', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
        other: { label: 'Other', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    };
    const cfg = map[method] || map['other'];
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
};

export const SaleDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((s) => s.token);
    const { user } = useAuthStore();
    const { formatCurrency } = useCurrency();
    const { addToast } = useToast();

    const [transaction, setTransaction] = useState<any | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank'>('cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [invoicePayments, setInvoicePayments] = useState<any[]>([]);
    const [loadingInvoicePayments, setLoadingInvoicePayments] = useState(false);

    useEffect(() => {
        if (!id || !token) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(getApiUrl(`/sales/${id}?includeItems=true`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to load');
                setTransaction(await res.json());
            } catch (err) {
                console.error(err);
                setTransaction(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, token]);

    const loadTransaction = async () => {
        if (!id || !token) return;
        const res = await fetch(getApiUrl(`/sales/${id}?includeItems=true`), {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to reload sale');
        setTransaction(await res.json());
    };

    const loadInvoicePayments = async (customerId?: number | string, saleId?: number | string) => {
        if (!token || !customerId || !saleId) {
            setInvoicePayments([]);
            return;
        }
        setLoadingInvoicePayments(true);
        try {
            const response = await fetch(getApiUrl(`/customers/${customerId}/payments`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load invoice payments');
            const allPayments = await response.json();
            const filtered = (allPayments || []).filter((payment: any) => Number(payment.saleId) === Number(saleId));
            setInvoicePayments(filtered);
        } catch (error) {
            console.error(error);
            setInvoicePayments([]);
        } finally {
            setLoadingInvoicePayments(false);
        }
    };

    useEffect(() => {
        if (!transaction?.id || !transaction?.customer?.id) {
            setInvoicePayments([]);
            return;
        }
        loadInvoicePayments(transaction.customer.id, transaction.id);
    }, [transaction?.id, transaction?.customer?.id, token]);

    if (loading) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[50vh] text-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <div className="text-muted-foreground">Loading transaction...</div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[50vh] text-foreground">
                <AlertTriangle className="text-red-400 mb-3" size={40} />
                <div className="text-muted-foreground">Transaction not found.</div>
                <button onClick={() => navigate('/admin/transactions')} className="mt-4 text-primary hover:underline text-sm">← Back to Sales</button>
            </div>
        );
    }

    const isReturn = !!transaction.parentSaleId;
    const tax = Number(transaction.tax || 0);
    const subtotal = Number(transaction.subtotal || 0);
    const discount = Number(transaction.discount || 0);
    const roundOff = Number(transaction.roundOffDiscount || 0);
    const grandTotal = Number(transaction.total || 0);
    const dueAmount = Math.max(0, Number(transaction.dueAmount || 0));
    const pointsEarned = Number(transaction.pointsEarned || 0);
    const pointsRedeemed = Number(transaction.pointsRedeemed || 0);
    const paymentDetails = transaction.paymentDetails as any;
    const items = transaction.items || [];
    const customer = transaction.customer;
    const staff = transaction.staff;
    const returns = transaction.returns || [];

    // Items-based subtotal for display when subtotal field is 0
    const itemsTotal = items.reduce((sum: number, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
    const displaySubtotal = subtotal > 0 ? subtotal : itemsTotal;

    const taxPercent = tax > 0 && displaySubtotal - discount > 0
        ? ((tax / (displaySubtotal - discount)) * 100).toFixed(2)
        : '0.00';
    const cashPortion = Number(paymentDetails?.cashAmount || (transaction.paymentMethod === 'cash' ? grandTotal : 0));
    const cardPortion = Number(paymentDetails?.cardAmount || (transaction.paymentMethod === 'card' ? grandTotal : 0));
    const creditPortion = Number(paymentDetails?.creditAmount || (transaction.paymentMethod === 'credit' ? dueAmount || Math.max(0, grandTotal - cashPortion - cardPortion) : 0));
    const collectedNow = cashPortion + cardPortion;
    const cashTendered = Number(paymentDetails?.cashAmount || 0);
    const changeGiven = transaction.paymentMethod !== 'split' && cashTendered > grandTotal ? cashTendered - grandTotal : 0;
    const parsedPaymentAmount = Number(paymentAmount || 0);
    const paidAgainstInvoice = invoicePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const remainingAfterInput = Math.max(0, dueAmount - (Number.isFinite(parsedPaymentAmount) ? parsedPaymentAmount : 0));

    const handlePayDue = async () => {
        if (!token) return;
        if (!customer?.id) {
            addToast('This sale has no customer linked', 'error');
            return;
        }
        if (dueAmount <= 0) {
            addToast('No due amount remaining', 'error');
            return;
        }
        if (!paymentAmount || Number.isNaN(parsedPaymentAmount) || parsedPaymentAmount <= 0) {
            addToast('Enter a valid payment amount', 'error');
            return;
        }
        if (parsedPaymentAmount > dueAmount) {
            addToast('Payment exceeds due amount', 'error');
            return;
        }

        setIsPaying(true);
        try {
            const response = await fetch(getApiUrl(`/customers/${customer.id}/payments`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: parsedPaymentAmount,
                    paymentMethod,
                    note: paymentNote || `Payment for Bill #${transaction.id}`,
                    saleId: Number(transaction.id)
                })
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || 'Failed to record payment');
            }

            addToast('Payment recorded successfully', 'success');
            setPaymentAmount('');
            setPaymentNote('');
            await loadTransaction();
            await loadInvoicePayments(customer.id, transaction.id);
        } catch (error: any) {
            console.error(error);
            addToast(error?.message || 'Failed to record payment', 'error');
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-5 text-foreground">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/transactions')}
                        className="p-2 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-lg shadow-sm border border-border transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{isReturn ? 'Return / Refund' : 'Sale'} Report</h1>
                            {isReturn && (
                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-bold flex items-center gap-1">
                                    <RotateCcw size={10} /> RETURN
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Bill #{transaction.id} &nbsp;·&nbsp; {new Date(transaction.createdAt).toLocaleString()}
                            {isReturn && transaction.parentSaleId && (
                                <span className="ml-2 text-red-500">
                                    · Ref: <button onClick={() => navigate(`/admin/transactions/${transaction.parentSaleId}`)} className="underline hover:text-red-600">#{transaction.parentSaleId}</button>
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={transaction.status || 'completed'} />
                    <PaymentBadge method={transaction.paymentMethod || 'cash'} />
                    <button
                        onClick={() => setIsPrinting(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                        <Printer size={15} /> Print Receipt
                    </button>
                </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Customer */}
                <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                        <Users size={12} /> Customer
                    </div>
                    {customer ? (
                        <div>
                            <div className="font-bold text-base">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.phone || '-'}</div>
                            <button
                                onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                className="mt-1.5 text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                View Profile <ChevronRight size={12} />
                            </button>
                        </div>
                    ) : (
                        <div className="font-bold text-base text-gray-500">Walk-in Customer</div>
                    )}
                </div>

                {/* Staff */}
                <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                        <User size={12} /> Served By
                    </div>
                    <div className="font-bold text-base">{staff?.username || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground capitalize">{staff?.role || '-'}</div>
                </div>

                {/* Note */}
                <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                        <FileText size={12} /> Note
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                        {transaction.note || <span className="text-gray-400">No note</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Total</div>
                    <div className="mt-1 text-xl font-bold text-foreground">{formatCurrency(grandTotal)}</div>
                </div>
                <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Paid (This Invoice)</div>
                    <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAgainstInvoice)}</div>
                </div>
                <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Open Due</div>
                    <div className={`mt-1 text-xl font-bold ${dueAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(dueAmount)}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                    <Receipt size={16} className="text-primary" />
                    <h2 className="font-bold text-base">Items</h2>
                    <span className="ml-auto text-sm text-gray-400">{items.length} line{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 font-medium">Product</th>
                                <th className="px-4 py-3 font-medium">SKU</th>
                                <th className="px-4 py-3 font-medium">Batch</th>
                                <th className="px-4 py-3 font-medium text-right">Qty</th>
                                <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                                <th className="px-4 py-3 font-medium text-right">Line Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {items.map((item: any) => {
                                const qty = Number(item.quantity || 0);
                                const price = Number(item.price || 0);
                                const batchId = item.batchId ?? item.batch_id ?? item.batch?.id ?? null;
                                const batchDateRaw = item.batch?.purchase?.date || item.batch?.createdAt || item.batch?.created_at;
                                return (
                                    <tr key={item.id} className={`hover:bg-accent hover:text-accent-foreground/30 transition-colors ${qty < 0 ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                                        <td className="px-4 py-3 font-medium">
                                            {item.product?.name || 'Unknown'}
                                            {qty < 0 && <span className="ml-2 text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded font-bold">RETURN</span>}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                                            {item.product?.skuCode || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {batchId ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">B#{batchId}</span>
                                                    {batchDateRaw && (
                                                        <span className="text-[10px] text-gray-400">{new Date(batchDateRaw).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            ) : 'N/A'}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${qty < 0 ? 'text-destructive' : ''}`}>
                                            {qty}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {formatCurrency(price)}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-semibold ${qty < 0 ? 'text-destructive' : ''}`}>
                                            {formatCurrency(price * Math.abs(qty))}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Financial Summary + Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Financial Breakdown */}
                <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                        <Tag size={16} className="text-primary" /> Financial Breakdown
                    </h2>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Items Total</span>
                            <span className="font-medium">{formatCurrency(itemsTotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-success">
                                <span>Discount Applied</span>
                                <span className="font-medium">− {formatCurrency(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold border-t border-border pt-2 mt-1">
                            <span>Subtotal (After Discount)</span>
                            <span>{formatCurrency(Math.max(0, displaySubtotal - discount))}</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>Tax ({taxPercent}%)</span>
                                <span className="font-medium">+ {formatCurrency(tax)}</span>
                            </div>
                        )}
                        {roundOff > 0 && (
                            <div className="flex justify-between text-success">
                                <span>Round Off</span>
                                <span className="font-medium">− {formatCurrency(roundOff)}</span>
                            </div>
                        )}
                        <div className={`flex justify-between font-bold text-lg border-t border-border pt-3 mt-2 ${isReturn ? 'text-destructive' : 'text-foreground'}`}>
                            <span>{isReturn ? 'REFUND TOTAL' : 'GRAND TOTAL'}</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
                        {!isReturn && collectedNow > 0 && (
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold border-t border-border pt-2 mt-1">
                                <span>Collected Now</span>
                                <span>{formatCurrency(collectedNow)}</span>
                            </div>
                        )}
                        {dueAmount > 0 && (
                            <div className="flex justify-between text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/10 rounded-lg px-3 py-2 border border-orange-100 dark:border-orange-900/30">
                                <span>Outstanding Due</span>
                                <span>{formatCurrency(dueAmount)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment & Loyalty */}
                <div className="space-y-4">

                    {/* Payment Method */}
                    <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
                        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                            {transaction.paymentMethod === 'card' ? <CreditCard size={16} className="text-primary" /> :
                                transaction.paymentMethod === 'credit' ? <Wallet size={16} className="text-accent" /> :
                                    <Banknote size={16} className="text-green-500" />}
                            Payment
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Method</span>
                                <PaymentBadge method={transaction.paymentMethod || 'cash'} />
                            </div>
                            {(transaction.paymentMethod === 'split' || transaction.paymentMethod === 'credit') && (cashPortion > 0 || cardPortion > 0 || creditPortion > 0) && (
                                <>
                                    {cashPortion > 0 && (
                                        <div className="flex justify-between text-muted-foreground ml-2 border-l-2 border-border pl-2">
                                            <span>Cash Portion</span>
                                            <span className="font-medium">{formatCurrency(cashPortion)}</span>
                                        </div>
                                    )}
                                    {cardPortion > 0 && (
                                        <div className="flex justify-between text-muted-foreground ml-2 border-l-2 border-border pl-2">
                                            <span>Card Portion</span>
                                            <span className="font-medium">{formatCurrency(cardPortion)}</span>
                                        </div>
                                    )}
                                    {creditPortion > 0 && (
                                        <div className="flex justify-between text-muted-foreground ml-2 border-l-2 border-border pl-2">
                                            <span>Credit Portion</span>
                                            <span className="font-medium">{formatCurrency(creditPortion)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            {cashTendered > 0 && transaction.paymentMethod !== 'split' && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Cash Tendered</span>
                                    <span className="font-medium">{formatCurrency(cashTendered)}</span>
                                </div>
                            )}
                            {changeGiven > 0 && (
                                    <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span>Change Given</span>
                                        <span>{formatCurrency(changeGiven)}</span>
                                    </div>
                                )}
                            {creditPortion > 0 && (
                                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-border text-sm">
                                    <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">On Account (Credit)</p>
                                    <div className="flex justify-between font-semibold">
                                        <span>Charged to Account</span>
                                        <span className="text-orange-600 dark:text-orange-400">{formatCurrency(creditPortion)}</span>
                                    </div>
                                    {dueAmount > 0 && (
                                        <div className="flex justify-between text-sm mt-1 text-red-500">
                                            <span>Outstanding</span>
                                            <span className="font-bold">{formatCurrency(dueAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loyalty Points */}
                    {(pointsEarned > 0 || pointsRedeemed > 0) && (
                        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
                            <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                                <Star size={16} className="text-purple-500" /> Loyalty Points
                            </h2>
                            <div className="space-y-2 text-sm">
                                {pointsEarned > 0 && (
                                    <div className="flex justify-between text-purple-600 dark:text-purple-400 font-medium">
                                        <span>Points Earned</span>
                                        <span>+ {pointsEarned} pts</span>
                                    </div>
                                )}
                                {pointsRedeemed > 0 && (
                                    <div className="flex justify-between text-red-500 font-medium">
                                        <span>Points Redeemed</span>
                                        <span>− {pointsRedeemed} pts</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {dueAmount > 0 && customer?.id && !isReturn && (
                        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
                            <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                                <Wallet size={16} className="text-accent" /> Due Payment
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Invoice Due</span>
                                    <span className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(dueAmount)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Already Paid (This Bill)</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAgainstInvoice)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setPaymentAmount(String(dueAmount))}
                                        className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        Pay All
                                    </button>
                                    <button
                                        onClick={() => setPaymentAmount((dueAmount / 2).toFixed(2))}
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
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(event) => setPaymentAmount(event.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                        min="0"
                                        step="0.01"
                                        max={dueAmount}
                                        placeholder="0.00"
                                    />
                                    {paymentAmount && parsedPaymentAmount > 0 && (
                                        <p className="mt-1 text-xs text-muted-foreground">Remaining after this payment: {formatCurrency(remainingAfterInput)}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(event) => setPaymentMethod(event.target.value as 'cash' | 'card' | 'bank')}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="bank">Bank</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Note</label>
                                    <input
                                        type="text"
                                        value={paymentNote}
                                        onChange={(event) => setPaymentNote(event.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                        placeholder={`Payment for Bill #${transaction.id}`}
                                    />
                                </div>
                                <button
                                    onClick={handlePayDue}
                                    disabled={isPaying || !paymentAmount || parsedPaymentAmount <= 0 || parsedPaymentAmount > dueAmount}
                                    className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold disabled:opacity-50"
                                >
                                    {isPaying ? 'Processing...' : `Record Payment ${paymentAmount ? `(${formatCurrency(parsedPaymentAmount)})` : ''}`}
                                </button>

                                <div className="pt-2 border-t border-border">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Invoice Payment History</h3>
                                    {loadingInvoicePayments ? (
                                        <div className="text-xs text-muted-foreground">Loading payment history...</div>
                                    ) : invoicePayments.length === 0 ? (
                                        <div className="text-xs text-muted-foreground">No payments recorded for this invoice yet.</div>
                                    ) : (
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                            {invoicePayments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/40 rounded px-2 py-1.5">
                                                    <span className="text-muted-foreground">{new Date(payment.createdAt).toLocaleString()} · {String(payment.paymentMethod || '').toUpperCase()}</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(payment.amount || 0))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Returns linked to this sale */}
            {returns.length > 0 && (
                <div className="bg-card text-card-foreground border border-orange-200 dark:border-orange-900/40 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-900/10 flex items-center gap-2">
                        <RotateCcw size={16} className="text-orange-600 dark:text-orange-400" />
                        <h2 className="font-bold text-base text-orange-700 dark:text-orange-300">Returns Against This Bill</h2>
                        <span className="ml-auto text-xs text-accent">{returns.length} return{returns.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {returns.map((ret: any) => (
                            <div key={ret.id} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        onClick={() => navigate(`/admin/transactions/${ret.id}`)}
                                        className="text-sm font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                                    >
                                        Return #{ret.id} <ChevronRight size={14} />
                                    </button>
                                    <span className="text-xs text-gray-500">{new Date(ret.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-0.5">
                                    {(ret.items || []).map((it: any) => (
                                        <div key={it.id} className="flex justify-between">
                                            <span>{it.product?.name || 'Product'} × {Math.abs(Number(it.quantity || 0))}</span>
                                            <span className="font-medium text-destructive">
                                                − {formatCurrency(Number(it.price || 0) * Math.abs(Number(it.quantity || 0)))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Print Receipt Modal */}
            {isPrinting && transaction && (
                <ReceiptModal
                    transaction={{
                        ...transaction,
                        transaction_id: transaction.id,
                        timestamp: transaction.createdAt,
                        total_amount: Number(transaction.total || 0),
                        tax_amount: Number(transaction.tax || 0),
                        discount: Number(transaction.discount || 0),
                        round_off_discount: Number(transaction.roundOffDiscount || 0),
                        payment_method: transaction.paymentMethod || 'cash',
                        payment_details: transaction.paymentDetails,
                        type: isReturn ? 'return' : 'sale',
                        parent_sale_id: transaction.parentSaleId
                    }}
                    items={(transaction.items || []).map((it: any) => ({
                        ...it,
                        name: it.product?.name || 'Unknown',
                        price_at_sale: Number(it.price || 0)
                    }))}
                    customer={customer ? {
                        ...customer,
                        customer_id: customer.id,
                        name: customer.name,
                        phone: customer.phone,
                        total_due: Number(customer.totalDue || 0)
                    } : null}
                    user={user}
                    onClose={() => setIsPrinting(false)}
                />
            )}
        </div>
    );
};

export default SaleDetailPage;
