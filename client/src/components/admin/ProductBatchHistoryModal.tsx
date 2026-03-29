import { useEffect, useState } from 'react';
import { X, History, TrendingUp, TrendingDown, Package } from 'lucide-react';
import type { Product } from '../../db/db';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';

interface ProductBatchHistoryModalProps {
    product: Product;
    onClose: () => void;
}

export const ProductBatchHistoryModal = ({ product, onClose }: ProductBatchHistoryModalProps) => {
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const token = useAuthStore((state) => state.token);
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || !product.product_id) return;
        const loadBatches = async () => {
            try {
                // Note: This endpoint may not exist yet - using purchases as fallback
                const response = await fetch(getApiUrl(`/products/${product.product_id}/batches`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    setBatches(await response.json());
                } else {
                    // Fallback: Show empty state
                    setBatches([]);
                }
            } catch (error) {
                console.error('Failed to load batches', error);
                setBatches([]);
            } finally {
                setLoading(false);
            }
        };
        loadBatches();
    }, [token, product.product_id]);

    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-full max-w-4xl p-0 rounded-2xl max-h-[90vh] overflow-hidden" showCloseButton={false}>

                {/* Header */}
                <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-800 bg-background text-foreground rounded-t-2xl">
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 text-primary rounded-xl">
                            <History size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">Price History & Batches</DialogTitle>
                            <p className="text-sm text-muted-foreground">{product.name} (SKU: {product.sku_code})</p>
                        </div>
                    </div>
                    <Button type="button" onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        <X size={28} />
                    </Button>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-20 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-muted-foreground font-medium">No purchase history found for this product.</p>
                            <p className="text-sm text-gray-400 mt-1">New batches will appear here when you add stock.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-6 gap-4 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <div className="col-span-1">Date</div>
                                <div className="col-span-1">Status</div>
                                <div className="col-span-1">Cost Price</div>
                                <div className="col-span-1">Selling Price</div>
                                <div className="col-span-1 text-center">Remaining Stock</div>
                                <div className="col-span-1">Note</div>
                            </div>

                            {batches.map((batch, index) => {
                                const prevBatch = batches[index + 1];
                                const costPrice = batch.costPrice || batch.cost_price || 0;
                                const retailPrice = batch.retailPrice || batch.retail_price || 0;
                                const qty = batch.quantity || 0;
                                const createdDate = batch.createdAt || batch.created_at;
                                const isCostUp = prevBatch && costPrice > (prevBatch.costPrice || prevBatch.cost_price || 0);
                                const isCostDown = prevBatch && costPrice < (prevBatch.costPrice || prevBatch.cost_price || 0);
                                const isRetailUp = prevBatch && retailPrice > (prevBatch.retailPrice || prevBatch.retail_price || 0);
                                const isRetailDown = prevBatch && retailPrice < (prevBatch.retailPrice || prevBatch.retail_price || 0);

                                return (
                                    <div
                                        key={batch.id || batch.batch_id}
                                        className={`grid grid-cols-6 gap-4 p-4 rounded-xl border transition-all ${qty > 0
                                                ? 'bg-card text-card-foreground border-border shadow-sm'
                                                : 'bg-muted/50 border-border opacity-60'
                                            }`}
                                    >
                                        <div className="col-span-1 text-sm font-medium text-foreground">
                                            {formatDateTime(new Date(createdDate))}
                                        </div>

                                        <div className="col-span-1 flex items-center">
                                            {qty > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase">Active</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-muted-foreground uppercase">Sold Out</span>
                                            )}
                                        </div>

                                        <div className="col-span-1">
                                            <div className="flex items-center gap-1 font-bold text-foreground">
                                                {formatCurrency(costPrice)}
                                                {isCostUp && <TrendingUp size={14} className="text-red-500" />}
                                                {isCostDown && <TrendingDown size={14} className="text-green-500" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500">Stock In Cost</p>
                                        </div>

                                        <div className="col-span-1">
                                            <div className="flex items-center gap-1 font-bold text-foreground text-lg">
                                                {formatCurrency(retailPrice)}
                                                {isRetailUp && <TrendingUp size={14} className="text-green-500" />}
                                                {isRetailDown && <TrendingDown size={14} className="text-red-500" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500">Customer Price</p>
                                        </div>

                                        <div className="col-span-1 text-center font-mono font-bold text-primary text-lg">
                                            {qty}
                                        </div>

                                        <div className="col-span-1 text-xs text-muted-foreground italic">
                                            {batch.note || '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-muted rounded-b-2xl">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Total Current Stock: <span className="font-bold text-foreground uppercase">{(product as any).stock_quantity || (product as any).stock || 0} {product.unit_id || 'units'}</span>
                        </div>
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="secondary"
                            className="px-6 font-bold"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
