import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Trash2, Receipt, Save } from 'lucide-react';
import { ReceiptModal } from '../../components/ReceiptModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrency } from '../../hooks/useCurrency';
import { getApiUrl } from '../../config/api';

export const SaleDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((s) => s.token);
    const { user } = useAuthStore();
    const { currencySymbol, formatCurrency } = useCurrency();

    const [transaction, setTransaction] = useState<any | null>(null);
    const [itemsWithNames, setItemsWithNames] = useState<any[]>([]);
    const [customer, setCustomer] = useState<any | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'split' | 'other'>('cash');
    const [status, setStatus] = useState<'completed' | 'voided' | 'parked'>('completed');
    const [taxAmount, setTaxAmount] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        if (!id || !token) return;
        const load = async () => {
            try {
                const res = await fetch(getApiUrl(`/sales/${id}?includeItems=true`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to load');
                const payload = await res.json();
                setTransaction(payload);
                setCustomer(payload.customer || null);
                setPaymentMethod(payload.paymentMethod || payload.payment_method || 'cash');
                setStatus(payload.status || 'completed');
                setTaxAmount(Number(payload.tax || payload.tax_amount || 0));
                setTotalAmount(Number(payload.total || payload.total_amount || 0));
                setItemsWithNames((payload.items || []).map((it: any) => ({
                    line_id: it.id,
                    name: it.product?.name || it.name || 'Unknown',
                    quantity: Number(it.quantity || 0),
                    price_at_sale: Number(it.price || 0)
                })));
            } catch (err) {
                console.error(err);
                setTransaction(null);
            }
        };
        load();
    }, [id, token]);

    const handleSave = async () => {
        if (!token || !transaction) return;
        setIsSaving(true);
        try {
            await fetch(getApiUrl(`/sales/${transaction.id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ paymentMethod, tax: Number(taxAmount), total: Number(totalAmount), status })
            });
            // reload
            const res = await fetch(getApiUrl(`/sales/${transaction.id}?includeItems=true`), { headers: { Authorization: `Bearer ${token}` } });
            const payload = await res.json();
            setTransaction(payload);
        } catch (e) {
            console.error(e);
            alert('Failed to update sale');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this sale? This cannot be undone.')) return;
        if (!token || !transaction) return;
        try {
            await fetch(getApiUrl(`/sales/${transaction.id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            navigate('/admin/transactions');
        } catch (e) {
            console.error(e);
            alert('Failed to delete sale');
        }
    };

    if (!transaction) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[50vh]">
                <div className="text-gray-500">Loading transaction...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/transactions')} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Sale Report</h1>
                        <p className="text-sm text-gray-500">#{transaction.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPrinting(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border">
                        <Printer size={16} /> Print Again
                    </button>
                    {!transaction.parentSaleId && (
                        <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600">
                            <Trash2 size={16} /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                    <div className="text-xs text-gray-400 uppercase">Date</div>
                    <div className="mt-2 font-semibold">{new Date(transaction.createdAt || transaction.timestamp).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                    <div className="text-xs text-gray-400 uppercase">Customer</div>
                    <div className="mt-2 font-semibold">{customer?.name || 'Walk-in'}</div>
                </div>
                {transaction.returns && transaction.returns.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border">
                        <div className="text-xs text-orange-500 uppercase">Returns</div>
                        <div className="mt-2">
                            {transaction.returns.map((ret: any) => (
                                <div key={ret.id} className="mb-2">
                                    <div className="font-semibold">Return #{ret.id} - {new Date(ret.createdAt).toLocaleString()}</div>
                                    <ul className="text-sm text-gray-700">
                                        {ret.items.map((it: any) => (
                                            <li key={it.id}>{it.product?.name || 'Product'} | Batch: {it.batchId || 'N/A'} | Qty: {Math.abs(Number(it.quantity || 0))} | Refund: {formatCurrency(Number(it.price || 0))}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white rounded-lg border">
                <h2 className="font-bold mb-4 flex items-center gap-2"><Receipt size={16} /> Items</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-500 border-b">
                            <tr>
                                <th className="py-2 text-left">Item</th>
                                <th className="py-2 text-right">Qty</th>
                                <th className="py-2 text-right">Price</th>
                                <th className="py-2 text-right">Line Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {itemsWithNames.map(item => (
                                <tr key={item.line_id}>
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

            <div className="p-4 bg-white rounded-lg border">
                <h2 className="font-bold mb-4">Edit Sale</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Payment Method</label>
                        <select className="w-full px-3 py-2 rounded-lg bg-gray-50" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="split">Split</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Status</label>
                        <select className="w-full px-3 py-2 rounded-lg bg-gray-50" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                            <option value="completed">Completed</option>
                            <option value="voided">Voided</option>
                            <option value="parked">Parked</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Tax Amount ({currencySymbol})</label>
                        <input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg bg-gray-50" value={taxAmount} onChange={(e) => setTaxAmount(Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Total Amount ({currencySymbol})</label>
                        <input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg bg-gray-50" value={totalAmount} onChange={(e) => setTotalAmount(Number(e.target.value))} />
                    </div>
                </div>
                <div className="mt-4">
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                        <Save size={16} /> {isSaving ? 'Saving...' : 'Update Sale'}
                    </button>
                </div>
            </div>

            <div className="p-4 bg-white rounded-lg border">
                <div className="text-xs text-gray-400 uppercase">Total</div>
                <div className="mt-2 font-semibold">{formatCurrency(totalAmount)}</div>
            </div>

            {isPrinting && (
                <ReceiptModal transaction={transaction} items={itemsWithNames} customer={customer} user={user} onClose={() => setIsPrinting(false)} />
            )}
        </div>
    );
};

export default SaleDetailPage;
