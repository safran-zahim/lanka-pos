import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getApiUrl } from '../../../config/api';

interface UnitManagerProps {
    onUnitCreated?: (unit: any) => void;
}

export const UnitManager = ({ onUnitCreated }: UnitManagerProps = {}) => {
    const token = useAuthStore((state) => state.token);
    const [units, setUnits] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', short_name: '', allow_decimal: false });

    useEffect(() => {
        const loadUnits = async () => {
            if (!token) return;
            try {
                const response = await fetch(getApiUrl('/units'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to load units');
                const payload = await response.json();
                setUnits(payload || []);
            } catch (error) {
                console.error('Failed to load units', error);
            }
        };

        loadUnits();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!token) throw new Error('Missing auth token');
            if (editingId) {
                const response = await fetch(getApiUrl(`/units/${editingId}`), {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        shortName: formData.short_name,
                        allowDecimal: formData.allow_decimal
                    })
                });
                if (!response.ok) throw new Error('Failed to update unit');
                const updated = await response.json();
                setUnits((prev) => prev.map((unit) => (unit.id === editingId ? updated : unit)));
                setEditingId(null);
            } else {
                const response = await fetch(getApiUrl('/units'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        shortName: formData.short_name,
                        allowDecimal: formData.allow_decimal
                    })
                });
                if (!response.ok) throw new Error('Failed to create unit');
                const created = await response.json();
                setUnits((prev) => [...prev, created]);
                setIsAdding(false);
                // Notify parent component if callback provided
                if (onUnitCreated) {
                    onUnitCreated(created);
                }
            }
            setFormData({ name: '', short_name: '', allow_decimal: false });
        } catch (error) {
            console.error('Failed to save unit', error);
            alert('Error saving unit. Name might be duplicate.');
        }
    };

    const handleEdit = (unit: any) => {
        setFormData({
            name: unit.name,
            short_name: unit.shortName || unit.short_name || '',
            allow_decimal: unit.allowDecimal ?? unit.allow_decimal
        });
        setEditingId(unit.id || unit.unit_id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this unit?')) {
            if (!token) return;
            await fetch(getApiUrl(`/units/${id}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnits((prev) => prev.filter((unit) => unit.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unit Library</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure units of measurement (kg, pieces, liters, etc.)</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl"
                    >
                        <Plus size={18} />
                        Add New Unit
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 animate-fadeIn shadow-lg">
                    <h4 className="text-md font-bold text-gray-800 dark:text-white mb-4">{editingId ? 'Edit Unit' : 'Create New Unit'}</h4>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Unit Name *</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    placeholder="e.g., Pieces, Kilograms, Liters"
                                    className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Short Name *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., pc, kg, ltr"
                                    className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={formData.short_name}
                                    onChange={e => setFormData({ ...formData, short_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    checked={formData.allow_decimal}
                                    onChange={e => setFormData({ ...formData, allow_decimal: e.target.checked })}
                                />
                                <div>
                                    <span className="font-semibold text-gray-900 dark:text-white">Allow Decimal Values</span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Enable for units like kg, ltr (e.g., 1.5 kg)</p>
                                </div>
                            </label>
                            <div className="flex gap-3">
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
                                        setFormData({ name: '', short_name: '', allow_decimal: false });
                                    }}
                                    className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-all"
                                >
                                    <X size={18} />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-md">
                <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800">
                        <tr>
                            <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">Unit Name</th>
                            <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">Short Name</th>
                            <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider text-center">Decimal Support</th>
                            <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {units?.map(unit => (
                            <tr key={unit.id || unit.unit_id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-semibold text-gray-900 dark:text-white text-base">{unit.name}</td>
                                <td className="p-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {unit.shortName || unit.short_name}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    {(unit.allowDecimal ?? unit.allow_decimal) ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Yes</span>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">No</span>
                                    )}
                                </td>
                                <td className="p-4 text-right space-x-3">
                                    <button
                                        onClick={() => handleEdit(unit)}
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                                        title="Edit Unit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(unit.id || unit.unit_id)}
                                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                                        title="Delete Unit"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {units?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                            <Plus size={32} className="text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 dark:text-white font-semibold text-lg">No units found</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Click "Add New Unit" to create your first unit</p>
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
