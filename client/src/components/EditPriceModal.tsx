import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import type { CartItem } from '../store/useCartStore';
import { useCurrency } from '../hooks/useCurrency';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface EditPriceModalProps {
    item: CartItem;
    onConfirm: (newPrice: number) => void;
    onClose: () => void;
}

export const EditPriceModal = ({ item, onConfirm, onClose }: EditPriceModalProps) => {
    const { currencySymbol } = useCurrency();
    const [price, setPrice] = useState<string>(item.retail_price.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) {
            alert('Please enter a valid price');
            return;
        }
        onConfirm(numPrice);
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-100 max-w-[92vw] p-6" showCloseButton>
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <DollarSign className="text-green-500" />
                        Edit Price: {item.name}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-muted-foreground mb-1">New Price ({currencySymbol})</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-foreground p-2 rounded focus:ring-2 focus:ring-green-500 outline-none border border-gray-300 dark:border-transparent"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
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
                            variant="success"
                            size="sm"
                        >
                            Update Price
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
