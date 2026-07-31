import React from 'react';
import { Badge } from '@/components/data-display/Badge';
import { Button } from '@/components/core/Button';
import { useGitHubSync } from '@/lib/hooks/useGitHubSync';
import { GitHubConnectButton } from './GitHubConnectButton';
import { GitHubSyncProgress } from './GitHubSyncProgress';

export const GitHubSection: React.FC = () => {
  const { status, repositories, loading, error, triggerSync, disconnect } = useGitHubSync();
  const isSyncing = status?.syncStatus === 'syncing';

  const statusTone = (repoStatus: string) => {
    if (repoStatus === 'completed') return 'success';
    if (repoStatus === 'failed') return 'danger';
    if (repoStatus === 'pending' || repoStatus === 'processing') return 'warning';
    return 'neutral';
  };

  if (loading) {
    return (
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--slate-500)' }}>
        Loading GitHub status…
      </p>
    );
  }

  if (!status?.connected) {
    return (
      <div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--slate-600)', marginBottom: 14 }}>
          Link your GitHub to automatically import accessible repositories as verified portfolio projects.
          Private repositories are included only when your GitHub authorization allows them.
        </p>
        <GitHubConnectButton />
        {error && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', marginTop: 10 }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {status.avatarUrl && (
          <img
            src={status.avatarUrl}
            alt="GitHub avatar"
            width={32}
            height={32}
            style={{ borderRadius: '50%' }}
          />
        )}
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink-900)' }}>
          @{status.githubUsername}
        </span>
      </div>

      <GitHubSyncProgress
        syncStatus={status.syncStatus}
        reposProcessed={status.reposProcessed}
        reposDiscovered={status.reposDiscovered}
        portfolioItemsCount={status.portfolioItemsCount}
        lastSyncedAt={status.lastSyncedAt}
        syncError={status.syncError}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <Button
          variant="gold"
          size="sm"
          onClick={() => void triggerSync()}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Sync All'}
        </Button>
        <button
          onClick={() => void disconnect()}
          disabled={isSyncing}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            color: '#dc2626',
            border: '1.5px solid #fecaca',
            borderRadius: 'var(--radius-md, 6px)',
            fontFamily: 'var(--font-body)',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            opacity: isSyncing ? 0.6 : 1,
          }}
        >
          Disconnect GitHub
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink-900)', fontWeight: 700, margin: 0 }}>
            Repositories
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', margin: 0 }}>
            {repositories.length} available
          </p>
        </div>

        {repositories.length === 0 ? (
          <div style={{
            border: '1px solid var(--line-200, #e5e7eb)',
            borderRadius: 'var(--radius-md, 6px)',
            padding: '12px 14px',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--slate-600)',
          }}>
            No repositories have been discovered yet. Use Sync All to fetch your GitHub repositories.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {repositories.map((repo) => (
              <div
                key={repo.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 12,
                  alignItems: 'center',
                  border: '1px solid var(--line-200, #e5e7eb)',
                  borderRadius: 'var(--radius-md, 6px)',
                  padding: '10px 12px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--ink-900)',
                        textDecoration: 'none',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {repo.fullName}
                    </a>
                    <Badge tone={statusTone(repo.enrichmentStatus)} dot>
                      {repo.imported ? 'Imported' : repo.enrichmentStatus.replace('_', ' ')}
                    </Badge>
                    {repo.isDuplicate && (
                      <Badge tone="neutral" dot>
                        Duplicate
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12.5,
                      color: 'var(--slate-600)',
                      margin: '4px 0 0',
                      overflowWrap: 'anywhere',
                    }}>
                      {repo.description}
                    </p>
                  )}
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', margin: '4px 0 0' }}>
                    {repo.primaryLanguage ?? 'Unknown language'} · Updated {new Date(repo.githubPushedAt).toLocaleDateString()}
                    {repo.ownerLogin ? ` · Owner ${repo.ownerLogin}` : ''}
                  </p>
                  {(repo.duplicateReason || repo.filterReason) && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-600)', margin: '4px 0 0' }}>
                      {repo.duplicateReason ?? repo.filterReason}
                    </p>
                  )}
                  {repo.enrichmentError && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#b91c1c', margin: '4px 0 0' }}>
                      {repo.enrichmentError}
                    </p>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void triggerSync(repo.id)}
                  disabled={isSyncing}
                >
                  {repo.isDuplicate ? 'Sync anyway' : 'Sync'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
