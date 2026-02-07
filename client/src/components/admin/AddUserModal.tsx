import React, { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '../../db/db';
import { useCurrency } from '../../hooks/useCurrency';

interface AddUserModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddUserModal = ({ onClose, onSuccess }: AddUserModalProps) => {
    const { currencySymbol } = useCurrency();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'cashier' as 'admin' | 'manager' | 'cashier',
        hourly_rate: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Check if username exists
            const existing = await db.users.where('username').equals(formData.username).first();
            if (existing) {
                alert('Username already exists');
                return;
            }

            await db.users.add({
                username: formData.username,
                password_hash: formData.password, // In real app, hash this!
                role: formData.role,
                hourly_rate: parseFloat(formData.hourly_rate) || 0
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to add user.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-[400px] border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add New User</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-gray-700 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            required
                            type="password"
                            className="w-full bg-gray-700 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Role</label>
                        <select
                            className="w-full bg-gray-700 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
                            className="w-full bg-gray-700 text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.hourly_rate}
                            onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded mt-4"
                    >
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    );
};
