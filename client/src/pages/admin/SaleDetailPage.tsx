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

    const [transaction, setTransaction] = useState<any | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[50vh] text-gray-900 dark:text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <div className="text-gray-500 dark:text-gray-400">Loading transaction...</div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[50vh] text-gray-900 dark:text-white">
                <AlertTriangle className="text-red-400 mb-3" size={40} />
                <div className="text-gray-500 dark:text-gray-400">Transaction not found.</div>
                <button onClick={() => navigate('/admin/transactions')} className="mt-4 text-blue-500 hover:underline text-sm">← Back to Sales</button>
            </div>
        );
    }

    const isReturn = !!transaction.parentSaleId;
    const tax = Number(transaction.tax || 0);
    const subtotal = Number(transaction.subtotal || 0);
    const discount = Number(transaction.discount || 0);
    const roundOff = Number(transaction.roundOffDiscount || 0);
    const grandTotal = Number(transaction.total || 0);
    const dueAmount = Number(transaction.dueAmount || 0);
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

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-5 text-gray-900 dark:text-white">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/transactions')}
                        className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                        <Printer size={15} /> Print Receipt
                    </button>
                </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Customer */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                        <Users size={12} /> Customer
                    </div>
                    {customer ? (
                        <div>
                            <div className="font-bold text-base">{customer.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{customer.phone || '-'}</div>
                            <button
                                onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                className="mt-1.5 text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                                View Profile <ChevronRight size={12} />
                            </button>
                        </div>
                    ) : (
                        <div className="font-bold text-base text-gray-500">Walk-in Customer</div>
                    )}
                </div>

                {/* Staff */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                        <User size={12} /> Served By
                    </div>
                    <div className="font-bold text-base">{staff?.username || 'Unknown'}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{staff?.role || '-'}</div>
                </div>

                {/* Note */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                        <FileText size={12} /> Note
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                        {transaction.note || <span className="text-gray-400">No note</span>}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <Receipt size={16} className="text-blue-500" />
                    <h2 className="font-bold text-base">Items</h2>
                    <span className="ml-auto text-sm text-gray-400">{items.length} line{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
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
                                return (
                                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${qty < 0 ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                                        <td className="px-4 py-3 font-medium">
                                            {item.product?.name || 'Unknown'}
                                            {qty < 0 && <span className="ml-2 text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded font-bold">RETURN</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">
                                            {item.product?.skuCode || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                            {item.batch?.batchNumber || 'N/A'}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${qty < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                            {qty}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                                            {formatCurrency(price)}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-semibold ${qty < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
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
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                        <Tag size={16} className="text-blue-500" /> Financial Breakdown
                    </h2>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Items Total</span>
                            <span className="font-medium">{formatCurrency(itemsTotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>Discount Applied</span>
                                <span className="font-medium">− {formatCurrency(discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold border-t border-gray-100 dark:border-gray-700 pt-2 mt-1">
                            <span>Subtotal (After Discount)</span>
                            <span>{formatCurrency(Math.max(0, displaySubtotal - discount))}</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Tax ({taxPercent}%)</span>
                                <span className="font-medium">+ {formatCurrency(tax)}</span>
                            </div>
                        )}
                        {roundOff > 0 && (
                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>Round Off</span>
                                <span className="font-medium">− {formatCurrency(roundOff)}</span>
                            </div>
                        )}
                        <div className={`flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-3 mt-2 ${isReturn ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                            <span>{isReturn ? 'REFUND TOTAL' : 'GRAND TOTAL'}</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
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
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
                        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                            {transaction.paymentMethod === 'card' ? <CreditCard size={16} className="text-blue-500" /> :
                                transaction.paymentMethod === 'credit' ? <Wallet size={16} className="text-orange-500" /> :
                                    <Banknote size={16} className="text-green-500" />}
                            Payment
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Method</span>
                                <PaymentBadge method={transaction.paymentMethod || 'cash'} />
                            </div>
                            {transaction.paymentMethod === 'split' && paymentDetails && (
                                <>
                                    {Number(paymentDetails.cashAmount || 0) > 0 && (
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400 ml-2 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
                                            <span>Cash Portion</span>
                                            <span className="font-medium">{formatCurrency(Number(paymentDetails.cashAmount || 0))}</span>
                                        </div>
                                    )}
                                    {Number(paymentDetails.cardAmount || 0) > 0 && (
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400 ml-2 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
                                            <span>Card Portion</span>
                                            <span className="font-medium">{formatCurrency(Number(paymentDetails.cardAmount || 0))}</span>
                                        </div>
                                    )}
                                    {Number(paymentDetails.creditAmount || 0) > 0 && (
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400 ml-2 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
                                            <span>Credit Portion</span>
                                            <span className="font-medium">{formatCurrency(Number(paymentDetails.creditAmount || 0))}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            {paymentDetails?.cashAmount && !paymentDetails?.cardAmount && (
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Cash Tendered</span>
                                    <span className="font-medium">{formatCurrency(Number(paymentDetails.cashAmount))}</span>
                                </div>
                            )}
                            {paymentDetails?.cashAmount &&
                                Number(paymentDetails.cashAmount) > grandTotal &&
                                transaction.paymentMethod !== 'split' && (
                                    <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                                        <span>Change Given</span>
                                        <span>{formatCurrency(Number(paymentDetails.cashAmount) - grandTotal)}</span>
                                    </div>
                                )}
                            {transaction.paymentMethod === 'credit' && (
                                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm">
                                    <p className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">On Account (Credit)</p>
                                    <div className="flex justify-between font-semibold">
                                        <span>Charged to Account</span>
                                        <span className="text-orange-600 dark:text-orange-400">{formatCurrency(grandTotal)}</span>
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
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
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
                </div>
            </div>

            {/* Returns linked to this sale */}
            {returns.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-900/40 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-900/10 flex items-center gap-2">
                        <RotateCcw size={16} className="text-orange-600 dark:text-orange-400" />
                        <h2 className="font-bold text-base text-orange-700 dark:text-orange-300">Returns Against This Bill</h2>
                        <span className="ml-auto text-xs text-orange-500">{returns.length} return{returns.length !== 1 ? 's' : ''}</span>
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
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                                    {(ret.items || []).map((it: any) => (
                                        <div key={it.id} className="flex justify-between">
                                            <span>{it.product?.name || 'Product'} × {Math.abs(Number(it.quantity || 0))}</span>
                                            <span className="font-medium text-red-600 dark:text-red-400">
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
