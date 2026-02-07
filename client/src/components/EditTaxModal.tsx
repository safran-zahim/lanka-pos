import React, { useState } from 'react';
import { X, Percent } from 'lucide-react';

interface EditTaxModalProps {
    currentRate: number;
    onConfirm: (rate: number) => void;
    onClose: () => void;
}

export const EditTaxModal = ({ currentRate, onConfirm, onClose }: EditTaxModalProps) => {
    const [rateInput, setRateInput] = useState<string>((currentRate * 100).toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const percent = parseFloat(rateInput);
        if (isNaN(percent) || percent < 0) {
            alert('Please enter a valid tax rate');
            return;
        }
        onConfirm(percent / 100);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[360px] border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Percent className="text-blue-500" />
                        Edit Tax Rate
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tax Rate (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none border border-gray-300 dark:border-transparent"
                            value={rateInput}
                            onChange={(e) => setRateInput(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
