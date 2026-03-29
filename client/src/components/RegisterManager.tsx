import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../store/useToast';
import { getApiUrl } from '../config/api';
import { Button } from './ui/Button';
import { Dialog, DialogContent } from './ui/dialog';

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
        <Dialog open={true} onOpenChange={handleClose}>
            <DialogContent className="w-full max-w-md p-6 relative">

                <Button
                    onClick={handleClose}
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Button>

                <div className="text-center mb-6 mt-2">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Open Register</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                        You must open a register session with a starting cash float before you can make sales.
                    </p>
                </div>

                <form onSubmit={handleOpenRegister}>
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Starting Cash Float
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
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
                                className="w-full pl-14 pr-4 py-3.5 bg-muted border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-ring focus:border-blue-500 dark:focus:ring-ring outline-none transition-all text-xl font-bold text-foreground"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        variant="primary"
                        fullWidth
                        className="font-bold py-3.5"
                    >
                        {isSubmitting ? 'Opening Register...' : 'Open Register'}
                    </Button>

                    <Button
                        type="button"
                        onClick={handleClose}
                        variant="ghost"
                        fullWidth
                        className="mt-3 font-medium py-2"
                    >
                        Cancel (View Only Mode)
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
