import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useCurrency } from '../hooks/useCurrency';
import { getApiUrl } from '../config/api';
import { useToast } from '../store/useToast';
import { X, Save, TrendingUp, TrendingDown, Clock, Download, DollarSign, Wallet, FileText, ArrowRight, ArrowLeft, LogOut } from 'lucide-react';
import { RegisterSummaryReceipt } from './RegisterSummaryReceipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/Button';

interface ActiveRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegisterClosed: () => void; // Called when the shift is successfully closed
}

export const ActiveRegisterModal: React.FC<ActiveRegisterModalProps> = ({ isOpen, onClose, onRegisterClosed }) => {
    const { token } = useAuthStore();
    const { formatCurrency, currencySymbol } = useCurrency();
    const { addToast } = useToast();

    const [shiftData, setShiftData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Petty Cash state
    const [showPettyCash, setShowPettyCash] = useState(false);
    const [pettyType, setPettyType] = useState<'IN' | 'OUT'>('IN');
    const [pettyAmount, setPettyAmount] = useState('');
    const [pettyDesc, setPettyDesc] = useState('');
    const [isSubmittingPetty, setIsSubmittingPetty] = useState(false);

    // Close Register state
    const [showCloseRegister, setShowCloseRegister] = useState(false);
    const [countedCash, setCountedCash] = useState('');
    const [closeNote, setCloseNote] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    const loadShift = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl('/shifts/active'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setShiftData(data);
                // Pre-fill close register counted cash with calculated expected cash initially for convenience
                setCountedCash(data.liveExpectedCash);
            } else {
                setShiftData(null);
            }
        } catch (error) {
            console.error('Failed to load shift', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadShift();
            setShowPettyCash(false);
            setShowCloseRegister(false);
            setShowReceipt(false);
        }
    }, [isOpen, token]);

    const handlePettyCashSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pettyAmount || isNaN(Number(pettyAmount)) || Number(pettyAmount) <= 0) {
            addToast("Please enter a valid amount", "error");
            return;
        }
        if (!pettyDesc.trim()) {
            addToast("Please add a description", "error");
            return;
        }

        setIsSubmittingPetty(true);
        try {
            const res = await fetch(getApiUrl('/shifts/petty-cash'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ amount: Number(pettyAmount), type: pettyType, description: pettyDesc })
            });
            if (res.ok) {
                addToast(`Petty Cash ${pettyType} saved.`, "success");
                setShowPettyCash(false);
                setPettyAmount('');
                setPettyDesc('');
                loadShift(); // Reload expected cash
            } else {
                const err = await res.json();
                addToast(err.error || "Failed to log petty cash", "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        } finally {
            setIsSubmittingPetty(false);
        }
    };

    const handleCloseRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (countedCash === '' || isNaN(Number(countedCash)) || Number(countedCash) < 0) {
            addToast("Please enter valid counted cash", "error");
            return;
        }

        setIsClosing(true);
        try {
            const res = await fetch(getApiUrl('/shifts/close'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ countedCash: Number(countedCash), note: closeNote })
            });

            if (res.ok) {
                addToast("Register closed successfully.", "success");
                setShowReceipt(true);
                // We let the receipt handle calling onRegisterClosed/onClose after printing
            } else {
                const err = await res.json();
                addToast(err.error || "Failed to close register", "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        } finally {
            setIsClosing(false);
        }
    };

    if (!isOpen) return null;

    if (showReceipt && shiftData) {
        return (
            <RegisterSummaryReceipt
                shiftData={shiftData}
                countedCash={Number(countedCash)}
                variance={Number(countedCash) - Number(shiftData.liveExpectedCash)}
                closeNote={closeNote}
                onClose={() => {
                    setShowReceipt(false);
                    onRegisterClosed();
                    onClose();
                }}
            />
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`${showCloseRegister ? 'max-w-4xl' : 'max-w-2xl'} flex flex-col max-h-[90vh]`}>
                {/* Header */}
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Active Register</DialogTitle>
                            {shiftData && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Opened at {new Date(shiftData.startTime).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
                    ) : !shiftData ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">No active register found.</div>
                    ) : (
                        <div className="space-y-6">

                            {!showCloseRegister && !showPettyCash && (
                                <>
                                    {/* Dashboard Highlights */}
                                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 lg:p-4 border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                                            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Expected Drawer</p>
                                            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate" title={formatCurrency(shiftData.liveExpectedCash)}>{formatCurrency(shiftData.liveExpectedCash)}</p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 lg:p-4 border border-green-100 dark:border-green-900/30 overflow-hidden">
                                            <p className="text-xs lg:text-sm text-green-700 dark:text-green-400 font-medium truncate">Cash Sales</p>
                                            <p className="text-lg lg:text-xl font-bold text-green-900 dark:text-green-300 mt-1 truncate" title={`+${formatCurrency(shiftData.totalCashSales)}`}>+{formatCurrency(shiftData.totalCashSales)}</p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 lg:p-4 border border-orange-100 dark:border-orange-900/30 overflow-hidden">
                                            <p className="text-xs lg:text-sm text-orange-700 dark:text-orange-400 font-medium truncate">Cash Expenses</p>
                                            <p className="text-lg lg:text-xl font-bold text-orange-900 dark:text-orange-300 mt-1 truncate" title={`-${formatCurrency(shiftData.totalExpenses)}`}>-{formatCurrency(shiftData.totalExpenses)}</p>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 lg:p-4 border border-blue-100 dark:border-blue-900/30 overflow-hidden">
                                            <p className="text-xs lg:text-sm text-blue-700 dark:text-blue-400 font-medium truncate">Starting Float</p>
                                            <p className="text-lg lg:text-xl font-bold text-blue-900 dark:text-blue-300 mt-1 truncate" title={formatCurrency(shiftData.startingCash)}>{formatCurrency(shiftData.startingCash)}</p>
                                        </div>
                                    </div>

                                    {/* Deep Breakdown */}
                                    <div className="bg-white dark:bg-gray-800 border text-sm border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700"><h3 className="font-semibold text-gray-700 dark:text-gray-300">Detailed Breakdown</h3></div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                            <div className="flex justify-between px-4 py-3 text-gray-700 dark:text-gray-300">
                                                <span className="text-gray-600 dark:text-gray-400">Starting Cash</span>
                                                <span className="font-medium">{formatCurrency(shiftData.startingCash)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3 bg-green-50/30 dark:bg-green-900/10">
                                                <span className="text-gray-600 dark:text-gray-400">Cash Sales <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(+)</span></span>
                                                <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(shiftData.totalCashSales)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3 bg-blue-50/30 dark:bg-blue-900/10">
                                                <span className="text-gray-600 dark:text-gray-400">Card Sales <span className="text-xs text-blue-400 dark:text-blue-500 ml-2">(Non-Cash)</span></span>
                                                <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(shiftData.totalCardSales || 0)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3 bg-purple-50/30 dark:bg-purple-900/10">
                                                <span className="text-gray-600 dark:text-gray-400">Credit Sales <span className="text-xs text-purple-400 dark:text-purple-500 ml-2">(Non-Cash)</span></span>
                                                <span className="font-medium text-purple-600 dark:text-purple-400">{formatCurrency(shiftData.totalCreditSales || 0)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3 bg-green-50/30 dark:bg-green-900/10">
                                                <span className="text-gray-600 dark:text-gray-400">Customer Debt Repaid <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(+)</span></span>
                                                <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(shiftData.totalCustomerPayments)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3 bg-red-50/30 dark:bg-red-900/10">
                                                <span className="text-gray-600 dark:text-gray-400">Cash Refunds <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(-)</span></span>
                                                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(shiftData.totalCashRefunds)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3 bg-red-50/30 dark:bg-red-900/10">
                                                <span className="text-gray-600 dark:text-gray-400">Supplier Paid Out <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(-)</span></span>
                                                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(shiftData.totalSupplierPayments)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-3 bg-red-50/30 dark:bg-red-900/10">
                                                <span className="text-gray-600 dark:text-gray-400">General Expenses <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(-)</span></span>
                                                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(shiftData.totalExpenses)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-4 bg-gray-50 dark:bg-gray-900/50 font-bold border-t-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                                                <span>Calculated Expected Drawer</span>
                                                <span className="text-lg">{formatCurrency(shiftData.liveExpectedCash)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <Button 
                                            onClick={() => setShowPettyCash(true)} 
                                            variant="ghost"
                                            fullWidth
                                            className="flex items-center justify-center gap-2"
                                        >
                                            <DollarSign className="w-5 h-5" /> Petty Cash In/Out
                                        </Button>
                                        <Button 
                                            onClick={() => setShowCloseRegister(true)} 
                                            variant="danger"
                                            fullWidth
                                            className="flex items-center justify-center gap-2"
                                        >
                                            <LogOut className="w-5 h-5" /> Close Register
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Petty Cash View */}
                            {showPettyCash && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button 
                                            onClick={() => setShowPettyCash(false)} 
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-auto"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </Button>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Petty Cash Adjustment</h3>
                                    </div>

                                    <form onSubmit={handlePettyCashSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className={`cursor-pointer flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${pettyType === 'IN' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                                <input type="radio" name="type" className="sr-only" checked={pettyType === 'IN'} onChange={() => setPettyType('IN')} />
                                                <TrendingUp className="w-5 h-5" /> Cash IN
                                            </label>
                                            <label className={`cursor-pointer flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${pettyType === 'OUT' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                                <input type="radio" name="type" className="sr-only" checked={pettyType === 'OUT'} onChange={() => setPettyType('OUT')} />
                                                <TrendingDown className="w-5 h-5" /> Cash OUT
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">{currencySymbol}</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0.01"
                                                    step="0.01"
                                                    value={pettyAmount}
                                                    onChange={(e) => setPettyAmount(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                            <input
                                                type="text"
                                                required
                                                value={pettyDesc}
                                                onChange={(e) => setPettyDesc(e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                                                placeholder="Lunch, supplies, drawer fill..."
                                            />
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                            <Button 
                                                type="button" 
                                                onClick={() => setShowPettyCash(false)} 
                                                variant="ghost"
                                                fullWidth
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                disabled={isSubmittingPetty} 
                                                variant="primary"
                                                fullWidth
                                            >
                                                {isSubmittingPetty ? 'Saving...' : 'Save Adjustment'}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Close Register View */}
                            {showCloseRegister && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button 
                                            onClick={() => setShowCloseRegister(false)} 
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 h-auto"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </Button>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Close Daily Register</h3>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Please count the physical cash in your drawer and enter the total below. This will be compared against the system's expected total.</p>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-6 text-center">
                                        <span className="text-blue-700 dark:text-blue-400 font-medium text-sm">System Expected Cash</span>
                                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-300 mt-1">{formatCurrency(shiftData.liveExpectedCash)}</div>
                                    </div>

                                    <form onSubmit={handleCloseRegister} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Counted Cash</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">{currencySymbol}</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    value={countedCash}
                                                    onChange={(e) => setCountedCash(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-4 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xl font-bold text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            {Number(countedCash) !== Number(shiftData.liveExpectedCash) && countedCash !== '' && (
                                                <div className={`mt-2 text-sm font-medium ${Number(countedCash) > Number(shiftData.liveExpectedCash) ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                    Variance: {formatCurrency(Math.abs(Number(countedCash) - Number(shiftData.liveExpectedCash)))}
                                                    {Number(countedCash) > Number(shiftData.liveExpectedCash) ? ' Over (Surplus)' : ' Under (Shortage)'}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Closing Note (Optional)</label>
                                            <textarea
                                                value={closeNote}
                                                onChange={(e) => setCloseNote(e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-gray-900 dark:text-white"
                                                rows={2}
                                                placeholder={Number(countedCash) !== Number(shiftData.liveExpectedCash) ? "Please explain the variance..." : "Any closing remarks..."}
                                            />
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                            <Button 
                                                type="button" 
                                                onClick={() => setShowCloseRegister(false)} 
                                                variant="ghost"
                                                fullWidth
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                type="submit" 
                                                disabled={isClosing} 
                                                variant="danger"
                                                fullWidth
                                                className="flex items-center justify-center gap-2"
                                            >
                                                {isClosing ? 'Closing...' : <><LogOut className="w-5 h-5" /> Confirm & Close Register</>}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
