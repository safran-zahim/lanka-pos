import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Plus, Package, Tag, Scale, FolderTree, History, Edit, Eye, EyeOff } from 'lucide-react';
import { AddProductModal } from '../../components/admin/AddProductModal';
import { useCurrency } from '../../hooks/useCurrency';
import { BrandManager } from '../../components/admin/settings/BrandManager';
import { UnitManager } from '../../components/admin/settings/UnitManager';
import { CategoryManagerPanel } from '../../components/admin/settings/CategoryManagerPanel';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { db, type Product } from '../../db/db';
import { BulkUploadModal } from '../../components/shared/BulkUploadModal';
import { Upload } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../store/useToast';
import { getApiUrl } from '../../config/api';

export const ProductList = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands' | 'units'>('products');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const { formatCurrency } = useCurrency();
    const token = useAuthStore((state) => state.token);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingProductId, setTogglingProductId] = useState<string | number | null>(null);
    const [showInactive, setShowInactive] = useState(false);

    const loadProducts = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(getApiUrl('/products?showInactive=true'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load products');
            const payload = await response.json();
            const mapped = (payload || []).map((product: any): Product => ({
                product_id: product.id,
                sku_code: product.skuCode || '',
                name: product.name,
                description: product.description || '',
                category_id: product.categoryId ?? product.category_id ?? '',
                brand_id: product.brandId ?? product.brand_id ?? '',
                unit_id: product.unitId ?? product.unit_id ?? '',
                sub_category_id: product.subCategoryId ?? product.sub_category_id ?? '',
                cost_price: Number(product.costPrice || 0),
                retail_price: Number(product.retailPrice ?? product.price ?? 0),
                stock_quantity: Number(product.stock || 0),
                alert_quantity: Number(product.reorderLevel || 0),
                manage_stock: true,
                barcode: product.barcode || '',
                barcode_type: product.barcodeType || '',
                image: undefined,
                tax_type: undefined,
                tax_amount: undefined,
                business_locations: [],
                reorder_level: Number(product.reorderLevel || 0),
                has_purchase: Boolean(product.hasPurchase),
                isActive: product.isActive !== false,
                categoryRel: product.categoryRel,
                subCategory: product.subCategory,
                unit: product.unit
            }));
            setProducts(mapped);
            try {
                await db.products.bulkPut(mapped);
            } catch (error) {
                console.error('Failed to sync products to local storage', error);
            }
        } catch (error) {
            console.error('Failed to load products', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [token]);

    const toggleProductStatus = async (product: Product) => {
        if (!product.product_id) return;
        if (!token) {
            addToast('Missing auth token', 'error');
            return;
        }

        setTogglingProductId(product.product_id);
        try {
            const response = await fetch(getApiUrl(`/products/${product.product_id}/toggle-status`), {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = `Failed to update: ${response.status} ${response.statusText}`;
                try {
                    const errorPayload = await response.json();
                    if (typeof errorPayload?.error === 'string') {
                        errorMessage = errorPayload.error;
                    } else if (typeof errorPayload?.message === 'string') {
                        // Sometimes error might be under 'message'
                        errorMessage = errorPayload.message;
                    }
                } catch {
                    // Ignore JSON parse errors, keep the status code message
                    console.warn('Failed to parse error response JSON');
                }

                // Add URL for debugging if it's a 404
                if (response.status === 404) {
                    errorMessage += ` (${response.url})`;
                }

                throw new Error(errorMessage);
            }

            const updatedProduct = await response.json();
            const statusMessage = updatedProduct.isActive
                ? `Product "${product.name}" is now active`
                : `Product "${product.name}" is now inactive`;

            addToast(statusMessage, 'success');

            // Reload products to get updated status
            await loadProducts();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update product status';
            console.error('Failed to toggle product status', error);
            addToast(message, 'error');
        } finally {
            setTogglingProductId(null);
        }
    };

    const getRowClassName = (product: Product): string => {
        if (product.isActive === false) {
            return 'bg-gray-50 dark:bg-gray-700/30 opacity-60';
        }
        return '';
    };

    // Use filtering on fetched products
    const filteredProducts = products.filter(product => {
        const search = searchTerm.toLowerCase();
        const name = (product?.name || '').toLowerCase();
        const sku_code = (product?.sku_code || '').toLowerCase();

        const matchesSearch = name.includes(search) || sku_code.includes(search);
        const matchesStatus = showInactive || product.isActive !== false;

        return matchesSearch && matchesStatus;
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
            cell: (row: any) => (
                <div className="flex items-center gap-2">
                    <span className={row.isActive === false ? 'text-gray-400 line-through' : ''}>
                        {row.name}
                    </span>
                    {row.isActive === false && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold rounded">
                            Inactive
                        </span>
                    )}
                </div>
            ),
            sortable: true
        },
        {
            accessorKey: 'barcode',
            header: 'Barcode',
            cell: (row: any) => (
                <div className="flex flex-col">
                    {row.barcode ? (
                        <>
                            <span className="font-mono text-sm">{row.barcode}</span>
                            {row.barcode_type ? (
                                <span className="text-xs text-gray-500 dark:text-gray-400">{row.barcode_type}</span>
                            ) : (
                                <span className="text-xs text-gray-400">Type unknown</span>
                            )}
                        </>
                    ) : (
                        <span className="text-gray-400 text-xs">—</span>
                    )}
                </div>
            ),
            sortable: true
        },
        {
            header: 'Category',
            cell: (row: any) => (
                <div>
                    <div>{row.categoryRel?.name || row.category_id || (row.categoryName || 'Uncategorized')}</div>
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
            cell: (row: any) => {
                if (row.has_purchase === false) {
                    return <span className="text-gray-400 text-xs">Not set</span>;
                }
                return <span className="font-semibold">{formatCurrency(Number(row.retail_price || 0))}</span>;
            },
            sortable: true
        },
        {
            accessorKey: 'stock_quantity',
            header: 'Stock',
            cell: (row: any) => {
                if (row.has_purchase === false) {
                    return <span className="text-gray-400 text-xs">Not set</span>;
                }
                const stock = row.stock_quantity || 0;
                const reorder = row.alert_quantity || row.reorder_level || 0;
                const unitShortName = row.unit?.shortName || row.unit?.short_name || '';

                return (
                    <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${stock <= reorder
                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                            }`}>
                            {stock} {unitShortName}
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
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleProductStatus(row);
                        }}
                        disabled={togglingProductId === row.product_id}
                        className={`p-2 rounded-lg transition-colors ${row.isActive === false
                                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                                : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={row.isActive === false ? 'Mark as Active' : 'Mark as Inactive'}
                    >
                        {togglingProductId === row.product_id ? (
                            <div className="animate-spin"><Package size={18} /></div>
                        ) : row.isActive === false ? (
                            <EyeOff size={18} />
                        ) : (
                            <Eye size={18} />
                        )}
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
                    <div className="mb-4 flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showInactive"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="showInactive" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                            Show inactive products
                        </label>
                    </div>
                    <DataTable
                        data={filteredProducts}
                        columns={columns}
                        isLoading={loading}
                        pagination
                        searchable
                        onSearch={setSearchTerm}
                        keyField="product_id"
                        onRowClick={(row) => navigate(`/admin/products/${row.product_id}/history`)}
                        getRowClassName={getRowClassName}
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
                    onSuccess={loadProducts}
                />
            )}

            {activeTab === 'products' && editingProduct && (
                <AddProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSuccess={loadProducts}
                />
            )}

            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                type="products"
                onSuccess={loadProducts}
            />
        </div>
    );
};
