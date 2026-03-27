import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrency } from '../../hooks/useCurrency';
import { getApiUrl } from '../../config/api';
import { useToast } from '../../store/useToast';
import { Plus, Search, Filter, Trash2, Edit2, Wallet, Tag, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

export const ExpensesPage = () => {
    const { token } = useAuthStore();
    const { formatCurrency } = useCurrency();
    const { addToast } = useToast();

    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const [newExpense, setNewExpense] = useState({ amount: '', categoryId: '', description: '', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] });
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [expRes, catRes] = await Promise.all([
                fetch(getApiUrl('/expenses'), { headers: { Authorization: `Bearer ${token}` } }),
                fetch(getApiUrl('/expenses/categories'), { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (expRes.ok) setExpenses(await expRes.json());
            if (catRes.ok) setCategories(await catRes.json());
        } catch (error) {
            addToast('Failed to load expenses data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(getApiUrl('/expenses/categories'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newCategory)
            });
            if (res.ok) {
                addToast('Category created', 'success');
                setShowCategoryModal(false);
                setNewCategory({ name: '', description: '' });
                fetchData();
            } else {
                const err = await res.json();
                addToast(err.error || 'Failed to create category', 'error');
            }
        } catch (error) {
            addToast('Network error', 'error');
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(getApiUrl('/expenses'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    amount: Number(newExpense.amount),
                    categoryId: Number(newExpense.categoryId),
                    description: newExpense.description,
                    paymentMethod: newExpense.paymentMethod,
                    date: new Date(newExpense.date).toISOString()
                })
            });
            if (res.ok) {
                addToast('Expense logged successfully', 'success');
                setShowExpenseModal(false);
                setNewExpense({ amount: '', categoryId: '', description: '', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] });
                fetchData();
            } else {
                const err = await res.json();
                addToast(err.error || 'Failed to log expense', 'error');
            }
        } catch (error) {
            addToast('Network error', 'error');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage daily operation costs and view expense history.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowCategoryModal(true)}
                        variant="ghost"
                        className="border dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
                    >
                        <Tag className="w-4 h-4" /> Manage Categories
                    </Button>
                    <Button
                        onClick={() => setShowExpenseModal(true)}
                        variant="primary"
                        className="flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-4 h-4" /> Log Expense
                    </Button>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Bill Number</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">Description</th>
                                <th className="p-4 font-medium">Paid By</th>
                                <th className="p-4 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-10 dark:text-gray-400">Loading...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">No expenses found.</td></tr>
                            ) : (
                                expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 text-sm text-gray-900 dark:text-gray-300">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">#{exp.billNumber}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${exp.category?.name === 'Petty Cash IN'
                                                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800'
                                                    : exp.category?.name === 'Petty Cash OUT'
                                                        ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800'
                                                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                                                }`}>
                                                {exp.category?.name || 'General'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{exp.description}</td>
                                        <td className="p-4 text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">{exp.paymentMethod}</td>
                                        <td className="p-4 text-sm font-bold text-gray-900 dark:text-white text-right">{formatCurrency(exp.amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals...*/}
            {showCategoryModal && (
                <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
                    <DialogContent className="w-full max-w-md p-6" showCloseButton={false}>
                        <DialogHeader className="mb-4">
                            <div className="flex justify-between items-center">
                                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Add Expense Category</DialogTitle>
                                <Button onClick={() => setShowCategoryModal(false)} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </DialogHeader>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input type="text" required value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                <input type="text" value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button type="button" onClick={() => setShowCategoryModal(false)} variant="ghost" fullWidth className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</Button>
                                <Button type="submit" variant="primary" fullWidth>Save Category</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {showExpenseModal && (
                <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
                    <DialogContent className="w-full max-w-md p-6" showCloseButton={false}>
                        <DialogHeader className="mb-4">
                            <div className="flex justify-between items-center">
                                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Log Expense</DialogTitle>
                                <Button onClick={() => setShowExpenseModal(false)} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </DialogHeader>
                        <form onSubmit={handleCreateExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                <input type="number" required min="0.01" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select required value={newExpense.categoryId} onChange={e => setNewExpense({ ...newExpense, categoryId: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                                <select required value={newExpense.paymentMethod} onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="cash">Cash (Deducts from active register)</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="card">Credit Card</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <input type="text" required value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="What was this for?" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                <input type="date" required value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button type="button" onClick={() => setShowExpenseModal(false)} variant="ghost" fullWidth className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</Button>
                                <Button type="submit" variant="primary" fullWidth>Save Expense</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};
