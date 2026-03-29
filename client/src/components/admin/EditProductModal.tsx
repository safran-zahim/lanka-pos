import { useEffect, useState } from 'react';
import { X, Save, Settings, Trash2, RefreshCw } from 'lucide-react';
import type { Product } from '../../db/db';
import { CategoryManager } from '../CategoryManager';
import { useToast } from '../../store/useToast';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface EditProductModalProps {
    product: Product;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditProductModal = ({ product, onClose, onSuccess }: EditProductModalProps) => {
    const [formData, setFormData] = useState({
        sku_code: '',
        name: '',
        category_id: '',
        sub_category_id: '',
        reorder_level: ''
    });

    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const { addToast } = useToast();
    const token = useAuthStore((state) => state.token);
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);

    useEffect(() => {
        const loadLookups = async () => {
            if (!token) return;
            try {
                const [categoriesRes, productsRes] = await Promise.all([
                    fetch(getApiUrl('/categories'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/products'), { headers: { Authorization: `Bearer ${token}` } })
                ]);
                if (categoriesRes.ok) setCategories(await categoriesRes.json());
                if (productsRes.ok) setProducts(await productsRes.json());
            } catch (error) {
                console.error('Failed to load lookups', error);
            }
        };

        loadLookups();
    }, [token]);

    const handleGenerateSKU = () => {
        // Find highest numeric SKU
        const numericSKUs = (products || [])
            .map(p => parseInt(p.skuCode || p.sku_code))
            .filter(n => !isNaN(n));

        const nextSKU = numericSKUs.length > 0
            ? Math.max(...numericSKUs) + 1
            : 10001; // Starting number if none exist

        setFormData({ ...formData, sku_code: nextSKU.toString() });
        addToast(`Generated SKU: ${nextSKU}`, 'info');
    };

    useEffect(() => {
        if (product) {
            setFormData({
                sku_code: product.sku_code,
                name: product.name,
                category_id: String(product.category_id || ''),
                sub_category_id: String(product.sub_category_id || ''),
                reorder_level: product.reorder_level.toString()
            });
        }
    }, [product]);

    useEffect(() => {
        if (!formData.category_id) {
            setSubCategories([]);
            return;
        }
        const selected = categories.find((category) => category.id === formData.category_id);
        setSubCategories(selected?.subCategories || []);
    }, [categories, formData.category_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!token) {
                addToast('Missing auth token', 'error');
                return;
            }
            const response = await fetch(getApiUrl(`/products/${product.product_id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    skuCode: formData.sku_code,
                    name: formData.name,
                    categoryId: formData.category_id || undefined,
                    reorderLevel: parseFloat(formData.reorder_level) || 0
                })
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to update product');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update product.');
        }
    };

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
            try {
                if (!token) {
                    addToast('Missing auth token', 'error');
                    return;
                }
                const response = await fetch(getApiUrl(`/products/${product.product_id}`), {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload.error || 'Failed to delete product');
                }
                onSuccess();
                onClose();
            } catch (error) {
                console.error(error);
                alert('Failed to delete product.');
            }
        }
    };

    return (
        <>
            {showCategoryManager && (
                <CategoryManager onClose={() => setShowCategoryManager(false)} />
            )}
            <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DialogContent className="w-full max-w-125 p-6 max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                    <DialogHeader className="mb-6">
                        <div className="flex justify-between items-center">
                            <DialogTitle className="text-xl font-bold text-foreground">Edit Product</DialogTitle>
                            <Button type="button" onClick={onClose} variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-700 dark:hover:text-white">
                                <X size={24} />
                            </Button>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="block text-sm text-muted-foreground mb-1">SKU Code</Label>
                                <div className="relative">
                                    <Input
                                        required
                                        type="text"
                                        className="pr-10"
                                        value={formData.sku_code}
                                        onChange={e => setFormData({ ...formData, sku_code: e.target.value })}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleGenerateSKU}
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1 h-8 w-8 p-0 text-primary hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                                        title="Generate Sequential SKU"
                                    >
                                        <RefreshCw size={14} />
                                    </Button>
                                </div>
                            </div>
                            <div className="col-span-1">
                                <Label className="block text-sm text-muted-foreground mb-1">Category</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={formData.category_id}
                                        onValueChange={(val) => setFormData({
                                            ...formData,
                                            category_id: val,
                                            sub_category_id: ''
                                        })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        onClick={() => setShowCategoryManager(true)}
                                        variant="secondary"
                                        size="sm"
                                        className="h-10 w-10 p-0"
                                        title="Manage Categories"
                                    >
                                        <Settings size={18} />
                                    </Button>
                                </div>
                            </div>
                            {formData.category_id && (
                                <div className="col-span-2">
                                    <Label className="block text-sm text-muted-foreground mb-1">Sub Category</Label>
                                    <Select
                                        value={formData.sub_category_id}
                                        onValueChange={(val) => setFormData({ ...formData, sub_category_id: val })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Sub Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subCategories?.map((sub) => (
                                                <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>
                                            ))}
                                            {subCategories?.length === 0 && <SelectItem value="none" disabled>No subcategories available</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label className="block text-sm text-muted-foreground mb-1">Product Name</Label>
                            <Input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="block text-sm text-muted-foreground mb-1">Reorder Level</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={formData.reorder_level}
                                    onChange={e => setFormData({ ...formData, reorder_level: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="block text-sm text-muted-foreground mb-1">Current Stock</Label>
                                <Input
                                    disabled
                                    type="text"
                                    className="bg-muted cursor-not-allowed opacity-70"
                                    value={product.stock_quantity}
                                />
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-700/50 text-sm text-yellow-800 dark:text-yellow-200">
                            Note: Stock Quantity cannot be edited here. Use the <b>Add Stock</b> button in the inventory list to update stock.
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                            <Button
                                type="button"
                                onClick={handleDelete}
                                variant="danger"
                                fullWidth
                                className="flex-1 font-semibold py-3 flex items-center justify-center gap-2"
                            >
                                <Trash2 size={20} />
                                Delete Product
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                className="flex-1 font-semibold py-3 flex items-center justify-center gap-2"
                            >
                                <Save size={20} />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
