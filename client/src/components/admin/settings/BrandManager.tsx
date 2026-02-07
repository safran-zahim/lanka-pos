import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export const BrandManager = () => {
    const brands = useLiveQuery(() => db.brands.toArray());
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await db.brands.update(editingId, formData);
                setEditingId(null);
            } else {
                await db.brands.add(formData);
                setIsAdding(false);
            }
            setFormData({ name: '', description: '' });
        } catch (error) {
            console.error('Failed to save brand', error);
            alert('Error saving brand. Name might be duplicate.');
        }
    };

    const handleEdit = (brand: any) => {
        setFormData({ name: brand.name, description: brand.description || '' });
        setEditingId(brand.brand_id);
        setIsAdding(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this brand?')) {
            await db.brands.delete(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Product Brands</h3>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                        <Plus size={16} />
                        Add Brand
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Brand Name *</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    placeholder="e.g. Nike, Apple, Samsung"
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Description</label>
                                <input
                                    type="text"
                                    placeholder="Optional description"
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                            >
                                <Save size={18} />
                                {editingId ? 'Update' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingId(null);
                                    setFormData({ name: '', description: '' });
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2"
                            >
                                <X size={18} />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                            <th className="p-3">Brand Name</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {brands?.map(brand => (
                            <tr key={brand.brand_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 font-medium text-gray-900 dark:text-white">{brand.name}</td>
                                <td className="p-3 text-gray-500 dark:text-gray-400">{brand.description || '-'}</td>
                                <td className="p-3 text-right space-x-2">
                                    <button
                                        onClick={() => handleEdit(brand)}
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(brand.brand_id!)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {brands?.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    No brands found. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
