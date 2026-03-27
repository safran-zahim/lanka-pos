import { useState, useEffect, useCallback } from 'react';
import {
    Shield, ShieldOff, Calendar, Infinity, Power, Save,
    AlertTriangle, CheckCircle, Clock, History, FileText,
    ChevronDown, ChevronUp, RefreshCw, Loader
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getApiUrl } from '../../config/api';
import { useToast } from '../../store/useToast';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface SubStatus {
    subscriptionStatus: string;
    paymentCycle: string;
    subscriptionExpiresAt: string | null;
    isNeverEnd: boolean;
    isSystemDisabled: boolean;
    clientNote: string | null;
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


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active:   { label: 'Active',   color: 'text-green-600 bg-green-50  border-green-200' },
    blocked:  { label: 'Blocked',  color: 'text-red-600   bg-red-50    border-red-200'   },
    canceled: { label: 'Canceled', color: 'text-gray-600  bg-gray-50   border-gray-200'  },
    past_due: { label: 'Past Due', color: 'text-amber-600 bg-amber-50  border-amber-200' },
};

const ACTION_LABELS: Record<string, string> = {
    status_change:     'Status Changed',
    cycle_change:      'Payment Cycle Changed',
    expiry_set:        'Expiry Date Set',
    system_disabled:   'System Toggle',
    never_end_toggled: 'Lifetime Toggle',
    config_update:     'Configuration Updated',
};

function fmt(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

function daysLabel(d: number | null, isNeverEnd: boolean) {
    if (isNeverEnd) return '∞ Lifetime';
    if (d === null) return 'No expiry set';
    if (d <= 0) return 'Expired';
    return `${d} day${d === 1 ? '' : 's'} remaining`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export const SystemSubscriptionPage = () => {
    const token = useAuthStore((s) => s.token);
    const { addToast } = useToast();

    const [status, setStatus] = useState<SubStatus | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const [formStatus, setFormStatus] = useState<string>('active');
    const [formPaymentCycle, setFormPaymentCycle] = useState<string>('monthly');
    const [formExpiresAt, setFormExpiresAt] = useState<string>('');
    const [formIsNeverEnd, setFormIsNeverEnd] = useState(false);
    const [formIsDisabled, setFormIsDisabled] = useState(false);
    const [formClientNote, setFormClientNote] = useState('');
    const [formHistoryNote, setFormHistoryNote] = useState('');

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // ── Fetch ──────────────────────────────────
    const fetchStatus = useCallback(async () => {
        setLoadingStatus(true);
        try {
            const r = await fetch(getApiUrl('/subscription/status'), { headers });
            if (r.ok) {
                const d: SubStatus = await r.json();
                setStatus(d);
                setFormStatus(d.subscriptionStatus);
                setFormPaymentCycle(d.paymentCycle ?? 'monthly');
                setFormIsNeverEnd(d.isNeverEnd);
                setFormIsDisabled(d.isSystemDisabled);
                setFormClientNote(d.clientNote ?? '');
                if (d.subscriptionExpiresAt) {
                    // Format for datetime-local input
                    const dt = new Date(d.subscriptionExpiresAt);
                    const pad = (n: number) => String(n).padStart(2, '0');
                    setFormExpiresAt(
                        `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
                    );
                } else {
                    setFormExpiresAt('');
                }
            }
        } finally {
            setLoadingStatus(false);
        }
    }, [token]);

    const fetchHistory = useCallback(async () => {
        const r = await fetch(getApiUrl('/subscription/history'), { headers });
        if (r.ok) setHistory(await r.json());
    }, [token]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (showHistory) fetchHistory();
    }, [showHistory, fetchHistory]);

    // ── Save ───────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            const body: any = {
                subscriptionStatus: formStatus,
                paymentCycle: formPaymentCycle,
                isNeverEnd: formIsNeverEnd,
                isSystemDisabled: formIsDisabled,
                clientNote: formClientNote || null,
                historyNote: formHistoryNote || undefined,
                subscriptionExpiresAt: formIsNeverEnd
                    ? null
                    : formExpiresAt
                        ? new Date(formExpiresAt).toISOString()
                        : null,
            };

            const r = await fetch(getApiUrl('/subscription/status'), {
                method: 'PATCH',
                headers,
                body: JSON.stringify(body),
            });

            if (r.ok) {
                addToast('Subscription settings saved successfully.', 'success');
                setFormHistoryNote('');
                await fetchStatus();
                if (showHistory) await fetchHistory();
            } else {
                const err = await r.json();
                addToast(err.error || 'Failed to save.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Quick toggles ─────────────────────────
    const toggleDisabled = async () => {
        const newVal = !formIsDisabled;
        setFormIsDisabled(newVal);
    };

    const toggleNeverEnd = () => {
        setFormIsNeverEnd((v) => !v);
    };

    // ── Derived display ────────────────────────
    const statusInfo = STATUS_LABELS[formStatus] ?? STATUS_LABELS.active;
    const isExpired = !formIsNeverEnd && status?.daysRemaining !== null && (status?.daysRemaining ?? 1) <= 0;

    if (loadingStatus) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Loader className="animate-spin" size={36} />
                    <span className="font-medium">Loading subscription data…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            {/* ── Page Header ────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        <Shield className="text-blue-600" size={28} />
                        System Subscription
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Developer control panel — manage client system access and subscription lifecycle.
                    </p>
                </div>
                <button
                    onClick={fetchStatus}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* ── Status Summary Card ─────────────────── */}
            <div className={`rounded-2xl border-2 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                formIsDisabled
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : isExpired
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-green-400 bg-green-50 dark:bg-green-900/20'
            }`}>
                <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Status</div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-bold text-sm ${statusInfo.color}`}>
                        {formIsDisabled ? <ShieldOff size={14} /> : <CheckCircle size={14} />}
                        {formIsDisabled ? 'System Disabled' : statusInfo.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium capitalize">
                        {formPaymentCycle} billing
                        {' · '}
                        <span className={isExpired ? 'text-red-600 font-bold' : ''}>
                            {daysLabel(status?.daysRemaining ?? null, formIsNeverEnd)}
                        </span>
                    </div>
                    {status?.subscriptionExpiresAt && !formIsNeverEnd && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} /> Expires: {fmt(status.subscriptionExpiresAt)}
                        </div>
                    )}
                </div>

                {/* Kill Switch */}
                <button
                    onClick={toggleDisabled}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${
                        formIsDisabled
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                    <Power size={18} />
                    {formIsDisabled ? 'Enable System' : 'Disable System (Kill-Switch)'}
                </button>
            </div>

            {/* ── Config Form ─────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg">Subscription Configuration</h2>
                </div>
                <div className="p-6 space-y-6">

                    {/* Row 1: Status + Plan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Subscription Status
                            </label>
                            <select
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value)}
                                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all font-medium"
                            >
                                <option value="active">✅ Active</option>
                                <option value="past_due">⚠️ Past Due</option>
                                <option value="blocked">🚫 Blocked</option>
                                <option value="canceled">❌ Canceled</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Payment Cycle
                            </label>
                            <div className="flex gap-3">
                                {(['monthly', 'yearly'] as const).map(cycle => (
                                    <button
                                        key={cycle}
                                        onClick={() => setFormPaymentCycle(cycle)}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm capitalize transition-all ${
                                            formPaymentCycle === cycle
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                                        }`}
                                    >
                                        {cycle === 'monthly' ? '📅 Monthly' : '📆 Yearly'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Expiry + Never End toggle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Expiration Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={formExpiresAt}
                                disabled={formIsNeverEnd}
                                onChange={(e) => setFormExpiresAt(e.target.value)}
                                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Never End toggle */}
                        <div
                            onClick={toggleNeverEnd}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                formIsNeverEnd
                                    ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                            }`}
                        >
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Infinity size={16} className={formIsNeverEnd ? 'text-purple-600' : 'text-gray-400'} />
                                    Never End (Lifetime)
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">Ignore expiry date permanently</p>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${
                                formIsNeverEnd ? 'bg-purple-500 justify-end' : 'bg-gray-300 justify-start'
                            }`}>
                                <div className="w-4 h-4 bg-white rounded-full shadow" />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Client Note */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FileText size={14} /> Client Note (Internal — Developer only)
                        </label>
                        <textarea
                            rows={2}
                            value={formClientNote}
                            onChange={(e) => setFormClientNote(e.target.value)}
                            placeholder="e.g. Client: ABC Supermarket, Contact: 0777 000 000, Renewed: March 2026"
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all resize-none text-sm"
                        />
                    </div>

                    {/* Row 4: History Note + Save */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <History size={14} /> Change Reason (Logged in History)
                        </label>
                        <input
                            type="text"
                            value={formHistoryNote}
                            onChange={(e) => setFormHistoryNote(e.target.value)}
                            placeholder="e.g. Renewed for 30 days after payment received"
                            className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none transition-all text-sm"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] disabled:opacity-50"
                    >
                        {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'Saving…' : 'Save Subscription Settings'}
                    </button>
                </div>
            </div>

            {/* ── Subscription History ─────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <button
                    onClick={() => setShowHistory((v) => !v)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                        <History size={20} className="text-blue-500" />
                        Subscription History
                    </h2>
                    {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {showHistory && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                        {history.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <History size={32} className="mx-auto mb-2 opacity-40" />
                                <p>No changes recorded yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                                {history.map((h) => (
                                    <div key={h.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {h.action.split(',').map(a => ACTION_LABELS[a] ?? a).join(' + ')}
                                                </span>
                                                {h.paymentCycle && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium capitalize">
                                                        {h.paymentCycle}
                                                    </span>
                                                )}
                                                {h.isSystemDisabled !== null && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.isSystemDisabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        System {h.isSystemDisabled ? 'Disabled' : 'Enabled'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 space-x-3">
                                                {h.previousStatus && h.newStatus && h.previousStatus !== h.newStatus && (
                                                    <span>{h.previousStatus} → {h.newStatus}</span>
                                                )}
                                                {h.newExpiresAt && (
                                                    <span>Expires: {fmt(h.newExpiresAt)}</span>
                                                )}
                                                {h.isNeverEnd !== null && (
                                                    <span>Never-End: {h.isNeverEnd ? 'ON' : 'OFF'}</span>
                                                )}
                                            </div>
                                            {h.note && (
                                                <div className="text-xs text-blue-600 dark:text-blue-400 italic mt-0.5">
                                                    "{h.note}"
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right text-xs text-gray-400 whitespace-nowrap shrink-0">
                                            <div className="font-medium">{h.changedByName ?? 'system'}</div>
                                            <div>{fmt(h.createdAt)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Warning if expiry is within 7 days ────── */}
            {!formIsNeverEnd && !formIsDisabled && status?.daysRemaining !== null && (status?.daysRemaining ?? 99) <= 7 && (status?.daysRemaining ?? 0) > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <strong>Subscription Expiring Soon!</strong>
                        <p className="text-xs mt-0.5 opacity-80">This system expires in {status?.daysRemaining} day(s). Set a new expiry date above to renew.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
