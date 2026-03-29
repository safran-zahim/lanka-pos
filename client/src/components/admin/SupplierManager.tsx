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
    const addToast = useToast((state) => state.addToast);
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
                <div className="font-medium text-foreground flex items-center gap-2">
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
                        className="p-1.5 text-primary hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
        <div className="p-10 max-w-[1700px] mx-auto space-y-10">
            <div className="flex justify-between items-end border-b border-border/50 pb-10">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter italic uppercase mb-2">Supplier Network</h1>
                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">Supply Chain Management & Procurement Relations</p>
                </div>
                <div className="flex gap-5">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="bg-muted hover:bg-muted/80 text-foreground px-8 py-4 rounded-xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest border border-border shadow-inner"
                    >
                        <Upload size={18} />
                        Bulk Injection
                    </button>
                    <button
                        onClick={() => {
                            setEditingSupplier(null);
                            setIsAddModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 active:scale-95"
                    >
                        <Plus size={20} />
                        Register Creator
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-xs font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Synchronizing Supply Chain...</p>
                </div>
            ) : (
                <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-2xl animate-in fade-in duration-700">
                    <DataTable
                        data={suppliers}
                        columns={columns}
                        keyField="id"
                        enableSelection
                        onRowClick={(row) => navigate(`/admin/suppliers/${row.id}`)}
                    />
                </div>
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
