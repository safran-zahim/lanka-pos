import { useState } from 'react';
import { Plus, Search, Edit, Package, Tag, Scale, FolderTree } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { AddProductModal } from '../../components/admin/AddProductModal';
// import { PurchaseModal } from '../../components/admin/PurchaseModal'; // Removed
import { EditProductModal } from '../../components/admin/EditProductModal';
import type { Product } from '../../db/db';
import { useCurrency } from '../../hooks/useCurrency';
import { BrandManager } from '../../components/admin/settings/BrandManager';
import { UnitManager } from '../../components/admin/settings/UnitManager';
import { CategoryManagerPanel } from '../../components/admin/settings/CategoryManagerPanel';

export const ProductList = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false); // Removed
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands' | 'units'>('products');
    const { formatCurrency } = useCurrency();

    const products = useLiveQuery(() => db.products.toArray());

    const filteredProducts = products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'products', label: 'Products', icon: <Package size={18} /> },
        { id: 'categories', label: 'Categories', icon: <FolderTree size={18} /> },
        { id: 'brands', label: 'Brands', icon: <Tag size={18} /> },
        { id: 'units', label: 'Units', icon: <Scale size={18} /> },
    ] as const;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Package className="text-blue-600" />
                    Products
                </h1>
                {activeTab === 'products' && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Product
                    </button>
                )}
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
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold tracking-wider border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-lg">SKU</th>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">Stock</th>
                                    <th className="px-6 py-4 rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts?.map((product) => (
                                    <tr
                                        key={product.product_id}
                                        onClick={() => setEditingProduct(product)}
                                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 font-mono text-sm">{product.sku_code}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                                        <td className="px-6 py-4">
                                            {product.category_id}
                                            {product.sub_category_id && (
                                                <span className="text-gray-400 text-xs block dark:text-gray-500">
                                                    {product.sub_category_id}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold">{formatCurrency(product.retail_price)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock_quantity <= product.reorder_level
                                                ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                                : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                                }`}>
                                                {product.stock_quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                                <Edit size={16} />
                                                <span className="text-xs">Click to edit</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
        </div>
    );
};
