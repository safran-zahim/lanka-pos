import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Folder, Package, FolderOpen, List, Edit2, Check } from 'lucide-react';
import { useToast } from '../store/useToast';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl } from '../config/api';

interface CategoryManagerProps {
    onClose: () => void;
    onCategoryCreated?: (category: any) => void;
}

export const CategoryManager = ({ onClose, onCategoryCreated }: CategoryManagerProps) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null);
    const [subCategories, setSubCategories] = useState<{ id: number; name: string; categoryId: number }[]>([]);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [editingSubCategoryId, setEditingSubCategoryId] = useState<number | null>(null);
    const [editingSubCategoryName, setEditingSubCategoryName] = useState('');
    const { addToast } = useToast();
    const token = useAuthStore((state) => state.token);
    const [categories, setCategories] = useState<{ id: number; name: string; subCategories?: any[] }[]>([]);

    useEffect(() => {
        const loadCategories = async () => {
            if (!token) return;
            try {
                const response = await fetch(getApiUrl('/categories'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to load categories');
                const payload = await response.json();
                setCategories(payload || []);

                // Flatten all subcategories from all categories
                const allSubs = (payload || []).flatMap((cat: any) =>
                    (cat.subCategories || []).map((sub: any) => ({
                        id: Number(sub.id),
                        name: sub.name,
                        categoryId: Number(sub.categoryId)
                    }))
                );
                setSubCategories(allSubs);
            } catch (error) {
                console.error('Failed to load categories', error);
            }
        };

        loadCategories();
    }, [token]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            if (!token) {
                addToast('Missing auth token', 'error');
                return;
            }
            const response = await fetch(getApiUrl('/categories'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newCategoryName.trim() })
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to add category');
            }
            const created = await response.json();
            setCategories((prev) => [...prev, created]);
            setNewCategoryName('');
            addToast('Category added', 'success');
            // Notify parent component if callback provided
            if (onCategoryCreated) {
                onCategoryCreated(created);
            }
        } catch (error) {
            console.error("Error adding category:", error);
            addToast("Failed to add category. Name might be duplicate.", 'error');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                if (!token) {
                    addToast('Missing auth token', 'error');
                    return;
                }
                const response = await fetch(getApiUrl(`/categories/${id}`), {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload.error || 'Failed to delete category');
                }
                setCategories((prev) => prev.filter((category) => category.id !== id));
                addToast('Category deleted', 'success');
            } catch (error) {
                console.error("Error deleting category:", error);
                addToast(error instanceof Error ? error.message : "Failed to delete category.", 'error');
            }
        }
    };

    const handleAddSubCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubCategoryName.trim() || !selectedCategory) return;

        try {
            if (!token) {
                addToast('Missing auth token', 'error');
                return;
            }

            const response = await fetch(getApiUrl('/categories/subcategories'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newSubCategoryName.trim(),
                    categoryId: selectedCategory.id
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to add subcategory');
            }

            const created = await response.json();
            setSubCategories((prev) => [...prev, created]);
            setNewSubCategoryName('');
            addToast('Subcategory added successfully', 'success');
        } catch (error) {
            console.error("Error adding subcategory:", error);
            addToast("Failed to add subcategory. Name might be duplicate.", 'error');
        }
    };

    const handleDeleteSubCategory = async (id: number) => {
        if (confirm('Are you sure you want to delete this subcategory?')) {
            try {
                if (!token) {
                    addToast('Missing auth token', 'error');
                    return;
                }

                const response = await fetch(getApiUrl(`/categories/subcategories/${id}`), {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload.error || 'Failed to delete subcategory');
                }

                setSubCategories((prev) => prev.filter((sub) => sub.id !== id));
                addToast('Subcategory deleted', 'success');
            } catch (error) {
                console.error("Error deleting subcategory:", error);
                addToast(error instanceof Error ? error.message : "Failed to delete subcategory.", 'error');
            }
        }
    };

    const handleUpdateCategory = async (id: number, newName: string) => {
        if (!newName.trim()) return;
        try {
            if (!token) {
                addToast('Missing auth token', 'error');
                return;
            }
            const response = await fetch(getApiUrl(`/categories/${id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to update category');
            }
            const updated = await response.json();
            setCategories((prev) => prev.map((cat) => Number(cat.id) === Number(id) ? { ...cat, id: Number(updated.id), name: updated.name } : cat));
            if (selectedCategory && Number(selectedCategory.id) === Number(id)) {
                setSelectedCategory({ id: Number(updated.id), name: updated.name });
            }
            setEditingCategoryId(null);
            setEditingCategoryName('');
            addToast('Category updated', 'success');
        } catch (error) {
            console.error("Error updating category:", error);
            addToast("Failed to update category.", 'error');
        }
    };

    const handleUpdateSubCategory = async (id: number, newName: string) => {
        if (!newName.trim()) return;
        try {
            if (!token) {
                addToast('Missing auth token', 'error');
                return;
            }
            const response = await fetch(getApiUrl(`/categories/subcategories/${id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.error || 'Failed to update subcategory');
            }
            const updated = await response.json();
            setSubCategories((prev) => prev.map((sub) => Number(sub.id) === Number(id) ? { ...sub, id: Number(updated.id), name: updated.name, categoryId: Number(updated.categoryId) } : sub));
            setEditingSubCategoryId(null);
            setEditingSubCategoryName('');
            addToast('Subcategory updated', 'success');
        } catch (error) {
            console.error("Error updating subcategory:", error);
            addToast("Failed to update subcategory.", 'error');
        }
    };

    const handleCategorySelect = (category: { id: number; name: string }) => {
        setSelectedCategory(category);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col border-2 border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Manage Categories & Subcategories</h2>
                            <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">Organize your product catalog with categories and subcategories</p>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex gap-6 overflow-hidden p-6">
                    {/* Categories Panel - Left Side */}
                    <div className="w-1/2 flex flex-col rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-gray-900/50 dark:to-gray-800">
                        <div className="bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-5 border-b-2 border-blue-200 dark:border-blue-800">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <Package size={20} className="text-blue-600 dark:text-blue-400" />
                                Categories
                            </h3>
                            <form onSubmit={handleAddCategory} className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Enter category name..."
                                    className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!newCategoryName.trim()}
                                >
                                    <Plus size={20} />
                                    Add
                                </button>
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {categories?.map((category) => (
                                <div
                                    key={category.id}
                                    onClick={() => Number(editingCategoryId) !== Number(category.id) && handleCategorySelect(category)}
                                    className={`
                                        flex justify-between items-center p-4 rounded-lg cursor-pointer transition-all group
                                        ${selectedCategory && Number(selectedCategory.id) === Number(category.id)
                                            ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500 dark:border-blue-600 shadow-md'
                                            : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedCategory && Number(selectedCategory.id) === Number(category.id) ? 'bg-blue-500' : 'bg-blue-100 dark:bg-blue-900'}`}>
                                            {selectedCategory && Number(selectedCategory.id) === Number(category.id) ? (
                                                <FolderOpen size={20} className="text-white" />
                                            ) : (
                                                <Folder size={20} className="text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                        {Number(editingCategoryId) === Number(category.id) ? (
                                            <input
                                                type="text"
                                                value={editingCategoryName}
                                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateCategory(category.id, editingCategoryName);
                                                    if (e.key === 'Escape') { setEditingCategoryId(null); setEditingCategoryName(''); }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded border-2 border-blue-500 focus:outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className={`text-base font-semibold ${selectedCategory && Number(selectedCategory.id) === Number(category.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{category.name}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {Number(editingCategoryId) === Number(category.id) ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateCategory(category.id, editingCategoryName);
                                                }}
                                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium transition-all"
                                                title="Save"
                                            >
                                                <Check size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingCategoryId(category.id);
                                                    setEditingCategoryName(category.name);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-all"
                                                title="Edit Category"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCategory(category.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-all"
                                            title="Delete Category"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {categories?.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                                        <Package size={32} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-semibold text-lg">No categories</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Add a category to get started</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subcategories Panel - Right Side */}
                    <div className="w-1/2 flex flex-col rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-linear-to-br from-gray-50 to-purple-50/30 dark:from-gray-900/50 dark:to-gray-800">
                        {selectedCategory ? (
                            <>
                                <div className="bg-linear-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-5 border-b-2 border-purple-200 dark:border-purple-800">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                        <List size={20} className="text-purple-600 dark:text-purple-400" />
                                        Subcategories
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        For category: <span className="font-semibold text-purple-600 dark:text-purple-400">{selectedCategory.name}</span>
                                    </p>
                                    <form onSubmit={handleAddSubCategory} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Enter subcategory name..."
                                            className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-3 text-base rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                            value={newSubCategoryName}
                                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!newSubCategoryName.trim()}
                                        >
                                            <Plus size={20} />
                                            Add
                                        </button>
                                    </form>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {subCategories
                                        .filter(sub => Number(sub.categoryId) === Number(selectedCategory.id))
                                        .map((subCategory) => (
                                            <div
                                                key={subCategory.id}
                                                className="flex justify-between items-center p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all group"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                                        <List size={18} className="text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    {Number(editingSubCategoryId) === Number(subCategory.id) ? (
                                                        <input
                                                            type="text"
                                                            value={editingSubCategoryName}
                                                            onChange={(e) => setEditingSubCategoryName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleUpdateSubCategory(subCategory.id, editingSubCategoryName);
                                                                if (e.key === 'Escape') { setEditingSubCategoryId(null); setEditingSubCategoryName(''); }
                                                            }}
                                                            className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 rounded border-2 border-purple-500 focus:outline-none"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-base font-medium text-gray-900 dark:text-white">{subCategory.name}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {Number(editingSubCategoryId) === Number(subCategory.id) ? (
                                                        <button
                                                            onClick={() => handleUpdateSubCategory(subCategory.id, editingSubCategoryName)}
                                                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium transition-all"
                                                            title="Save"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingSubCategoryId(subCategory.id);
                                                                setEditingSubCategoryName(subCategory.name);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-all"
                                                            title="Edit Subcategory"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteSubCategory(subCategory.id)}
                                                        className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-all"
                                                        title="Delete Subcategory"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    {subCategories.filter(sub => Number(sub.categoryId) === Number(selectedCategory.id)).length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-3">
                                                <List size={32} className="text-purple-400 dark:text-purple-500" />
                                            </div>
                                            <p className="text-gray-900 dark:text-white font-semibold text-lg">No subcategories</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Add a subcategory above</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                                <FolderOpen size={64} className="mb-4 opacity-20" />
                                <p className="text-lg font-semibold">Select a category</p>
                                <p className="text-sm mt-2">Choose a category from the left to manage its subcategories</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
