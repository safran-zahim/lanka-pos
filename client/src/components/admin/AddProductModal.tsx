import { useEffect, useRef, useState } from 'react';
import { X, Plus, Image as ImageIcon, RefreshCw, AlertCircle, Package } from 'lucide-react';
import { CategoryManager } from '../CategoryManager';
import { BrandManager } from './settings/BrandManager';
import { UnitManager } from './settings/UnitManager';
import { useToast } from '../../store/useToast';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import type { Product } from '../../db/db';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Input } from '../ui/Input';

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
        tax_type: product?.tax_type ?? 'inclusive',
        cost_price: String(product?.cost_price ?? 0),
        retail_price: String(product?.retail_price ?? 0)
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
            tax_type: product.tax_type ?? 'inclusive',
            cost_price: String(product.cost_price ?? 0),
            retail_price: String(product.retail_price ?? 0)
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
                        costPrice: parseFloat(formData.cost_price) || 0,
                        retailPrice: parseFloat(formData.retail_price) || 0,
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

    const ModalOverlay = ({ title, onClose, children }: any) => (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-5xl p-0 overflow-hidden rounded-xl border-border shadow-2xl h-fit border flex flex-col bg-background">
                <DialogHeader className="p-8 border-b border-border bg-muted/30">
                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">{title}</DialogTitle>
                    <p className="text-[10px] font-black text-muted-foreground/40 mt-1 uppercase tracking-[0.2em]">Secondary Infrastructure Management</p>
                </DialogHeader>
                <div className="p-10 overflow-y-auto max-h-[85vh] custom-scrollbar">
                    <div className="bg-card/30 rounded-2xl border border-border/5 p-8 shadow-inner">
                        {children}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    return (
        <>
            {/* Helper Modals */}
            {modalState.showCategory && (
                <CategoryManager
                    onClose={() => setModalState({ ...modalState, showCategory: false })}
                    onCategoryCreated={(newCategory) => {
                        setCategories(prev => [...prev, newCategory]);
                        setFormData({ ...formData, category_id: String(newCategory.id) });
                        setModalState({ ...modalState, showCategory: false });
                    }}
                />
            )}
            {modalState.showBrand && (
                <ModalOverlay
                    title="Manage Brands"
                    onClose={() => setModalState({ ...modalState, showBrand: false })}
                >
                    <BrandManager onBrandCreated={(newBrand) => {
                        setBrands(prev => [...prev, newBrand]);
                        setFormData({ ...formData, brand_id: String(newBrand.id) });
                        setModalState({ ...modalState, showBrand: false });
                    }} />
                </ModalOverlay>
            )}
            {modalState.showUnit && (
                <ModalOverlay
                    title="Manage Units"
                    onClose={() => setModalState({ ...modalState, showUnit: false })}
                >
                    <UnitManager onUnitCreated={(newUnit) => {
                        setUnits(prev => [...prev, newUnit]);
                        setFormData({ ...formData, unit_id: String(newUnit.id) });
                        setModalState({ ...modalState, showUnit: false });
                    }} />
                </ModalOverlay>
            )}

            {/* Main Modal */}
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="w-full max-w-7xl p-0 overflow-hidden flex flex-col h-[95vh] rounded-xl border border-border shadow-2xl bg-background">
                    <DialogHeader className="p-8 border-b bg-muted/5 sticky top-0 z-20 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <Plus size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-1.5">
                                    {isEdit ? 'Update Product Details' : 'Design New Product'}
                                </DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Architecture & Inventory Logic</p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="ghost"
                            size="sm"
                            className="rounded-lg h-10 w-10 hover:bg-muted"
                        >
                            <X size={20} />
                        </Button>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            
                            {/* Left Side: General & Stock (8/12) */}
                            <div className="lg:col-span-8 space-y-12">
                                {/* Core Info */}
                                <div className="p-10 rounded-2xl border border-border bg-card shadow-xs space-y-8">
                                    <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Primary Identity</Label>
                                        <span className="text-[10px] font-bold text-muted-foreground/30 italic uppercase">Step 01</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Product Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                required
                                                className={`h-12 rounded-xl border bg-background focus:ring-4 focus:ring-primary/5 text-base font-bold transition-all shadow-xs ${fieldErrors.name ? 'border-destructive' : 'border-border'}`}
                                                placeholder="e.g. Basmati Rice"
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                            {fieldErrors.name && <p className="text-[10px] text-destructive ml-1">{fieldErrors.name}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80 flex justify-between">
                                                SKU Code
                                                {!isEdit && <span className="text-[10px] text-primary/40 font-black tracking-widest">AUTO-GENERATED</span>}
                                            </Label>
                                            <div className="relative group/sku">
                                                <Input
                                                    className={`h-12 pl-4 pr-12 rounded-xl border bg-muted/5 font-mono font-black text-base focus:ring-4 focus:ring-primary/5 transition-all shadow-inner ${fieldErrors.skuCode ? 'border-destructive' : 'border-border'}`}
                                                    placeholder="10001"
                                                    value={formData.sku_code} onChange={e => setFormData({ ...formData, sku_code: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateSKU}
                                                    className="absolute right-1 top-1 h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                            </div>
                                            {fieldErrors.skuCode && <p className="text-[10px] text-destructive ml-1">{fieldErrors.skuCode}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Barcode Identifier</Label>
                                            <Input
                                                className="h-12 rounded-xl border border-border bg-background focus:ring-4 focus:ring-primary/5 text-base font-bold transition-all shadow-xs"
                                                placeholder="UPC/EAN Number"
                                                value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Symbology</Label>
                                            <Select value={formData.barcode_type} onValueChange={(val) => setFormData({ ...formData, barcode_type: val as BarcodeType })}>
                                                <SelectTrigger className="h-12 rounded-xl font-bold bg-background shadow-xs text-base">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border shadow-2xl">
                                                    {['C128', 'C39', 'EAN13', 'EAN8', 'UPCA', 'UPCE'].map(t => (
                                                        <SelectItem key={t} value={t} className="font-bold py-3">{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Commercial Logic — New Pricing Section */}
                                <div className="p-10 rounded-2xl border border-border bg-card shadow-xs space-y-8">
                                    <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Commercial Logic</Label>
                                        <span className="text-[10px] font-bold text-muted-foreground/30 italic uppercase">Step 03</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Buying Cost (Rs.) <span className="text-destructive">*</span></Label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-black text-xs">RS</div>
                                                <Input
                                                    type="number" step="any" required
                                                    className="h-14 pl-12 rounded-xl border border-border bg-background focus:ring-4 focus:ring-primary/5 text-xl font-black transition-all shadow-xs"
                                                    placeholder="0.00"
                                                    value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground/40 ml-1 font-bold">Base acquisition price for margin calculation.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Selling Retail (Rs.) <span className="text-destructive">*</span></Label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-black text-xs">RS</div>
                                                <Input
                                                    type="number" step="any" required
                                                    className="h-14 pl-12 rounded-xl border border-primary/20 bg-primary/5 focus:ring-4 focus:ring-primary/5 text-xl font-black text-primary transition-all shadow-xs"
                                                    placeholder="0.00"
                                                    value={formData.retail_price} onChange={e => setFormData({ ...formData, retail_price: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-[10px] text-primary/40 ml-1 font-bold">Standard storefront price for point-of-sale.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Organization */}
                                <div className="p-10 rounded-2xl border border-border bg-card shadow-xs space-y-8">
                                    <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Spatial Taxonomy</Label>
                                        <span className="text-[10px] font-bold text-muted-foreground/30 italic uppercase">Step 02</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Measurement Unit <span className="text-destructive">*</span></Label>
                                            <div className="flex gap-3 items-end">
                                                <Select value={formData.unit_id} onValueChange={(val) => setFormData({ ...formData, unit_id: val })}>
                                                    <SelectTrigger className="h-12 rounded-xl text-base font-bold flex-1 bg-background shadow-xs">
                                                        <SelectValue placeholder="Select Unit" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-border shadow-2xl">
                                                        {units?.map(u => (
                                                            <SelectItem key={u.id} value={String(u.id)} className="font-bold py-3">{u.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button type="button" onClick={() => setModalState({ ...modalState, showUnit: true })} variant="ghost" size="sm" className="h-12 w-12 shrink-0 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-xs border border-primary/10"><Plus size={20} /></Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Associated Brand</Label>
                                            <div className="flex gap-3 items-end">
                                                <Select value={formData.brand_id} onValueChange={(val) => setFormData({ ...formData, brand_id: val })}>
                                                    <SelectTrigger className="h-12 rounded-xl text-base font-bold flex-1 bg-background shadow-xs">
                                                        <SelectValue placeholder="No Brand" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-border shadow-2xl">
                                                        <SelectItem value="none" className="text-muted-foreground text-sm font-bold opacity-50 italic">None</SelectItem>
                                                        {brands?.map(b => (
                                                            <SelectItem key={b.id} value={String(b.id)} className="font-bold py-3">{b.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button type="button" onClick={() => setModalState({ ...modalState, showBrand: true })} variant="ghost" size="sm" className="h-12 w-12 shrink-0 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-xs border border-primary/10"><Plus size={20} /></Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Master Category</Label>
                                            <div className="flex gap-3 items-end">
                                                <Select value={formData.category_id} onValueChange={(val) => setFormData({ ...formData, category_id: val, sub_category_id: '' })}>
                                                    <SelectTrigger className="h-12 rounded-xl text-base font-bold flex-1 bg-background shadow-xs">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-border shadow-2xl">
                                                        <SelectItem value="none" className="text-muted-foreground text-sm font-bold opacity-50 italic">None</SelectItem>
                                                        {categories?.map(c => (
                                                            <SelectItem key={c.id} value={String(c.id)} className="font-bold py-3">{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button type="button" onClick={() => setModalState({ ...modalState, showCategory: true })} variant="ghost" size="sm" className="h-12 w-12 shrink-0 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-xs border border-primary/10"><Plus size={20} /></Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black ml-1 text-muted-foreground/80">Nested Level</Label>
                                            <Select disabled={!formData.category_id || formData.category_id === 'none'} value={formData.sub_category_id} onValueChange={(val) => setFormData({ ...formData, sub_category_id: val })}>
                                                <SelectTrigger className="h-12 rounded-xl text-base font-bold flex-1 bg-background shadow-xs">
                                                    <SelectValue placeholder="Sub-category" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border shadow-2xl">
                                                    <SelectItem value="none" className="text-muted-foreground text-sm font-bold opacity-50 italic">None</SelectItem>
                                                    {subCategories?.map(sub => (
                                                        <SelectItem key={sub.id} value={String(sub.id)} className="font-bold py-3">{sub.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Manager */}
                                <div className="p-10 rounded-2xl border-2 border-primary/10 bg-primary/5 flex items-center justify-between shadow-xs">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Package size={28} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-base font-black text-primary uppercase tracking-tight">Inventory Logic</Label>
                                            <p className="text-xs text-muted-foreground font-bold">Monitor and manage warehouse quantities for this item.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10 px-8 border-l border-primary/10">
                                        <div className="flex items-center gap-3">
                                            <Checkbox id="manage_stock" checked={formData.manage_stock} onCheckedChange={(val) => setFormData({ ...formData, manage_stock: !!val })} className="h-6 w-6 rounded-lg border-2 border-primary/30" />
                                            <Label htmlFor="manage_stock" className="text-sm font-black cursor-pointer select-none text-primary">Track Stock</Label>
                                        </div>
                                        {formData.manage_stock && (
                                            <div className="space-y-1.5 w-44 animate-in fade-in slide-in-from-right-4 duration-500">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1">Reorder Point</Label>
                                                <input type="number" step="any" className="w-full h-11 bg-background rounded-xl border border-primary/20 text-xl font-black text-center focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm" value={formData.alert_quantity} onChange={e => setFormData({ ...formData, alert_quantity: e.target.value })} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Media & Description (4/12) */}
                            <div className="lg:col-span-4 space-y-12 h-fit">
                                <div className="p-10 rounded-2xl border border-border bg-card shadow-xs space-y-8">
                                    <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Visual Identity</Label>
                                        <span className="text-[10px] font-bold text-muted-foreground/30 italic uppercase">Media</span>
                                    </div>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative group border-2 border-dashed border-border/60 rounded-2xl h-72 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden shadow-inner bg-muted/10"
                                    >
                                        {formData.image ? (
                                            <div className="relative w-full h-full p-4 focus:animate-pulse">
                                                <img src={formData.image} alt="Preview" className="h-full w-full object-contain rounded-xl" />
                                                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                                                    <span className="text-xs font-black uppercase px-5 py-2.5 bg-background border border-border shadow-2xl rounded-xl">Replace Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-border/50 flex items-center justify-center text-muted-foreground/30 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                                    <ImageIcon size={40} />
                                                </div>
                                                <span className="text-xs font-black uppercase text-muted-foreground/60 tracking-widest">Drop Product Photo</span>
                                                <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase font-bold">JPEG / PNG / WEBP MAX 5MB</p>
                                            </>
                                        )}
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </div>
                                </div>

                                <div className="p-10 rounded-2xl border border-border bg-card flex flex-col gap-6 min-h-110 shadow-xs">
                                    <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Extended Details</Label>
                                        <span className="text-[10px] font-bold text-muted-foreground/30 italic uppercase">Description</span>
                                    </div>
                                    <textarea 
                                        className="w-full flex-1 p-6 rounded-xl border border-border text-base bg-background focus:ring-4 focus:ring-primary/5 outline-none resize-none placeholder:text-muted-foreground/30 font-medium transition-all shadow-inner leading-relaxed"
                                        placeholder="Add descriptive details for labels and online storefronts..."
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="p-8 border-t bg-muted/5 flex justify-end gap-5 sticky bottom-0 z-20">
                        <Button type="button" onClick={onClose} variant="ghost" className="px-10 h-14 rounded-xl text-base font-black border border-border bg-background shadow-xs hover:bg-muted transition-all">
                            Discard Changes
                        </Button>
                        <Button type="submit" disabled={isSubmitting} form="product-form" variant="primary" className="px-16 h-14 font-black rounded-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-base">
                            {isSubmitting && <RefreshCw className="animate-spin" size={20} />}
                            {isEdit ? 'Update Specification' : 'Publish Product'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
