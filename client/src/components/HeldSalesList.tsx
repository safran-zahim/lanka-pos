import { X, PlayCircle, Trash2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { HeldSale } from '../db/db';
import { useCurrency } from '../hooks/useCurrency';
import { getApiUrl } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface HeldSalesListProps {
    onRestore: (sale: HeldSale) => void;
    onClose: () => void;
}

export const HeldSalesList = ({ onRestore, onClose }: HeldSalesListProps) => {
    const { formatCurrency } = useCurrency();
    const { token } = useAuthStore();
    const [heldSales, setHeldSales] = useState<any[]>([]);

    useEffect(() => {
        const fetchHeldSales = async () => {
            if (!token) return;
            try {
                const response = await fetch(getApiUrl('/sales/held'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to load held sales');
                const payload = await response.json();
                setHeldSales(Array.isArray(payload) ? payload : payload.data || []);
            } catch (error) {
                console.error('Failed to load held sales', error);
            }
        };

        fetchHeldSales();
    }, [token]);

    const handleDelete = async (id: number) => {
        if (confirm('Discard this held sale?')) {
            if (!token) return;
            await fetch(getApiUrl(`/sales/held/${id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setHeldSales((prev) => prev.filter((sale) => sale.id !== id));
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-150 max-h-[80vh] p-6 flex flex-col">
                <DialogHeader className="mb-6">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Clock className="text-primary" />
                            Held Sales
                        </DialogTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X size={24} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {heldSales?.map((sale) => (
                        <div key={sale.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center border border-gray-200 dark:border-transparent">
                            <div>
                                <div className="font-medium text-foreground text-lg">
                                    {sale.note || `Sale #${sale.id}`}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(sale.createdAt || sale.timestamp).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {(sale.items || []).length} items • Total: {formatCurrency((sale.items || []).reduce((sum: number, i: any) => sum + ((i.product?.retail_price || 0) * i.quantity), 0))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleDelete(sale.id!)}
                                    variant="ghost"
                                    size="sm"
                                    title="Discard"
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash2 size={20} />
                                </Button>
                                <Button
                                    onClick={() => onRestore(sale)}
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <PlayCircle size={18} />
                                    Restore
                                </Button>
                            </div>
                        </div>
                    ))}

                    {heldSales?.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">
                            No held sales found.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
