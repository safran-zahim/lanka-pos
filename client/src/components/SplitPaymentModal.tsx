import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, CreditCard, Banknote } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

interface SplitPaymentModalProps {
    total: number;
    onConfirm: (details: { cash: number; card: number }) => void;
    onClose: () => void;
}

export const SplitPaymentModal = ({ total, onConfirm, onClose }: SplitPaymentModalProps) => {
    const { formatCurrency } = useCurrency();
    const [cashAmount, setCashAmount] = useState<string>('');
    const [cardAmount, setCardAmount] = useState<string>('');
    const [receivedCash, setReceivedCash] = useState<string>('');
    const [remaining, setRemaining] = useState(total);

    useEffect(() => {
        const cash = parseFloat(cashAmount) || 0;
        const card = parseFloat(cardAmount) || 0;
        setRemaining(total - (cash + card));
        // Auto-fill received cash if cash amount changes and no received cash entered yet,
        // or if received cash is somehow less than cash amount
        if (cash > 0 && (!receivedCash || (parseFloat(receivedCash) || 0) < cash)) {
            setReceivedCash(cashAmount);
        }
    }, [cashAmount, cardAmount, total, receivedCash]);

    const handleConfirm = (e: FormEvent) => {
        e.preventDefault();
        const cash = parseFloat(cashAmount) || 0;
        const card = parseFloat(cardAmount) || 0;
        const received = parseFloat(receivedCash) || 0;

        if (Math.abs(remaining) > 0.01) {
            alert('Total payment must match the bill amount.');
            return;
        }

        if (cash > 0 && received < cash) {
            alert('Received cash cannot be less than the cash allocated to the bill.');
            return;
        }

        onConfirm({ cash, card });
    };

    const handleAutoFill = (type: 'cash' | 'card') => {
        const currentCash = parseFloat(cashAmount) || 0;
        const currentCard = parseFloat(cardAmount) || 0;

        if (type === 'cash') {
            const needed = total - currentCard;
            setCashAmount(needed.toFixed(2));
        } else {
            const needed = total - currentCash;
            setCardAmount(needed.toFixed(2));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[400px] border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="text-blue-500" />
                        Split Payment
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6 bg-gray-100 dark:bg-gray-700 p-4 rounded text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Payable</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</div>
                    <div className={`text-sm mt-1 font-medium ${Math.abs(remaining) < 0.01 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(remaining) < 0.01 ? 'Fully Covered' : `Remaining: ${formatCurrency(remaining)}`}
                    </div>
                </div>

                <form onSubmit={handleConfirm} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                            <span>Cash Allocated to Bill</span>
                            <button type="button" onClick={() => handleAutoFill('cash')} className="text-blue-500 hover:text-blue-600 text-xs font-bold bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">Auto Fill Max</button>
                        </label>
                        <div className="relative">
                            <Banknote className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-gray-600 font-semibold"
                                value={cashAmount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCashAmount(val);
                                    if (val === '') {
                                        setCardAmount('');
                                    } else {
                                        const cashVal = parseFloat(val) || 0;
                                        const remaining = Math.max(0, total - cashVal);
                                        setCardAmount(remaining > 0 ? remaining.toFixed(2) : '0.00');
                                    }
                                }}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Actually Received Cash */}
                        {(parseFloat(cashAmount) || 0) > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-blue-500">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Actual Cash Received from Customer
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full pl-8 pr-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-gray-600 font-bold text-blue-600 dark:text-blue-400"
                                        value={receivedCash}
                                        onChange={(e) => setReceivedCash(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                {((parseFloat(receivedCash) || 0) - (parseFloat(cashAmount) || 0)) > 0 && (
                                    <div className="mt-1.5 text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg inline-block">
                                        Change to give: {formatCurrency((parseFloat(receivedCash) || 0) - (parseFloat(cashAmount) || 0))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                            <span>Card Amount</span>
                            <button type="button" onClick={() => handleAutoFill('card')} className="text-blue-500 hover:text-blue-600 text-xs font-bold bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">Auto Fill Max</button>
                        </label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-gray-600 font-semibold"
                                value={cardAmount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCardAmount(val);
                                    if (val === '') {
                                        setCashAmount('');
                                    } else {
                                        const cardVal = parseFloat(val) || 0;
                                        const remaining = Math.max(0, total - cardVal);
                                        setCashAmount(remaining > 0 ? remaining.toFixed(2) : '0.00');
                                        setReceivedCash(remaining > 0 ? remaining.toFixed(2) : '0.00'); // Auto update received cash when auto-filling cash
                                    }
                                }}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={Math.abs(remaining) > 0.01}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Split Pay
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
