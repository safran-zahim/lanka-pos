import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Supplier } from '../../db/db';
import { Plus, Edit2, Trash2, Search, Truck, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useToast } from '../../store/useToast';

export const SupplierManager = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState<Partial<Supplier>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const suppliers = useLiveQuery(() => db.suppliers.toArray());

    const filteredSuppliers = suppliers?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await db.suppliers.update(editingSupplier.supplier_id!, formData);
                addToast('Supplier updated successfully', 'success');
            } else {
                await db.suppliers.add(formData as Supplier);
                addToast('Supplier added successfully', 'success');
            }
            closeModal();
        } catch (error) {
            console.error('Error saving supplier:', error);
            addToast('Failed to save supplier', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            try {
                await db.suppliers.delete(id);
                addToast('Supplier deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting supplier:', error);
                addToast('Failed to delete supplier', 'error');
            }
        }
    };

    const openModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({});
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setFormData({});
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Truck className="text-blue-600" />
                    Supplier Management
                </h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Supplier
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search suppliers..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers?.map((supplier) => (
                    <div
                        key={supplier.supplier_id}
                        onClick={() => navigate(`/admin/suppliers/${supplier.supplier_id}`)}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    {supplier.name}
                                    <Eye size={14} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                                </h3>
                                {(supplier.contact_person) && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact: {supplier.contact_person}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openModal(supplier);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(supplier.supplier_id!);
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                            {supplier.phone && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Phone:</span> {supplier.phone}
                                </div>
                            )}
                            {supplier.email && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Email:</span> {supplier.email}
                                </div>
                            )}
                            {supplier.address && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Address:</span> {supplier.address}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredSuppliers?.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">
                        No suppliers found.
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.contact_person || ''}
                                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.phone || ''}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                <textarea
                                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    rows={3}
                                    value={formData.address || ''}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                                >
                                    Save Supplier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
