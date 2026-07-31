import React from 'react';

interface GitHubSyncProgressProps {
  syncStatus: string;
  reposProcessed: number;
  reposDiscovered: number;
  portfolioItemsCount: number;
  lastSyncedAt: string | null;
  syncError: string | null;
}

export const GitHubSyncProgress: React.FC<GitHubSyncProgressProps> = ({
  syncStatus,
  reposProcessed,
  reposDiscovered,
  portfolioItemsCount,
  lastSyncedAt,
  syncError,
}) => {
  const progressPercent = reposDiscovered > 0
    ? Math.round((reposProcessed / reposDiscovered) * 100)
    : 0;

  if (syncStatus === 'syncing') {
    return (
      <div style={{ marginTop: 12 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink-900)', marginBottom: 8 }}>
          Analyzing your repositories… ({reposProcessed} / {reposDiscovered})
        </p>
        <div style={{ background: 'var(--line-200, #e5e7eb)', borderRadius: 4, height: 8 }}>
          <div style={{
            width: `${progressPercent}%`,
            background: 'var(--brass-500, #2da44e)',
            height: '100%',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>
          {progressPercent}% complete
        </p>
      </div>
    );
  }

  if (syncStatus === 'failed' && syncError) {
    return (
      <div style={{
        marginTop: 12,
        color: '#b91c1c',
        background: '#fef2f2',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md, 6px)',
        fontFamily: 'var(--font-body)',
        fontSize: 13.5,
      }}>
        <strong>Sync failed:</strong> {syncError}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-900)' }}>
        <strong>{portfolioItemsCount}</strong> projects imported from GitHub
      </p>
      {lastSyncedAt && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
          Last synced {new Date(lastSyncedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};
