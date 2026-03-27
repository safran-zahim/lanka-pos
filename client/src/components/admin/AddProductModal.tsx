import { useEffect, useRef, useState } from 'react';
import { X, Plus, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { CategoryManager } from '../CategoryManager';
import { BrandManager } from './settings/BrandManager';
import { UnitManager } from './settings/UnitManager';
import { useToast } from '../../store/useToast';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import type { Product } from '../../db/db';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

type BarcodeType = 'C128' | 'C39' | 'EAN13' | 'EAN8' | 'UPCA' | 'UPCE';

interface AddProductModalProps {
    onClose: () => void;
    onSuccess: () => void;
    product?: Product;
}

export const AddProductModal = ({ onClose, onSuccess, product }: AddProductModalProps) => {
    const isEdit = Boolean(product);
    const [formData, setFormData] = useState({
        name: product?.name ?? '',
        sku_code: product?.sku_code ?? '',
        barcode: product?.barcode ?? '',
        barcode_type: (product?.barcode_type ?? 'C128') as BarcodeType,
        unit_id: product?.unit_id ? String(product.unit_id) : '',
        brand_id: product?.brand_id ? String(product.brand_id) : '',
        category_id: product?.category_id ? String(product.category_id) : '',
        sub_category_id: product?.sub_category_id ? String(product.sub_category_id) : '',
        manage_stock: product?.manage_stock ?? true,
        alert_quantity: String(product?.alert_quantity ?? product?.reorder_level ?? 0),
        description: product?.description ?? '',
        image: product?.image ?? '',
        tax_type: product?.tax_type ?? 'inclusive'
    });

    const [modalState, setModalState] = useState({
        showCategory: false,
        showBrand: false,
        showUnit: false
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    const token = useAuthStore((state) => state.token);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);

    const { addToast } = useToast();
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        const loadLookups = async () => {
            if (!token) return;
            try {
                const [categoriesRes, brandsRes, unitsRes, productsRes] = await Promise.all([
                    fetch(getApiUrl('/categories'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/brands'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/units'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/products'), { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (categoriesRes.ok) setCategories(await categoriesRes.json());
                if (brandsRes.ok) setBrands(await brandsRes.json());
                if (unitsRes.ok) {
                    const loadedUnits = await unitsRes.json();
                    setUnits(loadedUnits);
                    // Auto-select first unit if available
                    if (loadedUnits && loadedUnits.length > 0) {
                        setFormData(prev => (prev.unit_id ? prev : { ...prev, unit_id: loadedUnits[0].id }));
                    }
                }
                if (productsRes.ok) {
                    const loadedProducts = await productsRes.json();
                    setProducts(loadedProducts);

                    // Auto-generate SKU for new products if not editing
                    if (!isEdit && !product) {
                        if (!loadedProducts || loadedProducts.length === 0) {
                            setFormData(prev => ({ ...prev, sku_code: '10001' }));
                        } else {
                            const latestProduct = [...loadedProducts].sort((a, b) => (b.id || b.product_id) - (a.id || a.product_id))[0];
                            const latestSKU = latestProduct?.skuCode || latestProduct?.sku_code;

                            let nextSKU = '10001';
                            if (latestSKU) {
                                const numericPart = latestSKU.match(/\d+/);
                                if (numericPart) {
                                    const number = parseInt(numericPart[0]);
                                    nextSKU = latestSKU.replace(numericPart[0], (number + 1).toString());
                                } else {
                                    nextSKU = latestSKU + '1';
                                }
                            }
                            setFormData(prev => ({ ...prev, sku_code: nextSKU }));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load product metadata', error);
            }
        };

        loadLookups();
    }, [token, isEdit, product]);

    useEffect(() => {
        if (!product) return;
        setFormData({
            name: product.name ?? '',
            sku_code: product.sku_code ?? '',
            barcode: product.barcode ?? '',
            barcode_type: (product.barcode_type ?? 'C128') as BarcodeType,
            unit_id: product.unit_id ? String(product.unit_id) : '',
            brand_id: product.brand_id ? String(product.brand_id) : '',
            category_id: product.category_id ? String(product.category_id) : '',
            sub_category_id: product.sub_category_id ? String(product.sub_category_id) : '',
            manage_stock: product.manage_stock ?? true,
            alert_quantity: String(product.alert_quantity ?? product.reorder_level ?? 0),
            description: product.description ?? '',
            image: product.image ?? '',
            tax_type: product.tax_type ?? 'inclusive'
        });
    }, [product]);

    useEffect(() => {
        if (!formData.category_id) {
            setSubCategories([]);
            return;
        }
        const selected = categories.find((category) => String(category.id) === String(formData.category_id));
        setSubCategories(selected?.subCategories || []);
    }, [categories, formData.category_id]);

    const handleGenerateSKU = () => {
        if (!products || products.length === 0) {
            setFormData({ ...formData, sku_code: '10001' });
            addToast(`Generated SKU: 10001`, 'info');
            return;
        }

        // Find the most recently added product (highest ID)
        // Products are returned sorted by name 'asc' from getProducts, 
        // but we have the full list so we can find the max ID
        const latestProduct = [...products].sort((a, b) => (b.id || b.product_id) - (a.id || a.product_id))[0];
        const latestSKU = latestProduct?.skuCode || latestProduct?.sku_code;

        let nextSKU = '10001';
        if (latestSKU) {
            const numericPart = latestSKU.match(/\d+/);
            if (numericPart) {
                const number = parseInt(numericPart[0]);
                nextSKU = latestSKU.replace(numericPart[0], (number + 1).toString());
            } else {
                nextSKU = latestSKU + '1';
            }
        }

        setFormData({ ...formData, sku_code: nextSKU });
        addToast(`Generated SKU: ${nextSKU}`, 'info');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate Size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                addToast("Image size must be less than 5MB", 'error');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLock = useRef(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitLock.current) return;
        submitLock.current = true;
        setIsSubmitting(true);
        setFieldErrors({}); // Reset errors before submission
        try {
            if (!token) {
                addToast('Missing auth token', 'error');
                return;
            }
            if (isEdit && !product?.product_id) {
                addToast('Missing product id', 'error');
                return;
            }
            const response = await fetch(
                isEdit ? getApiUrl(`/products/${product?.product_id}`) : getApiUrl('/products'),
                {
                    method: isEdit ? 'PATCH' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        skuCode: formData.sku_code || null,
                        barcode: formData.barcode || null,
                        barcodeType: formData.barcode_type || null,
                        description: formData.description || null,
                        categoryId: formData.category_id ? Number(formData.category_id) : null,
                        subCategoryId: formData.sub_category_id ? Number(formData.sub_category_id) : null,
                        brandId: formData.brand_id ? Number(formData.brand_id) : null,
                        unitId: formData.unit_id ? Number(formData.unit_id) : null,
                        reorderLevel: parseFloat(formData.alert_quantity) || 0
                    })
                });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                console.log('Product Validation Error Payload:', errorPayload);
                let errorMessage = '';
                const newFieldErrors: Record<string, string> = {};

                if (errorPayload.field) {
                    // Single field error (e.g., SKU collision)
                    // Map sku_code to skuCode for consistent highlighting
                    const fieldName = errorPayload.field === 'sku_code' ? 'skuCode' : errorPayload.field;
                    newFieldErrors[fieldName] = errorPayload.error;
                    errorMessage = errorPayload.error;
                } else if (Array.isArray(errorPayload.details)) {
                    // Structured Zod errors
                    errorPayload.details.forEach((d: any) => {
                        const fieldName = d.field === 'sku_code' ? 'skuCode' : d.field;
                        newFieldErrors[fieldName] = d.message;
                    });
                    errorMessage = 'Please fix the highlighted errors';
                } else if (Array.isArray(errorPayload.error)) {
                    // Legacy Zod error format if any
                    errorMessage = errorPayload.error.map((e: any) => e.message || JSON.stringify(e)).join(', ');
                } else {
                    errorMessage = errorPayload.error || (isEdit ? 'Failed to update product' : 'Failed to add product');
                }

                setFieldErrors(newFieldErrors);
                throw new Error(errorMessage);
            }
            addToast(isEdit ? 'Product updated successfully!' : 'Product added successfully!', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Product creation error:', error);
            const errorMessage = error.message || 'Failed to add product';
            addToast(errorMessage, 'error');
        } finally {
            submitLock.current = false;
            setIsSubmitting(false);
        }
    };

    const ModalOverlay = ({ title, onClose, children, large }: any) => (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className={`w-full ${large ? 'max-w-4xl' : 'max-w-lg'} p-0 overflow-hidden`}>
                <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white">{title}</DialogTitle>
                        <Button onClick={onClose} variant="ghost" size="sm" className="hover:bg-white/50 dark:hover:bg-gray-700">
                            <X size={24} className="text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>
                </DialogHeader>
                <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
            </DialogContent>
        </Dialog>
    );

    return (
        <>
            {/* Helper Modals */}
            {modalState.showCategory && (
                <CategoryManager
                    onClose={() => {
                        setModalState({ ...modalState, showCategory: false });
                        // Reload categories after closing
                        const loadCategories = async () => {
                            if (!token) return;
                            try {
                                const res = await fetch(getApiUrl('/categories'), { headers: { Authorization: `Bearer ${token}` } });
                                if (res.ok) setCategories(await res.json());
                            } catch (error) {
                                console.error('Failed to reload categories', error);
                            }
                        };
                        loadCategories();
                    }}
                    onCategoryCreated={(newCategory) => {
                        setCategories(prev => [...prev, newCategory]);
                        setFormData({ ...formData, category_id: newCategory.id });
                        setModalState({ ...modalState, showCategory: false });
                    }}
                />
            )}
            {modalState.showBrand && (
                <ModalOverlay
                    title="Manage Brands"
                    large={true}
                    onClose={() => {
                        setModalState({ ...modalState, showBrand: false });
                        // Reload brands after closing
                        const loadBrands = async () => {
                            if (!token) return;
                            try {
                                const res = await fetch(getApiUrl('/brands'), { headers: { Authorization: `Bearer ${token}` } });
                                if (res.ok) setBrands(await res.json());
                            } catch (error) {
                                console.error('Failed to reload brands', error);
                            }
                        };
                        loadBrands();
                    }}
                >
                    <BrandManager onBrandCreated={(newBrand) => {
                        setBrands(prev => [...prev, newBrand]);
                        setFormData({ ...formData, brand_id: newBrand.id });
                        setModalState({ ...modalState, showBrand: false });
                    }} />
                </ModalOverlay>
            )}
            {modalState.showUnit && (
                <ModalOverlay
                    title="Manage Units"
                    large={true}
                    onClose={() => {
                        setModalState({ ...modalState, showUnit: false });
                        // Reload units after closing
                        const loadUnits = async () => {
                            if (!token) return;
                            try {
                                const res = await fetch(getApiUrl('/units'), { headers: { Authorization: `Bearer ${token}` } });
                                if (res.ok) setUnits(await res.json());
                            } catch (error) {
                                console.error('Failed to reload units', error);
                            }
                        };
                        loadUnits();
                    }}
                >
                    <UnitManager onUnitCreated={(newUnit) => {
                        setUnits(prev => [...prev, newUnit]);
                        setFormData({ ...formData, unit_id: newUnit.id });
                        setModalState({ ...modalState, showUnit: false });
                    }} />
                </ModalOverlay>
            )}

            {/* Main Modal */}
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="w-full md:max-w-6xl p-0 overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh]">

                    {/* Header */}
                    {/* Header */}
                    <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
                        <div className="flex justify-between items-center">
                            <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-white">{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                                <X size={28} />
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <form id="product-form" onSubmit={handleSubmit} className="space-y-8">

                            {/* Basic Details Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Product Name*</label>
                                        <input
                                            required
                                            type="text"
                                            className={`w-full p-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${fieldErrors.name ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                            placeholder="Product Name"
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        {fieldErrors.name && <p className="text-xs text-red-500 font-medium">{fieldErrors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            SKU
                                            {!isEdit && <span className="text-xs text-green-600 dark:text-green-400 ml-2">(Auto-generated)</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={`w-full p-2.5 pr-12 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${fieldErrors.skuCode ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                placeholder="SKU Code (Auto-generated)"
                                                value={formData.sku_code} onChange={e => setFormData({ ...formData, sku_code: e.target.value })}
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleGenerateSKU}
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-2 top-1.5 p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md"
                                                title="Regenerate SKU"
                                            >
                                                <RefreshCw size={18} />
                                            </Button>
                                        </div>
                                        {fieldErrors.skuCode && <p className="text-xs text-red-500 font-medium">{fieldErrors.skuCode}</p>}
                                        {!isEdit && !fieldErrors.skuCode && <p className="text-xs text-gray-500 dark:text-gray-400">SKU is automatically generated. Click refresh to regenerate.</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Barcode</label>
                                        <input
                                            type="text"
                                            className={`w-full p-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${fieldErrors.barcode ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                            placeholder="Barcode (Optional)"
                                            value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                        />
                                        {fieldErrors.barcode && <p className="text-xs text-red-500 font-medium">{fieldErrors.barcode}</p>}
                                        <div className="mt-3">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Barcode Type</label>
                                            <select className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                                value={formData.barcode_type}
                                                onChange={e => setFormData({ ...formData, barcode_type: e.target.value as BarcodeType })}>
                                                <option value="C128">Code 128 (C128)</option>
                                                <option value="C39">Code 39 (C39)</option>
                                                <option value="EAN13">EAN-13</option>
                                                <option value="EAN8">EAN-8</option>
                                                <option value="UPCA">UPC-A</option>
                                                <option value="UPCE">UPC-E</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Unit*</label>
                                        <div className="flex gap-2">
                                            <select required className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                                value={formData.unit_id} onChange={e => setFormData({ ...formData, unit_id: e.target.value })}>
                                                <option value="">Select Unit</option>
                                                {units?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.shortName || u.short_name})</option>)}
                                            </select>
                                            <Button type="button" onClick={() => setModalState({ ...modalState, showUnit: true })} variant="ghost" size="sm" className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"><Plus size={20} /></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Brand</label>
                                        <div className="flex gap-2">
                                            <select className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                                value={formData.brand_id} onChange={e => setFormData({ ...formData, brand_id: e.target.value })}>
                                                <option value="">Select Brand</option>
                                                {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                            <Button type="button" onClick={() => setModalState({ ...modalState, showBrand: true })} variant="ghost" size="sm" className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"><Plus size={20} /></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Category</label>
                                        <div className="flex gap-2">
                                            <select className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                                value={formData.category_id} onChange={e => {
                                                    setFormData({
                                                        ...formData,
                                                        category_id: e.target.value,
                                                        sub_category_id: '' // Reset subcategory when category changes
                                                    });
                                                }}>
                                                <option value="">Select Category</option>
                                                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <Button type="button" onClick={() => setModalState({ ...modalState, showCategory: true })} variant="ghost" size="sm" className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"><Plus size={20} /></Button>
                                        </div>
                                    </div>

                                    {/* SubCategory Selection */}
                                    {formData.category_id && (
                                        <div className="space-y-2 animate-fadeIn">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Sub Category</label>
                                            <select
                                                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                                value={formData.sub_category_id}
                                                onChange={e => setFormData({ ...formData, sub_category_id: e.target.value })}
                                            >
                                                <option value="">Select Sub Category</option>
                                                {subCategories?.map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))}
                                                {subCategories?.length === 0 && <option disabled>No subcategories found</option>}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Inventory & Stock */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Inventory & Stock</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <input type="checkbox" id="manage_stock" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                checked={formData.manage_stock} onChange={e => setFormData({ ...formData, manage_stock: e.target.checked })} />
                                            <label htmlFor="manage_stock" className="font-semibold text-gray-700 dark:text-gray-300">Manage Stock?</label>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-8">Enable stock management at product level</p>

                                        {formData.manage_stock && (
                                            <div className="ml-8 mt-2">
                                                <div className="space-y-1">
                                                    <label className="block text-sm text-gray-600 dark:text-gray-400">Alert Quantity</label>
                                                    <input type="number" step="any" className="w-1/2 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={formData.alert_quantity} onChange={e => setFormData({ ...formData, alert_quantity: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description & Image */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Product Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Product Description</label>
                                        <textarea className="w-full h-40 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="Enter product description..."
                                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Product Image</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800/50"
                                        >
                                            {formData.image ? (
                                                <img src={formData.image} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                                            ) : (
                                                <>
                                                    <ImageIcon size={32} className="text-gray-400 mb-2" />
                                                    <span className="text-sm text-gray-500">Click to upload image</span>
                                                </>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                        <p className="text-xs text-center text-gray-500">Max File size: 5MB. Aspect ratio 1:1 recommended.</p>
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 md:rounded-b-xl flex justify-end gap-3 sticky bottom-0 z-10 safe-area-bottom">
                        <Button type="button" onClick={onClose} variant="ghost" size="sm" className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} form="product-form" variant="primary" size="sm" className="flex-1 md:flex-none px-6 py-2.5 font-bold text-sm">
                            {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Product')}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>
        </>
    );
};
