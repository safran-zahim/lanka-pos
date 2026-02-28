import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../store/useToast';
import { getApiUrl } from '../config/api';

interface RegisterManagerProps {
    onRegisterStatusKnown: (isOpen: boolean) => void;
}

export const RegisterManager: React.FC<RegisterManagerProps> = ({ onRegisterStatusKnown }) => {
    const { token } = useAuthStore();
    const { addToast } = useToast();
    const [isOpen, setIsOpen] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [startingCash, setStartingCash] = useState('0'); // Default to 0 based on user request
    const [isSubmitting, setIsSubmitting] = useState(false);

    const checkRegister = async () => {
        // ... (unchanged code inside checkRegister, handleOpenRegister, effect)
        if (!token) return;
        try {
            const res = await fetch(getApiUrl('/shifts/active'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setIsOpen(true);
                onRegisterStatusKnown(true);
            } else if (res.status === 404) {
                setIsOpen(false);
                onRegisterStatusKnown(false);

                // Fetch the expected cash from the last closed register to pre-fill the float
                try {
                    const lastRes = await fetch(getApiUrl('/shifts/last-closed'), {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (lastRes.ok) {
                        const lastData = await lastRes.json();
                        if (lastData && lastData.expectedCash != null) {
                            setStartingCash(String(lastData.expectedCash));
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch last closed shift float", e);
                }
            }
        } catch (error) {
            console.error("Failed to check register status", error);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkRegister();
    }, [token]);

    const handleOpenRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (startingCash === '' || isNaN(Number(startingCash))) {
            addToast("Please enter a valid starting cash amount", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(getApiUrl('/shifts/open'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ startingCash: Number(startingCash) })
            });

            if (res.ok) {
                addToast("Register opened successfully", "success");
                setIsOpen(true);
                onRegisterStatusKnown(true);
            } else {
                const err = await res.json();
                addToast(err.error || "Failed to open register", "error");
            }
        } catch (error) {
            addToast("Network error opening register", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isOpen || isChecking) return null;

    // Helper to close the modal and return to POS (if user abandons opening register)
    const handleClose = () => {
        setIsOpen(true); // Temporarily hide modal, POS will be locked due to missing register but modal goes away
        onRegisterStatusKnown(false); // Make sure POS knows it's closed
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 relative">

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-6 mt-2">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Open Register</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        You must open a register session with a starting cash float before you can make sales.
                    </p>
                </div>

                <form onSubmit={handleOpenRegister}>
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Starting Cash Float
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">
                                LKR
                            </span>
                            <input
                                type="number"
                                autoFocus
                                required
                                min="0"
                                step="any"
                                value={startingCash}
                                onChange={(e) => setStartingCash(e.target.value)}
                                className="w-full pl-14 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 outline-none transition-all text-xl font-bold text-gray-900 dark:text-white"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 shadow-lg shadow-blue-200 dark:shadow-none"
                    >
                        {isSubmitting ? 'Opening Register...' : 'Open Register'}
                    </button>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full mt-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium py-2 transition-colors"
                    >
                        Cancel (View Only Mode)
                    </button>
                </form>
            </div>
        </div>
    );
};
