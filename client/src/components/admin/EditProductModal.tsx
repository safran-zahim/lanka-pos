import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Trash2, RefreshCw } from 'lucide-react';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Product } from '../../db/db';
import { CategoryManager } from '../CategoryManager';
import { useCurrency } from '../../hooks/useCurrency';
import { useToast } from '../../store/useToast';

interface EditProductModalProps {
    product: Product;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditProductModal = ({ product, onClose, onSuccess }: EditProductModalProps) => {
    const { currencySymbol } = useCurrency();
    const [formData, setFormData] = useState({
        sku_code: '',
        name: '',
        category_id: '',
        sub_category_id: '',
        cost_price: '',
        retail_price: '',
        reorder_level: ''
    });

    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const categories = useLiveQuery(() => db.categories.toArray());

    const selectedCategoryObj = categories?.find(c => c.name === formData.category_id);
    const subCategories = useLiveQuery(
        () => selectedCategoryObj ? db.sub_categories.where('category_id').equals(selectedCategoryObj.category_id!).toArray() : [],
        [selectedCategoryObj]
    );

    const products = useLiveQuery(() => db.products.toArray());
    const { addToast } = useToast();

    const handleGenerateSKU = () => {
        if (!products) return;

        // Find highest numeric SKU
        const numericSKUs = products
            .map(p => parseInt(p.sku_code))
            .filter(n => !isNaN(n));

        const nextSKU = numericSKUs.length > 0
            ? Math.max(...numericSKUs) + 1
            : 10001; // Starting number if none exist

        setFormData({ ...formData, sku_code: nextSKU.toString() });
        addToast(`Generated SKU: ${nextSKU}`, 'info');
    };

    useEffect(() => {
        if (product) {
            setFormData({
                sku_code: product.sku_code,
                name: product.name,
                category_id: product.category_id,
                sub_category_id: product.sub_category_id || '',
                cost_price: product.cost_price.toString(),
                retail_price: product.retail_price.toString(),
                reorder_level: product.reorder_level.toString()
            });
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.products.update(product.product_id!, {
                sku_code: formData.sku_code,
                name: formData.name,
                category_id: formData.category_id,
                sub_category_id: formData.sub_category_id,
                cost_price: parseFloat(formData.cost_price),
                retail_price: parseFloat(formData.retail_price),
                reorder_level: parseInt(formData.reorder_level) || 0
                // Note: stock_quantity is explicitly excluded here
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update product.');
        }
    };

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
            try {
                await db.products.delete(product.product_id!);
                onSuccess();
                onClose();
            } catch (error) {
                console.error(error);
                alert('Failed to delete product.');
            }
        }
    };

    return (
        <>
            {showCategoryManager && (
                <CategoryManager onClose={() => setShowCategoryManager(false)} />
            )}
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px] border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Product</h2>
                        <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">SKU Code</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 pr-10 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                        value={formData.sku_code}
                                        onChange={e => setFormData({ ...formData, sku_code: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateSKU}
                                        className="absolute right-2 top-1.5 p-1 text-blue-600 hover:bg-blue-200/50 rounded transition-colors"
                                        title="Generate Sequential SKU"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Category</label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                        value={formData.category_id}
                                        onChange={e => setFormData({
                                            ...formData,
                                            category_id: e.target.value,
                                            sub_category_id: ''
                                        })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories?.map(c => <option key={c.category_id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryManager(true)}
                                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white p-2 rounded"
                                        title="Manage Categories"
                                    >
                                        <Settings size={20} />
                                    </button>
                                </div>
                            </div>
                            {/* SubCategory Selection */}
                            {formData.category_id && (
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Sub Category</label>
                                    <select
                                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                        value={formData.sub_category_id}
                                        onChange={e => setFormData({ ...formData, sub_category_id: e.target.value })}
                                    >
                                        <option value="">Select Sub Category</option>
                                        {subCategories?.map(sub => (
                                            <option key={sub.sub_category_id} value={sub.name}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Product Name</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Cost Price ({currencySymbol})</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                    value={formData.cost_price}
                                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Retail Price ({currencySymbol})</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                    value={formData.retail_price}
                                    onChange={e => setFormData({ ...formData, retail_price: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Reorder Level</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                    value={formData.reorder_level}
                                    onChange={e => setFormData({ ...formData, reorder_level: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Current Stock</label>
                                <input
                                    disabled
                                    type="text"
                                    className="w-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 p-2 rounded cursor-not-allowed border border-gray-300 dark:border-transparent"
                                    value={product.stock_quantity}
                                />
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-700/50 text-sm text-yellow-800 dark:text-yellow-200">
                            Note: Stock Quantity cannot be edited here. Use the <b>Add Stock</b> button in the inventory list to update stock.
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Trash2 size={20} />
                                Delete Product
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Save size={20} />
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
