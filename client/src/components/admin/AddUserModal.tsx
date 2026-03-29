import { useState } from 'react';
import { X } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface AddUserModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddUserModal = ({ onClose, onSuccess }: AddUserModalProps) => {
    const { currencySymbol } = useCurrency();
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'cashier' as 'admin' | 'manager' | 'cashier',
        hourly_rate: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!token) {
                alert('Missing auth token');
                return;
            }

            const response = await fetch(getApiUrl('/staff'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.username,
                    role: formData.role,
                    password: formData.password,
                    hourly_rate: parseFloat(formData.hourly_rate) || 0
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to add user');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to add user.');
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-100 bg-gray-800 border border-gray-700 text-white p-6" showCloseButton={false}>
                <DialogHeader className="mb-6">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-xl font-bold text-white">Add New User</DialogTitle>
                        <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-700 text-white p-2 rounded focus:ring-2 focus:ring-ring outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            required
                            type="password"
                            className="w-full bg-gray-700 text-white p-2 rounded focus:ring-2 focus:ring-ring outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Role</label>
                        <select
                            className="w-full bg-gray-700 text-white p-2 rounded focus:ring-2 focus:ring-ring outline-none"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                        >
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Hourly Rate ({currencySymbol})</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full bg-gray-700 text-white p-2 rounded focus:ring-2 focus:ring-ring outline-none"
                            value={formData.hourly_rate}
                            onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        className="font-bold py-3 mt-4"
                    >
                        Create Account
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
