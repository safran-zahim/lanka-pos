import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { History, TrendingUp, TrendingDown, Package, ArrowLeft, Tag, Barcode, FolderTree, AlertCircle } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';

import { APP_CONFIG } from '../../config/appConfig';
import { Button } from '../../components/ui/Button';

type ProductDetails = {
    id: number;
    name: string;
    skuCode: string;
    barcode?: string;
    barcodeType?: string;
    description?: string;
    categoryRel?: { id: number; name: string };
    subCategory?: { id: number; name: string };
    brand?: { id: number; name: string };
    unit?: { id: number; name: string; shortName: string; allowDecimal: boolean };
    reorderLevel: number;
    stats: {
        currentStock: number;
        currentCost: number;
        currentRetail: number;
        totalSold: number;
        totalRevenue: number;
        currentMargin: number;
        recentSales: Array<{ date: string; quantity: number; price: number }>;
    };
};

type ProductSummary = {
    name: string;
    sku_code: string;
    unit_id: string;
    stock_quantity: number;
    cost_price: number;
    retail_price: number;
};

export const ProductHistoryPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const productId = parseInt(id || '0');
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();
    const token = useAuthStore((state) => state.token);

    const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
    const [batches, setBatches] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token || !Number.isFinite(productId) || productId <= 0) return;
        let isMounted = true;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [productResponse, batchResponse] = await Promise.all([
                    fetch(getApiUrl(`/products/${productId}`), {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    fetch(getApiUrl(`/products/${productId}/batches`), {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (!productResponse.ok) {
                    throw new Error('Failed to load product details');
                }

                const productPayload = await productResponse.json();
                const batchPayload = batchResponse.ok ? await batchResponse.json() : [];

                if (isMounted) {
                    setProductDetails(productPayload);
                    setBatches(batchPayload || []);
                }
            } catch (error) {
                console.error('Failed to load product history', error);
                if (isMounted) {
                    setProductDetails(null);
                    setBatches([]);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [token, productId]);

    if (isLoading || !productDetails) {
        return (
            <div className="p-8 flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const product = productDetails;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="px-2 py-2"
                        onClick={() => navigate('/admin/products')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="p-3 bg-primary/20 text-primary rounded-xl">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                        <p className="text-muted-foreground">Product ID: {product.id}</p>
                    </div>
                </div>
            </div>

            {/* Product Details Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4">Product Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <Tag size={16} className="text-gray-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">SKU Code</p>
                                    <p className="text-sm font-semibold text-foreground font-mono">{product.skuCode || 'N/A'}</p>
                                </div>
                            </div>
                            {product.barcode && (
                                <div className="flex items-start gap-2">
                                    <Barcode size={16} className="text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Barcode</p>
                                        <p className="text-sm font-semibold text-foreground font-mono">{product.barcode}</p>
                                        {product.barcodeType && <p className="text-xs text-gray-500">{product.barcodeType}</p>}
                                    </div>
                                </div>
                            )}
                            {product.unit && (
                                <div className="flex items-start gap-2">
                                    <Package size={16} className="text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Unit</p>
                                        <p className="text-sm font-semibold text-foreground">{product.unit.name} ({product.unit.shortName})</p>
                                        <p className="text-xs text-gray-500">Accepts Decimals: {product.unit.allowDecimal ? '✓ Yes' : '✗ No'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            {product.categoryRel && (
                                <div className="flex items-start gap-2">
                                    <FolderTree size={16} className="text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Category</p>
                                        <p className="text-sm font-semibold text-foreground">{product.categoryRel.name}</p>
                                    </div>
                                </div>
                            )}
                            {product.subCategory && (
                                <div className="flex items-start gap-2">
                                    <FolderTree size={16} className="text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Sub-Category</p>
                                        <p className="text-sm font-semibold text-foreground">{product.subCategory.name}</p>
                                    </div>
                                </div>
                            )}
                            {product.brand && (
                                <div className="flex items-start gap-2">
                                    <Tag size={16} className="text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Brand</p>
                                        <p className="text-sm font-semibold text-foreground">{product.brand.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {product.description && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Description</p>
                            <p className="text-sm text-foreground">{product.description}</p>
                        </div>
                    )}
                </div>

                {/* Stats Card */}
                <div className="bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-blue-100 dark:to-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/30 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4">Stock Status</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Current Stock</p>
                            <p className="text-3xl font-bold text-primary">
                                {product.stats.currentStock} 
                                <span className="text-sm ml-1">{product.unit?.shortName || ''}</span>
                            </p>
                        </div>
                        {product.reorderLevel > 0 && (
                            <div className={product.stats.currentStock <= product.reorderLevel ? 'p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-900' : ''}>
                                <p className="text-xs text-muted-foreground">Reorder Level</p>
                                <p className={`text-sm font-semibold ${product.stats.currentStock <= product.reorderLevel ? 'text-destructive' : 'text-foreground'}`}>
                                    {product.reorderLevel} {product.unit?.shortName || ''}
                                    {product.stats.currentStock <= product.reorderLevel && <span className="ml-2">⚠️ Low Stock!</span>}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm">
                    <p className="text-sm text-muted-foreground font-medium">Total Units Sold</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{product.stats.totalSold}</p>
                </div>
                <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm">
                    <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-success mt-2">{formatCurrency(product.stats.totalRevenue)}</p>
                </div>
                <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm">
                    <p className="text-sm text-muted-foreground font-medium">Purchase Batches</p>
                    <p className="text-3xl font-bold text-primary mt-2">{batches?.length || 0}</p>
                </div>
            </div>

            {/* Content */}
            <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/50">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Package size={20} className="text-primary" />
                        Purchase Batches & Price Trends
                    </h3>
                </div>

                <div className="p-6">
                    {!batches ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-20 bg-muted/50 rounded-2xl border-2 border-dashed border-border">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-muted-foreground font-medium">No purchase history found for this product.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <div>Date</div>
                                <div>Status</div>
                                <div>Cost Price</div>
                                <div>Selling Price</div>
                                <div className="text-center">Remaining Stock</div>
                                <div>Note</div>
                            </div>

                            {batches.map((batch, index) => {
                                const prevBatch = batches[index + 1];
                                const isCostUp = prevBatch && batch.cost_price > prevBatch.cost_price;
                                const isCostDown = prevBatch && batch.cost_price < prevBatch.cost_price;
                                const isRetailUp = prevBatch && batch.retail_price > prevBatch.retail_price;
                                const isRetailDown = prevBatch && batch.retail_price < prevBatch.retail_price;

                                return (
                                    <div
                                        key={batch.batch_id}
                                        className={`grid grid-cols-1 md:grid-cols-6 gap-4 p-4 rounded-xl border transition-all ${batch.quantity > 0
                                            ? 'bg-card text-card-foreground border-border shadow-sm'
                                            : 'bg-muted/50 border-border opacity-60'
                                            }`}
                                    >
                                        <div className="text-sm font-medium text-foreground">
                                            {formatDateTime(new Date(batch.created_at))}
                                        </div>

                                        <div className="flex items-center">
                                            {batch.quantity > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase">Active</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-muted-foreground uppercase">Sold Out</span>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-1 font-bold text-foreground">
                                                {formatCurrency(batch.cost_price)}
                                                {isCostUp && <TrendingUp size={14} className="text-red-500" />}
                                                {isCostDown && <TrendingDown size={14} className="text-green-500" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500">Stock In Cost</p>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-1 font-bold text-foreground">
                                                {formatCurrency(batch.retail_price)}
                                                {isRetailUp && <TrendingUp size={14} className="text-green-500" />}
                                                {isRetailDown && <TrendingDown size={14} className="text-red-500" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500">Customer Price</p>
                                        </div>

                                        <div className="text-center font-mono font-bold text-primary text-lg">
                                            {batch.quantity}
                                        </div>

                                        <div className="text-xs text-muted-foreground italic">
                                            {batch.note || '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <div className="text-center text-xs text-gray-400 mt-8">
                Powered by {APP_CONFIG.appName} - {APP_CONFIG.company.supportPhone}
            </div>

        </div>
    );
};
