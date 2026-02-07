import React, { useState, useRef } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { CategoryManager } from '../CategoryManager';
import { BrandManager } from './settings/BrandManager';
import { UnitManager } from './settings/UnitManager';
import { useToast } from '../../store/useToast';
import { useCurrency } from '../../hooks/useCurrency';

interface AddProductModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AddProductModal = ({ onClose, onSuccess }: AddProductModalProps) => {
    const { currencySymbol } = useCurrency();
    const [formData, setFormData] = useState({
        name: '',
        sku_code: '',
        barcode_type: 'C128',
        unit_id: '',
        brand_id: '',
        category_id: '',
        sub_category_id: '',
        manage_stock: true,
        alert_quantity: '',
        description: '',
        image: '' as string,
        cost_price: '',
        retail_price: '',
        tax_type: 'inclusive'
    });

    const [modalState, setModalState] = useState({
        showCategory: false,
        showBrand: false,
        showUnit: false
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Live Data
    const categories = useLiveQuery(() => db.categories.toArray());
    const brands = useLiveQuery(() => db.brands.toArray());
    const units = useLiveQuery(() => db.units.toArray());

    // Fetch SubCategories based on selected Category Name
    const selectedCategoryObj = categories?.find(c => c.name === formData.category_id);
    const subCategories = useLiveQuery(
        () => selectedCategoryObj ? db.sub_categories.where('category_id').equals(selectedCategoryObj.category_id!).toArray() : [],
        [selectedCategoryObj]
    );

    const { addToast } = useToast();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.products.add({
                name: formData.name,
                sku_code: formData.sku_code,
                barcode_type: formData.barcode_type as any,
                unit_id: formData.unit_id,
                brand_id: formData.brand_id,
                category_id: formData.category_id || (categories?.[0]?.name || 'Uncategorized'),
                sub_category_id: formData.sub_category_id,
                manage_stock: formData.manage_stock,
                alert_quantity: Number(formData.alert_quantity) || 0,
                description: formData.description,
                image: formData.image,
                cost_price: Number(formData.cost_price) || 0,
                retail_price: Number(formData.retail_price) || 0,
                // tax_type: formData.tax_type, // TODO: Add to DB schema if needed
                stock_quantity: 0, // Initial stock 0
                reorder_level: Number(formData.alert_quantity) || 0 // Backward compat
            });
            addToast("Product added successfully!", 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            addToast("Failed to add product. SKU might be duplicate.", 'error');
        }
    };

    const ModalOverlay = ({ title, onClose, children }: any) => (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );

    return (
        <>
            {/* Helper Modals */}
            {modalState.showCategory && (
                <CategoryManager onClose={() => setModalState({ ...modalState, showCategory: false })} />
            )}
            {modalState.showBrand && (
                <ModalOverlay title="Manage Brands" onClose={() => setModalState({ ...modalState, showBrand: false })}>
                    <BrandManager />
                </ModalOverlay>
            )}
            {modalState.showUnit && (
                <ModalOverlay title="Manage Units" onClose={() => setModalState({ ...modalState, showUnit: false })}>
                    <UnitManager />
                </ModalOverlay>
            )}

            {/* Main Modal */}
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
                <div className="bg-white dark:bg-gray-900 w-full md:max-w-6xl md:rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 md:my-8 flex flex-col h-full md:h-auto md:max-h-[90vh]">

                    {/* Header */}
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-xl sticky top-0 z-10">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Product</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                            <X size={28} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <form id="product-form" onSubmit={handleSubmit} className="space-y-8">

                            {/* Basic Details Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Product Name*</label>
                                        <input required type="text" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Product Name"
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">SKU*</label>
                                        <input required type="text" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="SKU Code"
                                            value={formData.sku_code} onChange={e => setFormData({ ...formData, sku_code: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Barcode Type</label>
                                        <select className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                            value={formData.barcode_type} onChange={e => setFormData({ ...formData, barcode_type: e.target.value })}>
                                            <option value="C128">Code 128 (C128)</option>
                                            <option value="EAN13">EAN-13</option>
                                            <option value="UPCA">UPC-A</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Unit*</label>
                                        <div className="flex gap-2">
                                            <select required className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                                value={formData.unit_id} onChange={e => setFormData({ ...formData, unit_id: e.target.value })}>
                                                <option value="">Select Unit</option>
                                                {units?.map(u => <option key={u.unit_id} value={u.short_name}>{u.name} ({u.short_name})</option>)}
                                            </select>
                                            <button type="button" onClick={() => setModalState({ ...modalState, showUnit: true })} className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"><Plus size={20} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Brand</label>
                                        <div className="flex gap-2">
                                            <select className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                                value={formData.brand_id} onChange={e => setFormData({ ...formData, brand_id: e.target.value })}>
                                                <option value="">Select Brand</option>
                                                {brands?.map(b => <option key={b.brand_id} value={b.name}>{b.name}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setModalState({ ...modalState, showBrand: true })} className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"><Plus size={20} /></button>
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
                                                {categories?.map(c => <option key={c.category_id} value={c.name}>{c.name}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setModalState({ ...modalState, showCategory: true })} className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"><Plus size={20} /></button>
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
                                                    <option key={sub.sub_category_id} value={sub.name}>{sub.name}</option>
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
                                                    <input type="number" className="w-1/2 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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

                            {/* Pricing */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Pricing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Cost Price ({currencySymbol}, Excl. Tax)*</label>
                                        <input required type="number" step="0.01" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Retail Price ({currencySymbol}, Inc. Tax)*</label>
                                        <input required type="number" step="0.01" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.retail_price} onChange={e => setFormData({ ...formData, retail_price: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 md:rounded-b-xl flex justify-end gap-3 sticky bottom-0 z-10 safe-area-bottom">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm">
                            Cancel
                        </button>
                        <button type="submit" form="product-form" className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all text-sm">
                            Save Product
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};
