import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Truck, Edit2, Trash2, Eye } from 'lucide-react';
import { useToast } from '../../store/useToast';
import { DataTable } from '../ui/DataTable';
import { AddSupplierModal } from './AddSupplierModal';
import { BulkUploadModal } from '../shared/BulkUploadModal';
import { getApiUrl } from '../../config/api';

export const SupplierManager = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            const response = await fetch(getApiUrl('/suppliers'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch suppliers');
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            addToast('Failed to load suppliers', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this supplier?')) {
            try {
                const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                const response = await fetch(getApiUrl(`/suppliers/${id}`), {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to delete supplier');

                addToast('Supplier deleted successfully', 'success');
                fetchSuppliers();
            } catch (error) {
                console.error('Error deleting supplier:', error);
                addToast('Failed to delete supplier', 'error');
            }
        }
    };

    const handleEdit = (supplier: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSupplier(supplier);
        setIsAddModalOpen(true);
    };

    const columns = [
        {
            header: 'Name',
            accessorKey: 'name' as keyof any,
            cell: (row: any) => (
                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Truck size={16} className="text-gray-400" />
                    {row.name}
                </div>
            ),
            sortable: true
        },
        {
            header: 'Contact Person',
            accessorKey: 'contactPerson' as keyof any,
            sortable: true
        },
        {
            header: 'Phone',
            accessorKey: 'phone' as keyof any,
        },
        {
            header: 'Email',
            accessorKey: 'email' as keyof any,
        },
        {
            header: 'Purchases',
            accessorKey: 'purchaseCount' as keyof any,
            cell: (row: any) => (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                    {row._count?.purchases || 0} Orders
                </span>
            )
        },
        {
            header: 'Actions',
            cell: (row: any) => (
                <div className="flex gap-2">
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Supplier Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your suppliers and purchase relationships</p>
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
                        onClick={() => {
                            setEditingSupplier(null);
                            setIsAddModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                    >
                        <Plus size={20} />
                        Add Supplier
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading suppliers...</div>
            ) : (
                <DataTable
                    data={suppliers}
                    columns={columns}
                    keyField="id"
                    enableSelection
                    onRowClick={(row) => navigate(`/admin/suppliers/${row.id}`)}
                />
            )}

            <AddSupplierModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchSuppliers}
                supplier={editingSupplier}
            />

            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                type="customers" // TODO: Add 'suppliers' support
            />
        </div>
    );
};
