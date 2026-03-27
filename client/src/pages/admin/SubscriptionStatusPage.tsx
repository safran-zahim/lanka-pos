import { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle, Clock, History, ChevronDown, ChevronUp, AlertTriangle, ShieldOff, Infinity } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubStatus {
    subscriptionStatus: string;
    paymentCycle: string;
    subscriptionExpiresAt: string | null;
    isNeverEnd: boolean;
    isSystemDisabled: boolean;
    daysRemaining: number | null;
}

interface HistoryEntry {
    id: number;
    changedByName: string | null;
    action: string;
    previousStatus: string | null;
    newStatus: string | null;
    previousExpiresAt: string | null;
    newExpiresAt: string | null;
    paymentCycle: string | null;
    isNeverEnd: boolean | null;
    isSystemDisabled: boolean | null;
    note: string | null;
    createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
    active:   'bg-green-100 text-green-700 border-green-200',
    past_due: 'bg-amber-100 text-amber-700 border-amber-200',
    blocked:  'bg-red-100   text-red-700   border-red-200',
    canceled: 'bg-gray-100  text-gray-600  border-gray-200',
};

const ACTION_LABELS: Record<string, string> = {
    status_change:     'Status Changed',
    cycle_change:      'Payment Cycle Changed',
    expiry_set:        'Expiry Date Updated',
    system_disabled:   'System Enable/Disable Toggle',
    never_end_toggled: 'Lifetime Toggle',
    config_update:     'Settings Updated',
};

function fmt(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

// ─── Component ────────────────────────────────────────────────────────────────
export const SubscriptionStatusPage = () => {
    const token = useAuthStore((s) => s.token);
    const [status, setStatus] = useState<SubStatus | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loading, setLoading] = useState(true);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(getApiUrl('/subscription/status'), { headers });
            if (r.ok) setStatus(await r.json());
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchHistory = useCallback(async () => {
        const r = await fetch(getApiUrl('/subscription/history'), { headers });
        if (r.ok) setHistory(await r.json());
    }, [token]);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);
    useEffect(() => { if (showHistory) fetchHistory(); }, [showHistory, fetchHistory]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-gray-400">
                <Clock className="animate-spin mr-3" size={24} /> Loading subscription info…
            </div>
        );
    }

    const isExpired = !status?.isNeverEnd && status?.daysRemaining !== null && (status?.daysRemaining ?? 1) <= 0;
    const isWarning = !status?.isNeverEnd && status?.daysRemaining !== null && (status?.daysRemaining ?? 99) <= 30 && !isExpired;
    const statusStyle = STATUS_STYLES[status?.subscriptionStatus ?? 'active'] ?? STATUS_STYLES.active;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <Shield className="text-blue-600" size={26} />
                    Subscription Status
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Read-only view. Contact your system developer to make changes.
                </p>
            </div>

            {/* Status Card */}
            <div className={`rounded-2xl border-2 p-6 space-y-4 ${
                status?.isSystemDisabled
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : isExpired
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                        : isWarning
                            ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-green-300 bg-green-50 dark:bg-green-900/20'
            }`}>
                <div className="flex flex-wrap items-center gap-3">
                    {status?.isSystemDisabled
                        ? <ShieldOff className="text-red-600" size={22} />
                        : <CheckCircle className="text-green-600" size={22} />
                    }
                    <span className={`px-3 py-1 rounded-full border font-bold text-sm ${statusStyle}`}>
                        {status?.isSystemDisabled ? 'System Disabled' : (status?.subscriptionStatus ?? 'active').replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                        {status?.isNeverEnd
                            ? <span className="flex items-center gap-1"><Infinity size={14} /> Lifetime (No Expiry)</span>
                            : `${status?.paymentCycle ?? 'monthly'} billing`
                        }
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Expiry Date</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                            {status?.isNeverEnd ? 'Never Expires' : fmt(status?.subscriptionExpiresAt ?? null)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">Days Remaining</p>
                        <p className={`font-bold text-lg ${isExpired ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'}`}>
                            {status?.isNeverEnd
                                ? '∞'
                                : status?.daysRemaining !== null
                                    ? (isExpired ? 'Expired' : `${status?.daysRemaining} day${status?.daysRemaining === 1 ? '' : 's'}`)
                                    : '—'
                            }
                        </p>
                    </div>
                </div>

                {isWarning && (
                    <div className="flex items-start gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>Subscription expires in <strong>{status?.daysRemaining} day{status?.daysRemaining === 1 ? '' : 's'}</strong>. Contact your developer to renew.</span>
                    </div>
                )}
                {isExpired && (
                    <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-800 dark:text-red-200 text-sm">
                        <ShieldOff size={16} className="shrink-0 mt-0.5" />
                        <span><strong>Subscription has expired.</strong> Contact your developer to renew access.</span>
                    </div>
                )}
            </div>

            {/* History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <button
                    onClick={() => setShowHistory(v => !v)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History size={18} className="text-blue-500" /> Payment & Change History
                    </h2>
                    {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showHistory && (
                    <div className="border-t border-gray-100 dark:border-gray-700 max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                        {history.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No history recorded yet.</div>
                        ) : history.map(h => (
                            <div key={h.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                        {h.action.split(',').map(a => ACTION_LABELS[a] ?? a).join(' + ')}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                                        {h.previousStatus && h.newStatus && h.previousStatus !== h.newStatus && (
                                            <span>{h.previousStatus} → {h.newStatus}</span>
                                        )}
                                        {h.newExpiresAt && <span>Expiry: {fmt(h.newExpiresAt)}</span>}
                                        {h.paymentCycle && <span className="capitalize">{h.paymentCycle}</span>}
                                    </div>
                                    {h.note && <div className="text-xs text-blue-600 dark:text-blue-400 italic mt-0.5">"{h.note}"</div>}
                                </div>
                                <div className="text-right text-xs text-gray-400 whitespace-nowrap shrink-0">
                                    <div className="font-medium">{h.changedByName ?? 'developer'}</div>
                                    <div>{fmt(h.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
