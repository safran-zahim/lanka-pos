import React, { useState } from 'react';
import { X, DollarSign, Hash, StickyNote } from 'lucide-react';
import type { CartItem } from '../store/useCartStore';
import { useCurrency } from '../hooks/useCurrency';

interface EditCartItemModalProps {
    item: CartItem;
    onConfirm: (updates: { price: number; quantity: number; note: string }) => void;
    onClose: () => void;
}

export const EditCartItemModal = ({ item, onConfirm, onClose }: EditCartItemModalProps) => {
    const { currencySymbol } = useCurrency();
    const [price, setPrice] = useState<string>(item.retail_price.toString());
    const [quantity, setQuantity] = useState<string>(item.quantity.toString());
    const [note, setNote] = useState<string>(item.note || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = parseFloat(price);
        const numQty = parseFloat(quantity);
        if (isNaN(numPrice) || numPrice < 0) {
            alert('Please enter a valid price');
            return;
        }
        if (isNaN(numQty) || numQty <= 0) {
            alert('Please enter a valid quantity');
            return;
        }
        onConfirm({ price: numPrice, quantity: numQty, note });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[420px] border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="text-blue-500" />
                        Edit Item
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Price ({currencySymbol})</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 pl-9 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Quantity</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 pl-9 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Note (prints on receipt)</label>
                        <div className="relative">
                            <StickyNote className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <textarea
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 pl-9 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent min-h-[80px]"
                                placeholder="e.g. No onions, extra spicy"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
