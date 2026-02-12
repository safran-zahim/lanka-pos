import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Plus, Package, Tag, Scale, FolderTree, History, PlusCircle, Edit } from 'lucide-react';
import { AddProductModal } from '../../components/admin/AddProductModal';
import { AddStockModal } from '../../components/admin/AddStockModal';
import { EditProductModal } from '../../components/admin/EditProductModal';
import { useCurrency } from '../../hooks/useCurrency';
import { BrandManager } from '../../components/admin/settings/BrandManager';
import { UnitManager } from '../../components/admin/settings/UnitManager';
import { CategoryManagerPanel } from '../../components/admin/settings/CategoryManagerPanel';
import { DataTable, type Column } from '../../components/ui/DataTable';
import type { Product } from '../../db/db';
import { BulkUploadModal } from '../../components/shared/BulkUploadModal';
import { Upload } from 'lucide-react';

export const ProductList = () => {
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [addStockProduct, setAddStockProduct] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands' | 'units'>('products');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const { formatCurrency } = useCurrency();

    // Use Dexie Live Query
    const products = useLiveQuery(() => db.products.toArray()) || [];
    const [loading] = useState(false); // Local DB is fast, loading is usually not needed but kept for UI compatibility

    // Use filtering on fetched products
    const filteredProducts = products.filter(product => {
        const search = searchTerm.toLowerCase();
        const name = (product?.name || '').toLowerCase();
        const sku_code = (product?.sku_code || '').toLowerCase();

        return name.includes(search) ||
            sku_code.includes(search);
    });

    const tabs = [
        { id: 'products', label: 'Products', icon: <Package size={18} /> },
        { id: 'categories', label: 'Categories', icon: <FolderTree size={18} /> },
        { id: 'brands', label: 'Brands', icon: <Tag size={18} /> },
        { id: 'units', label: 'Units', icon: <Scale size={18} /> },
    ] as const;

    const columns: Column<Product>[] = [
        {
            accessorKey: 'sku_code',
            header: 'SKU',
            cell: (row: any) => <span className="font-mono text-sm">{row.sku_code}</span>,
            sortable: true
        },
        {
            accessorKey: 'name',
            header: 'Name',
            sortable: true
        },
        {
            header: 'Category',
            cell: (row: any) => (
                <div>
                    <div>{row.category?.name || row.category_id || (row.categoryName || 'Uncategorized')}</div>
                    {row.subCategory?.name && (
                        <span className="text-gray-400 text-xs block dark:text-gray-500">
                            {row.subCategory.name}
                        </span>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'retail_price',
            header: 'Price',
            cell: (row: any) => <span className="font-semibold">{formatCurrency(Number(row.retail_price || 0))}</span>,
            sortable: true
        },
        {
            accessorKey: 'stock_quantity',
            header: 'Stock',
            cell: (row: any) => {
                const stock = row.stock_quantity || 0;
                const reorder = row.alert_quantity || row.reorder_level || 0;
                const unit = row.unit_id || '';

                return (
                    <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${stock <= reorder
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            }`}>
                            {stock} {unit}
                        </span>
                    </div>
                );
            },
            sortable: true
        },
        {
            header: 'Actions',
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setAddStockProduct(row);
                        }}
                        className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title="Add Stock / New Batch"
                    >
                        <PlusCircle size={18} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/products/${row.product_id}/history`);
                        }}
                        className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                        title="Price History & Batches"
                    >
                        <History size={18} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(row);
                        }}
                        className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        title="Edit Product Details"
                    >
                        <Edit size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Package className="text-blue-600" />
                    Products
                </h1>
                <div className="flex gap-3">
                    {activeTab === 'products' && (
                        <>
                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Upload size={20} />
                                Bulk Import
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                            >
                                <Plus size={20} />
                                Add Product
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
            {activeTab === 'products' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <DataTable
                        data={filteredProducts}
                        columns={columns}
                        isLoading={loading}
                        pagination
                        searchable
                        onSearch={setSearchTerm}
                        keyField="product_id"
                    />
                </div>
            )}

            {activeTab === 'brands' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="space-y-1 mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Brand Library</h2>
                        <p className="text-gray-500 dark:text-gray-400">Manage your product brands and manufacturers</p>
                    </div>
                    <BrandManager />
                </div>
            )}

            {activeTab === 'units' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="space-y-1 mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Unit Definitions</h2>
                        <p className="text-gray-500 dark:text-gray-400">Configure units of measurement (kg, pc, ltr, etc)</p>
                    </div>
                    <UnitManager />
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="space-y-1 mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Categories</h2>
                        <p className="text-gray-500 dark:text-gray-400">Organize your inventory catalog</p>
                    </div>
                    <CategoryManagerPanel />
                </div>
            )}

            {activeTab === 'products' && isAddModalOpen && (
                <AddProductModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => { }}
                />
            )}

            {activeTab === 'products' && editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSuccess={() => { }}
                />
            )}

            {activeTab === 'products' && addStockProduct && (
                <AddStockModal
                    product={addStockProduct}
                    onClose={() => setAddStockProduct(null)}
                    onSuccess={() => { }}
                />
            )}

            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                type="products"
                onSuccess={() => { /* useLiveQuery handles updates */ }}
            />
        </div>
    );
};
