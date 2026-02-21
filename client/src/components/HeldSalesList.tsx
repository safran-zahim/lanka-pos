import { X, PlayCircle, Trash2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { HeldSale } from '../db/db';
import { useCurrency } from '../hooks/useCurrency';
import { getApiUrl } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[600px] border border-gray-200 dark:border-gray-700 shadow-xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="text-blue-500" />
                        Held Sales
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {heldSales?.map((sale) => (
                        <div key={sale.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center border border-gray-200 dark:border-transparent">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white text-lg">
                                    {sale.note || `Sale #${sale.id}`}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(sale.createdAt || sale.timestamp).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {(sale.items || []).length} items • Total: {formatCurrency((sale.items || []).reduce((sum: number, i: any) => sum + ((i.product?.retail_price || 0) * i.quantity), 0))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDelete(sale.id!)}
                                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                    title="Discard"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button
                                    onClick={() => onRestore(sale)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-2"
                                >
                                    <PlayCircle size={18} />
                                    Restore
                                </button>
                            </div>
                        </div>
                    ))}

                    {heldSales?.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            No held sales found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
