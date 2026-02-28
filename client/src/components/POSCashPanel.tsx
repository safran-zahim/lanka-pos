import React, { useState, useEffect } from 'react';
import {
    X, TrendingUp, TrendingDown, Wallet, Receipt,
    DollarSign, ArrowLeft, Loader, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../store/useToast';
import { getApiUrl } from '../config/api';

interface POSCashPanelProps {
    onClose: () => void;
}

type Tab = 'overview' | 'petty' | 'expense';

export const POSCashPanel: React.FC<POSCashPanelProps> = ({ onClose }) => {
    const { token } = useAuthStore();
    const { formatCurrency, currencySymbol } = useCurrency();
    const { addToast } = useToast();

    const [tab, setTab] = useState<Tab>('overview');
    const [shiftData, setShiftData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);

    const { enableDailyRegister, loadSettings } = useSettingsStore();

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Petty Cash form
    const [pettyType, setPettyType] = useState<'IN' | 'OUT'>('OUT');
    const [pettyAmount, setPettyAmount] = useState('');
    const [pettyDesc, setPettyDesc] = useState('');
    const [isSubmittingPetty, setIsSubmittingPetty] = useState(false);

    // Expense form
    const [expAmount, setExpAmount] = useState('');
    const [expCategory, setExpCategory] = useState('');
    const [expDesc, setExpDesc] = useState('');
    const [expPayMethod, setExpPayMethod] = useState('cash');
    const [isSubmittingExp, setIsSubmittingExp] = useState(false);

    const loadShift = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl('/shifts/active'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setShiftData(await res.json());
            } else {
                setShiftData(null);
            }
        } catch {
            setShiftData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetch(getApiUrl('/expenses/categories'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setCategories(await res.json());
        } catch { }
    };

    useEffect(() => {
        loadShift();
        loadCategories();
    }, [token]);

    const handlePettyCash = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = Number(pettyAmount);
        if (!amt || amt <= 0) { addToast('Enter a valid amount', 'error'); return; }
        if (!pettyDesc.trim()) { addToast('Enter a description', 'error'); return; }

        setIsSubmittingPetty(true);
        try {
            const res = await fetch(getApiUrl('/shifts/petty-cash'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ amount: amt, type: pettyType, description: pettyDesc })
            });
            if (res.ok) {
                addToast(`Petty Cash ${pettyType === 'IN' ? 'IN' : 'OUT'} saved`, 'success');
                setPettyAmount(''); setPettyDesc('');
                await loadShift();
                setTab('overview');
            } else {
                const err = await res.json();
                addToast(err.error || 'Failed to save petty cash', 'error');
            }
        } catch { addToast('Network error', 'error'); }
        finally { setIsSubmittingPetty(false); }
    };

    const handleExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = Number(expAmount);
        if (!amt || amt <= 0) { addToast('Enter a valid amount', 'error'); return; }
        if (!expDesc.trim()) { addToast('Enter a description', 'error'); return; }

        setIsSubmittingExp(true);
        try {
            const res = await fetch(getApiUrl('/expenses'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    amount: amt,
                    categoryId: expCategory ? Number(expCategory) : undefined,
                    description: expDesc,
                    paymentMethod: expPayMethod
                })
            });
            if (res.ok) {
                addToast('Expense logged', 'success');
                setExpAmount(''); setExpCategory(''); setExpDesc(''); setExpPayMethod('cash');
                await loadShift();
                setTab('overview');
            } else {
                const err = await res.json();
                addToast(err.error || 'Failed to log expense', 'error');
            }
        } catch { addToast('Network error', 'error'); }
        finally { setIsSubmittingExp(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-end">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm h-full flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        {tab !== 'overview' && (
                            <button
                                onClick={() => setTab('overview')}
                                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                                {tab === 'overview' ? 'Cash & Expenses' : tab === 'petty' ? 'Petty Cash' : 'Log Expense'}
                            </h2>
                            {shiftData && tab === 'overview' && (
                                <p className="text-xs text-gray-500">
                                    Register opened {new Date(shiftData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={loadShift} title="Refresh" className="text-gray-400 hover:text-blue-500 transition-colors">
                            <RefreshCw size={16} />
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader size={28} className="animate-spin text-blue-500" />
                        </div>
                    ) : !shiftData ? (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
                            <AlertCircle size={40} className="text-orange-400" />
                            <p className="font-semibold text-gray-700 dark:text-gray-300">No Active Register</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Open a register shift first to log petty cash or expenses.</p>
                        </div>
                    ) : (
                        <>
                            {/* OVERVIEW TAB */}
                            {tab === 'overview' && (
                                <div className="p-5 space-y-4">
                                    {/* Drawer Summary */}
                                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                                        <p className="text-sm font-medium opacity-90">Expected in Drawer</p>
                                        <p className="text-4xl font-black mt-1">
                                            {formatCurrency(shiftData.liveExpectedCash ?? shiftData.expectedCash ?? 0)}
                                        </p>
                                    </div>

                                    {/* Breakdown */}
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                        <div className="flex justify-between px-4 py-3">
                                            <span className="text-gray-600 dark:text-gray-400">Starting Float</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(shiftData.startingCash)}</span>
                                        </div>
                                        <div className="flex justify-between px-4 py-3">
                                            <span className="text-green-600 dark:text-green-400">Cash Sales (+)</span>
                                            <span className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(shiftData.totalCashSales)}</span>
                                        </div>
                                        <div className="flex justify-between px-4 py-3">
                                            <span className="text-red-500 dark:text-red-400">Cash Refunds (-)</span>
                                            <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(shiftData.totalCashRefunds)}</span>
                                        </div>
                                        <div className="flex justify-between px-4 py-3">
                                            <span className="text-orange-600 dark:text-orange-400">General Expenses (-)</span>
                                            <span className="font-semibold text-orange-700 dark:text-orange-400">{formatCurrency(shiftData.totalExpenses)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setTab('petty')}
                                            className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group"
                                        >
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:scale-110 transition-transform">
                                                <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Petty Cash</span>
                                            <span className="text-[10px] text-blue-500 dark:text-blue-400">Cash IN / OUT</span>
                                        </button>

                                        <button
                                            onClick={() => setTab('expense')}
                                            className="flex flex-col items-center justify-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors group"
                                        >
                                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg group-hover:scale-110 transition-transform">
                                                <Receipt size={20} className="text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Log Expense</span>
                                            <span className="text-[10px] text-orange-500 dark:text-orange-400">Record outgoing cost</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* PETTY CASH TAB */}
                            {tab === 'petty' && (
                                <form onSubmit={handlePettyCash} className="p-5 space-y-5">
                                    {/* Type Selector */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setPettyType('IN')}
                                            className={`flex flex-col items-center py-4 rounded-xl border-2 font-semibold transition-all gap-1 ${pettyType === 'IN'
                                                ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 shadow-md'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-green-300'
                                                }`}
                                        >
                                            <TrendingUp size={22} />
                                            <span className="text-sm">Cash IN</span>
                                            <span className="text-[10px] opacity-70">Add to drawer</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPettyType('OUT')}
                                            className={`flex flex-col items-center py-4 rounded-xl border-2 font-semibold transition-all gap-1 ${pettyType === 'OUT'
                                                ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300 shadow-md'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-orange-300'
                                                }`}
                                        >
                                            <TrendingDown size={22} />
                                            <span className="text-sm">Cash OUT</span>
                                            <span className="text-[10px] opacity-70">Remove from drawer</span>
                                        </button>
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ({currencySymbol})</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            autoFocus
                                            value={pettyAmount}
                                            onChange={e => setPettyAmount(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                        <input
                                            type="text"
                                            required
                                            value={pettyDesc}
                                            onChange={e => setPettyDesc(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="e.g. Lunch, supplies, drawer top-up..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingPetty}
                                        className={`w-full py-3.5 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${pettyType === 'IN'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-orange-600 hover:bg-orange-700'
                                            } disabled:opacity-60`}
                                    >
                                        {isSubmittingPetty ? (
                                            <Loader size={18} className="animate-spin" />
                                        ) : pettyType === 'IN' ? (
                                            <><TrendingUp size={18} /> Save Cash IN</>
                                        ) : (
                                            <><TrendingDown size={18} /> Save Cash OUT</>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* EXPENSE TAB */}
                            {tab === 'expense' && (
                                <form onSubmit={handleExpense} className="p-5 space-y-4">
                                    {/* Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ({currencySymbol})</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            autoFocus
                                            value={expAmount}
                                            onChange={e => setExpAmount(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                        <select
                                            value={expCategory}
                                            onChange={e => setExpCategory(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">General (No Category)</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                                        <input
                                            type="text"
                                            required
                                            value={expDesc}
                                            onChange={e => setExpDesc(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="What was this expense for?"
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['cash', 'card'].map(method => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setExpPayMethod(method)}
                                                    className={`py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${expPayMethod === method
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {method.charAt(0).toUpperCase() + method.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        {expPayMethod === 'cash' && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5">
                                                ⚠ Cash expenses reduce the expected drawer balance
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingExp}
                                        className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmittingExp ? (
                                            <Loader size={18} className="animate-spin" />
                                        ) : (
                                            <><Receipt size={18} /> Save Expense</>
                                        )}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
