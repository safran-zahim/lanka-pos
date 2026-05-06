import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/useAuthStore';
import { Store, Lock, AlertCircle, ArrowRight, ShieldCheck, Zap, BarChart3, User } from 'lucide-react';
import { getApiUrl } from '../config/api';
import { APP_CONFIG } from '../config/appConfig';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type LoginFormData = {
    username: string;
    password: string;
};

export const Login = () => {
    const [error, setError] = useState('');
    const [isSubscriptionBlocked, setIsSubscriptionBlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const form = useForm<LoginFormData>({
        defaultValues: {
            username: '',
            password: '',
        }
    });

    const onSubmit = async (data: LoginFormData) => {
        setError('');
        setIsSubscriptionBlocked(false);
        setIsLoading(true);

        try {
            const res = await fetch(getApiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: data.username, password: data.password })
            });

            const responseData = await res.json();

            if (!res.ok) {
                if (res.status === 403 && responseData.code === 'SUBSCRIPTION_BLOCKED') {
                    setIsSubscriptionBlocked(true);
                    setError(responseData.error || 'System subscription is inactive. Please contact your developer.');
                } else {
                    setError('Invalid credentials');
                }
                setIsLoading(false);
                return;
            }

            const apiUser: any = {
                user_id: responseData.staff.id,
                username: responseData.staff.name,
                role: responseData.staff.role,
                subscription_status: responseData.subscriptionStatus || 'active'
            };

            login(apiUser, responseData.token);

            if (apiUser.role === 'super_admin') {
                navigate('/admin/system-subscription');
            } else if (apiUser.role === 'admin' || apiUser.role === 'manager') {
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
        <div className="min-h-screen flex bg-background font-sans selection:bg-primary/30">
            {/* Left Side - Deep Dark Modern Branding & Visuals */}
            <div className="hidden lg:flex flex-col w-[55%] relative overflow-hidden items-center justify-center p-16 bg-slate-950">
                {/* Dynamic Floating Orbs / Glassmorphism Background layer */}
                <div className="absolute top-[-20%] left-[-10%] w-200 h-200 rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-8000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-150 h-150 rounded-full bg-violet-600/20 blur-[150px] mix-blend-screen pointer-events-none" />
                
                {/* Subtle Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />

                <div className="relative z-10 w-full max-w-lg">
                    {/* Animated Brand Logo */}
                    <div className="w-20 h-20 mb-10 rounded-2xl bg-linear-to-tr from-blue-600 to-violet-600 p-0.5 shadow-2xl shadow-blue-500/20 transform hover:-translate-y-2 transition-all duration-500 cursor-default">
                        <div className="w-full h-full rounded-2xl bg-slate-950/90 backdrop-blur-xl flex items-center justify-center">
                            <Store size={36} className="text-blue-400" />
                        </div>
                    </div>

                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-linear-to-br from-white via-white to-white/60 mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {APP_CONFIG.appName}
                    </h1>
                    <p className="text-xl text-slate-300/80 font-medium leading-relaxed mb-12 max-w-md animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
                        The ultimate retail operating system. Built for speed, massive scale, and breathtaking modern experiences.
                    </p>
                    
                    {/* Features list */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                <Zap size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Lightning Fast POS</h3>
                                <p className="text-sm text-slate-400">Process complex carts with near-zero latency</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                                <BarChart3 size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Deep Analytics</h3>
                                <p className="text-sm text-slate-400">Actionable intelligence for retail dominance</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Enterprise Security</h3>
                                <p className="text-sm text-slate-400">Role-based rigorous access & audit logging</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Premium Login Form */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Subtle right-side lighting orb */}
                <div className="absolute top-0 right-0 w-125 h-125 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-60 pointer-events-none" />

                <div className="w-full max-w-105 relative z-10 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="mx-auto lg:mx-0 inline-flex lg:hidden w-16 h-16 mb-6 rounded-2xl bg-linear-to-tr from-blue-600 to-violet-600 p-0.5 shadow-xl">
                            <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                                <Store size={28} className="text-primary" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">Welcome Back</h2>
                        <p className="text-muted-foreground text-base">Sign in to your workspace to continue.</p>
                    </div>

                    <div className="bg-card/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-black/20 rounded-3xl p-8 transition-all hover:bg-card/50">
                        {error && (
                            <Alert variant={isSubscriptionBlocked ? "destructive" : "destructive"} className="mb-6 bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
                                <AlertCircle className="h-5 w-5" />
                                <AlertTitle className="font-bold">Authentication Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-5">
                                    <FormField 
                                        control={form.control}
                                        name="username"
                                        rules={{ required: "Username is required" }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground font-semibold">Username</FormLabel>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                            <User size={18} />
                                                        </div>
                                                        <Input 
                                                            {...field} 
                                                            placeholder="admin" 
                                                            disabled={isLoading}
                                                            className="pl-10 h-12 bg-background/50 border-input hover:border-border focus:border-primary focus:ring-primary/20 rounded-xl transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField 
                                        control={form.control}
                                        name="password"
                                        rules={{ required: "Password is required" }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between mb-2">
                                                    <FormLabel className="text-foreground font-semibold m-0">Password</FormLabel>
                                                    <a href="#" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                                                        Forgot password?
                                                    </a>
                                                </div>
                                                <FormControl>
                                                    <div className="relative group">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                            <Lock size={18} />
                                                        </div>
                                                        <Input 
                                                            {...field} 
                                                            type="password"
                                                            placeholder="••••••••" 
                                                            disabled={isLoading}
                                                            className="pl-10 h-12 bg-background/50 border-input hover:border-border focus:border-primary focus:ring-primary/20 rounded-xl transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !form.formState.isValid}
                                    className="w-full h-12 text-base font-extrabold bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-xl shadow-blue-500/20 border-0 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
                                >
                                    {/* Shine reflection effect */}
                                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                    
                                    <span className="relative flex items-center justify-center">
                                        {isLoading ? (
                                            'Authenticating...'
                                        ) : (
                                            <>Sign In <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" /></>
                                        )}
                                    </span>
                                </Button>
                            </form>
                        </Form>
                    </div>

                    {/* Minimalist Demo Credentials */}
                    <div className="mt-8">
                        <p className="text-xs text-center text-muted-foreground mb-4 font-bold uppercase tracking-wider">Demo Access</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <button
                                type="button" 
                                onClick={() => { form.setValue('username', 'superadmin'); form.setValue('password', 'admin123'); }}
                                className="bg-card/40 hover:bg-card border border-border/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all hover:-translate-y-0.5 shadow-sm group"
                            >
                                <span className="font-extrabold text-foreground group-hover:text-primary transition-colors">Super Admin</span>
                                <span className="text-muted-foreground scale-90">admin123</span>
                            </button>
                            <button
                                type="button" 
                                onClick={() => { form.setValue('username', 'cashier'); form.setValue('password', 'cashier123'); }}
                                className="bg-card/40 hover:bg-card border border-border/50 p-3 rounded-xl flex flex-col items-center justify-center transition-all hover:-translate-y-0.5 shadow-sm group"
                            >
                                <span className="font-extrabold text-foreground group-hover:text-violet-500 transition-colors">Cashier</span>
                                <span className="text-muted-foreground scale-90">cashier123</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
