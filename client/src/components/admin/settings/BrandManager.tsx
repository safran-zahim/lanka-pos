import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Award } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getApiUrl } from '../../../config/api';

interface BrandManagerProps {
    onBrandCreated?: (brand: any) => void;
}

export const BrandManager = ({ onBrandCreated }: BrandManagerProps = {}) => {
    const token = useAuthStore((state) => state.token);
    const [brands, setBrands] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        const loadBrands = async () => {
            if (!token) return;
            try {
                const response = await fetch(getApiUrl('/brands'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to load brands');
                const payload = await response.json();
                setBrands(payload || []);
            } catch (error) {
                console.error('Failed to load brands', error);
            }
        };

        loadBrands();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!token) throw new Error('Missing auth token');
            if (editingId) {
                const response = await fetch(getApiUrl(`/brands/${editingId}`), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                if (!response.ok) throw new Error('Failed to update brand');
                const updated = await response.json();
                setBrands((prev) => prev.map((brand) => (brand.id === editingId ? updated : brand)));
                setEditingId(null);
                setIsAdding(false);
            } else {
                const response = await fetch(getApiUrl('/brands'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                if (!response.ok) throw new Error('Failed to create brand');
                const created = await response.json();
                setBrands((prev) => [...prev, created]);
                setIsAdding(false);
                // Notify parent component if callback provided
                if (onBrandCreated) {
                    onBrandCreated(created);
                }
            }
            setFormData({ name: '', description: '' });
        } catch (error) {
            console.error('Failed to save brand', error);
            alert('Error saving brand. Name might be duplicate.');
        }
    };

    const handleEdit = (brand: any) => {
        setFormData({ name: brand.name, description: brand.description || '' });
        setEditingId(brand.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this brand?')) {
            if (!token) return;
            await fetch(getApiUrl(`/brands/${id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrands((prev) => prev.filter((brand) => brand.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Brand Library</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage brands & manufacturers</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl"
                    >
                        <Plus size={18} />
                        Add New Brand
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 animate-fadeIn shadow-lg">
                    <h4 className="text-md font-bold text-gray-800 dark:text-white mb-4">{editingId ? 'Edit Brand' : 'Create New Brand'}</h4>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand Name *</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    placeholder="e.g., Nike, Apple, Samsung"
                                    className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</label>
                                <input
                                    type="text"
                                    placeholder="Optional description"
                                    className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
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
                                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-all"
                            >
                                <X size={18} />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-md">
                <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800">
                        <tr>
                            <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">Brand Name</th>
                            <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">Description</th>
                            <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {brands?.map(brand => (
                            <tr key={brand.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                            <Award size={20} className="text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="font-semibold text-gray-900 dark:text-white text-base">{brand.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-400">{brand.description || '-'}</td>
                                <td className="p-4 text-right space-x-3">
                                    <button
                                        onClick={() => handleEdit(brand)}
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                                        title="Edit Brand"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(brand.id)}
                                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                                        title="Delete Brand"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {brands?.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                            <Award size={32} className="text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 dark:text-white font-semibold text-lg">No brands found</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Click "Add New Brand" to create your first brand</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
