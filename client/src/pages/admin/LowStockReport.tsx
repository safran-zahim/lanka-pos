import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LowStockReport = () => {
    const navigate = useNavigate();
    const [filterBrand, setFilterBrand] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [alertEdits, setAlertEdits] = useState<Record<number, string>>({});

    const products = useLiveQuery(() => db.products.toArray());
    const brands = useLiveQuery(() => db.brands.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    if (!products) return <div>Loading...</div>;

    const getAlertLevel = (product: typeof products[number]) => {
        const raw = product.alert_quantity;
        if (typeof raw === 'number' && raw > 0) {
            return raw;
        }
        return product.reorder_level ?? 0;
    };

    // Filter for low stock items
    // Logic: stock_quantity <= alert_quantity
    // Also apply brand/category filters
    const lowStockItems = products.filter(p => {
        const alertLevel = getAlertLevel(p);
        const isManaged = p.manage_stock !== false;
        const isLowStock = isManaged && (p.stock_quantity <= alertLevel);
        const matchesBrand = filterBrand ? p.brand_id === filterBrand : true;
        const matchesCategory = filterCategory ? p.category_id === filterCategory : true;
        return isLowStock && matchesBrand && matchesCategory;
    });

    const handleAlertChange = (productId: number, value: string) => {
        setAlertEdits(prev => ({ ...prev, [productId]: value }));
    };

    const persistAlertQuantity = async (productId: number, currentValue: number) => {
        const raw = alertEdits[productId];
        if (raw === undefined) return;
        const parsed = Number(raw);
        const nextValue = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : currentValue;
        await db.products.update(productId, {
            alert_quantity: nextValue,
            reorder_level: nextValue,
            manage_stock: true
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" />
                        Low Stock Report
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Items that have fallen below their alert quantity level.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/admin/purchases')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <ShoppingCart size={18} />
                        Create Purchase Order
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg"
                    >
                        Print/Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex gap-4">
                <select
                    className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={filterBrand}
                    onChange={e => setFilterBrand(e.target.value)}
                >
                    <option value="">All Brands</option>
                    {brands?.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
                <select
                    className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories?.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4">Product Name</th>
                            <th className="p-4">SKU</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Brand</th>
                            <th className="p-4 text-center">Current Stock</th>
                            <th className="p-4 text-center">Alert Level</th>
                            <th className="p-4 text-center">Deficit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {lowStockItems.map(item => {
                            const alertLevel = getAlertLevel(item);
                            const deficit = alertLevel - item.stock_quantity;
                            const editValue = alertEdits[item.product_id!] ?? String(alertLevel);
                            return (
                                <tr key={item.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{item.sku_code}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{item.category_id}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{item.brand_id || '-'}</td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                            {item.stock_quantity}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-20 text-center bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                                            value={editValue}
                                            onChange={(e) => handleAlertChange(item.product_id!, e.target.value)}
                                            onBlur={() => persistAlertQuantity(item.product_id!, alertLevel)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    (e.target as HTMLInputElement).blur();
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="p-4 text-center font-bold text-red-600 dark:text-red-400">-{deficit > 0 ? deficit : 0}</td>
                                </tr>
                            );
                        })}
                        {lowStockItems.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package size={32} className="text-green-500" />
                                        <span className="font-medium">All stock levels are healthy!</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
