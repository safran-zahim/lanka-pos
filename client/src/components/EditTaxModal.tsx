import React, { useState } from 'react';
import { Percent } from 'lucide-react';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-90 max-w-[92vw] p-6" showCloseButton>
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Percent className="text-primary" />
                        Edit Tax Rate
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Tax Rate (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-foreground p-2 rounded focus:ring-2 focus:ring-ring outline-none border border-gray-300 dark:border-transparent"
                            value={rateInput}
                            onChange={(e) => setRateInput(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                        >
                            Save
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
