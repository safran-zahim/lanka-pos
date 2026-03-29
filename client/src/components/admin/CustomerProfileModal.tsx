import { useEffect, useState, useMemo } from 'react';
import { X, User, Phone, Mail, Award, Receipt, Calendar } from 'lucide-react';
import { type Customer } from '../../db/db';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';

interface CustomerProfileModalProps {
    customer: Customer;
    onClose: () => void;
}

export const CustomerProfileModal = ({ customer, onClose }: CustomerProfileModalProps) => {
    const token = useAuthStore((state) => state.token);
    const [customerData, setCustomerData] = useState<any>(null);

    useEffect(() => {
        if (!token || !customer.customer_id) return;
        const loadCustomer = async () => {
            try {
                const response = await fetch(getApiUrl(`/customers/${customer.customer_id}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    setCustomerData(await response.json());
                }
            } catch (error) {
                console.error('Failed to load customer data', error);
            }
        };
        loadCustomer();
    }, [token, customer.customer_id]);

    const transactions = customerData?.sales || [];
    const pointsHistory = customerData?.pointsLedger || [];

    const transactionItemsMap = useMemo(() => {
        const map = new Map<number, { count: number }>();
        transactions.forEach((t: any) => {
            const count = t.items?.length || 0;
            map.set(t.id, { count });
        });
        return map;
    }, [transactions]);

    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-full max-w-225 p-6 max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                <DialogHeader className="mb-6">
                    <div className="flex justify-between items-center">
                    <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                        <User className="text-primary" />
                        Customer Profile
                    </DialogTitle>
                    <Button type="button" onClick={onClose} variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-700 dark:hover:text-white">
                        <X size={24} />
                    </Button>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-xs text-muted-foreground">Customer ID</div>
                        <div className="font-semibold text-foreground">CUS-{String(customer.customer_id).padStart(4, '0')}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-xs text-muted-foreground">Points Balance</div>
                        <div className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                            <Award size={16} /> {customer.loyalty_points_balance}
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="text-xs text-muted-foreground">Total Spend</div>
                        <div className="font-semibold text-foreground">{customer.total_spend_to_date.toFixed(2)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <User size={16} /> Details
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><User size={14} /> {customer.name}</div>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Phone size={14} /> {customer.phone}</div>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail size={14} /> {customer.email || '-'}</div>
                        </div>
                    </div>

                    <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Award size={16} /> Points History
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
                            {pointsHistory?.map((p: any) => (
                                <div key={p.id} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                    <span className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        {new Date(p.timestamp || p.createdAt).toLocaleString()}
                                    </span>
                                    <span className={p.points >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {p.points >= 0 ? '+' : ''}{p.points}
                                    </span>
                                </div>
                            ))}
                            {pointsHistory?.length === 0 && (
                                <div className="text-gray-500">No points history</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-card text-card-foreground border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Receipt size={16} /> Bills & Sales History
                    </h3>
                    <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="py-2 text-left">Bill #</th>
                                    <th className="py-2 text-left">Date</th>
                                    <th className="py-2 text-right">Items</th>
                                    <th className="py-2 text-right">Tax</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {transactions?.map((t: any) => (
                                    <tr key={t.id} className="text-gray-700 dark:text-gray-300">
                                        <td className="py-2">#{t.id}</td>
                                        <td className="py-2">{new Date(t.createdAt || t.timestamp).toLocaleString()}</td>
                                        <td className="py-2 text-right">{transactionItemsMap.get(t.id)?.count || 0}</td>
                                        <td className="py-2 text-right">{(t.tax || t.tax_amount || 0).toFixed(2)}</td>
                                        <td className="py-2 text-right font-semibold text-foreground">{(t.total || t.total_amount || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactions?.length === 0 && (
                            <div className="text-gray-500 text-sm py-4">No sales history</div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
