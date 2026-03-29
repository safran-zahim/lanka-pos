import { useEffect, useState } from 'react';
import { Plus, Trash2, Folder, FolderOpen, List, Edit2, Package, X, Save } from 'lucide-react';
import { useToast } from '../../../store/useToast';
import { useAuthStore } from '../../../store/useAuthStore';
import { getApiUrl } from '../../../config/api';

export const CategoryManagerPanel = () => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
    const { addToast } = useToast();
    const token = useAuthStore((state) => state.token);
    const [categories, setCategories] = useState<{ id: string; name: string; subCategories?: any[] }[]>([]);
    const [subCategories, setSubCategories] = useState<{ id: string; name: string; categoryId: string }[]>([]);

    // Edit States
    const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
    const [editingSubCategory, setEditingSubCategory] = useState<{ id: string; name: string } | null>(null);

    // Product View State
    const [viewingProducts, setViewingProducts] = useState<{ type: 'category' | 'subcategory', id: string, name: string } | null>(null);
    const [productsList, setProductsList] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        loadCategories();
    }, [token]);

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
                    id: sub.id,
                    name: sub.name,
                    categoryId: sub.categoryId
                }))
            );
            setSubCategories(allSubs);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

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
        } catch (error) {
            console.error('Error adding category:', error);
            addToast('Failed to add category. Name might be duplicate.', 'error');
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory || !editingCategory.name.trim()) return;

        try {
            if (!token) return;
            const response = await fetch(getApiUrl(`/categories/${editingCategory.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: editingCategory.name.trim() })
            });

            if (!response.ok) throw new Error('Failed to update category');

            await loadCategories(); // Reload to refresh both lists
            setEditingCategory(null);
            addToast('Category updated', 'success');
        } catch (error) {
            console.error('Error updating category:', error);
            addToast('Failed to update category', 'error');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (confirm('Are you sure you want to delete this category? All subcategories will also be deleted.')) {
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
                if (selectedCategory?.id === id) {
                    setSelectedCategory(null);
                }
                setCategories((prev) => prev.filter((category) => category.id !== id));
                setSubCategories((prev) => prev.filter((sub) => sub.categoryId !== id));
                addToast('Category deleted', 'success');
            } catch (error) {
                console.error('Error deleting category:', error);
                addToast('Failed to delete category.', 'error');
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

    const handleUpdateSubCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSubCategory || !editingSubCategory.name.trim()) return;

        try {
            if (!token) return;
            const response = await fetch(getApiUrl(`/categories/subcategories/${editingSubCategory.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: editingSubCategory.name.trim() })
            });

            if (!response.ok) throw new Error('Failed to update subcategory');

            setSubCategories(prev => prev.map(sub => sub.id === editingSubCategory.id ? { ...sub, name: editingSubCategory.name } : sub));
            setEditingSubCategory(null);
            addToast('Subcategory updated', 'success');
        } catch (error) {
            console.error('Error updating subcategory:', error);
            addToast('Failed to update subcategory', 'error');
        }
    };

    const handleDeleteSubCategory = async (id: string) => {
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
                addToast("Failed to delete subcategory.", 'error');
            }
        }
    };

    const fetchProducts = async (type: 'category' | 'subcategory', id: string, name: string) => {
        setViewingProducts({ type, id, name });
        setLoadingProducts(true);
        setProductsList([]);
        try {
            const queryParams = new URLSearchParams();
            if (type === 'category') queryParams.append('category', id);
            if (type === 'subcategory') queryParams.append('subCategory', id);

            const response = await fetch(getApiUrl(`/products?${queryParams.toString()}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setProductsList(await response.json());
            }
        } catch (error) {
            console.error('Failed to load products', error);
            addToast('Failed to load products', 'error');
        } finally {
            setLoadingProducts(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                {/* Categories Panel - Left Side */}
                <div className="flex flex-col rounded-lg border border-border overflow-hidden bg-muted/50">
                    <div className="bg-card text-card-foreground p-4 border-b border-border">
                        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            <Folder size={18} className="text-primary" />
                            Categories
                        </h3>
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="New category..."
                                className="flex-1 bg-gray-100 dark:bg-gray-700 text-foreground p-2 text-sm rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-ring outline-none"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-white p-2 rounded transition-colors disabled:opacity-50"
                                disabled={!newCategoryName.trim()}
                                title="Add Category"
                            >
                                <Plus size={18} />
                            </button>
                        </form>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {categories?.map((category) => (
                            <div
                                key={category.id}
                                onClick={() => setSelectedCategory(category)}
                                className={`
                                    flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all group
                                    ${selectedCategory?.id === category.id
                                        ? 'bg-primary/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 shadow-sm'
                                        : 'hover:bg-accent hover:text-accent-foreground text-gray-700 dark:text-gray-300 border border-transparent'}
                                `}
                            >
                                {editingCategory?.id === category.id ? (
                                    <form onSubmit={handleUpdateCategory} className="flex gap-2 w-full" onClick={e => e.stopPropagation()}>
                                        <input
                                            autoFocus
                                            type="text"
                                            className="flex-1 p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={editingCategory.name}
                                            onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        />
                                        <button type="submit" className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                                        <button type="button" onClick={() => setEditingCategory(null)} className="text-red-500 hover:text-red-600"><X size={16} /></button>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 min-w-0">
                                            {selectedCategory?.id === category.id ? <FolderOpen size={16} /> : <Folder size={16} />}
                                            <span className="font-medium truncate text-sm">{category.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); fetchProducts('category', category.id, category.name); }}
                                                className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-blue-300 p-1"
                                                title="View Products"
                                            >
                                                <Package size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingCategory(category); }}
                                                className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-300 p-1"
                                                title="Edit"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subcategories Panel - Right Side */}
                <div className="flex flex-col rounded-lg border border-border overflow-hidden bg-background text-foreground">
                    {selectedCategory ? (
                        <>
                            <div className="bg-card text-card-foreground p-4 border-b border-border">
                                <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                    <List size={18} className="text-purple-600 dark:text-purple-400" />
                                    Subcategories
                                </h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    For: <span className="font-semibold text-purple-600 dark:text-purple-400">{selectedCategory.name}</span>
                                </p>
                                <form onSubmit={handleAddSubCategory} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="New subcategory..."
                                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-foreground p-2 text-sm rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={newSubCategoryName}
                                        onChange={(e) => setNewSubCategoryName(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition-colors disabled:opacity-50"
                                        disabled={!newSubCategoryName.trim()}
                                        title="Add Subcategory"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </form>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {subCategories
                                    .filter(sub => sub.categoryId === selectedCategory.id)
                                    .map((subCategory) => (
                                        <div
                                            key={subCategory.id}
                                            className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border border-border hover:border-purple-300 dark:hover:border-purple-700 transition-all group"
                                        >
                                            {editingSubCategory?.id === subCategory.id ? (
                                                <form onSubmit={handleUpdateSubCategory} className="flex gap-2 w-full">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        className="flex-1 p-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                        value={editingSubCategory.name}
                                                        onChange={e => setEditingSubCategory({ ...editingSubCategory, name: e.target.value })}
                                                    />
                                                    <button type="submit" className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                                                    <button type="button" onClick={() => setEditingSubCategory(null)} className="text-red-500 hover:text-red-600"><X size={16} /></button>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <List size={14} className="text-purple-500 dark:text-purple-400 shrink-0" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{subCategory.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => fetchProducts('subcategory', subCategory.id, subCategory.name)}
                                                            className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-blue-300 p-1"
                                                            title="View Products"
                                                        >
                                                            <Package size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingSubCategory(subCategory)}
                                                            className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-300 p-1"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSubCategory(subCategory.id)}
                                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                            <FolderOpen size={48} className="mb-3 opacity-20" />
                            <p className="text-base font-medium">Select a category</p>
                            <p className="text-xs mt-1">Choose a category to manage its subcategories</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Products Viewer Modal/Panel */}
            {viewingProducts && (
                <div className="absolute inset-0 bg-background text-foreground z-10 flex flex-col animate-slideUp">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-muted">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setViewingProducts(null)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Package className="text-primary" />
                                    Products in {viewingProducts.type === 'category' ? 'Category' : 'Subcategory'}: {viewingProducts.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {loadingProducts ? 'Loading...' : `${productsList.length} products found`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {loadingProducts ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : productsList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Package size={48} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium">No products found</p>
                                <p className="text-sm">This {viewingProducts.type} has no products yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {productsList.map(product => (
                                    <div key={product.id} className="bg-card text-card-foreground border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-800 dark:text-white truncate pr-2" title={product.name}>{product.name}</h4>
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                Stock: {product.stock ?? 0}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p className="flex justify-between">
                                                <span>Price:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-200">
                                                    {product.price?.toFixed(2)}
                                                </span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span>SKU:</span>
                                                <span className="font-mono text-xs">{product.skuCode || '-'}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
