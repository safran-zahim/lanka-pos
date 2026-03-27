import { useEffect, useMemo, useState } from 'react';
import { X, RefreshCcw, Printer, Check, Tag, Minus, Plus, Info, List, Edit2, Save, FileText, CreditCard, User } from 'lucide-react';
import type { Transaction, TransactionItem, Customer } from '../db/db';
import { useAuthStore } from '../store/useAuthStore';
import { ReceiptModal } from './ReceiptModal';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../store/useToast';
import { useSettingsStore } from '../store/useSettingsStore';
import { getApiUrl } from '../config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/Button';

interface ReturnModalProps {
    saleId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface SaleItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    batchId?: number | null;
    batch?: { id: number; retailPrice: number; createdAt: string } | null;
    product?: { name?: string } | null;
}

interface SaleResponse {
    id: string;
    customerId?: string | null;
    parentSaleId?: string | number | null;
    createdAt: string;
    total: number;
    subtotal?: number | null;
    tax?: number | null;
    discount?: number | null;
    roundOffDiscount?: number | null;
    paymentMethod?: string | null;
    paymentDetails?: any | null;
    note?: string | null;
    items: SaleItem[];
    customer?: {
        id: string;
        name: string;
        phone: string;
        email?: string | null;
        pointsBalance?: number | null;
        totalSpend?: number | null;
    } | null;
    returns?: {
        total: number;
        paymentMethod: string;
        items: SaleItem[];
    }[];
}

type ReturnItem = SaleItem & {
    name: string;
    max_qty: number;
    return_qty: number;
    selected: boolean;
    batchDate?: string;
};

export const ReturnModal = ({ saleId, onClose, onSuccess }: ReturnModalProps) => {
    const { user, token } = useAuthStore();
    const { formatCurrency } = useCurrency();
    const { addToast } = useToast();
    const { taxEnabled } = useSettingsStore();
    const [items, setItems] = useState<ReturnItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [sale, setSale] = useState<SaleResponse | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
    const [receiptItems, setReceiptItems] = useState<(TransactionItem & { name: string })[]>([]);
    const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'credit'>('cash');
    const [refundNote, setRefundNote] = useState('');
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editingNoteValue, setEditingNoteValue] = useState('');
    const [isUpdatingNote, setIsUpdatingNote] = useState(false);
    const salePaymentDetails = sale?.paymentDetails;

    useEffect(() => {
        if (sale?.paymentMethod && sale.paymentMethod.toLowerCase() === 'credit') {
            setRefundMethod('credit');
        } else {
            setRefundMethod('cash');
        }
    }, [sale?.paymentMethod]);

    useEffect(() => {
        const loadSale = async () => {
            if (!saleId || !token) return;
            setLoading(true);
            try {
                const response = await fetch(getApiUrl(`/sales/${saleId}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload.error || 'Failed to load sale');
                }
                const payload: SaleResponse = await response.json();
                const normalizedItems = (payload.items || []).map((item) => ({
                    ...item,
                    price: Number(item.price || 0),
                    quantity: Number(item.quantity || 0)
                }));
                const normalizedReturns = (payload.returns || []).map((returnSale) => ({
                    ...returnSale,
                    items: (returnSale.items || []).map((item) => ({
                        ...item,
                        price: Number(item.price || 0),
                        quantity: Number(item.quantity || 0)
                    }))
                }));

                const normalizedPayload = {
                    ...payload,
                    items: normalizedItems,
                    returns: normalizedReturns
                };

                setSale(normalizedPayload);

                const returnedQtyByProductBatch = new Map<string, number>();
                (normalizedPayload.returns || []).forEach((returnSale) => {
                    (returnSale.items || []).forEach((item) => {
                        const qty = Math.abs(item.quantity);
                        const key = `${item.productId}-${item.batchId || 'null'}`;
                        returnedQtyByProductBatch.set(key, (returnedQtyByProductBatch.get(key) || 0) + qty);
                    });
                });

                const mappedItems = (normalizedPayload.items || []).map((item) => {
                    const key = `${item.productId}-${item.batchId || 'null'}`;
                    const returnedQty = returnedQtyByProductBatch.get(key) || 0;
                    const maxReturnable = Math.max(0, item.quantity - returnedQty);
                    return {
                        ...item,
                        name: item.product?.name || 'Unknown Product',
                        max_qty: maxReturnable,
                        return_qty: maxReturnable > 0 ? maxReturnable : 0,
                        selected: false,
                        batchDate: item.batch?.createdAt ? new Date(item.batch.createdAt).toLocaleDateString() : undefined
                    };
                });

                setItems(mappedItems);

                if (normalizedPayload.customer) {
                    setCustomer({
                        customer_id: normalizedPayload.customer.id,
                        name: normalizedPayload.customer.name,
                        phone: normalizedPayload.customer.phone,
                        email: normalizedPayload.customer.email || undefined,
                        loyalty_points_balance: normalizedPayload.customer.pointsBalance ?? 0,
                        total_spend_to_date: Number(normalizedPayload.customer.totalSpend || 0)
                    });
                } else {
                    setCustomer(null);
                }
            } catch (error) {
                console.error('Failed to load sale for return', error);
                addToast('Failed to load sale for return', 'error');
                onClose();
            } finally {
                setLoading(false);
            }
        };

        loadSale();
    }, [addToast, onClose, saleId, token]);

    const saleSubtotal = useMemo(() => {
        if (!sale) return 0;
        if (sale.subtotal !== null && sale.subtotal !== undefined) return Number(sale.subtotal || 0);
        return sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [sale]);

    const { refundSubtotal, refundTax, refundDiscount, refundRoundOff, refundTotal } = useMemo(() => {
        const subtotal = items.reduce((sum, item) => {
            if (!item.selected) return sum;
            return sum + (item.price * item.return_qty);
        }, 0);

        const taxVal = taxEnabled && saleSubtotal > 0 ? (subtotal / saleSubtotal) * Number(sale?.tax || 0) : 0;
        const discountVal = saleSubtotal > 0 ? (subtotal / saleSubtotal) * Number(sale?.discount || 0) : 0;
        const roundOffVal = saleSubtotal > 0 ? (subtotal / saleSubtotal) * Number(sale?.roundOffDiscount || 0) : 0;
        const totalVal = subtotal + taxVal - discountVal - roundOffVal;

        return {
            refundSubtotal: subtotal,
            refundTax: taxVal,
            refundDiscount: discountVal,
            refundRoundOff: roundOffVal,
            refundTotal: totalVal
        };
    }, [items, sale, saleSubtotal, taxEnabled]);

    // Logic: Cash Refund Cap
    const originallyPaidCash = Number(sale?.paymentDetails?.cashAmount || 0);
    const previouslyRefundedCash = useMemo(() => {
        if (!sale?.returns) return 0;
        return sale.returns.reduce((sum, r) => {
            if (r.paymentMethod === 'cash') return sum + Math.abs(r.total);
            return sum;
        }, 0);
    }, [sale?.returns]);

    const maxCashRefundable = Math.max(0, originallyPaidCash - previouslyRefundedCash);
    const isCashRefundCapped = refundMethod === 'cash' && originallyPaidCash > 0 && refundTotal > maxCashRefundable;

    const handlePrintOriginal = () => {
        if (!sale) return;
        setReceiptTransaction({
            transaction_id: sale.id,
            user_id: user?.user_id || user?.username || 'system',
            customer_id: sale.customerId || undefined,
            timestamp: new Date(sale.createdAt),
            total_amount: Number(sale.total || 0),
            tax_amount: Number(sale.tax || 0),
            discount: Number(sale.discount || 0),
            round_off_discount: Number(sale.roundOffDiscount || 0),
            payment_method: (sale.paymentMethod || 'cash') as any,
            payment_details: sale.paymentDetails,
            status: 'completed',
            type: 'sale',
            note: sale.note || 'Original Sale Reprint'
        });

        setReceiptItems((sale.items || []).map((item: any) => ({
            transaction_id: sale.id,
            product_id: item.productId,
            quantity: Math.abs(item.quantity),
            price_at_sale: Number(item.price || 0),
            note: item.note,
            name: item.product?.name || 'Unknown Product'
        })));
    };

    const handleToggleSelect = (index: number) => {
        const newItems = [...items];
        newItems[index].selected = !newItems[index].selected;
        setItems(newItems);
    };

    const handleQtyChange = (index: number, newQty: string) => {
        const qty = parseInt(newQty) || 0;
        const newItems = [...items];
        const maxQty = newItems[index].max_qty;
        if (maxQty <= 0) {
            newItems[index].return_qty = 0;
        } else {
            newItems[index].return_qty = Math.min(Math.max(1, qty), maxQty);
        }
        setItems(newItems);
    };

    const handleUpdateOriginalNote = async () => {
        if (!sale || !token) return;
        setIsUpdatingNote(true);
        try {
            const response = await fetch(getApiUrl(`/sales/${sale.id}/note`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ note: editingNoteValue })
            });

            if (!response.ok) throw new Error('Failed to update note');

            addToast('Original bill note updated', 'success');
            setSale({ ...sale, note: editingNoteValue });
            setIsEditingNote(false);
        } catch (error) {
            addToast('Error updating note', 'error');
        } finally {
            setIsUpdatingNote(false);
        }
    };

    const handleProcessReturn = async () => {
        if (isCashRefundCapped) {
            addToast(`Cash refund exceeds original cash paid (${formatCurrency(maxCashRefundable)})`, 'error');
            return;
        }

        const selectedItems = items.filter(i => i.selected && i.return_qty > 0);
        if (selectedItems.length === 0 || !sale) return;
        if (!token) {
            addToast('Missing auth token', 'error');
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch(getApiUrl('/sales/checkout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    staff_id: user?.user_id || 1,
                    parent_sale_id: sale.id,
                    customer_id: sale.customerId || undefined,
                    payment_method: refundMethod,
                    note: refundNote || `Refund for bill #${sale.id}`,
                    items: selectedItems.map(item => ({
                        product_id: item.productId,
                        quantity: -Math.abs(item.return_qty),
                        unit_price: item.price,
                        batch_id: item.batchId
                    })),
                    totals: {
                        subtotal: -refundSubtotal,
                        tax: -refundTax,
                        discount: -refundDiscount,
                        grand_total: -refundTotal,
                        round_off_discount: -refundRoundOff
                    }
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Return failed');
            }

            const returnSale = await response.json();

            setReceiptTransaction({
                transaction_id: returnSale.id,
                user_id: user?.user_id || user?.username || 'system',
                customer_id: sale.customerId || undefined,
                timestamp: new Date(returnSale.createdAt || new Date()),
                total_amount: Number(returnSale.total || 0),
                tax_amount: Number(returnSale.tax || 0),
                discount: Number(refundDiscount || 0),
                round_off_discount: Number(returnSale.roundOffDiscount || 0),
                payment_method: returnSale.paymentMethod || 'cash',
                status: 'completed',
                type: 'return',
                parent_sale_id: sale.id
            });

            setReceiptItems((returnSale.items || []).map((item: any) => ({
                transaction_id: returnSale.id,
                product_id: item.productId,
                quantity: Math.abs(item.quantity),
                price_at_sale: Number(item.price || 0),
                note: 'Return',
                name: items.find(existing => existing.productId === item.productId)?.name || 'Unknown Product'
            })));

            setItems((prevItems) => prevItems.map((item) => {
                if (!item.selected || item.return_qty <= 0) {
                    return item;
                }
                const remaining = Math.max(0, item.max_qty - item.return_qty);
                return {
                    ...item,
                    max_qty: remaining,
                    return_qty: remaining > 0 ? remaining : 0,
                    selected: false
                };
            }));

            addToast('Return processed successfully', 'success');
            onSuccess();
        } catch (error) {
            console.error('Return failed:', error);
            addToast('Return failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <Dialog open={true}>
                <DialogContent className="flex items-center justify-center">
                    <div className="flex items-center gap-3">
                        <RefreshCcw className="animate-spin text-orange-500" size={20} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Loading bill...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <DialogHeader>
                        <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg">
                                    <RefreshCcw size={18} />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold text-gray-900 dark:text-white leading-tight">Return & Bill Details</DialogTitle>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sale ID: {saleId}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrintOriginal}
                                title="Reprint Original"
                            >
                                <Printer size={18} />
                            </Button>
                        </div>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0 bg-gray-50 dark:bg-gray-900/20">

                    {/* Main Scrollable Area - Content combined */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">

                        {/* Section: Original Bill Details */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText size={16} className="text-blue-500" />
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Transaction Info</h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <div className="text-[10px] text-gray-400 uppercase font-black">Date</div>
                                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                        {sale && new Date(sale.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] text-gray-400 uppercase font-black">Customer</div>
                                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                        {customer?.name || 'Walk-in'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] text-gray-400 uppercase font-black">Method</div>
                                    <div className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase">
                                        {sale?.paymentMethod || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="text-[10px] text-gray-400 uppercase font-black">Total Paid</div>
                                    <div className="text-xs font-black text-gray-900 dark:text-white">
                                        {formatCurrency(sale?.total || 0)}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Breakdown badges */}
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                {salePaymentDetails?.cashAmount > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <span className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase">Cash: {formatCurrency(salePaymentDetails.cashAmount)}</span>
                                    </div>
                                )}
                                {salePaymentDetails?.cardAmount > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase">Card: {formatCurrency(salePaymentDetails.cardAmount)}</span>
                                    </div>
                                )}
                                {salePaymentDetails?.creditAmount > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase">Credit: {formatCurrency(salePaymentDetails.creditAmount)}</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Section: Sale Note Editing */}
                        <section className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <Edit2 size={16} className="text-orange-500" />
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Bill Note</h3>
                                </div>
                                {!isEditingNote ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditingNoteValue(sale?.note || '');
                                            setIsEditingNote(true);
                                        }}
                                    >
                                        <span className="text-[10px] font-black text-orange-600">EDIT</span>
                                    </Button>
                                ) : (
                                    <div className="flex gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditingNote(false)}
                                        >
                                            <span className="text-[10px] font-black text-gray-400">CANCEL</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleUpdateOriginalNote}
                                            disabled={isUpdatingNote}
                                        >
                                            <span className="text-[10px] font-black text-green-600">SAVE</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {isEditingNote ? (
                                <textarea
                                    value={editingNoteValue}
                                    onChange={(e) => setEditingNoteValue(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-orange-200 dark:border-orange-900/50 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none min-h-20"
                                    autoFocus
                                />
                            ) : (
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                    {sale?.note || 'No notes for this transaction.'}
                                </p>
                            )}
                        </section>

                        {/* Section: Returnable Items */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <List size={16} className="text-orange-500" />
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Items to Return</h3>
                            </div>

                            <div className="space-y-2">
                                {items.map((item, index) => {
                                    const isSelected = item.selected;
                                    const returnQty = item.return_qty;
                                    const maxReturnable = item.max_qty;

                                    return (
                                        <div
                                            key={`${item.productId}-${index}`}
                                            className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                                                ? 'border-orange-300 bg-orange-50/20 dark:border-orange-900/50 dark:bg-orange-900/10'
                                                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm hover:border-orange-200 dark:hover:border-orange-800'
                                                }`}
                                            onClick={() => handleToggleSelect(index)}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 dark:border-gray-700'}`}>
                                                {isSelected && <Check size={12} strokeWidth={4} />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</div>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                                                    <span className="text-gray-500">{formatCurrency(item.price)}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                    <span>Bought: {item.quantity}</span>
                                                    {item.batchId && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                            <span className="text-blue-500">Batch {item.batchId}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`flex items-center gap-2 ${!isSelected ? 'opacity-30' : ''}`} onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5 border border-gray-200 dark:border-gray-600">
                                                    <button
                                                        onClick={() => handleQtyChange(index, (returnQty - 1).toString())}
                                                        className="p-1 hover:text-orange-500 transition-colors"
                                                        disabled={returnQty <= 1 || !isSelected}
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={returnQty}
                                                        onChange={(e) => handleQtyChange(index, e.target.value)}
                                                        className="w-8 text-center text-[11px] font-black bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white"
                                                        disabled={!isSelected}
                                                        max={maxReturnable}
                                                    />
                                                    <button
                                                        onClick={() => handleQtyChange(index, (returnQty + 1).toString())}
                                                        className="p-1 hover:text-orange-500 transition-colors"
                                                        disabled={returnQty >= maxReturnable || !isSelected}
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <div className="text-right min-w-17.5 text-xs font-black text-gray-900 dark:text-white">
                                                    {formatCurrency(item.price * returnQty)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Right Panel - Sticky Refund & Checkout */}
                    <div className="w-full md:w-90 border-l border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-6 bg-white dark:bg-gray-900">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Refund Summary</h3>
                            <div className="space-y-2.5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 font-medium">Subtotal</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(refundSubtotal)}</span>
                                </div>
                                {taxEnabled && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500 font-medium">Tax Adjustment</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(refundTax)}</span>
                                    </div>
                                )}
                                {refundDiscount > 0 && (
                                    <div className="flex justify-between text-xs text-red-500">
                                        <span className="font-medium">Discount Rev.</span>
                                        <span className="font-bold">-{formatCurrency(refundDiscount)}</span>
                                    </div>
                                )}
                                <div className="pt-3 mt-1 border-t border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
                                    <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Net Refund</span>
                                    <span className="text-2xl font-black text-orange-600 dark:text-orange-500 tracking-tighter">
                                        {formatCurrency(refundTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Refund Method</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {(['cash', 'card', 'credit'] as const).map((method) => {
                                    return (
                                        <Button
                                            key={method}
                                            onClick={() => setRefundMethod(method)}
                                            disabled={method === 'credit' && !sale?.customerId}
                                            variant={refundMethod === method ? 'primary' : 'ghost'}
                                            size="sm"
                                            className={`text-[10px] font-black uppercase ${refundMethod === method
                                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                : ''
                                                }`}
                                        >
                                            {method}
                                        </Button>
                                    );
                                })}
                            </div>

                            {isCashRefundCapped && (
                                <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                                    <Info size={14} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold text-red-700 dark:text-red-400 leading-tight">
                                        Cash refund is capped at {formatCurrency(maxCashRefundable)} (original cash portion). Use credit or card for the remaining balance.
                                    </p>
                                </div>
                            )}
                            {sale?.parentSaleId && (
                                <div className="flex items-start gap-2.5 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-xl">
                                    <Info size={14} className="text-orange-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 leading-tight">
                                        This is a Refund Transaction. You cannot refund a refund.
                                    </p>
                                </div>
                            )}
                            {!sale?.parentSaleId && items.every(i => i.max_qty <= 0) && (
                                <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                                    <Info size={14} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold text-red-700 dark:text-red-400 leading-tight">
                                        This bill has already been fully refunded.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto space-y-4">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Internal Note</h3>
                                <textarea
                                    placeholder="Add refund reason..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-500 outline-none min-h-17.5 transition-all"
                                    value={refundNote}
                                    onChange={(e) => setRefundNote(e.target.value)}
                                    disabled={!!sale?.parentSaleId || items.every(i => i.max_qty <= 0)}
                                />
                            </div>

                            <Button
                                onClick={handleProcessReturn}
                                disabled={processing || refundTotal <= 0 || isCashRefundCapped || !!sale?.parentSaleId || items.every(i => i.max_qty <= 0)}
                                variant={refundTotal > 0 && !isCashRefundCapped && !processing && !sale?.parentSaleId && !items.every(i => i.max_qty <= 0) ? 'primary' : 'ghost'}
                                className="w-full h-12 font-black text-xs uppercase tracking-widest"
                            >
                                {processing ? 'Processing...' : (!!sale?.parentSaleId || items.every(i => i.max_qty <= 0) ? 'Already Refunded' : 'Complete Refund')}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>

            {receiptTransaction && receiptItems.length > 0 && (
                <ReceiptModal
                    transaction={receiptTransaction}
                    items={receiptItems}
                    customer={customer}
                    user={user}
                    autoPrint
                    onClose={() => {
                        setReceiptTransaction(null);
                        setReceiptItems([]);
                        onClose();
                    }}
                />
            )}
        </Dialog>
    );
};
