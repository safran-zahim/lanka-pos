import { X, Plus, Minus } from 'lucide-react';
import type { ProductBatch, Product } from '../db/db';
import { useCurrency } from '../hooks/useCurrency';
import { useState } from 'react';

interface SelectBatchModalProps {
    product: Product;
    batches: ProductBatch[];
    onSelect: (batch: ProductBatch, quantity: number) => void;
    onClose: () => void;
}

export const SelectBatchModal = ({ product, batches, onSelect, onClose }: SelectBatchModalProps) => {
    const { formatCurrency } = useCurrency();
    const [selectedBatch, setSelectedBatch] = useState<ProductBatch | null>(null);
    const [quantity, setQuantity] = useState<number>(1);

    // Filter to only batches with stock
    const availableBatches = batches.filter((batch) => {
        const remainingStock = (batch as any).remaining_in_stock ?? batch.quantity;
        return remainingStock > 0;
    });

    const lastBatchIndex = availableBatches.length - 1;

    const handleBatchClick = (batch: ProductBatch, remainingStock: number) => {
        if (remainingStock <= 0) {
            // Prevent selecting batches with no stock
            return;
        }
        setSelectedBatch(batch);
        setQuantity(1); // Reset to 1 when selecting a new batch
    };

    const handleQuantityChange = (newQty: number) => {
        if (!selectedBatch) return;
        const remainingStock = (selectedBatch as any).remaining_in_stock ?? selectedBatch.quantity;
        if (remainingStock <= 0) return; // Safety check
        const validQty = Math.max(1, Math.min(newQty, remainingStock));
        setQuantity(validQty);
    };

    const handleConfirm = () => {
        if (!selectedBatch) return;
        const remainingStock = (selectedBatch as any).remaining_in_stock ?? selectedBatch.quantity;
        if (remainingStock <= 0) {
            // Additional safety: don't allow confirming if no stock
            return;
        }
        if (quantity > remainingStock || quantity <= 0) {
            return; // Prevent confirming invalid quantity
        }
        onSelect(selectedBatch, quantity);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-[520px] max-h-[85vh] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 dark:from-gray-900 to-gray-50 dark:to-gray-800">
                    <div className="flex-1">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Select Batch</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 font-medium">{product.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Batches List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                    {availableBatches.length === 0 && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-12 flex flex-col items-center">
                            <span>No batches with stock available.</span>
                        </div>
                    )}
                    {availableBatches.map((batch, index) => {
                        const remainingStock = (batch as any).remaining_in_stock ?? batch.quantity;
                        const isOutOfStock = remainingStock <= 0; // Should never be true
                        const isLastBatch = index === lastBatchIndex;
                        const canSelect = !isOutOfStock;
                        const isSelected = selectedBatch?.batch_id === batch.batch_id;

                        return (
                            <button
                                key={batch.batch_id}
                                onClick={() => handleBatchClick(batch, remainingStock)}
                                disabled={!canSelect}
                                className={`w-full text-left p-4 rounded-lg border-2 flex items-center justify-between transition-all active:scale-95 ${
                                    isSelected
                                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                                        : !canSelect
                                        ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-40 cursor-not-allowed'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-gray-800 cursor-pointer'
                                }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-base text-gray-900 dark:text-white">
                                            {formatCurrency(batch.retail_price)}
                                        </span>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold">
                                            Batch #{batch.batch_id}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                            isOutOfStock 
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        }`}>
                                            {remainingStock} available
                                        </span>
                                        {(batch as any).purchased_quantity && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                ({(batch as any).purchased_quantity} purchased)
                                            </span>
                                        )}
                                        {isOutOfStock && isLastBatch && (
                                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full font-semibold">Latest</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 ml-4 text-right">
                                    <div className="font-medium">Purchase Date</div>
                                    <div>
                                        {new Date(batch.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Quantity Selector */}
                {selectedBatch && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">
                                Select Quantity
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1}
                                    className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Decrease"
                                >
                                    <Minus size={18} className="text-gray-700 dark:text-gray-300" />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={(selectedBatch as any).remaining_in_stock ?? selectedBatch.quantity}
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                    className="flex-1 h-10 text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <button
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={quantity >= ((selectedBatch as any).remaining_in_stock ?? selectedBatch.quantity)}
                                    className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Increase"
                                >
                                    <Plus size={18} className="text-gray-700 dark:text-gray-300" />
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Available</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                    {(selectedBatch as any).remaining_in_stock ?? selectedBatch.quantity}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Price</p>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                    {formatCurrency(selectedBatch.retail_price * quantity)}
                                </p>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleConfirm}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 active:scale-95 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-600/30"
                        >
                            Add {quantity} {quantity === 1 ? 'Item' : 'Items'} to Cart
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
