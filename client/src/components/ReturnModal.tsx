import { useEffect, useMemo, useState } from 'react';
import { X, RefreshCcw } from 'lucide-react';
import type { Transaction, TransactionItem, Customer } from '../db/db';
import { useAuthStore } from '../store/useAuthStore';
import { ReceiptModal } from './ReceiptModal';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../store/useToast';
import { getApiUrl } from '../config/api';

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
    createdAt: string;
    total: number;
    subtotal?: number | null;
    tax?: number | null;
    discount?: number | null;
    roundOffDiscount?: number | null;
    items: SaleItem[];
    customer?: {
        id: string;
        name: string;
        phone: string;
        email?: string | null;
        pointsBalance?: number | null;
        totalSpend?: number | null;
    } | null;
    returns?: { items: SaleItem[] }[];
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
    const [items, setItems] = useState<ReturnItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [sale, setSale] = useState<SaleResponse | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
    const [receiptItems, setReceiptItems] = useState<(TransactionItem & { name: string })[]>([]);

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

                // Track returned quantities by product AND batch (just like backend does)
                const returnedQtyByProductBatch = new Map<string, number>();
                (normalizedPayload.returns || []).forEach((returnSale) => {
                    (returnSale.items || []).forEach((item) => {
                        const qty = Math.abs(item.quantity);
                        const key = `${item.productId}-${item.batchId || 'null'}`;
                        returnedQtyByProductBatch.set(key, (returnedQtyByProductBatch.get(key) || 0) + qty);
                    });
                });

                const mappedItems = (normalizedPayload.items || []).map((item) => {
                    // Use product+batch key to match what was actually sold
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

    const refundSubtotal = items.reduce((sum, item) => {
        if (!item.selected) return sum;
        return sum + (item.price * item.return_qty);
    }, 0);

    const refundTax = saleSubtotal > 0 ? (refundSubtotal / saleSubtotal) * Number(sale?.tax || 0) : 0;
    const refundDiscount = saleSubtotal > 0 ? (refundSubtotal / saleSubtotal) * Number(sale?.discount || 0) : 0;
    const refundRoundOff = saleSubtotal > 0 ? (refundSubtotal / saleSubtotal) * Number(sale?.roundOffDiscount || 0) : 0;
    const refundTotal = refundSubtotal + refundTax - refundDiscount - refundRoundOff;

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

    const handleProcessReturn = async () => {
        const selectedItems = items.filter(i => i.selected && i.return_qty > 0);
        if (selectedItems.length === 0 || !sale) return;
        if (!token) {
            addToast('Missing auth token', 'error');
            return;
        }

        if (!user?.user_id) {
            addToast('Missing staff id', 'error');
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
                    staff_id: user.user_id,
                    parent_sale_id: sale.id,
                    customer_id: sale.customerId || undefined,
                    payment_method: 'cash',
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
                round_off_discount: Number(returnSale.roundOffDiscount || 0),
                payment_method: returnSale.paymentMethod || 'cash',
                status: 'completed',
                type: 'return',
                parent_sale_id: sale.id  // Reference to original sale
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
        return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 w-[720px] max-h-[85vh] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-orange-50 dark:bg-orange-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-300">
                            <RefreshCcw size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Return Items</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Transaction #{saleId}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={22} />
                    </button>
                </div>

                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800">
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500">Customer</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{customer?.name || 'Walk-in'}</div>
                        <div className="text-xs text-gray-500">{customer?.phone || 'No phone'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500">Refund Subtotal</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(refundSubtotal)}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500">Estimated Tax</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(refundTax)}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                        <div className="text-xs text-orange-600 dark:text-orange-300">Total Refund</div>
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-300">{formatCurrency(refundTotal)}</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="p-3 w-10">Select</th>
                                <th className="p-3">Product</th>
                                <th className="p-3 text-right">Price</th>
                                <th className="p-3 text-center">Batch</th>
                                <th className="p-3 text-center">Qty Sold</th>
                                <th className="p-3 text-center">Return Qty</th>
                                <th className="p-3 text-right">Refund</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {items.map((item, index) => (
                                <tr key={`${item.productId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => handleToggleSelect(index)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                                        />
                                    </td>
                                    <td className="p-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                    <td className="p-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.price)}</td>
                                    <td className="p-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                        {item.batchDate || 'N/A'}
                                    </td>
                                    <td className="p-3 text-center text-gray-500 dark:text-gray-400">{item.max_qty}</td>
                                    <td className="p-3 text-center">
                                        <input
                                            type="number"
                                            min={item.max_qty > 0 ? 1 : 0}
                                            max={item.max_qty}
                                            value={item.return_qty}
                                            onChange={(e) => handleQtyChange(index, e.target.value)}
                                            disabled={!item.selected || item.max_qty === 0}
                                            className="w-16 p-1.5 text-center bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(item.selected ? item.price * item.return_qty : 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Select items and quantities to process the return.
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleProcessReturn}
                                disabled={processing || items.filter(i => i.selected).length === 0}
                                className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {processing ? 'Processing...' : (
                                    <>
                                        <RefreshCcw size={18} />
                                        Confirm Return
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    {items.filter(i => i.selected).length === 0 && (
                        <p className="text-center text-xs text-red-500 mt-2">Select at least one item.</p>
                    )}
                </div>
            </div>

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
        </div>
    );
};
