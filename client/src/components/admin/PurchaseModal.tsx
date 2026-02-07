import React, { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCurrency } from '../../hooks/useCurrency';

interface PurchaseModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const PurchaseModal = ({ onClose, onSuccess }: PurchaseModalProps) => {
    const { currencySymbol } = useCurrency();
    const products = useLiveQuery(() => db.products.toArray());
    const suppliers = useLiveQuery(() => db.suppliers.toArray());
    const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
    const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [retailPrice, setRetailPrice] = useState('');

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pId = parseInt(e.target.value);
        setSelectedProductId(pId);
        const product = products?.find(p => p.product_id === pId);
        if (product) {
            setCostPrice(product.cost_price.toString());
            setRetailPrice(product.retail_price.toString());
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || !quantity || !costPrice || !retailPrice) return;

        try {
            const qty = parseInt(quantity);
            const cost = parseFloat(costPrice);
            const retail = parseFloat(retailPrice);
            const pId = Number(selectedProductId);

            // Add Purchase Record
            await db.purchases.add({
                product_id: pId,
                quantity: qty,
                cost_price: cost,
                timestamp: new Date(),
                user_id: 1, // Hardcoded for now
                supplier_id: selectedSupplierId ? Number(selectedSupplierId) : undefined,
                payment_status: 'paid',
                payment_method: 'cash',
                shipping_cost: 0,
                discount: 0,
                bill_total: qty * cost
            });

            // Update Product Stock
            const product = await db.products.get(pId);
            if (product) {
                await db.products.update(pId, {
                    stock_quantity: product.stock_quantity + qty,
                    cost_price: cost
                });
            }

            // Create Batch for manual pricing selection
            await db.product_batches.add({
                product_id: pId,
                quantity: qty,
                cost_price: cost,
                retail_price: retail,
                created_at: new Date()
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to add stock.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px] border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Stock (Purchase)</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Product</label>
                        <select
                            required
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                            value={selectedProductId}
                            onChange={handleProductChange}
                        >
                            <option value="">Select Product</option>
                            {products?.map(p => (
                                <option key={p.product_id} value={p.product_id}>
                                    {p.name} ({p.sku_code}) - Current Stock: {p.stock_quantity}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Supplier (Optional)</label>
                        <select
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                            value={selectedSupplierId}
                            onChange={(e) => setSelectedSupplierId(parseInt(e.target.value))}
                        >
                            <option value="">Select Supplier</option>
                            {suppliers?.map(s => (
                                <option key={s.supplier_id} value={s.supplier_id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Quantity</label>
                            <input
                                required
                                type="number"
                                min="1"
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Unit Cost ({currencySymbol})</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                value={costPrice}
                                onChange={e => setCostPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Retail Price ({currencySymbol})</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                value={retailPrice}
                                onChange={e => setRetailPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded mt-4"
                    >
                        Add Stock
                    </button>
                </form>
            </div>
        </div>
    );
};
