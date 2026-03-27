import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Save, AlertCircle, Award } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/Button';

interface CustomerModalProps {
    customer?: any | null;
    onClose: () => void;
    onSuccess: (createdCustomer?: any) => void;
}

export const CustomerModal = ({ customer, onClose, onSuccess }: CustomerModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TODO: Fetch transactions and points history from API if needed
    // For now we will display basic info or fetch from API
    // The previous implementation used LiveQuery which is Dexie specific.
    // We can implement fetching logic inside useEffect if we want to show history in modal.
    // Given the modal is mostly for Editing details, maybe we skip history for now or fetch it.
    // The history is shown in the Modal? 
    // Yes, lines 183+.
    // We should probably fetch it using UseEffect.

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                phone: customer.phone,
                email: customer.email || ''
            });
        }
    }, [customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!formData.name.trim() || !formData.phone.trim()) {
            setError('Name and phone are required.');
            return;
        }

        setIsSaving(true);
        try {
            const url = customer?.id
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/customers/${customer.id}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/customers`;

            const method = customer?.id ? 'PATCH' : 'POST';
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errData = await response.json();
                // Handle error properly - could be string, array, or object
                let errorMessage = 'Failed to save customer';
                if (typeof errData.error === 'string') {
                    errorMessage = errData.error;
                } else if (Array.isArray(errData.error)) {
                    // Zod validation errors
                    errorMessage = errData.error.map((e: any) => e.message).join(', ');
                } else if (errData.error && typeof errData.error === 'object') {
                    errorMessage = JSON.stringify(errData.error);
                }
                throw new Error(errorMessage);
            }

            const savedCustomer = await response.json();
            onSuccess(savedCustomer);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save customer details.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md p-0 rounded-2xl overflow-hidden" showCloseButton={false}>
                {/* Header Graphic */}
                <div className="relative h-32 bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full backdrop-blur-md"
                    >
                        <X size={20} />
                    </Button>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-xl flex items-center justify-center translate-y-8 border-4 border-gray-50 dark:border-gray-900">
                        <User size={40} className="text-blue-600" />
                    </div>
                </div>

                <div className="px-8 pt-12 pb-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {customer ? 'Edit Customer' : 'Add New Customer'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {customer ? 'Update customer contact information' : 'Create a new customer profile'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl py-4 pl-12 pr-4 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all shadow-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="tel"
                                    required
                                    placeholder="+94 77 123 4567"
                                    className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl py-4 pl-12 pr-4 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all shadow-sm"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address (Optional)</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl py-4 pl-12 pr-4 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all shadow-sm"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex gap-3">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="ghost"
                                fullWidth
                                className="flex-1 border-2 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                variant="primary"
                                className="flex-2 font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={20} />
                                )}
                                {customer ? 'Update Profile' : 'Create Profile'}
                            </Button>
                        </div>
                    </form>

                    {customer?.id && (
                        <div className="mt-8 space-y-6">
                            {/* Points history were here, removing Dexie dependency for now */}
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-600 dark:text-gray-300">Points Balance</div>
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                                    <Award size={16} /> {customer.loyaltyPointsBalance || 0}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
