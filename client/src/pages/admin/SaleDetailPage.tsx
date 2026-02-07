import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { ArrowLeft, Trash2, Printer, Save, Receipt } from 'lucide-react';
import { ReceiptModal } from '../../components/ReceiptModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrency } from '../../hooks/useCurrency';

export const SaleDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { currencySymbol, formatCurrency } = useCurrency();
    const transactionId = Number(id);

    const transaction = useLiveQuery(
        () => (Number.isFinite(transactionId) ? db.transactions.get(transactionId) : undefined),
        [transactionId]
    );
    const transactionItems = useLiveQuery(
        () => (Number.isFinite(transactionId) ? db.transaction_items.where('transaction_id').equals(transactionId).toArray() : []),
        [transactionId]
    );
    const products = useLiveQuery(() => db.products.toArray());
    const customer = useLiveQuery(
        () => (transaction?.customer_id ? db.customers.get(transaction.customer_id) : undefined),
        [transaction?.customer_id]
    );

    const itemsWithNames = useMemo(() => {
        if (!transactionItems || !products) return [];
        const productMap = new Map(products.map(p => [p.product_id!, p.name]));
        return transactionItems.map(item => ({
            ...item,
            name: productMap.get(item.product_id) || 'Unknown'
        }));
    }, [transactionItems, products]);

    const [isPrinting, setIsPrinting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split' | 'other'>(transaction?.payment_method || 'cash');
    const [status, setStatus] = useState<'completed' | 'voided' | 'parked'>(transaction?.status || 'completed');
    const [taxAmount, setTaxAmount] = useState(transaction?.tax_amount || 0);
    const [totalAmount, setTotalAmount] = useState(transaction?.total_amount || 0);

    if (!transaction) {
        return (
            <div className="p-6">
                <button
                    onClick={() => navigate('/admin/transactions')}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="mt-4 text-gray-500">Sale not found.</div>
            </div>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await db.transactions.update(transaction.transaction_id!, {
                payment_method: paymentMethod as any,
                status: status as any,
                tax_amount: Number(taxAmount),
                total_amount: Number(totalAmount)
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this sale? This cannot be undone.')) return;
        await db.transaction('rw', db.transactions, db.transaction_items, async () => {
            await db.transaction_items.where('transaction_id').equals(transaction.transaction_id!).delete();
            await db.transactions.delete(transaction.transaction_id!);
        });
        navigate('/admin/transactions');
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/transactions')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sale Report</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">#{transaction.transaction_id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPrinting(true)}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                        <Printer size={16} /> Print Again
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg"
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Date</div>
                    <div className="mt-2 text-gray-900 dark:text-white font-semibold">
                        {new Date(transaction.timestamp).toLocaleString()}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Customer</div>
                    <div className="mt-2 text-gray-900 dark:text-white font-semibold">
                        {customer?.name || 'Walk-in'}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Total</div>
                    <div className="mt-2 text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(transaction.total_amount)}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Receipt size={16} /> Items
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="py-2 text-left">Item</th>
                                <th className="py-2 text-right">Qty</th>
                                <th className="py-2 text-right">Price</th>
                                <th className="py-2 text-right">Line Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {itemsWithNames.map(item => (
                                <tr key={item.line_id} className="text-gray-700 dark:text-gray-300">
                                    <td className="py-2">{item.name}</td>
                                    <td className="py-2 text-right">{item.quantity}</td>
                                    <td className="py-2 text-right">{formatCurrency(item.price_at_sale)}</td>
                                    <td className="py-2 text-right">{formatCurrency(item.price_at_sale * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4">Edit Sale</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Payment Method</label>
                        <select
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'split' | 'other')}
                        >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="split">Split</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Status</label>
                        <select
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as 'completed' | 'voided' | 'parked')}
                        >
                            <option value="completed">Completed</option>
                            <option value="voided">Voided</option>
                            <option value="parked">Parked</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Tax Amount ({currencySymbol})</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg"
                            value={taxAmount}
                            onChange={(e) => setTaxAmount(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Total Amount ({currencySymbol})</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        <Save size={16} /> {isSaving ? 'Saving...' : 'Update Sale'}
                    </button>
                </div>
            </div>

            {isPrinting && (
                <ReceiptModal
                    transaction={transaction}
                    items={itemsWithNames}
                    customer={customer}
                    user={user}
                    onClose={() => setIsPrinting(false)}
                />
            )}
        </div>
    );
};
