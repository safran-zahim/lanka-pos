import React, { useState, useEffect, useMemo } from 'react';
import { X, CreditCard, Banknote, Users, Delete, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import type { Customer } from '../db/db';

interface UnifiedCheckoutModalProps {
    total: number;
    enableCustomerCredit?: boolean;
    customer: Customer | null;
    onConfirm: (
        paymentMethod: 'cash' | 'card' | 'credit' | 'split',
        payload: {
            cashAmount: number;
            cardAmount: number;
            creditAmount: number;
            changeReturn?: number;
        }
    ) => void;
    onClose: () => void;
}

type TenderMethod = 'cash' | 'card' | 'credit';

export const UnifiedCheckoutModal: React.FC<UnifiedCheckoutModalProps> = ({
    total,
    enableCustomerCredit,
    customer,
    onConfirm,
    onClose
}) => {
    const { formatCurrency, currencySymbol } = useCurrency();

    // Keypad input state (string for active typing)
    const [inputValue, setInputValue] = useState<string>('');

    // Active tenders
    const [tenders, setTenders] = useState<{ method: TenderMethod; amount: number }[]>([]);

    useEffect(() => {
        // Pre-fill input with remaining balance on load if empty
        if (!inputValue && tenders.length === 0) {
            setInputValue('');
        }
    }, [tenders, inputValue, total]);

    // Derived Financials
    const totalTendered = tenders.reduce((sum, t) => sum + t.amount, 0);
    const balanceDue = Math.max(0, total - totalTendered);
    const changeDue = Math.max(0, totalTendered - total);
    const isReadyToComplete = balanceDue <= 0;

    const isWalkIn = !customer || (customer.name || '').toLowerCase().replace(/[^a-z]/g, '') === 'walkin';
    const canUseCredit = enableCustomerCredit && !isWalkIn;

    const handleKeypadPress = (val: string) => {
        setInputValue(prev => {
            if (val === '.') {
                if (prev.includes('.')) return prev;
                return prev === '' ? '0.' : prev + '.';
            }
            if (prev === '0' && val !== '.') return val;

            // Limit to 2 decimal places
            const parts = prev.split('.');
            if (parts.length > 1 && parts[1].length >= 2) return prev;

            return prev + val;
        });
    };

    const handleDelete = () => {
        setInputValue(prev => prev.slice(0, -1));
    };

    const handleQuickAmount = (amount: number) => {
        setInputValue(amount.toString());
    };

    const getRemainingToPay = () => balanceDue;

    const handleAddTender = (method: TenderMethod) => {
        const amountToAdd = parseFloat(inputValue) || getRemainingToPay();
        if (amountToAdd <= 0) return;

        // Card and Credit cannot exceed the balance due to prevent negative change in those tender types.
        let finalAmount = amountToAdd;
        if ((method === 'card' || method === 'credit') && amountToAdd > balanceDue) {
            finalAmount = balanceDue;
            // Optionally, we could show a toast here, but just auto-correcting is smoother UX.
        }

        if (finalAmount <= 0) return;

        setTenders(prev => {
            const existing = prev.find(t => t.method === method);
            if (existing) {
                return prev.map(t => t.method === method ? { ...t, amount: t.amount + finalAmount } : t);
            }
            return [...prev, { method, amount: finalAmount }];
        });

        setInputValue('');
    };

    const handleRemoveTender = (index: number) => {
        setTenders(prev => prev.filter((_, i) => i !== index));
    };

    const handleComplete = () => {
        if (!isReadyToComplete) return;

        const cashTender = tenders.find(t => t.method === 'cash')?.amount ?? 0;
        const cardTender = tenders.find(t => t.method === 'card')?.amount ?? 0;
        const creditTender = tenders.find(t => t.method === 'credit')?.amount ?? 0;

        // Determine primary method for legacy compatibility, or use 'split'
        let primaryMethod: 'cash' | 'card' | 'credit' | 'split' = 'split';

        if (tenders.length === 1) {
            primaryMethod = tenders[0].method;
        }

        onConfirm(primaryMethod, {
            cashAmount: cashTender,
            cardAmount: cardTender,
            creditAmount: creditTender,
            changeReturn: changeDue > 0 ? changeDue : undefined
        });
    };

    // Quick cash buttons based on remaining balance
    const quickAmounts = useMemo(() => {
        const amounts = [balanceDue];
        const base = Math.ceil(balanceDue / 100) * 100;
        if (base > balanceDue && !amounts.includes(base)) amounts.push(base);

        const denominations = [500, 1000, 5000];
        denominations.forEach(denom => {
            if (denom >= balanceDue && !amounts.includes(denom)) {
                amounts.push(denom);
            }
        });

        return amounts.sort((a, b) => a - b).slice(0, 4);
    }, [balanceDue]);


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[150] p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[80vh] max-h-[800px] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Checkout
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                    {/* Left Panel: Summary & Tenders */}
                    <div className="w-full lg:w-5/12 bg-gray-50/50 dark:bg-gray-800/20 border-r border-gray-100 dark:border-gray-800 p-5 flex flex-col overflow-y-auto">

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Due</div>
                            <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                {formatCurrency(total)}
                            </div>
                        </div>

                        {/* Applied Tenders */}
                        <div className="flex-1 mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Payments Applied</h3>
                            {tenders.length === 0 ? (
                                <div className="text-gray-400 dark:text-gray-500 text-sm italic py-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    No payments applied yet
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tenders.map((tender, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-right-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${tender.method === 'cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        tender.method === 'card' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    }`}>
                                                    {tender.method === 'cash' && <Banknote size={18} />}
                                                    {tender.method === 'card' && <CreditCard size={18} />}
                                                    {tender.method === 'credit' && <Users size={18} />}
                                                </div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-200 capitalize">
                                                    {tender.method}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(tender.amount)}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveTender(idx)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Balance / Change */}
                        <div className={`mt-auto p-5 rounded-xl border-2 transition-colors duration-300 ${isReadyToComplete
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50'
                                : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'
                            }`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-sm font-semibold ${isReadyToComplete ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {isReadyToComplete ? 'Change Due' : 'Remaining Balance'}
                                </span>
                            </div>
                            <div className={`text-3xl font-black ${isReadyToComplete ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(isReadyToComplete ? changeDue : balanceDue)}
                            </div>
                        </div>

                    </div>

                    {/* Right Panel: Numpad & Tenders */}
                    <div className="w-full lg:w-7/12 p-3 sm:p-5 flex flex-col bg-white dark:bg-gray-900">
                        {/* Custom Input Display */}
                        <div className="mb-4">
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 px-1">Tender Amount</div>
                            <div className="bg-gray-50 dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex justify-between items-center">
                                <span className="text-xl sm:text-2xl text-gray-400 font-bold">{currencySymbol}</span>
                                <span className={`text-4xl sm:text-5xl font-black tracking-tight ${inputValue ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                                    {inputValue || (balanceDue > 0 ? balanceDue.toFixed(2) : '0.00')}
                                </span>
                            </div>
                        </div>

                        {/* Quick Cash row */}
                        {!isReadyToComplete && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
                                {quickAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => handleQuickAmount(amt)}
                                        className="flex-none px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold rounded-lg border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                    >
                                        {formatCurrency(amt)}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 flex gap-4 mt-auto">
                            {/* Numpad */}
                            <div className="w-2/3 grid grid-cols-3 gap-2">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.'].map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => handleKeypadPress(key)}
                                        className={`bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-2xl font-semibold rounded-xl active:scale-95 transition-transform ${key === '0' ? 'col-span-2' : ''}`}
                                    >
                                        {key}
                                    </button>
                                ))}
                                <button
                                    onClick={handleDelete}
                                    className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center rounded-xl active:scale-95 transition-transform"
                                >
                                    <Delete size={28} />
                                </button>
                            </div>

                            {/* Payment Methods */}
                            <div className="w-1/3 flex flex-col gap-2">
                                <button
                                    onClick={() => handleAddTender('cash')}
                                    disabled={isReadyToComplete}
                                    className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex flex-col items-center justify-center gap-1 sm:gap-2 transition-colors shadow-sm"
                                >
                                    <Banknote size={28} />
                                    <span className="font-bold text-sm sm:text-base">Cash</span>
                                </button>

                                <button
                                    onClick={() => handleAddTender('card')}
                                    disabled={isReadyToComplete}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex flex-col items-center justify-center gap-1 sm:gap-2 transition-colors shadow-sm"
                                >
                                    <CreditCard size={28} />
                                    <span className="font-bold text-sm sm:text-base">Card</span>
                                </button>

                                {enableCustomerCredit && (
                                    <button
                                        onClick={() => handleAddTender('credit')}
                                        disabled={!canUseCredit || isReadyToComplete}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex flex-col items-center justify-center gap-1 sm:gap-2 transition-colors shadow-sm relative group"
                                    >
                                        <Users size={28} />
                                        <span className="font-bold text-sm sm:text-base">Credit</span>
                                        {!canUseCredit && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                <AlertCircle size={24} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
                    <button
                        onClick={handleComplete}
                        disabled={!isReadyToComplete}
                        className="w-full py-4 sm:py-5 rounded-xl text-lg sm:text-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:transform-none disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 shadow-xl"
                        style={{
                            backgroundColor: isReadyToComplete ? '#10b981' : undefined,
                            color: isReadyToComplete ? 'white' : undefined
                        }}
                    >
                        {isReadyToComplete ? (
                            <>
                                <CheckCircle2 size={28} />
                                Complete Sale
                            </>
                        ) : (
                            <>
                                Pay {formatCurrency(balanceDue)}
                                <ArrowRight size={24} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
