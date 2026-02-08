import { useState, useEffect } from 'react';
import { Package, Check, X, Edit, Save } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number | string;
    duration: number;
    features: string[];
    active: boolean;
}

const AVAILABLE_FEATURES = [
    'Reporting',
    'Inventory Management',
    'Customer CRM',
    'Multi-User Support',
    'API Access',
    'Email Notifications',
    'Backup & Restore'
];

export const SubscriptionPlans = () => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});
    const token = useAuthStore((state) => state.token); // Assuming token is stored in auth store, if not handle via fetch wrapper

    const fetchPlans = async () => {
        try {
            const response = await fetch('/subscription/plans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPlans(data);
            }
        } catch (error) {
            console.error('Failed to fetch plans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleEdit = (plan: SubscriptionPlan) => {
        setEditingId(plan.id);
        setEditForm({
            price: plan.price,
            features: [...plan.features],
            active: plan.active
        });
    };

    const handleSave = async (id: string) => {
        try {
            const response = await fetch(`/subscription/plans/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                setEditingId(null);
                fetchPlans();
            }
        } catch (error) {
            console.error('Failed to update plan', error);
        }
    };

    const toggleFeature = (feature: string) => {
        setEditForm(prev => {
            const features = prev.features || [];
            if (features.includes(feature)) {
                return { ...prev, features: features.filter(f => f !== feature) };
            } else {
                return { ...prev, features: [...features, feature] };
            }
        });
    };

    const toggleActive = async (plan: SubscriptionPlan) => {
        try {
            const response = await fetch(`/subscription/plans/${plan.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ active: !plan.active })
            });

            if (response.ok) {
                fetchPlans();
            }
        } catch (error) {
            console.error('Failed to toggle active', error);
        }
    };

    if (loading) return <div className="p-8">Loading plans...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage available subscription plans and features</p>
                </div>
                {/* Add Create Plan button later if needed */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${!plan.active ? 'border-red-200 dark:border-red-900 opacity-75' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {editingId === plan.id ? (
                                            <input
                                                type="number"
                                                value={editForm.price}
                                                onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                                className="w-24 p-1 border rounded"
                                            />
                                        ) : (
                                            `$${Number(plan.price).toFixed(2)}`
                                        )}
                                        <span className="text-xs ml-1">/{plan.duration} days</span>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${plan.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {plan.active ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Features</h4>
                                <div className="space-y-2">
                                    {editingId === plan.id ? (
                                        AVAILABLE_FEATURES.map(feature => (
                                            <label key={feature} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.features?.includes(feature)}
                                                    onChange={() => toggleFeature(feature)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                                            </label>
                                        ))
                                    ) : (
                                        plan.features.length > 0 ? (
                                            plan.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Check size={14} className="text-green-500" />
                                                    {feature}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-400 italic">No features enabled</div>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                {editingId === plan.id ? (
                                    <>
                                        <button
                                            onClick={() => handleSave(plan.id)}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                                        >
                                            <Save size={16} /> Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 flex items-center justify-center gap-2"
                                        >
                                            <X size={16} /> Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleEdit(plan)}
                                            className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
                                        >
                                            <Edit size={16} /> Edit
                                        </button>
                                        <button
                                            onClick={() => toggleActive(plan)}
                                            className={`flex-1 px-4 py-2 rounded flex items-center justify-center gap-2 text-white ${plan.active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                        >
                                            {plan.active ? 'Disable' : 'Enable'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {plans.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Plans Found</h3>
                        <p className="text-gray-500 mb-4">You haven't created any subscription plans yet.</p>
                        {/* <button className="bg-blue-600 text-white px-4 py-2 rounded">Create Plan</button> */}
                    </div>
                )}
            </div>
        </div>
    );
};
