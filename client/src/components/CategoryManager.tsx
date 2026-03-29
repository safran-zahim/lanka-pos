import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Folder, Package, FolderOpen, List, Edit2, Check } from 'lucide-react';
import { useToast } from '../store/useToast';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl } from '../config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/Button';

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
        <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="w-full max-w-7xl p-0 overflow-hidden rounded-xl border border-border shadow-2xl h-[95vh] flex flex-col bg-background" showCloseButton={false}>
                
                <DialogHeader className="p-8 border-b bg-muted/5 flex flex-row items-center justify-between shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <FolderOpen size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-1.5">Category Architecture</DialogTitle>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Manage product categories and hierarchical taxonomies</p>
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

                <div className="flex-1 flex overflow-hidden p-10 gap-10 bg-muted/5">
                    
                    {/* Categories Panel - Left */}
                    <div className="flex-1 flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
                        <div className="p-8 bg-muted/10 border-b border-border space-y-6">
                            <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">Primary Taxonomies</h3>
                                <span className="text-[10px] font-black bg-primary text-primary-foreground px-2.5 py-1 rounded-lg shadow-sm">{categories?.length || 0}</span>
                            </div>
                            <form onSubmit={handleAddCategory} className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Add Category Name..."
                                    className="flex-1 h-12 px-4 rounded-xl border border-border bg-background focus:ring-4 focus:ring-primary/5 outline-none text-base font-bold transition-all shadow-xs"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    disabled={!newCategoryName.trim()}
                                    variant="primary"
                                    className="h-12 w-12 p-0 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center"
                                >
                                    <Plus size={24} />
                                </Button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {categories?.map((category) => (
                                <div
                                    key={category.id}
                                    onClick={() => Number(editingCategoryId) !== Number(category.id) && handleCategorySelect(category)}
                                    className={`
                                        flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all group
                                        ${selectedCategory && Number(selectedCategory.id) === Number(category.id)
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1'
                                            : 'hover:bg-muted text-foreground border border-transparent hover:border-border'}
                                    `}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <Folder size={18} className={selectedCategory && Number(selectedCategory.id) === Number(category.id) ? 'text-primary-foreground' : 'text-primary'} />
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
                                                className="flex-1 h-10 bg-background text-foreground px-3 rounded-lg border-2 border-primary focus:outline-none text-base font-black shadow-inner"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="text-base font-black truncate tracking-tight">{category.name}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {Number(editingCategoryId) === Number(category.id) ? (
                                            <Button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleUpdateCategory(category.id, editingCategoryName); }}
                                                variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary-foreground"
                                            >
                                                <Check size={16} />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setEditingCategoryId(category.id); setEditingCategoryName(category.name); }}
                                                variant="ghost" size="sm" className={`h-7 w-7 p-0 rounded ${selectedCategory && Number(selectedCategory.id) === Number(category.id) ? 'text-primary-foreground hover:bg-white/10' : 'text-primary hover:bg-primary/5'}`}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                                            variant="ghost" size="sm" className={`h-7 w-7 p-0 rounded ${selectedCategory && Number(selectedCategory.id) === Number(category.id) ? 'text-primary-foreground hover:bg-white/10' : 'text-destructive hover:bg-destructive/5'}`}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subcategories Panel - Right */}
                    <div className="flex-1 flex flex-col rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
                        {selectedCategory ? (
                            <>
                                <div className="p-8 bg-muted/10 border-b border-border space-y-6">
                                    <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-2">
                                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">Nested Specifications</h3>
                                        <span className="text-[10px] font-black text-primary truncate max-w-[200px] uppercase italic">
                                            Hierarchy: {selectedCategory.name}
                                        </span>
                                    </div>
                                    <form onSubmit={handleAddSubCategory} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Add Sub-Level Name..."
                                            className="flex-1 h-12 px-4 rounded-xl border border-border bg-background focus:ring-4 focus:ring-primary/5 outline-none text-base font-bold transition-all shadow-xs"
                                            value={newSubCategoryName}
                                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={!newSubCategoryName.trim()}
                                            variant="primary"
                                            className="h-12 w-12 p-0 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center"
                                        >
                                            <Plus size={24} />
                                        </Button>
                                    </form>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    {subCategories
                                        .filter(sub => Number(sub.categoryId) === Number(selectedCategory.id))
                                        .map((subCategory) => (
                                            <div
                                                key={subCategory.id}
                                                className="flex justify-between items-center p-4 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <List size={16} className="text-muted-foreground/40" />
                                                    {Number(editingSubCategoryId) === Number(subCategory.id) ? (
                                                        <input
                                                            type="text"
                                                            value={editingSubCategoryName}
                                                            onChange={(e) => setEditingSubCategoryName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleUpdateSubCategory(subCategory.id, editingSubCategoryName);
                                                                if (e.key === 'Escape') { setEditingSubCategoryId(null); setEditingSubCategoryName(''); }
                                                            }}
                                                            className="flex-1 h-10 bg-background text-foreground px-3 rounded-lg border-2 border-primary focus:outline-none text-base font-black shadow-inner"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-base font-black truncate tracking-tight">{subCategory.name}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        type="button"
                                                        onClick={() => { setEditingSubCategoryId(subCategory.id); setEditingSubCategoryName(subCategory.name); }}
                                                        variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary hover:bg-primary/5"
                                                    >
                                                        <Edit2 size={14} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleDeleteSubCategory(subCategory.id)}
                                                        variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/5"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    {subCategories.filter(sub => Number(sub.categoryId) === Number(selectedCategory.id)).length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                                            <List size={32} className="text-muted-foreground mb-2" />
                                            <p className="font-bold text-[10px] uppercase tracking-widest">No Sub-categories</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30">
                                    <FolderOpen size={32} />
                                </div>
                                <div className="max-w-[200px]">
                                    <p className="text-sm font-bold text-foreground">Select a Category</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Choose a primary category from the left to manage its children.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
