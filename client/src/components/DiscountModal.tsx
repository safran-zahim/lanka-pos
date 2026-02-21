import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

interface DiscountModalProps {
    subtotal: number;
    onConfirm: (discount: { mode: 'amount' | 'percent'; value: number }) => void;
    onClose: () => void;
}

export const DiscountModal = ({ subtotal, onConfirm, onClose }: DiscountModalProps) => {
    const { currencySymbol } = useCurrency();
    const [mode, setMode] = useState<'amount' | 'percent'>('amount');
    const [value, setValue] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numValue = parseFloat(value) || 0;
        let discountAmount = 0;

        if (mode === 'amount') {
            discountAmount = numValue;
        } else {
            discountAmount = (subtotal * numValue) / 100;
        }

        if (discountAmount > subtotal) {
            alert('Discount cannot exceed subtotal');
            return;
        }

        onConfirm({ mode, value: numValue });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[400px] border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Tag className="text-blue-500" />
                        Apply Discount
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded mb-4">
                    <button
                        type="button"
                        onClick={() => setMode('amount')}
                        className={`flex-1 py-1 rounded text-sm font-medium transition-colors ${mode === 'amount'
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Amount ({currencySymbol})
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('percent')}
                        className={`flex-1 py-1 rounded text-sm font-medium transition-colors ${mode === 'percent'
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Percentage (%)
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {mode === 'amount' ? `Discount Amount (${currencySymbol})` : 'Discount Percentage (%)'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            autoFocus
                            placeholder="0.00"
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                        >
                            Apply Discount
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
