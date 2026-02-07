import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export const UnitManager = () => {
    const units = useLiveQuery(() => db.units.toArray());
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', short_name: '', allow_decimal: false });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await db.units.update(editingId, formData);
                setEditingId(null);
            } else {
                await db.units.add(formData);
                setIsAdding(false);
            }
            setFormData({ name: '', short_name: '', allow_decimal: false });
        } catch (error) {
            console.error('Failed to save unit', error);
            alert('Error saving unit. Name might be duplicate.');
        }
    };

    const handleEdit = (unit: any) => {
        setFormData({ name: unit.name, short_name: unit.short_name, allow_decimal: unit.allow_decimal });
        setEditingId(unit.unit_id);
        setIsAdding(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this unit?')) {
            await db.units.delete(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Product Units</h3>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                        <Plus size={16} />
                        Add Unit
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 md:items-end">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Unit Name</label>
                            <input
                                autoFocus
                                required
                                type="text"
                                placeholder="e.g. Pieces"
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Short Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. pc"
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.short_name}
                                onChange={e => setFormData({ ...formData, short_name: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center pb-3">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-200">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    checked={formData.allow_decimal}
                                    onChange={e => setFormData({ ...formData, allow_decimal: e.target.checked })}
                                />
                                Allow Decimals
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                                title="Save"
                            >
                                <Save size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingId(null);
                                    setFormData({ name: '', short_name: '', allow_decimal: false });
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                                title="Cancel"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Short Name</th>
                            <th className="p-3">Allow Decimal</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {units?.map(unit => (
                            <tr key={unit.unit_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 font-medium text-gray-900 dark:text-white">{unit.name}</td>
                                <td className="p-3 text-gray-500 dark:text-gray-400">{unit.short_name}</td>
                                <td className="p-3 text-gray-500 dark:text-gray-400">{unit.allow_decimal ? 'Yes' : 'No'}</td>
                                <td className="p-3 text-right space-x-2">
                                    <button
                                        onClick={() => handleEdit(unit)}
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(unit.unit_id!)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {units?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    No units found. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
