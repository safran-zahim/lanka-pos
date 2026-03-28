import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Store, Lock, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { APP_CONFIG } from '../config/appConfig';

// shadcn components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubscriptionBlocked, setIsSubscriptionBlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubscriptionBlocked(false);
        setIsLoading(true);

        try {
            const res = await fetch(getApiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 403 && data.code === 'SUBSCRIPTION_BLOCKED') {
                    setIsSubscriptionBlocked(true);
                    setError(data.error || 'System subscription is inactive. Please contact your developer.');
                } else {
                    setError('Invalid credentials');
                }
                setIsLoading(false);
                return;
            }

            const apiUser: any = {
                user_id: data.staff.id,
                username: data.staff.name,
                role: data.staff.role,
                subscription_status: data.subscriptionStatus || 'active'
            };
            login(apiUser, data.token);

            if (data.staff.role === 'super_admin') {
                navigate('/admin/system-subscription');
            } else if (data.staff.role === 'admin' || data.staff.role === 'manager') {
                navigate('/dashboard');
            } else {
                navigate('/pos');
            }
        } catch (err) {
            console.warn('API login error', err);
            setError('Login failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Left Side - Branding & Visuals */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

                <div className="relative z-10 text-white max-w-lg">
                    <div className="bg-white/10 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20 shadow-xl">
                        <Store size={32} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight">{APP_CONFIG.appName}</h1>
                    <p className="text-xl text-primary-100 font-light leading-relaxed">
                        The advanced point of sale solution for modern businesses. Manage inventory, sales, and customers with ease.
                    </p>

                    <div className="mt-12 space-y-4">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-accent-400/20 flex items-center justify-center text-accent-300">
                                <Store size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold">Smart Inventory</h3>
                                <p className="text-sm text-primary-200">Real-time tracking & alerts</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <div className="inline-flex lg:hidden bg-primary-600 p-3 rounded-xl mb-4 text-white">
                            <Store size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please enter your details to sign in.</p>
                    </div>

                    <Card className="border-gray-200 dark:border-gray-700">
                        <CardContent className="pt-6">
                            <form onSubmit={handleLogin} className="space-y-6">
                                {/* Error Alert */}
                                {error && (
                                    <Alert variant={isSubscriptionBlocked ? "destructive" : "destructive"}>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Authentication Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                        <Input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Enter your username"
                                            disabled={isLoading}
                                            className="rounded-lg"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                            className="rounded-lg"
                                            icon={<Lock size={18} />}
                                        />
                                    </div>
                                </div>

                                {/* Remember & Forgot */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="remember" />
                                        <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                                            Remember me
                                        </label>
                                    </div>
                                    <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                                        Forgot password?
                                    </a>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !username || !password}
                                    className="w-full h-11 rounded-lg font-semibold bg-primary-600 hover:bg-primary-700 dark:bg-primary-600"
                                >
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Demo Credentials */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4 font-semibold">Demo Credentials</p>
                        <div className="space-y-2 text-xs">
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-md text-gray-600 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-700">
                                <span className="text-primary-600 font-bold">superadmin</span> / admin123
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-md text-gray-600 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-700">
                                <span className="text-primary-600 font-bold">admin</span> / admin123
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-md text-gray-600 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-700">
                                <span className="text-accent-600 font-bold">cashier</span> / cashier123
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
