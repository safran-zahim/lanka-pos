import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Search, Calendar, FileText, Truck, DollarSign, UploadCloud, Package, PlusCircle } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { AddProductModal } from '../../components/admin/AddProductModal';
import { useCurrency } from '../../hooks/useCurrency';

interface PurchaseItem {
    product_id: number;
    name: string;
    sku: string;
    qty: number;
    cost: number;
    retail_price: number; // Selling price
    tax: number; // Percentage
    batch?: string;
}

export const PurchasePage = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { formatCurrency } = useCurrency();

    // Section A: Header & Supplier
    const [supplierId, setSupplierId] = useState<string>('');
    const [refNo, setRefNo] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [warehouse, setWarehouse] = useState('Main Warehouse');

    // Section B: Items
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [itemSearch, setItemSearch] = useState('');

    // Section C: Summary
    const [discount, setDiscount] = useState(0);
    const [shipping, setShipping] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState('due');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    // Section D: Notes
    const [notes, setNotes] = useState('');

    // Add Product Modal State
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    // Data Fetching
    const suppliers = useLiveQuery(() => db.suppliers.toArray());
    const products = useLiveQuery(() => db.products.toArray());

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        p.sku_code.includes(itemSearch)
    );

    const addItem = (product: any) => {
        const existing = items.find(i => i.product_id === product.product_id);
        if (existing) {
            addToast("Item already added", 'info');
            return;
        }
        setItems([...items, {
            product_id: product.product_id,
            name: product.name,
            sku: product.sku_code,
            qty: 1,
            cost: product.cost_price,
            retail_price: product.retail_price,
            tax: 0
        }]);
        setItemSearch('');
    };

    const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
    const totalTax = items.reduce((sum, item) => sum + (item.qty * item.cost * (item.tax / 100)), 0);
    const grandTotal = subtotal + totalTax + shipping - discount;

    const handleSubmit = async () => {
        if (items.length === 0) {
            addToast("Please add at least one item", 'error');
            return;
        }

        try {
            // Create Purchase Record (Simplified for now - strictly linking to stock updates)
            // In a real app, we'd have a 'purchase_orders' table. 
            // For this MVP, we will update stock and log a purchase transaction/history.

            // 1. Log Purchase Transaction
            // Note: Our DB schema might need a 'purchase_orders' table for full features.
            // checking db.ts... we have 'purchases' table but it seems per-item?
            // "purchases: '++purchase_id, product_id, timestamp'"
            // This schema is too simple for a full PO.
            // For now, we will just update Stock Quantity and add to 'purchases' table per item.

            const timestamp = new Date(date);

            for (const item of items) {
                // Update Product Stock
                const product = await db.products.get(item.product_id);
                if (product) {
                    await db.products.update(item.product_id, {
                        stock_quantity: product.stock_quantity + Number(item.qty),
                        cost_price: Number(item.cost) // Update cost price? Usually yes.
                    });
                }

                await db.product_batches.add({
                    product_id: item.product_id,
                    quantity: Number(item.qty),
                    cost_price: Number(item.cost),
                    retail_price: Number(item.retail_price),
                    created_at: timestamp,
                    note: refNo ? `PO ${refNo}` : undefined
                });

                // Log Purchase (per item as per current simple schema)
                await db.purchases.add({
                    product_id: item.product_id,
                    quantity: Number(item.qty),
                    cost_price: Number(item.cost),
                    timestamp: timestamp,
                    user_id: 1, // Todo: Get actual user
                    supplier_id: supplierId ? Number(supplierId) : undefined,
                    ref_number: refNo,
                    payment_status: paymentStatus as any,
                    payment_method: paymentMethod as any,
                    shipping_cost: Number(shipping) || 0,
                    discount: Number(discount) || 0,
                    notes: notes || undefined,
                    bill_total: Number(grandTotal) || 0
                });
            }

            addToast("Purchase recorded successfully! Stock updated.", 'success');
            navigate('/admin/purchases');

        } catch (error) {
            console.error(error);
            addToast("Failed to save purchase", 'error');
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
            {/* Header / Actions */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/purchases')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Purchase Order</h1>
                        <p className="text-gray-500 text-sm">Create a new stock-in record</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-green-500/20"
                    >
                        <Save size={20} />
                        Finalize Purchase
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT COLUMN (2/3) - Main Input Area */}
                <div className="xl:col-span-2 space-y-6">

                    {/* SECTION A: Supplier & Details */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Truck className="text-blue-500" /> Supplier & Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Supplier</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={supplierId}
                                    onChange={e => setSupplierId(e.target.value)}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers?.map(s => (
                                        <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Purchase Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="date"
                                        className="w-full pl-10 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Reference No.</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="PO-2024-001"
                                        className="w-full pl-10 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                                        value={refNo}
                                        onChange={e => setRefNo(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Location</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                                    value={warehouse}
                                    onChange={e => setWarehouse(e.target.value)}
                                >
                                    <option value="Main Warehouse">Main Warehouse</option>
                                    <option value="Store 2">Store 2</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION B: Items Table */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Plus className="text-green-500" /> Items
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search Product to Add..."
                                        className="w-full pl-10 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                        value={itemSearch}
                                        onChange={e => setItemSearch(e.target.value)}
                                    />
                                    {itemSearch && (
                                        <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mt-1 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                            {filteredProducts?.map(p => (
                                                <div
                                                    key={p.product_id}
                                                    onClick={() => addItem(p)}
                                                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between"
                                                >
                                                    <span>{p.name}</span>
                                                    <span className="text-gray-500 text-sm">{p.sku_code}</span>
                                                </div>
                                            ))}
                                            {filteredProducts?.length === 0 && (
                                                <div className="p-3 text-sm text-gray-500">No products found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowAddProductModal(true)}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
                                >
                                    <PlusCircle size={18} /> Add New Product
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Product Name</th>
                                        <th className="p-3 w-24 text-center">Qty</th>
                                        <th className="p-3 w-32 text-right">Unit Cost</th>
                                        <th className="p-3 w-32 text-right">Retail Price</th>
                                        <th className="p-3 w-24 text-center">Tax %</th>
                                        <th className="p-3 w-32 text-right">Total</th>
                                        <th className="p-3 w-10 rounded-r-lg"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {items.map((item, index) => (
                                        <tr key={item.product_id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-3 font-medium">
                                                <div className="text-gray-900 dark:text-white">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.sku}</div>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-gray-50 dark:bg-gray-900 p-1.5 rounded text-center outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={item.qty}
                                                    onChange={e => updateItem(index, 'qty', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full bg-gray-50 dark:bg-gray-900 p-1.5 rounded text-right outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={item.cost}
                                                    onChange={e => updateItem(index, 'cost', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full bg-gray-50 dark:bg-gray-900 p-1.5 rounded text-right outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={item.retail_price}
                                                    onChange={e => updateItem(index, 'retail_price', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent text-center border-b border-transparent focus:border-blue-500 outline-none"
                                                    value={item.tax}
                                                    onChange={e => updateItem(index, 'tax', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-3 text-right font-medium">
                                                {formatCurrency(item.qty * item.cost)}
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-10 text-center text-gray-400">
                                                <Package className="mx-auto mb-2 opacity-50" size={48} />
                                                No items added. Search above to add products.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (1/3) - Summary & Notes */}
                <div className="space-y-6">

                    {/* SECTION C: Financial Summary */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <DollarSign className="text-green-500" /> Payment Summary
                        </h2>

                        <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Order Tax</span>
                                <span>{formatCurrency(totalTax)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                                <span>Shipping Cost</span>
                                <input
                                    type="number"
                                    className="w-20 text-right bg-gray-50 dark:bg-gray-900 p-1 rounded border border-gray-200 dark:border-gray-700 outline-none text-sm"
                                    value={shipping}
                                    onChange={e => setShipping(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                <span>Discount</span>
                                <input
                                    type="number"
                                    className="w-20 text-right bg-green-50 dark:bg-green-900/20 p-1 rounded border border-green-200 dark:border-green-800 outline-none text-sm"
                                    value={discount}
                                    onChange={e => setDiscount(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="py-4 flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-800 dark:text-white">Grand Total</span>
                            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(grandTotal)}</span>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Status</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['paid', 'partial', 'due'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setPaymentStatus(status)}
                                            className={`py-2 rounded-lg text-sm capitalize font-medium border ${paymentStatus === status
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="card">Card</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION D: Notes & Attachments */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="text-purple-500" /> Notes
                        </h2>

                        <div className="space-y-4">
                            <textarea
                                className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg resize-none outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Add notes for this purchase..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />

                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                                <UploadCloud size={32} className="mb-2" />
                                <span className="text-sm">Attach Invoice (PDF/Img)</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Add Product Modal */}
            {showAddProductModal && (
                <AddProductModal
                    onClose={() => setShowAddProductModal(false)}
                    onSuccess={() => {
                        addToast("Product added successfully!", 'success');
                        setShowAddProductModal(false);
                    }}
                />
            )}
        </div>
    );
};
