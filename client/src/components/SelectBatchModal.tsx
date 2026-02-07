import { X } from 'lucide-react';
import type { ProductBatch, Product } from '../db/db';
import { useCurrency } from '../hooks/useCurrency';

interface SelectBatchModalProps {
    product: Product;
    batches: ProductBatch[];
    onSelect: (batch: ProductBatch) => void;
    onClose: () => void;
}

export const SelectBatchModal = ({ product, batches, onSelect, onClose }: SelectBatchModalProps) => {
    const { formatCurrency } = useCurrency();
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 w-[520px] max-h-[80vh] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Price Batch</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {batches.length === 0 && (
                        <div className="text-center text-sm text-gray-500 py-8">No batches available.</div>
                    )}
                    {batches.map(batch => (
                        <button
                            key={batch.batch_id}
                            onClick={() => onSelect(batch)}
                            className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                        >
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(batch.retail_price)}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Qty: {batch.quantity}</div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(batch.created_at).toLocaleDateString()}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
