import React, { useState } from 'react';
import { DollarSign, Hash, StickyNote } from 'lucide-react';
import type { CartItem } from '../store/useCartStore';
import { useCurrency } from '../hooks/useCurrency';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface EditCartItemModalProps {
    item: CartItem;
    onConfirm: (updates: { price: number; quantity: number; note: string }) => void;
    onClose: () => void;
}

export const EditCartItemModal = ({ item, onConfirm, onClose }: EditCartItemModalProps) => {
    const { currencySymbol } = useCurrency();
    const [price, setPrice] = useState<string>(item.retail_price.toString());
    const [quantity, setQuantity] = useState<string>(item.quantity.toString());
    const [note, setNote] = useState<string>(item.note || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = parseFloat(price);
        const numQty = parseFloat(quantity);
        if (isNaN(numPrice) || numPrice < 0) {
            alert('Please enter a valid price');
            return;
        }
        if (isNaN(numQty) || numQty <= 0) {
            alert('Please enter a valid quantity');
            return;
        }
        onConfirm({ price: numPrice, quantity: numQty, note });
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-105 max-w-[92vw] p-6" showCloseButton>
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <DollarSign className="text-primary" />
                        Edit Item
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Price ({currencySymbol})</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full bg-gray-100 dark:bg-gray-700 text-foreground p-2 pl-9 rounded focus:ring-2 focus:ring-ring outline-none border border-gray-300 dark:border-transparent"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Quantity</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="w-full bg-gray-100 dark:bg-gray-700 text-foreground p-2 pl-9 rounded focus:ring-2 focus:ring-ring outline-none border border-gray-300 dark:border-transparent"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Note (prints on receipt)</label>
                        <div className="relative">
                            <StickyNote className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <textarea
                                className="w-full bg-gray-100 dark:bg-gray-700 text-foreground p-2 pl-9 rounded focus:ring-2 focus:ring-ring outline-none border border-gray-300 dark:border-transparent min-h-[80px]"
                                placeholder="e.g. No onions, extra spicy"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
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
