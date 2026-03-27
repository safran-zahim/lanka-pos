import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, ShieldOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';

export const SubscriptionIndicator = ({ compact = true }: { compact?: boolean }) => {
    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const [status, setStatus] = useState<any>(null);

    useEffect(() => {
        if (!token) return;
        const fetchStatus = async () => {
            try {
                const r = await fetch(getApiUrl('/subscription/status'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (r.ok) setStatus(await r.json());
            } catch (e) {
                console.error('Failed to fetch subscription status', e);
            }
        };
        fetchStatus();
    }, [token]);

    if (!status) return null;

    const isLifetime = status.isNeverEnd;
    const isSystemDisabled = status.isSystemDisabled;
    const daysLeft = status.daysRemaining ?? 999;
    const isExpired = !isLifetime && (daysLeft <= 0 || status.subscriptionStatus === 'blocked');
    const isWarning = !isLifetime && daysLeft <= 7 && !isExpired;

    // Priority: Disabled/Expired > Warning > SuperAdmin Status > Hidden
    if (!isSystemDisabled && !isExpired && !isWarning && user?.role !== 'super_admin') {
        return null;
    }

    if (compact) {
        return (
            <Button
                type="button"
                size="sm"
                variant={isSystemDisabled || isExpired ? 'danger' : isWarning ? 'warning' : 'secondary'}
                onClick={() => navigate(user?.role === 'super_admin' ? '/admin/system-subscription' : '/admin/plans')}
                className={`h-8 gap-1.5 px-2.5 text-[10px] font-black uppercase tracking-wider ${isWarning ? 'animate-pulse' : ''}`}
                title={isSystemDisabled ? 'System Disabled' : isExpired ? 'Subscription Expired' : isWarning ? `Expires in ${daysLeft} days` : 'Subscription Active'}
            >
                {isSystemDisabled ? <ShieldOff size={14} /> : (isExpired || isWarning) ? <AlertTriangle size={14} /> : <Shield size={14} />}
                <Badge variant="secondary" className="h-5 px-2 text-[10px] font-black uppercase">
                    {isSystemDisabled ? 'System Blocked' : isExpired ? 'Expired' : isWarning ? `${daysLeft} Days Left` : (isLifetime ? 'Lifetime' : 'Active')}
                </Badge>
            </Button>
        );
    }

    return null;
};
