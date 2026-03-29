import React, { useState } from 'react';
import { Tag, Percent, DollarSign, Trash2 } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-110 max-w-[92vw] p-6 max-h-[90vh] overflow-y-auto" showCloseButton>

                {/* Header */}
                <DialogHeader className="mb-5">
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Tag className="text-primary" />
                        Apply Bill Discount
                    </DialogTitle>
                </DialogHeader>

                {/* Quick Presets */}
                <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Quick Presets
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                        {QUICK_PRESETS.map((preset) => (
                            <Button
                                key={preset}
                                type="button"
                                onClick={() => handlePreset(preset)}
                                size="sm"
                                className={`py-2 rounded-lg text-sm font-bold border-2 transition-all ${mode === 'percent' && numValue === preset
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                                    : 'bg-gray-50 dark:bg-gray-700 text-foreground border-border hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    }`}
                            >
                                {preset}%
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-4">
                    <Button
                        type="button"
                        variant={mode === 'percent' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setMode('percent')}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${mode === 'percent'
                            ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow'
                            : 'text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Percent size={14} />
                        Percentage
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'amount' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setMode('amount')}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${mode === 'amount'
                            ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow'
                            : 'text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <DollarSign size={14} />
                        Amount ({currencySymbol})
                    </Button>
                </div>

                {/* Discount Input */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-muted-foreground mb-1">
                            {mode === 'percent' ? 'Discount Percentage (%)' : `Discount Amount (${currencySymbol})`}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={mode === 'percent' ? '100' : undefined}
                            className="w-full bg-gray-100 dark:bg-gray-700 text-foreground p-2.5 rounded-lg focus:ring-2 focus:ring-ring outline-none border border-gray-300 dark:border-transparent text-lg font-semibold"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            autoFocus
                            placeholder="0"
                        />
                        {numValue > 0 && (
                            <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Discount amount:</span>
                                <span className="font-bold text-success">
                                    -{formatCurrency(Math.min(discountPreview, subtotal))}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mb-4">
                        {currentDiscount > 0 && (
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={handleRemoveDiscount}
                                className="flex items-center gap-1.5"
                            >
                                <Trash2 size={14} />
                                Remove Discount
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            size="sm"
                            className="flex-1"
                        >
                            Apply Discount
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
};
