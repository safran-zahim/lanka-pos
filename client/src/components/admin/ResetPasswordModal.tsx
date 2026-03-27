import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface ResetPasswordModalProps {
    user: { user_id?: number | string, username: string };
    onClose: () => void;
    onSuccess: () => void;
}

export const ResetPasswordModal = ({ user, onClose, onSuccess }: ResetPasswordModalProps) => {
    const { addToast } = useToast();
    const token = useAuthStore((state) => state.token);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addToast("Passwords do not match", 'error');
            return;
        }

        if (password.length < 4) {
            addToast("Password must be at least 4 characters", 'error');
            return;
        }

        setIsLoading(true);
        try {
            if (!token) {
                throw new Error('Missing auth token');
            }
            const response = await fetch(getApiUrl(`/staff/${user.user_id}/password`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to update password');
            }
            addToast("Password updated successfully", 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to reset password', error);
            addToast("Failed to update password", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-md p-6" showCloseButton={false}>
                <DialogHeader className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Lock size={20} className="text-blue-500" />
                                Reset Password
                            </DialogTitle>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                For user: <span className="font-semibold text-blue-600 dark:text-blue-400">{user.username}</span>
                            </p>
                        </div>
                        <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <X size={20} />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10"
                                placeholder="Enter new password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <Button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                variant="ghost"
                                size="sm"
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 h-8 px-2"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                        <input
                            required
                            type="password"
                            className="w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="ghost"
                            fullWidth
                            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            variant="primary"
                            fullWidth
                            className="font-bold shadow-lg shadow-blue-500/30"
                        >
                            {isLoading ? 'Saving...' : 'Update Password'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
