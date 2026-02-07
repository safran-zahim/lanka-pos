import React, { useState } from 'react';
import { X, PauseCircle } from 'lucide-react';

interface HoldSaleModalProps {
    onConfirm: (note: string) => void;
    onClose: () => void;
}

export const HoldSaleModal = ({ onConfirm, onClose }: HoldSaleModalProps) => {
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(note);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[400px] border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <PauseCircle className="text-orange-500" />
                        Hold Sale
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Optional Note (e.g. Table 5, Customer Name)</label>
                        <input
                            type="text"
                            placeholder="Reason for holding..."
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none border border-gray-300 dark:border-transparent"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-medium"
                        >
                            Hold Sale
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
