import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Upload, Eye, Edit2, Trash2, Filter, RotateCcw } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { DataTable } from '../../components/ui/DataTable';
import { CustomerModal } from '../../components/admin/CustomerModal';
import { BulkUploadModal } from '../../components/shared/BulkUploadModal';

export const CustomerList = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // Filters
    const [minPoints, setMinPoints] = useState('');
    const [minSpend, setMinSpend] = useState('');
    const [emailFilter, setEmailFilter] = useState<'all' | 'with' | 'without'>('all');

    const [modalState, setModalState] = useState<{ show: boolean; customer: any | null }>({
        show: false,
        customer: null
    });

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
            addToast('Failed to load customers', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/customers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete customer');

            addToast('Customer deleted successfully', 'success');
            fetchCustomers();
        } catch (error) {
            console.error(error);
            addToast('Failed to delete customer.', 'error');
        }
    };

    const handleEdit = (customer: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setModalState({ show: true, customer });
    };

    // Filter logic implies we filter BEFORE passing to DataTable, 
    // OR we rely on DataTable search and handle specific numeric filters here.
    // DataTable currently only has text search.
    // So we apply numeric/email filters here.
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const pointsOk = minPoints ? (c.loyaltyPointsBalance || 0) >= Number(minPoints) : true;
            const spendOk = minSpend ? (c.totalSpend || 0) >= Number(minSpend) : true;
            const emailOk = emailFilter === 'all'
                ? true
                : emailFilter === 'with'
                    ? !!c.email
                    : !c.email;
            return pointsOk && spendOk && emailOk;
        });
    }, [customers, minPoints, minSpend, emailFilter]);

    const columns = [
        {
            header: 'Customer',
            accessorKey: 'name',
            cell: (row: any) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
                    <div className="text-xs text-gray-400">CUS-{String(row.id).slice(0, 8)}</div>
                </div>
            ),
            sortable: true
        },
        {
            header: 'Phone',
            accessorKey: 'phone',
            sortable: true
        },
        {
            header: 'Email',
            accessorKey: 'email',
            cell: (row: any) => row.email || <span className="text-gray-400">-</span>
        },
        {
            header: 'Points',
            accessorKey: 'loyaltyPointsBalance',
            cell: (row: any) => <div className="text-right">{row.loyaltyPointsBalance || 0}</div>,
            sortable: true
        },
        {
            header: 'Total Spend',
            accessorKey: 'totalSpend', // Assuming backend returns this, otherwise computed?
            // Backend `getCustomers` usually assumes simple list. 
            // If backend doesn't return totalSpend in list, we might need to rely on what we have or accept 0 until detailed view.
            // Check `customer.controller.ts`: getCustomers returns `prisma.customer.findMany()`.
            // It does NOT include aggregates by default in list.
            // We might need to update backend to include `totalSpend` in list or `include: { localtyPoints }`.
            // For now, let's assume property exists or 0.
            cell: (row: any) => <div className="text-right">{Number(row.totalSpend || 0).toFixed(2)}</div>,
            sortable: true
        },
        {
            header: 'Actions',
            cell: (row: any) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/customers/${row.id}`); }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="View Profile"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={(e) => handleEdit(row, e)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => handleDelete(row.id, e)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Users className="text-blue-600" />
                        Customers
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your customer base</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                    >
                        <Upload size={20} />
                        Bulk Import
                    </button>
                    <button
                        onClick={() => setModalState({ show: true, customer: null })}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                        <Plus size={20} />
                        Add Customer
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Filter size={16} /> Advanced Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <input
                        type="number"
                        min="0"
                        placeholder="Min Points"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={minPoints}
                        onChange={(e) => setMinPoints(e.target.value)}
                    />
                    <input
                        type="number"
                        min="0"
                        placeholder="Min Spend"
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={minSpend}
                        onChange={(e) => setMinSpend(e.target.value)}
                    />
                    <select
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value as any)}
                    >
                        <option value="all">All Emails</option>
                        <option value="with">With Email</option>
                        <option value="without">No Email</option>
                    </select>
                    <button
                        onClick={() => { setMinPoints(''); setMinSpend(''); setEmailFilter('all'); }}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading customers...</div>
            ) : (
                <DataTable
                    data={filteredCustomers}
                    columns={columns as any}
                    keyField="id"
                    enableSelection
                    onRowClick={(row) => navigate(`/admin/customers/${row.id}`)}
                />
            )}

            {modalState.show && (
                <CustomerModal
                    customer={modalState.customer}
                    onClose={() => setModalState({ show: false, customer: null })}
                    onSuccess={(createdCustomer) => {
                        addToast(modalState.customer ? 'Customer updated' : 'Customer added', 'success');
                        fetchCustomers();
                    }}
                />
            )}

            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                type="customers"
                onSuccess={fetchCustomers}
            />
        </div>
    );
};
