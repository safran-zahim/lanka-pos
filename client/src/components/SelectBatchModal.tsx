import { Plus, Minus } from 'lucide-react';
import type { ProductBatch, Product } from '../db/db';
import { useCurrency } from '../hooks/useCurrency';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-full max-w-130 max-h-[85vh] rounded-2xl p-0 overflow-hidden" showCloseButton>
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 dark:from-gray-900 to-gray-50 dark:to-gray-800">
                    <div className="flex-1">
                        <DialogTitle className="text-lg font-extrabold text-gray-900 dark:text-white">Select Batch</DialogTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 font-medium">{product.name}</p>
                    </div>
                </DialogHeader>

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
                            <Button
                                key={batch.batch_id}
                                type="button"
                                onClick={() => handleBatchClick(batch, remainingStock)}
                                disabled={!canSelect}
                                variant={isSelected ? 'primary' : 'ghost'}
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
                                        <Badge variant="secondary" className="text-[11px] font-semibold">
                                            Batch #{batch.batch_id}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <Badge className={`text-xs font-semibold ${
                                            isOutOfStock 
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        }`}>
                                            {remainingStock} available
                                        </Badge>
                                        {(batch as any).purchased_quantity && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                ({(batch as any).purchased_quantity} purchased)
                                            </span>
                                        )}
                                        {isOutOfStock && isLastBatch && (
                                            <Badge className="text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Latest</Badge>
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
                            </Button>
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
                                <Button
                                    type="button"
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1}
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 px-0"
                                    title="Decrease"
                                >
                                    <Minus size={18} className="text-gray-700 dark:text-gray-300" />
                                </Button>
                                <input
                                    type="number"
                                    min={1}
                                    max={(selectedBatch as any).remaining_in_stock ?? selectedBatch.quantity}
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                    className="flex-1 h-10 text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <Button
                                    type="button"
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={quantity >= ((selectedBatch as any).remaining_in_stock ?? selectedBatch.quantity)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 px-0"
                                    title="Increase"
                                >
                                    <Plus size={18} className="text-gray-700 dark:text-gray-300" />
                                </Button>
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
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            fullWidth
                            className="h-11"
                        >
                            Add {quantity} {quantity === 1 ? 'Item' : 'Items'} to Cart
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
