import { useNavigate, useParams } from 'react-router-dom';
import { History, TrendingUp, TrendingDown, Package, ArrowLeft } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useCurrency } from '../../hooks/useCurrency';
import { useLocale } from '../../hooks/useLocale';

import { APP_CONFIG } from '../../config/appConfig';

export const ProductHistoryPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const productId = parseInt(id || '0');
    const { formatCurrency } = useCurrency();
    const { formatDateTime } = useLocale();

    const product = useLiveQuery(() => db.products.get(productId), [productId]);
    const batches = useLiveQuery(
        () => db.product_batches.where('product_id').equals(productId).reverse().sortBy('created_at'),
        [productId]
    );

    if (!product) {
        return (
            <div className="p-8 flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/products')}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                        <History size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Stock History</h1>
                        <p className="text-gray-500 dark:text-gray-400">{product.name} (SKU: {product.sku_code})</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Available Stock</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        {product.stock_quantity} <span className="text-sm font-normal text-gray-500">{product.unit_id}</span>
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Last Cost Price</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(product.cost_price)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current Selling Price</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(product.retail_price)}</p>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package size={20} className="text-blue-600" />
                        Purchase Batches & Price Trends
                    </h3>
                </div>

                <div className="p-6">
                    {!batches ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No purchase history found for this product.</p>
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
                                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                                            : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-60'
                                            }`}
                                    >
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatDateTime(new Date(batch.created_at))}
                                        </div>

                                        <div className="flex items-center">
                                            {batch.quantity > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase">Active</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase">Sold Out</span>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(batch.cost_price)}
                                                {isCostUp && <TrendingUp size={14} className="text-red-500" />}
                                                {isCostDown && <TrendingDown size={14} className="text-green-500" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500">Stock In Cost</p>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(batch.retail_price)}
                                                {isRetailUp && <TrendingUp size={14} className="text-green-500" />}
                                                {isRetailDown && <TrendingDown size={14} className="text-red-500" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500">Customer Price</p>
                                        </div>

                                        <div className="text-center font-mono font-bold text-blue-600 dark:text-blue-400 text-lg">
                                            {batch.quantity}
                                        </div>

                                        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
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
