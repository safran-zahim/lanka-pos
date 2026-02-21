import { useState, useEffect } from 'react';
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';

export const LowStockReport = () => {
    const navigate = useNavigate();
    const [filterBrand, setFilterBrand] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [alertEdits, setAlertEdits] = useState<Record<number, string>>({});
    const token = useAuthStore((state) => state.token);

    const [products, setProducts] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [productsRes, brandsRes, categoriesRes] = await Promise.all([
                    fetch(getApiUrl('/products/low-stock'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/brands'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/categories'), { headers: { Authorization: `Bearer ${token}` } })
                ]);
                if (productsRes.ok) setProducts(await productsRes.json());
                else setError('Failed to load low-stock products');
                if (brandsRes.ok) setBrands(await brandsRes.json());
                if (categoriesRes.ok) setCategories(await categoriesRes.json());
            } catch (error) {
                console.error('Failed to load data', error);
                setError('Failed to fetch data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [token]);

    if (isLoading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    const getAlertLevel = (product: any): number => {
        const raw = product.alertQuantity ?? product.alert_quantity;
        if (typeof raw === 'number' && !isNaN(raw)) {
            return raw;
        }
        return Number(product.reorderLevel ?? product.reorder_level ?? 0);
    };

    // Filter for low stock items - already filtered by API, but apply brand/category filters
    const lowStockItems = products.filter(p => {
        const brandName = p.brand?.name || p.brand_name;
        const categoryName = p.category?.name || p.category_name;
        const matchesBrand = filterBrand ? brandName === filterBrand : true;
        const matchesCategory = filterCategory ? categoryName === filterCategory : true;

        const alertLevel = Number(getAlertLevel(p));
        const stock = Number(p.stock ?? p.stock_quantity ?? 0);

        return matchesBrand && matchesCategory && stock <= alertLevel;
    });

    const handleAlertChange = (productId: number, value: string) => {
        setAlertEdits(prev => ({ ...prev, [productId]: value }));
    };

    const persistAlertQuantity = async (productId: number, currentValue: number) => {
        const raw = alertEdits[productId];
        if (raw === undefined || !token) return;
        const parsed = Number(raw);
        const nextValue = Number.isFinite(parsed) ? Math.max(0, parsed) : currentValue;
        await fetch(getApiUrl(`/products/${productId}`), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                alertQuantity: nextValue,
                reorderLevel: nextValue,
                manageStock: true
            })
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
                    {brands?.map(b => <option key={b.id || b.brand_id} value={b.name}>{b.name}</option>)}
                </select>
                <select
                    className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories?.map(c => <option key={c.id || c.category_id} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4">Product Name</th>
                            <th className="p-4">SKU</th>
                            <th className="p-4">Barcode</th>
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
                            const stock = item.stock ?? item.stock_quantity ?? 0;
                            const deficit = alertLevel - stock;
                            const pId = item.id || item.product_id;
                            const editValue = alertEdits[pId] ?? String(alertLevel);
                            return (
                                <tr key={pId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <span>{item.name}</span>
                                            {!item.isActive && !item.is_active && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                    INACTIVE
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{item.skuCode || item.sku_code}</td>
                                    <td className="p-4">
                                        {item.barcode ? (
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm text-gray-900 dark:text-white">{item.barcode}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{item.barcodeType}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{item.category?.name || item.category_name || '-'}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{item.brand?.name || item.brand_name || '-'}</td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                            {stock}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-20 text-center bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 px-2 py-1"
                                            value={editValue}
                                            onChange={(e) => handleAlertChange(pId, e.target.value)}
                                            onBlur={() => persistAlertQuantity(pId, alertLevel)}
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
                                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
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
