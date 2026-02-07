import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db, type Customer } from '../../db/db';
import { Plus, Trash2, Edit2, Search, Users, Eye, Filter, RotateCcw } from 'lucide-react';
import { CustomerModal } from '../../components/admin/CustomerModal';
import { useToast } from '../../store/useToast';

export const CustomerList = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const customers = useLiveQuery(() => db.customers.toArray());
    const [search, setSearch] = useState('');
    const [minPoints, setMinPoints] = useState('');
    const [minSpend, setMinSpend] = useState('');
    const [emailFilter, setEmailFilter] = useState<'all' | 'with' | 'without'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'points' | 'spend'>('name');
    const [modalState, setModalState] = useState<{ show: boolean; customer: Customer | null }>({
        show: false,
        customer: null
    });

    const filtered = customers
        ?.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search) ||
            (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
        )
        .filter(c => {
            const pointsOk = minPoints ? c.loyalty_points_balance >= Number(minPoints) : true;
            const spendOk = minSpend ? c.total_spend_to_date >= Number(minSpend) : true;
            const emailOk = emailFilter === 'all'
                ? true
                : emailFilter === 'with'
                    ? !!c.email
                    : !c.email;
            return pointsOk && spendOk && emailOk;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'points') return b.loyalty_points_balance - a.loyalty_points_balance;
            return b.total_spend_to_date - a.total_spend_to_date;
        });

    const handleRowClick = (customer: Customer) => {
        navigate(`/admin/customers/${customer.customer_id}`);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
        try {
            await db.customers.delete(id);
            addToast('Customer deleted successfully', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to delete customer.', 'error');
        }
    };

    const handleViewProfile = (e: React.MouseEvent, customer: Customer) => {
        e.stopPropagation();
        navigate(`/admin/customers/${customer.customer_id}`);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Users className="text-blue-600" />
                    Customers
                </h1>
                <button
                    onClick={() => setModalState({ show: true, customer: null })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Customer
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                    <div className="relative lg:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, phone or email"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            min="0"
                            placeholder="Min points"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600"
                            value={minPoints}
                            onChange={(e) => setMinPoints(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="number"
                            min="0"
                            placeholder="Min spend"
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600"
                            value={minSpend}
                            onChange={(e) => setMinSpend(e.target.value)}
                        />
                    </div>
                    <div>
                        <select
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600"
                            value={emailFilter}
                            onChange={(e) => setEmailFilter(e.target.value as 'all' | 'with' | 'without')}
                        >
                            <option value="all">All Emails</option>
                            <option value="with">With Email</option>
                            <option value="without">No Email</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Filter size={16} /> Advanced filters
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'name' | 'points' | 'spend')}
                        >
                            <option value="name">Sort: Name</option>
                            <option value="points">Sort: Points</option>
                            <option value="spend">Sort: Spend</option>
                        </select>
                        <button
                            onClick={() => {
                                setSearch('');
                                setMinPoints('');
                                setMinSpend('');
                                setEmailFilter('all');
                                setSortBy('name');
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-600 dark:text-gray-300">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold tracking-wider border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4 text-right">Points</th>
                                <th className="px-6 py-4 text-right">Total Spend</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filtered?.map(c => (
                                <tr
                                    key={c.customer_id}
                                    onClick={() => handleRowClick(c)}
                                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {c.name}
                                        <div className="text-xs text-gray-400">CUS-{String(c.customer_id).padStart(4, '0')}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{c.phone}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{c.email || '-'}</td>
                                    <td className="px-6 py-4 text-right">{c.loyalty_points_balance}</td>
                                    <td className="px-6 py-4 text-right">{c.total_spend_to_date.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => handleViewProfile(e, c)}
                                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                title="View Profile"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(c); }}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, c.customer_id!)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Components */}
            {modalState.show && (
                <CustomerModal
                    customer={modalState.customer}
                    onClose={() => setModalState({ show: false, customer: null })}
                    onSuccess={() => {
                        addToast(modalState.customer ? 'Customer profile updated' : 'New customer profile created', 'success');
                    }}
                />
            )}

        </div>
    );
};
