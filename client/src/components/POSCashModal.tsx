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
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface POSCashModalProps {
    onClose: () => void;
}

type Tab = 'overview' | 'petty' | 'expense';

export const POSCashModal: React.FC<POSCashModalProps> = ({ onClose }) => {
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
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-full max-w-lg rounded-2xl p-0 overflow-hidden max-h-[90vh]" showCloseButton={false}>

                {/* Header */}
                <DialogHeader className="px-6 py-5 border-b border-border bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {tab !== 'overview' && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setTab('overview')}
                                className="h-8 w-8 rounded-full px-0 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <ArrowLeft size={18} />
                            </Button>
                        )}
                        <div className="p-2.5 bg-green-500/10 text-green-600 rounded-xl">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">
                                {tab === 'overview' ? 'Cash & Expenses' : tab === 'petty' ? 'Petty Cash Transaction' : 'Record Business Expense'}
                            </DialogTitle>
                            {shiftData && tab === 'overview' && (
                                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                    ACTIVE REGISTER • SINCE {new Date(shiftData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={loadShift}
                            disabled={isLoading}
                            className="h-9 w-9 px-0 text-gray-400 hover:text-primary"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-9 w-9 px-0 text-gray-400 hover:text-red-500"
                        >
                            <X size={20} />
                        </Button>
                    </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader size={32} className="animate-spin text-green-500" />
                            <p className="text-sm text-gray-500 animate-pulse">Syncing drawer data...</p>
                        </div>
                    ) : (enableDailyRegister && !shiftData) ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
                            <div className="p-4 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                                <AlertCircle size={48} className="text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Register is Closed</h3>
                            <p className="text-muted-foreground max-w-xs">
                                Global settings require an active register shift. Please open a register before logging transactions.
                            </p>
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="secondary"
                                size="sm"
                                className="mt-4 px-8"
                            >
                                Got it
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* OVERVIEW TAB */}
                            {tab === 'overview' && (
                                <div className="p-6 space-y-6">
                                    {/* Main Card */}
                                    <div className="relative overflow-hidden bg-linear-to-br from-gray-900 to-gray-800 dark:from-green-600 dark:to-emerald-800 rounded-3xl p-8 text-white shadow-2xl">
                                        <div className="relative z-10">
                                            <p className="text-xs font-bold uppercase tracking-[2px] opacity-70">Current Cash Estimate</p>
                                            <h3 className="text-5xl font-black mt-3 flex items-baseline gap-1">
                                                {formatCurrency(shiftData?.liveExpectedCash ?? shiftData?.expectedCash ?? 0)}
                                            </h3>
                                        </div>
                                        {/* Decorative circle */}
                                        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                                    </div>

                                    {/* Detailed Breakdown */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted/50 p-4 rounded-2xl border border-border">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Starting Float</p>
                                            <p className="text-lg font-bold text-foreground mt-1">
                                                {formatCurrency(shiftData?.startingCash ?? 0)}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                                            <p className="text-[10px] font-bold text-success uppercase">Cash Sales</p>
                                            <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
                                                +{formatCurrency(shiftData?.totalCashSales ?? 0)}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                                            <p className="text-[10px] font-bold text-destructive uppercase">Cash Refunds</p>
                                            <p className="text-lg font-bold text-red-700 dark:text-red-300 mt-1">
                                                -{formatCurrency(shiftData?.totalCashRefunds ?? 0)}
                                            </p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Total Expenses</p>
                                            <p className="text-lg font-bold text-orange-700 dark:text-orange-300 mt-1">
                                                -{formatCurrency(shiftData?.totalExpenses ?? 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Grid */}
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                                        <Button
                                            type="button"
                                            onClick={() => setTab('petty')}
                                            variant="ghost"
                                            size="sm"
                                            className="flex flex-col items-center gap-3 p-5 bg-card text-card-foreground border-2 border-border rounded-3xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all group"
                                        >
                                            <div className="p-3 bg-primary/20 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                                                <DollarSign size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-foreground">Petty Cash</p>
                                                <p className="text-[10px] text-gray-500">Add or Remove Cash</p>
                                            </div>
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={() => setTab('expense')}
                                            variant="ghost"
                                            size="sm"
                                            className="flex flex-col items-center gap-3 p-5 bg-card text-card-foreground border-2 border-border rounded-3xl hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-xl transition-all group"
                                        >
                                            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 transition-transform">
                                                <Receipt size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-foreground">Log Expense</p>
                                                <p className="text-[10px] text-gray-500">Record Outgoing Cost</p>
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* PETTY CASH FORM */}
                            {tab === 'petty' && (
                                <form onSubmit={handlePettyCash} className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            type="button"
                                            onClick={() => setPettyType('IN')}
                                            variant="ghost"
                                            size="sm"
                                            className={`flex flex-col items-center py-5 rounded-3xl border-2 font-bold transition-all gap-2 ${pettyType === 'IN'
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300 shadow-lg scale-[1.02]'
                                                : 'border-border text-gray-400 hover:border-green-200'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-full ${pettyType === 'IN' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                                <TrendingUp size={20} />
                                            </div>
                                            <span>Cash IN</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setPettyType('OUT')}
                                            variant="ghost"
                                            size="sm"
                                            className={`flex flex-col items-center py-5 rounded-3xl border-2 font-bold transition-all gap-2 ${pettyType === 'OUT'
                                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-300 shadow-lg scale-[1.02]'
                                                : 'border-border text-gray-400 hover:border-orange-200'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-full ${pettyType === 'OUT' ? 'bg-accent text-accent-foreground' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                                <TrendingDown size={20} />
                                            </div>
                                            <span>Cash OUT</span>
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Amount ({currencySymbol})</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    required
                                                    autoFocus
                                                    value={pettyAmount}
                                                    onChange={e => setPettyAmount(e.target.value)}
                                                    className="w-full bg-muted border border-transparent focus:border-blue-500 text-foreground rounded-2xl px-6 py-4 outline-none text-3xl font-black transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Reason / Description</label>
                                            <input
                                                type="text"
                                                required
                                                value={pettyDesc}
                                                onChange={e => setPettyDesc(e.target.value)}
                                                className="w-full bg-muted border border-transparent focus:border-blue-500 text-foreground rounded-2xl px-6 py-4 outline-none font-medium transition-all"
                                                placeholder="e.g. Purchase lunch for staff..."
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSubmittingPetty}
                                        className={`w-full py-5 rounded-3xl font-black text-lg text-white shadow-xl transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${pettyType === 'IN'
                                            ? 'bg-success hover:bg-success/90 shadow-green-600/20'
                                            : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                                            } disabled:opacity-60`}
                                    >
                                        {isSubmittingPetty ? (
                                            <Loader size={24} className="animate-spin" />
                                        ) : (
                                            <p>Submit {pettyType === 'IN' ? 'Cash IN' : 'Cash OUT'}</p>
                                        )}
                                    </Button>
                                </form>
                            )}

                            {/* EXPENSE FORM */}
                            {tab === 'expense' && (
                                <form onSubmit={handleExpense} className="p-8 space-y-5">
                                    <div className="grid grid-cols-1 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Expense Amount ({currencySymbol})</label>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                required
                                                autoFocus
                                                value={expAmount}
                                                onChange={e => setExpAmount(e.target.value)}
                                                className="w-full bg-muted border border-transparent focus:border-blue-500 text-foreground rounded-2xl px-6 py-4 outline-none text-3xl font-black transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Category</label>
                                                <select
                                                    value={expCategory}
                                                    onChange={e => setExpCategory(e.target.value)}
                                                    className="w-full bg-muted border border-transparent focus:border-blue-500 text-foreground rounded-2xl px-4 py-4 outline-none font-bold text-sm appearance-none transition-all cursor-pointer"
                                                >
                                                    <option value="">General Cost</option>
                                                    {categories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Pay Method</label>
                                                <div className="grid grid-cols-2 h-14 bg-background rounded-2xl p-1 gap-1">
                                                    {['cash', 'card'].map(method => (
                                                        <Button
                                                            key={method}
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setExpPayMethod(method)}
                                                            className={`rounded-xl text-xs font-black uppercase transition-all ${expPayMethod === method
                                                                ? 'bg-card text-card-foreground text-primary shadow-sm'
                                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                                                }`}
                                                        >
                                                            {method}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Description</label>
                                            <input
                                                type="text"
                                                required
                                                value={expDesc}
                                                onChange={e => setExpDesc(e.target.value)}
                                                className="w-full bg-muted border border-transparent focus:border-blue-500 text-foreground rounded-2xl px-6 py-4 outline-none font-medium transition-all"
                                                placeholder="What was this for?"
                                            />
                                            {expPayMethod === 'cash' && (
                                                <p className="text-[10px] text-accent font-bold mt-2 flex items-center gap-1">
                                                    <AlertCircle size={10} /> Drawer balance will be adjusted
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSubmittingExp}
                                        className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl font-black text-lg shadow-xl shadow-gray-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                                    >
                                        {isSubmittingExp ? (
                                            <Loader size={24} className="animate-spin text-gray-400" />
                                        ) : (
                                            <>
                                                <Receipt size={20} />
                                                <p>Log Business Expense</p>
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
