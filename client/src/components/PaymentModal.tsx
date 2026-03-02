import React, { useState, useEffect, useMemo } from 'react';
import { X, CreditCard, Banknote, DollarSign, Users } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

interface PaymentModalProps {
    total: number;
    enableCustomerCredit?: boolean;
    hasCustomer?: boolean;
    onConfirm: (method: 'cash' | 'card' | 'credit', receivedAmount: number) => void;
    onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ total, enableCustomerCredit, hasCustomer, onConfirm, onClose }) => {
    const { formatCurrency, currencySymbol } = useCurrency();
    const [method, setMethod] = useState<'cash' | 'card' | 'credit'>('cash');
    const [receivedAmountStr, setReceivedAmountStr] = useState<string>('');

    // Pre-fill received amount if switching to Card, as card usually is exact amount
    // Pre-fill received amount if switching to Card or Credit, as they are typically exact amounts
    useEffect(() => {
        if (method === 'card' || method === 'credit') {
            setReceivedAmountStr(total.toFixed(2));
        } else {
            setReceivedAmountStr(''); // Reset for cash to force entry
        }
    }, [method, total]);

    const receivedAmount = parseFloat(receivedAmountStr) || 0;
    const change = Math.max(0, receivedAmount - total);
    const balanceRemaining = Math.max(0, total - receivedAmount);

    // Quick cash buttons (e.g., 500, 1000, 5000 based on the total)
    const quickAmounts = useMemo(() => {
        const amounts = [total]; // Exact amount
        const base = Math.ceil(total / 100) * 100; // Next hundred
        if (base > total && !amounts.includes(base)) amounts.push(base);

        // Typical Sri Lankan/General currency denominations 
        const denominations = [500, 1000, 5000];
        denominations.forEach(denom => {
            if (denom >= total && !amounts.includes(denom)) {
                amounts.push(denom);
            }
        });

        return amounts.sort((a, b) => a - b).slice(0, 4); // Max 4 buttons
    }, [total]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (receivedAmount < total && method === 'cash') {
            return; // Don't submit if short on cash (UI button will be disabled anyway)
        }

        onConfirm(method, receivedAmount);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-blue-500" />
                        Complete Payment
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Amount Due Display */}
                    <div className="text-center mb-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Due</div>
                        <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                            {formatCurrency(total)}
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className={`grid gap-3 mb-6 ${enableCustomerCredit ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <button
                            type="button"
                            onClick={() => setMethod('cash')}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all font-semibold ${method === 'cash'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300 dark:hover:border-blue-800'
                                }`}
                        >
                            <Banknote size={20} />
                            <span>Cash</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMethod('card')}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all font-semibold ${method === 'card'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300 dark:hover:border-blue-800'
                                }`}
                        >
                            <CreditCard size={20} />
                            <span>Card</span>
                        </button>
                        {enableCustomerCredit && (
                            <button
                                type="button"
                                onClick={() => setMethod('credit')}
                                disabled={!hasCustomer}
                                className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${method === 'credit'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300 dark:hover:border-blue-800'
                                    }`}
                                title={!hasCustomer ? "Select a customer first to use Credit" : "Pay on Credit"}
                            >
                                <Users size={20} />
                                <span>Credit</span>
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Amount Received */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Amount Received
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                                    {currencySymbol}
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    autoFocus
                                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                                    value={receivedAmountStr}
                                    onChange={(e) => setReceivedAmountStr(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Quick Cash Buttons */}
                        {method === 'cash' && (
                            <div className="flex gap-2">
                                {quickAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setReceivedAmountStr(amt.toString())}
                                        className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-lg text-sm font-semibold border border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                                    >
                                        {formatCurrency(amt)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Calculations Display */}
                        {method === 'cash' && (
                            <div className={`p-4 rounded-xl border ${balanceRemaining > 0 ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/50' : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50'}`}>
                                {balanceRemaining > 0 ? (
                                    <div className="flex justify-between items-center text-orange-700 dark:text-orange-400 font-semibold">
                                        <span>Balance Due:</span>
                                        <span className="text-xl">{formatCurrency(balanceRemaining)}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-green-700 dark:text-green-400 font-semibold">
                                        <span>Change Due:</span>
                                        <span className="text-2xl font-bold">{formatCurrency(change)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={method === 'cash' && receivedAmount < total}
                                className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                Complete Payment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
