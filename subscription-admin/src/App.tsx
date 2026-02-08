import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const App = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'active' | 'past_due' | 'blocked' | 'canceled'>('active');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateStatus = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/subscription/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subscriptionStatus: status })
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || 'Request failed');
      }
      setMessage('Subscription status updated.');
    } catch (err: any) {
      setMessage(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Subscription Admin</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Set subscription status for the POS app. Requires an admin JWT from the backend.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Admin JWT</div>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste admin JWT"
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Subscription Status</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
          >
            <option value="active">active</option>
            <option value="past_due">past_due</option>
            <option value="blocked">blocked</option>
            <option value="canceled">canceled</option>
          </select>
        </label>

        <button
          onClick={updateStatus}
          disabled={loading || !token}
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>

        {message && (
          <div style={{ marginTop: 8, color: message.includes('failed') ? '#dc2626' : '#16a34a' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
