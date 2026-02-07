import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Plus, Search, Shield, Trash2, Key } from 'lucide-react';
import { AddUserModal } from '../../components/admin/AddUserModal';
import { ResetPasswordModal } from '../../components/admin/ResetPasswordModal';
import { useToast } from '../../store/useToast';
import { useAuthStore } from '../../store/useAuthStore';

export const UserList = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [resettingUser, setResettingUser] = useState<{ user_id?: number, username: string } | null>(null);
    const { addToast } = useToast();
    const { user: currentUser } = useAuthStore();

    const users = useLiveQuery(
        () => db.users.toArray()
    );

    const filteredUsers = users?.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto transition-colors">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Staff Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage system access and roles</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm transition-colors"
                >
                    <Plus size={20} />
                    <span>Add User</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6 flex items-center space-x-4 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search staff..."
                    className="bg-transparent border-none focus:outline-none text-gray-900 dark:text-white w-full placeholder-gray-500 dark:placeholder-gray-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers?.map(user => (
                    <div key={user.user_id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col items-center text-center transition-colors">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-300 mb-4 transition-colors">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user.username}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 flex items-center space-x-1 ${user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800' :
                            user.role === 'manager' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                                'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                            }`}>
                            <Shield size={12} />
                            <span>{user.role}</span>
                        </div>

                        <div className="w-full border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>ID: #{user.user_id}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setResettingUser(user)}
                                    className="p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                                    title="Reset Password"
                                >
                                    <Key size={16} />
                                </button>
                                <button
                                    onClick={async () => {
                                        if (user.user_id === currentUser?.user_id) {
                                            addToast("You cannot delete your own account!", 'error');
                                            return;
                                        }
                                        if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
                                            try {
                                                await db.users.delete(user.user_id!);
                                                addToast("User deleted successfully", 'success');
                                            } catch (error) {
                                                console.error(error);
                                                addToast("Failed to delete user", 'error');
                                            }
                                        }
                                    }}
                                    className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                    title="Remove User"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => addToast('User Added Successfully!', 'success')}
                />
            )}

            {resettingUser && (
                <ResetPasswordModal
                    user={resettingUser}
                    onClose={() => setResettingUser(null)}
                    onSuccess={() => { }}
                />
            )}
        </div>
    );
};
