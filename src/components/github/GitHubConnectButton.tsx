import React, { useState } from 'react';
import { Github } from 'lucide-react';
import { api } from '@/lib/api';

export const GitHubConnectButton: React.FC = () => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const response = await api.get<{ redirectUrl: string }>('/github/connect', { params: { returnTo } });
      window.location.href = response.data.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start GitHub connection');
      setConnecting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => void handleConnect()}
        disabled={connecting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          background: 'var(--ink-900, #1a1a1a)',
          color: 'var(--paper-50, #fafafa)',
          border: 'none',
          borderRadius: 'var(--radius-md, 6px)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          cursor: connecting ? 'not-allowed' : 'pointer',
          opacity: connecting ? 0.65 : 1,
          minHeight: 42,
        }}
      >
        <Github size={18} strokeWidth={1.9} />
        {connecting ? 'Connecting…' : 'Connect GitHub Account'}
      </button>
      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', margin: '10px 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
};
