import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { getApiUrl } from '../../config/api';
import { useToast } from '../../store/useToast';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface Supplier {
    id?: string;
    supplier_id?: string; // Handle legacy or backend id
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxId?: string;
    notes?: string;
}

interface AddSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    supplier?: Supplier | null;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ isOpen, onClose, onSuccess, supplier }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<Supplier>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (supplier) {
            setFormData(supplier);
        } else {
            setFormData({});
        }
    }, [supplier, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const isEditing = !!supplier?.id;
            const url = isEditing
                ? getApiUrl(`/suppliers/${supplier.id}`)
                : getApiUrl('/suppliers');

            const method = isEditing ? 'PATCH' : 'POST';

            const token = sessionStorage.getItem('token') || localStorage.getItem('token');

            // Clean up read-only or nested fields that shouldn't be sent back
            const { id, supplier_id, ...cleanData } = formData as any;
            if (cleanData._count) delete cleanData._count;
            if (cleanData.purchases) delete cleanData.purchases;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cleanData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save supplier');
            }

            addToast(`Supplier ${supplier ? 'updated' : 'added'} successfully`, 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving supplier:', error);
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md p-6">
                <DialogHeader className="mb-6 border-b border-border pb-4">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white">
                            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter company name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
                        <input
                            type="text"
                            className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                            value={formData.contactPerson || ''}
                            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                            placeholder="Enter contact person name"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                            <input
                                type="tel"
                                className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Phone number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Email address"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                        <textarea
                            className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                            rows={3}
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter address"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax ID</label>
                            <input
                                type="text"
                                className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                value={formData.taxId || ''}
                                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                placeholder="Business tax ID"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                            <input
                                type="text"
                                className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-ring outline-none transition-all"
                                value={formData.notes || ''}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Internal notes"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="ghost"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            className="flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Supplier'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
