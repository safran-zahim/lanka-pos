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
            try {
                if (!token) throw new Error('Missing auth token');
                const response = await fetch(getApiUrl(`/brands/${id}`), {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload.error || 'Failed to delete brand');
                }
                setBrands((prev) => prev.filter((brand) => brand.id !== id));
            } catch (error: any) {
                console.error('Delete brand error:', error);
                alert(error.message || 'Failed to delete brand');
            }
        }
    };

    return (
        <div className="space-y-10 p-2">
            <div className="flex justify-between items-end border-b border-border/50 pb-8">
                <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight italic uppercase">Brand Collection</h3>
                    <p className="text-xs font-bold text-muted-foreground/60 mt-2 uppercase tracking-widest">Global Manufacturers & Label Management</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-black transition-all shadow-xl shadow-primary/20 hover:shadow-2xl active:scale-95 text-sm uppercase tracking-wider"
                    >
                        <Plus size={20} />
                        New Brand Entry
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-muted/30 p-10 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-4 duration-500 shadow-inner">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Plus size={20} />
                        </div>
                        <h4 className="text-lg font-black text-foreground uppercase tracking-tight">{editingId ? 'Modify Brand Specification' : 'Register New Brand'}</h4>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Official Name <span className="text-destructive">*</span></label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    placeholder="e.g., Nike, Apple, Samsung"
                                    className="w-full h-14 p-4 rounded-xl border border-border bg-background text-foreground text-lg font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-xs"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Background / Notes</label>
                                <input
                                    type="text"
                                    placeholder="Brief brand history or category..."
                                    className="w-full h-14 p-4 rounded-xl border border-border bg-background text-foreground text-lg font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-xs"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-5 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingId(null);
                                    setFormData({ name: '', description: '' });
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
                                {editingId ? 'Update Brand' : 'Save Brand'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/20 border-b border-border">
                            <th className="p-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.3em]">Brand Identity</th>
                            <th className="p-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.3em]">Meta Description</th>
                            <th className="p-8 font-black text-muted-foreground text-[10px] uppercase tracking-[0.3em] text-right">Control Hub</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {brands?.map(brand => (
                            <tr key={brand.id} className="group hover:bg-primary/[0.02] transition-colors">
                                <td className="p-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <span className="font-black text-foreground text-xl tracking-tight leading-none block mb-1">{brand.name}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Registered ID: #{String(brand.id).slice(-4)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <p className="text-muted-foreground/70 font-medium text-base italic max-w-md line-clamp-2">
                                        {brand.description || 'No descriptive metadata provided.'}
                                    </p>
                                </td>
                                <td className="p-8 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(brand)}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-muted hover:bg-primary hover:text-white text-muted-foreground transition-all duration-300"
                                            title="Edit Brand"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(brand.id)}
                                            className="w-12 h-12 flex items-center justify-center rounded-xl bg-muted hover:bg-destructive hover:text-white text-muted-foreground transition-all duration-300"
                                            title="Delete Brand"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!brands || brands.length === 0) && (
                            <tr>
                                <td colSpan={3} className="p-32 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-6">
                                        <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center text-muted-foreground/20">
                                            <Award size={48} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-foreground font-black text-2xl uppercase tracking-tighter italic">Vault is Empty</p>
                                            <p className="text-muted-foreground/50 text-xs font-bold uppercase tracking-widest">No brand partners have been registered yet.</p>
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
