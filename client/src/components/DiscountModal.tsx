import React, { useState } from 'react';
import { X, Tag, Percent, DollarSign, Trash2 } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

interface DiscountModalProps {
    subtotal: number;
    total: number; // final cart total (after tax, round-off) — used for change calculation
    currentDiscount?: number; // existing applied discount amount
    onConfirm: (discount: { mode: 'amount' | 'percent'; value: number }) => void;
    onClose: () => void;
}

const QUICK_PRESETS = [5, 10, 15, 20, 25];

/**
 * Modal to apply a discount to the entire bill before payment
 */
export const DiscountModal = ({
    subtotal,
    total,
    currentDiscount = 0,
    onConfirm,
    onClose,
}: DiscountModalProps) => {
    const { currencySymbol, formatCurrency } = useCurrency();
    const [mode, setMode] = useState<'amount' | 'percent'>('percent');
    const [value, setValue] = useState<string>('');
    const numValue = parseFloat(value) || 0;
    const discountPreview =
        mode === 'percent'
            ? (subtotal * numValue) / 100
            : numValue;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (discountPreview > subtotal) {
            alert('Discount cannot exceed subtotal');
            return;
        }
        onConfirm({ mode, value: numValue });
    };

    const handlePreset = (percent: number) => {
        setMode('percent');
        setValue(String(percent));
    };

    const handleRemoveDiscount = () => {
        onConfirm({ mode: 'amount', value: 0 });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-[440px] border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Tag className="text-blue-500" />
                        Apply Bill Discount
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Quick Presets */}
                <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                        Quick Presets
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                        {QUICK_PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => handlePreset(preset)}
                                className={`py-2 rounded-lg text-sm font-bold border-2 transition-all ${mode === 'percent' && numValue === preset
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    }`}
                            >
                                {preset}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-4">
                    <button
                        type="button"
                        onClick={() => setMode('percent')}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${mode === 'percent'
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Percent size={14} />
                        Percentage
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('amount')}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${mode === 'amount'
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <DollarSign size={14} />
                        Amount ({currencySymbol})
                    </button>
                </div>

                {/* Discount Input */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {mode === 'percent' ? 'Discount Percentage (%)' : `Discount Amount (${currencySymbol})`}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={mode === 'percent' ? '100' : undefined}
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent text-lg font-semibold"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            autoFocus
                            placeholder="0"
                        />
                        {numValue > 0 && (
                            <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Discount amount:</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    -{formatCurrency(Math.min(discountPreview, subtotal))}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mb-4">
                        {currentDiscount > 0 && (
                            <button
                                type="button"
                                onClick={handleRemoveDiscount}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 size={14} />
                                Remove Discount
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-md shadow-blue-200 dark:shadow-blue-900/30"
                        >
                            Apply Discount
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
