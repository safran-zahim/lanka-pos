import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { db } from '../../db/db';
import type { Product } from '../../db/db';
import { useCurrency } from '../../hooks/useCurrency';
import { useToast } from '../../store/useToast';

interface AddStockModalProps {
    product: Product;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddStockModal = ({ product, onClose, onSuccess }: AddStockModalProps) => {
    const { currencySymbol } = useCurrency();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        quantity: '',
        cost_price: product.cost_price.toString(),
        retail_price: product.retail_price.toString(),
        note: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseFloat(formData.quantity);
        const cost = parseFloat(formData.cost_price);
        const retail = parseFloat(formData.retail_price);

        if (isNaN(qty) || qty <= 0) {
            addToast("Please enter a valid quantity", 'error');
            return;
        }

        setIsSaving(true);
        try {
            await db.transaction('rw', db.products, db.product_batches, async () => {
                // 1. Create the batch
                await db.product_batches.add({
                    product_id: product.product_id!,
                    quantity: qty,
                    cost_price: cost,
                    retail_price: retail,
                    created_at: new Date(),
                    note: formData.note
                });

                // 2. Update product stock and current prices
                await db.products.update(product.product_id!, {
                    stock_quantity: (product.stock_quantity || 0) + qty,
                    cost_price: cost,
                    retail_price: retail
                });
            });

            addToast(`Successfully added ${qty} units to stock`, 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            addToast("Failed to add stock", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add Stock / New Batch</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{product.name} (SKU: {product.sku_code})</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity to Add*</label>
                            <input
                                required
                                type="number"
                                step="any"
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                                placeholder="0"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Batch Cost Price ({currencySymbol})</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.cost_price}
                                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Previous: {currencySymbol}{product.cost_price}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Batch Selling Price ({currencySymbol})</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.retail_price}
                                    onChange={e => setFormData({ ...formData, retail_price: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Previous: {currencySymbol}{product.retail_price}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
                            <textarea
                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows={2}
                                placeholder="e.g. Purchased from morning supplier"
                                value={formData.note}
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            ) : (
                                <Plus size={20} />
                            )}
                            {isSaving ? 'Processing...' : 'Complete Purchase'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
