import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { db, type Category } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '../store/useToast';

interface CategoryManagerProps {
    onClose: () => void;
}

export const CategoryManager = ({ onClose }: CategoryManagerProps) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const { addToast } = useToast();

    const categories = useLiveQuery(() => db.categories.toArray());
    const subCategories = useLiveQuery(
        () => selectedCategory ? db.sub_categories.where('category_id').equals(selectedCategory.category_id!).toArray() : [],
        [selectedCategory]
    );

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            await db.categories.add({
                name: newCategoryName.trim()
            });
            setNewCategoryName('');
            addToast('Category added', 'success');
        } catch (error) {
            console.error("Error adding category:", error);
            addToast("Failed to add category. Name might be duplicate.", 'error');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (confirm('Are you sure you want to delete this category? All subcategories will also be deleted.')) {
            try {
                await db.transaction('rw', db.categories, db.sub_categories, async () => {
                    await db.sub_categories.where('category_id').equals(id).delete();
                    await db.categories.delete(id);
                });
                if (selectedCategory?.category_id === id) {
                    setSelectedCategory(null);
                }
                addToast('Category deleted', 'success');
            } catch (error) {
                console.error("Error deleting category:", error);
                addToast("Failed to delete category.", 'error');
            }
        }
    };

    const handleAddSubCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubCategoryName.trim() || !selectedCategory) return;

        try {
            await db.sub_categories.add({
                category_id: selectedCategory.category_id!,
                name: newSubCategoryName.trim()
            });
            setNewSubCategoryName('');
            addToast('Subcategory added', 'success');
        } catch (error) {
            console.error("Error adding subcategory:", error);
            addToast("Failed to add subcategory.", 'error');
        }
    };

    const handleDeleteSubCategory = async (id: number) => {
        if (confirm('Delete this subcategory?')) {
            try {
                await db.sub_categories.delete(id);
                addToast('Subcategory deleted', 'success');
            } catch (error) {
                console.error("Error deleting subcategory:", error);
                addToast("Failed to delete subcategory.", 'error');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl h-[600px] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Categories</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Organize your products with categories and subcategories</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Categories List (Left) */}
                    <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <form onSubmit={handleAddCategory} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="New Category..."
                                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-2 text-sm rounded border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
                                    disabled={!newCategoryName.trim()}
                                >
                                    <Plus size={18} />
                                </button>
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {categories?.map((category) => (
                                <div
                                    key={category.category_id}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`
                                        flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all group
                                        ${selectedCategory?.category_id === category.category_id
                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {selectedCategory?.category_id === category.category_id ? <FolderOpen size={18} /> : <Folder size={18} />}
                                        <span className="font-medium truncate">{category.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.category_id!); }}
                                            className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                            title="Delete Category"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <ChevronRight size={16} className={`text-gray-400 ${selectedCategory?.category_id === category.category_id ? 'rotate-90' : ''} transition-transform`} />
                                    </div>
                                </div>
                            ))}
                            {categories?.length === 0 && (
                                <div className="text-gray-400 text-center py-8 text-sm">
                                    No categories yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subcategories List (Right) */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                        {selectedCategory ? (
                            <>
                                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                                        <span className="text-gray-400 font-normal">Category:</span>
                                        {selectedCategory.name}
                                    </h3>
                                    <form onSubmit={handleAddSubCategory} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Add subcategory to ${selectedCategory.name}...`}
                                            className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newSubCategoryName}
                                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                            disabled={!newSubCategoryName.trim()}
                                        >
                                            <Plus size={18} />
                                            Add Subcategory
                                        </button>
                                    </form>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {subCategories?.map((sub) => (
                                            <div key={sub.sub_category_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg group hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                                                <span className="text-gray-700 dark:text-gray-200 font-medium">{sub.name}</span>
                                                <button
                                                    onClick={() => handleDeleteSubCategory(sub.sub_category_id!)}
                                                    className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {subCategories?.length === 0 && (
                                            <div className="col-span-2 text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                                <p>No subcategories found for {selectedCategory.name}.</p>
                                                <p className="text-sm mt-1">Add one above to get started.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                                <FolderOpen size={64} className="mb-4 opacity-20" />
                                <p className="text-lg">Select a category to manage subcategories</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
