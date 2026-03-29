import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Save, AlertCircle, Award, RefreshCw, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';

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
            <DialogContent className="w-full max-w-2xl p-0 rounded-xl overflow-hidden border border-border shadow-2xl bg-background" showCloseButton={false}>
                <DialogHeader className="p-8 border-b bg-muted/5 flex flex-row items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <User size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-1.5">
                                {customer ? 'Update Profile' : 'New Customer'}
                            </DialogTitle>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                {customer ? `Member ID: #${customer.id}` : 'Create a new loyalty profile'}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-10 w-10 hover:bg-muted"
                    >
                        <X size={20} />
                    </Button>
                </DialogHeader>

                <div className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-xs animate-in fade-in duration-200">
                            <AlertCircle size={16} className="shrink-0" />
                            <p className="font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-12">
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Basic Statistics</Label>
                                    <span className="text-[10px] font-bold text-muted-foreground/30 italic uppercase">Section 01</span>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2.5">
                                        <Label className="text-xs font-black ml-1 text-muted-foreground/80">Full Name <span className="text-destructive">*</span></Label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                                                <User size={18} />
                                            </div>
                                            <Input
                                                required
                                                placeholder="e.g. John Doe"
                                                className="pl-12 h-12 rounded-xl border border-border bg-background focus:ring-4 focus:ring-primary/5 text-base font-bold transition-all shadow-xs"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2.5">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Phone Number <span className="text-destructive">*</span></Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                                                    <Phone size={18} />
                                                </div>
                                                <Input
                                                    required
                                                    type="tel"
                                                    placeholder="07XXXXXXXX"
                                                    className="pl-12 h-12 rounded-xl border border-border bg-background focus:ring-4 focus:ring-primary/5 text-base font-bold transition-all shadow-xs"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Email <span className="opacity-40">(Optional)</span></Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                                                    <Mail size={18} />
                                                </div>
                                                <Input
                                                    type="email"
                                                    placeholder="email@example.com"
                                                    className="pl-12 h-12 rounded-xl border border-border bg-background focus:ring-4 focus:ring-primary/5 text-base font-bold transition-all shadow-xs"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {customer?.id && (
                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Privilege Status</Label>
                                        <span className="text-[10px] font-bold text-muted-foreground/30 italic uppercase">Membership</span>
                                    </div>
                                    <div className="p-8 bg-primary/5 border-2 border-primary/10 rounded-2xl flex items-center justify-between shadow-xs">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                                <Award size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Available Points</p>
                                                <p className="text-4xl font-black text-primary tracking-tighter tabular-nums leading-none">{customer.loyaltyPointsBalance || 0}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs font-black bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-lg shadow-primary/20 tracking-wide uppercase">Active VIP</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-8 flex gap-5 border-t border-border/10">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="ghost"
                                className="flex-1 h-14 rounded-xl text-base font-black border border-border bg-background shadow-xs hover:bg-muted transition-all"
                            >
                                Cancel Discovery
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                variant="primary"
                                className="flex-[1.5] h-14 font-black rounded-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-base"
                            >
                                {isSaving ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Check className="w-5 h-5" />
                                )}
                                {customer ? 'Update Specifications' : 'Publish Member'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
