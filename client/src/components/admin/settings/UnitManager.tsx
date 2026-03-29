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
            try {
                if (!token) throw new Error('Missing auth token');
                const response = await fetch(getApiUrl(`/units/${id}`), {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload.error || 'Failed to delete unit');
                }
                setUnits((prev) => prev.filter((unit) => (unit.id || unit.unit_id) !== id));
            } catch (error: any) {
                console.error('Delete unit error:', error);
                alert(error.message || 'Failed to delete unit');
            }
        }
    };

    return (
        <div className="space-y-10 p-2">
            <div className="flex justify-between items-end border-b border-border/50 pb-8">
                <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight italic uppercase">Dimensional Units</h3>
                    <p className="text-xs font-bold text-muted-foreground/60 mt-2 uppercase tracking-widest">Inventory Measurement & Quantity Standards</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-black transition-all shadow-xl shadow-primary/20 hover:shadow-2xl active:scale-95 text-sm uppercase tracking-wider"
                    >
                        <Plus size={20} />
                        New Unit Entry
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-muted/30 p-10 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-4 duration-500 shadow-inner">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Plus size={20} />
                        </div>
                        <h4 className="text-lg font-black text-foreground uppercase tracking-tight">{editingId ? 'Modify Unit Specification' : 'Define New Measurement'}</h4>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Full Unit Name <span className="text-destructive">*</span></label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    placeholder="e.g., Kilograms, Pieces, Liters"
                                    className="w-full h-14 p-4 rounded-xl border border-border bg-background text-foreground text-lg font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-xs"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Symbol / Short Name <span className="text-destructive">*</span></label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., kg, pc, ltr"
                                    className="w-full h-14 p-4 rounded-xl border border-border bg-background text-foreground text-lg font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-xs"
                                    value={formData.short_name}
                                    onChange={e => setFormData({ ...formData, short_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-background p-6 rounded-2xl border border-border shadow-sm">
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.allow_decimal}
                                        onChange={e => setFormData({ ...formData, allow_decimal: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                                <div>
                                    <span className="font-black text-foreground uppercase tracking-tight text-sm">Fractional Inventory</span>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Allow decimal quantities (e.g. 1.5kg)</p>
                                </div>
                            </label>
                            
                            <div className="flex gap-5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingId(null);
                                        setFormData({ name: '', short_name: '', allow_decimal: false });
                                    }}
                                    className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-10 py-4 rounded-xl font-black transition-all text-sm uppercase"
                                >
                                    <X size={18} />
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-12 py-4 rounded-xl font-black transition-all shadow-2xl shadow-primary/30 active:scale-95 text-sm uppercase"
                                >
                                    <Save size={18} />
                                    {editingId ? 'Update Unit' : 'Save Unit'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/20 border-b border-border">
                            <th className="p-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.3em]">Measurement Type</th>
                            <th className="p-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.3em]">Internal Symbol</th>
                            <th className="p-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.3em] text-center">Precision Logic</th>
                            <th className="p-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.3em] text-right">Control Hub</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {units?.map(unit => (
                            <tr key={unit.id || unit.unit_id} className="group hover:bg-primary/[0.02] transition-colors">
                                <td className="p-8">
                                    <span className="font-black text-foreground text-xl tracking-tight uppercase leading-none">{unit.name}</span>
                                </td>
                                <td className="p-8">
                                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-black bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800 uppercase tracking-widest leading-none">
                                        {unit.shortName || unit.short_name}
                                    </span>
                                </td>
                                <td className="p-8 text-center">
                                    {(unit.allowDecimal ?? unit.allow_decimal) ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 uppercase tracking-wider">High Precision</span>
                                            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase">Decimals Allowed</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 uppercase tracking-wider">Discrete</span>
                                            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase">Integers Only</span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-8 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(unit)}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-muted hover:bg-primary hover:text-white text-muted-foreground transition-all duration-300"
                                            title="Edit Unit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(unit.id || unit.unit_id)}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-muted hover:bg-destructive hover:text-white text-muted-foreground transition-all duration-300"
                                            title="Delete Unit"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!units || units.length === 0) && (
                            <tr>
                                <td colSpan={4} className="p-32 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-6">
                                        <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center text-muted-foreground/20">
                                            <Plus size={48} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-foreground font-black text-2xl uppercase tracking-tighter italic">No Metrics Found</p>
                                            <p className="text-muted-foreground/50 text-xs font-bold uppercase tracking-widest">Define your first measurement standard to continue.</p>
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
