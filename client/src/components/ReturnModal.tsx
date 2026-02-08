import { useState, useEffect } from 'react';
import { X, RefreshCcw } from 'lucide-react';
import { db, type Transaction, type TransactionItem, type Customer } from '../db/db';
import { useAuthStore } from '../store/useAuthStore';
import { ReceiptModal } from './ReceiptModal';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../store/useToast';

interface ReturnModalProps {
    transaction: Transaction;
    onClose: () => void;
    onSuccess: () => void;
}

export const ReturnModal = ({ transaction, onClose, onSuccess }: ReturnModalProps) => {
    const { user } = useAuthStore();
    const { formatCurrency } = useCurrency();
    const { addToast } = useToast();
    const [items, setItems] = useState<(TransactionItem & { name: string, max_qty: number, return_qty: number, selected: boolean })[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
    const [receiptItems, setReceiptItems] = useState<(TransactionItem & { name: string })[]>([]);

    useEffect(() => {
        const loadItems = async () => {
            if (!transaction.transaction_id) return;

            const txnItems = await db.transaction_items
                .where('transaction_id')
                .equals(transaction.transaction_id)
                .toArray();

            const itemsWithDetails = await Promise.all(txnItems.map(async (item) => {
                const product = await db.products.get(item.product_id);
                return {
                    ...item,
                    name: product?.name || 'Unknown Product',
                    max_qty: item.quantity, // Max we can return is what was bought
                    return_qty: item.quantity, // Default to return all
                    selected: false
                };
            }));

            setItems(itemsWithDetails);
            setLoading(false);
        };

        loadItems();
    }, [transaction]);

    useEffect(() => {
        const loadCustomer = async () => {
            if (!transaction.customer_id) {
                setCustomer(null);
                return;
            }
            const customerRecord = await db.customers.get(transaction.customer_id);
            setCustomer(customerRecord || null);
        };
        loadCustomer();
    }, [transaction.customer_id]);

    const handleToggleSelect = (index: number) => {
        const newItems = [...items];
        newItems[index].selected = !newItems[index].selected;
        setItems(newItems);
    };

    const handleQtyChange = (index: number, newQty: string) => {
        const qty = parseInt(newQty) || 0;
        const newItems = [...items];
        // Clamp between 1 and max_qty
        newItems[index].return_qty = Math.min(Math.max(1, qty), newItems[index].max_qty);
        setItems(newItems);
    };

    const calculateRefundTotal = () => {
        return items.reduce((sum, item) => {
            if (!item.selected) return sum;
            return sum + (item.price_at_sale * item.return_qty);
        }, 0);
    };

    const getTaxRate = () => {
        const taxableBase = transaction.total_amount - transaction.tax_amount;
        if (taxableBase <= 0) return 0;
        return transaction.tax_amount / taxableBase;
    };

    const handleProcessReturn = async () => {
        const selectedItems = items.filter(i => i.selected);
        if (selectedItems.length === 0) return;

        setProcessing(true);
        try {
            const refundAmount = calculateRefundTotal();
            const taxRefund = refundAmount * getTaxRate(); // Pro-rated tax on subtotal

            const updatedTotal = Math.max(0, transaction.total_amount - (refundAmount + taxRefund));
            const updatedTax = Math.max(0, transaction.tax_amount - taxRefund);

            await db.transactions.update(transaction.transaction_id!, {
                total_amount: updatedTotal,
                tax_amount: updatedTax
            });

            for (const item of selectedItems) {
                if (!item.line_id) continue;
                const newQty = Math.max(0, item.quantity - item.return_qty);
                await db.transaction_items.update(item.line_id, {
                    quantity: newQty,
                    note: item.note ? `${item.note} | Return: ${item.return_qty}` : `Return: ${item.return_qty}`
                });
            }

            // 2. Update Stock
            for (const item of selectedItems) {
                const product = await db.products.get(item.product_id);
                if (product) {
                    await db.products.update(item.product_id, {
                        stock_quantity: product.stock_quantity + item.return_qty
                    });
                }
                if (item.batch_id) {
                    const batch = await db.product_batches.get(item.batch_id);
                    if (batch) {
                        await db.product_batches.update(item.batch_id, {
                            quantity: batch.quantity + item.return_qty
                        });
                    }
                }
            }

            // 3. Deduct Points (if customer exists)
            if (transaction.customer_id) {
                const customer = await db.customers.get(transaction.customer_id);
                if (customer) {
                    const pointsToDeduct = Math.floor((refundAmount + taxRefund) / 10);
                    await db.customers.update(transaction.customer_id, {
                        loyalty_points_balance: Math.max(0, customer.loyalty_points_balance - pointsToDeduct),
                        total_spend_to_date: Math.max(0, customer.total_spend_to_date - (refundAmount + taxRefund))
                    });

                    if (pointsToDeduct > 0) {
                        await db.customer_points.add({
                            customer_id: transaction.customer_id,
                            timestamp: new Date(),
                            type: 'adjust',
                            points: -pointsToDeduct,
                            note: 'Return adjustment',
                            transaction_id: transaction.transaction_id
                        });
                    }
                }
            }

            setReceiptTransaction({
                transaction_id: transaction.transaction_id,
                user_id: transaction.user_id,
                customer_id: transaction.customer_id,
                timestamp: new Date(),
                total_amount: -(refundAmount + taxRefund),
                tax_amount: -taxRefund,
                payment_method: 'cash',
                status: 'completed',
                type: 'return'
            });

            setReceiptItems(selectedItems.map(item => ({
                transaction_id: transaction.transaction_id!,
                product_id: item.product_id,
                batch_id: item.batch_id,
                quantity: item.return_qty,
                price_at_sale: item.price_at_sale,
                note: 'Return',
                name: item.name
            })));

            addToast('Return processed successfully', 'success');
            onSuccess();
        } catch (error) {
            console.error("Return failed:", error);
            addToast('Return failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Loading...</div>;

    const refundTotal = calculateRefundTotal();
    const refundTax = refundTotal * getTaxRate();

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
                            <p className="text-xs text-gray-500 dark:text-gray-400">Transaction #{transaction.transaction_id}</p>
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
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(refundTotal)}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500">Estimated Tax</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(refundTax)}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                        <div className="text-xs text-orange-600 dark:text-orange-300">Total Refund</div>
                        <div className="text-xl font-bold text-orange-600 dark:text-orange-300">{formatCurrency(refundTotal + refundTax)}</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="p-3 w-10">Select</th>
                                <th className="p-3">Product</th>
                                <th className="p-3 text-right">Price</th>
                                <th className="p-3 text-center">Qty Sold</th>
                                <th className="p-3 text-center">Return Qty</th>
                                <th className="p-3 text-right">Refund</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {items.map((item, index) => (
                                <tr key={`${item.product_id}-${item.batch_id ?? 'base'}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={() => handleToggleSelect(index)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                                        />
                                    </td>
                                    <td className="p-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                    <td className="p-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.price_at_sale)}</td>
                                    <td className="p-3 text-center text-gray-500 dark:text-gray-400">{item.max_qty}</td>
                                    <td className="p-3 text-center">
                                        <input
                                            type="number"
                                            min="1"
                                            max={item.max_qty}
                                            value={item.return_qty}
                                            onChange={(e) => handleQtyChange(index, e.target.value)}
                                            disabled={!item.selected}
                                            className="w-16 p-1.5 text-center bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(item.selected ? item.price_at_sale * item.return_qty : 0)}
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
