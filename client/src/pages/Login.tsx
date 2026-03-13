import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Store, Lock, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';

import { APP_CONFIG } from '../config/appConfig';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch(getApiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                setError('Invalid credentials');
                return;
            }

            const data = await res.json();
            const apiUser: any = {
                user_id: data.staff.id,
                username: data.staff.name,
                role: data.staff.role
            };
            login(apiUser, data.token);
            if (data.staff.role === 'admin' || data.staff.role === 'manager' || data.staff.role === 'super_admin') {
                if (data.staff.role === 'super_admin') {
                    navigate('/admin/plans');
                    return;
                }
                navigate('/dashboard');
            } else {
                navigate('/pos');
            }
        } catch (err) {
            console.warn('API login error', err);
            setError('Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Left Side - Branding & Visuals */}
            <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

                <div className="relative z-10 text-white max-w-lg">
                    <div className="bg-white/10 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20 shadow-xl">
                        <Store size={32} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight">{APP_CONFIG.appName}</h1>
                    <p className="text-xl text-blue-100 font-light leading-relaxed">
                        The advanced point of sale solution for modern businesses. Manage inventory, sales, and customers with ease.
                    </p>

                    <div className="mt-12 space-y-4">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center text-green-300">
                                <Store size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold">Smart Inventory</h3>
                                <p className="text-sm text-blue-200">Real-time tracking & alerts</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="inline-flex lg:hidden bg-blue-600 p-3 rounded-xl mb-4 text-white">
                            <Store size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4">Demo Credentials</p>
                        <div className="flex flex-wrap justify-center gap-4 text-xs font-mono">
                            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded text-gray-600 dark:text-gray-300">
                                <span className="text-purple-600 font-bold">superadmin</span> / admin123
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded text-gray-600 dark:text-gray-300">
                                <span className="text-blue-600 font-bold">admin</span> / admin123
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded text-gray-600 dark:text-gray-300">
                                <span className="text-green-600 font-bold">cashier</span> / cashier123
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
