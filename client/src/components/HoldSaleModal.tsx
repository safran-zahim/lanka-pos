import React, { useState } from 'react';
import { PauseCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-100 max-w-[92vw] p-6" showCloseButton>
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <PauseCircle className="text-accent" />
                        Hold Sale
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-muted-foreground mb-1">Optional Note (e.g. Table 5, Customer Name)</label>
                        <input
                            type="text"
                            placeholder="Reason for holding..."
                            className="w-full bg-gray-100 dark:bg-gray-700 text-foreground p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none border border-gray-300 dark:border-transparent"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
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
                            variant="warning"
                            size="sm"
                        >
                            Hold Sale
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
