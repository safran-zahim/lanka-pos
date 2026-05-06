import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, Package, DollarSign, Calendar, Shield, Users, ArrowUpRight, ArrowDownRight, Activity, ShoppingCart, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { useAuthStore } from '../store/useAuthStore';
import { getApiUrl } from '../config/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title as ChartTitle,
    Tooltip,
    Legend,
    Filler,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ChartTitle,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

export const Dashboard = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [shiftData, setShiftData] = useState<any>(null);
    const [subInfo, setSubInfo] = useState<any>(null);

    const subscriptionStatus = String(user?.subscription_status || 'active').toLowerCase();
    const isSubscriptionInactive = user?.role !== 'super_admin' && subscriptionStatus !== 'active';

    useEffect(() => {
        if (!token) return;

        const loadData = async () => {
            try {
                const [insightsRes, shiftRes, subRes] = await Promise.all([
                    fetch(getApiUrl('/reports/dashboard'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/shifts/active'), { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(getApiUrl('/subscription/status'), { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (insightsRes.ok) setInsights(await insightsRes.json());
                if (shiftRes.ok) setShiftData(await shiftRes.json());
                if (subRes.ok) setSubInfo(await subRes.json());
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const cssVar = (name: string) => `hsl(var(--${name}))`;

    const heatmapData = {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
            label: 'Today\'s Sales Revenue',
            data: insights?.heatmap || [],
            borderColor: cssVar('primary'),
            backgroundColor: `${cssVar('primary')}20`, // 20% opacity approx if supported, else chartjs handles it poorly. Let's rely on standard colors.
            fill: true,
            tension: 0.4
        }]
    };

    const categoryData = {
        labels: insights?.categories?.map((c: any) => c.name) || [],
        datasets: [{
            label: 'Sales by Category',
            data: insights?.categories?.map((c: any) => c.value) || [],
            backgroundColor: [
                cssVar('chart-1'),
                cssVar('chart-2'),
                cssVar('chart-3'),
                cssVar('chart-4'),
                cssVar('chart-5'),
            ],
            borderWidth: 0
        }]
    };

    const brandData = {
        labels: insights?.brands?.map((b: any) => b.name) || [],
        datasets: [{
            label: 'Sales by Brand',
            data: insights?.brands?.map((b: any) => b.value) || [],
            backgroundColor: [
                cssVar('chart-5'),
                cssVar('chart-4'),
                cssVar('chart-3'),
                cssVar('chart-2'),
                cssVar('chart-1'),
            ],
            borderWidth: 0
        }]
    };

    const crmData = {
        labels: ['New Customers', 'Returning Customers'],
        datasets: [{
            data: [insights?.crm?.new || 0, insights?.crm?.returning || 0],
            backgroundColor: [cssVar('primary'), cssVar('secondary')],
            hoverOffset: 4
        }]
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 transition-colors">
            {/* Header & Insight Bar */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold">Dashboard</h1>
                            <p className="text-muted-foreground text-xs sm:text-sm">Real-time business intelligence</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 sm:gap-3">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => navigate('/admin/purchases/new')}
                            className="gap-2 px-4 text-sm font-bold uppercase tracking-wide"
                        >
                            <Package size={16} />
                            <span>Purchase</span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={isSubscriptionInactive ? 'secondary' : 'primary'}
                            onClick={() => !isSubscriptionInactive && navigate('/pos')}
                            className={`gap-2 px-4 text-sm font-bold uppercase tracking-wide ${isSubscriptionInactive ? 'cursor-not-allowed' : ''}`}
                            disabled={isSubscriptionInactive}
                        >
                            <DollarSign size={16} />
                            <span>{isSubscriptionInactive ? 'POS Locked' : 'POS'}</span>
                        </Button>
                    </div>
                </div>

                {isSubscriptionInactive && (
                    <div className="mb-2 rounded-xl border border-destructive bg-destructive/10 p-4">
                        <h2 className="text-lg font-bold text-destructive">Subscription Expired</h2>
                        <p className="text-sm text-destructive mt-1">System is inactive. Contact developer to continue POS operations.</p>
                    </div>
                )}

                {/* THE PULSE (Stylized Summary Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(insights?.pulse?.todayRevenue || 0)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Profit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(insights?.pulse?.todayProfit || 0)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Ticket Value</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(insights?.pulse?.atv || 0)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
                            <Award className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(insights?.pulse?.inventoryValue || 0)}</div>
                        </CardContent>
                    </Card>

                    <Card className={insights?.inventory?.lowStockCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Health</CardTitle>
                            {insights?.inventory?.lowStockCount > 0 ? (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                            ) : (
                                <Shield className="h-4 w-4 text-primary" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {insights?.inventory?.lowStockCount > 0 ? 'Warning' : 'Excellent'}
                            </div>
                            {insights?.inventory?.lowStockCount > 0 && (
                                <p className="text-xs font-bold text-destructive mt-1 uppercase">
                                    {insights?.inventory?.lowStockCount} Items Low
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Top Performers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2"><Award size={20} className="text-primary"/> Top Performing Products</CardTitle>
                        <span className="text-xs text-muted-foreground uppercase font-bold">Last 30 Days</span>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
                                    <tr>
                                        <th className="pb-3">Product</th>
                                        <th className="pb-3 text-right">Sold</th>
                                        <th className="pb-3 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {insights?.inventory?.topSellers?.map((p: any) => (
                                        <tr key={p.id} className="group hover:bg-muted/50 transition-colors">
                                            <td className="py-3 font-bold text-sm text-foreground">{p.name}</td>
                                            <td className="py-3 text-right font-black text-foreground">{p.quantity}</td>
                                            <td className="py-3 text-right font-black text-primary">{formatCurrency(p.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-accent"><Clock size={20} />Slow Movers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {insights?.inventory?.slowMovers?.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No slow movers identified.</p>
                        ) : (
                            insights?.inventory?.slowMovers?.map((p: any) => (
                                <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-muted rounded-lg border border-border">
                                    <span className="text-muted-foreground font-medium truncate w-32">{p.name}</span>
                                    <span className="font-bold text-accent">{p.stock} In Stock</span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Visual Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Sales Heatmap */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2"><Calendar size={20} className="text-primary" /> Peak Sales Hours</CardTitle>
                        <span className="text-xs text-muted-foreground">Today's Traffic</span>
                    </CardHeader>
                    <CardContent>
                        <div className="h-62.5">
                            <Line
                                data={heatmapData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { beginAtZero: true, grid: { display: false } },
                                        x: { grid: { display: false } }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Sub & Shift Summary */}
                <div className="space-y-6">
                    <Card 
                        className={`cursor-pointer transition-all hover:bg-muted/50 ${subInfo?.isNeverEnd ? 'border-primary' : (subInfo?.daysRemaining ?? 99) <= 7 ? 'border-destructive' : 'border-border'}`}
                        onClick={() => navigate('/admin/plans')}
                    >
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-muted-foreground">Subscription</h3>
                                    <p className="text-2xl font-black">{subInfo?.isNeverEnd ? 'Lifetime' : `${subInfo?.daysRemaining ?? 0} Days Left`}</p>
                                </div>
                                <Shield size={32} className={subInfo?.isNeverEnd ? 'text-primary' : (subInfo?.daysRemaining ?? 0) <= 7 ? 'text-destructive' : 'text-primary'} />
                            </div>
                            <p className="text-xs text-muted-foreground">{subInfo?.paymentCycle} billing · {subInfo?.status || 'Active'}</p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer transition-all hover:bg-muted/50" 
                        onClick={() => navigate('/pos')}
                    >
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-muted-foreground">Register Drawer</h3>
                                    <p className="text-2xl font-black">{shiftData ? formatCurrency(shiftData.expectedCash) : 'Closed'}</p>
                                </div>
                                <DollarSign size={32} className="text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground">{shiftData ? 'Active shift estimated cash' : 'Open shift in POS to start selling'}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Row Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={20} className="text-primary" />Category Mix</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-50">
                            <Doughnut
                                data={categoryData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Package size={20} className="text-primary"/>Brand Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-50">
                            <Doughnut
                                data={brandData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Users size={20} className="text-primary" />CRM Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-50">
                            <Bar
                                data={crmData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { display: false } } }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
