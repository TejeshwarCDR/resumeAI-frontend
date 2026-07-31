import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { env } from '@/lib/env';

interface GithubStatus {
  connected: boolean;
  syncStatus: 'idle' | 'syncing' | 'failed';
  githubUsername: string | null;
  avatarUrl: string | null;
  lastSyncedAt: string | null;
  reposDiscovered: number;
  reposProcessed: number;
  portfolioItemsCount: number;
  syncError: string | null;
}

export interface GithubRepository {
  id: string;
  githubRepoId: number;
  fullName: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  primaryLanguage: string | null;
  topics: string[];
  starsCount: number;
  forksCount: number;
  isFork: boolean;
  isArchived: boolean;
  ownerLogin: string | null;
  filterReason: string | null;
  duplicateGroupKey: string | null;
  duplicateOfGithubRepoId: number | null;
  duplicateReason: string | null;
  isDuplicate: boolean;
  githubPushedAt: string;
  enrichmentStatus: 'pending' | 'filtered_out' | 'processing' | 'completed' | 'failed' | string;
  enrichmentError: string | null;
  lastSyncState: string | null;
  lastEnrichedAt: string | null;
  portfolioItemId: string | null;
  imported: boolean;
}

export const useGitHubSync = () => {
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [repositories, setRepositories] = useState<GithubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = useCallback(async () => {
    const response = await api.get<{ repositories: GithubRepository[] }>('/github/repositories');
    setRepositories(response.data.repositories);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get<GithubStatus>('/github/status');
      setStatus(response.data);
      if (response.data.connected) {
        await fetchRepositories();
      } else {
        setRepositories([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GitHub status');
    } finally {
      setLoading(false);
    }
  }, [fetchRepositories]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  // Poll while syncing
  useEffect(() => {
    if (status?.syncStatus !== 'syncing') return;
    const interval = setInterval(() => void fetchStatus(), 3000);
    return () => clearInterval(interval);
  }, [status?.syncStatus, fetchStatus]);

  // Listen for WebSocket events for real-time progress
  useEffect(() => {
    const wsUrl = env.WS_URL;
    let ws: WebSocket | null = null;

    try {
      const token = localStorage.getItem('sig_token');
      ws = new WebSocket(`${wsUrl}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as { type: string; data: Record<string, unknown> };

          if (data.type === 'github_repo_processed' || data.type === 'github_repo_failed') {
            setStatus(prev => prev ? {
              ...prev,
              reposProcessed: data.data.processed as number,
              reposDiscovered: data.data.total as number,
            } : prev);
          }

          if (data.type === 'github_sync_complete') {
            void fetchStatus();
          }

          if (data.type === 'github_sync_error') {
            setStatus(prev => prev ? { ...prev, syncStatus: 'failed', syncError: data.data.error as string } : prev);
          }
        } catch { /* ignore parse errors */ }
      };
    } catch { /* WebSocket not available — polling fallback is active */ }

    return () => ws?.close();
  }, [fetchStatus]);

  // Handle OAuth redirect query params (e.g. ?github=connected after callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubParam = params.get('github');
    if (githubParam === 'connected' || githubParam === 'denied') {
      const url = new URL(window.location.href);
      url.searchParams.delete('github');
      window.history.replaceState({}, '', url.toString());
      if (githubParam === 'connected') {
        setError(null);
        void fetchStatus();
      } else {
        setError('GitHub connection was cancelled.');
      }
    }
  }, [fetchStatus]);

  const triggerSync = useCallback(async (repositoryId?: string) => {
    try {
      setError(null);
      await api.post('/github/sync', repositoryId ? { repositoryId } : {});
      setStatus(prev => prev ? { ...prev, syncStatus: 'syncing' } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger sync');
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await api.delete('/github/disconnect');
      setStatus(prev => prev ? { ...prev, connected: false, syncStatus: 'idle', githubUsername: null } : prev);
      setRepositories([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect GitHub');
    }
  }, []);

  return { status, repositories, loading, error, triggerSync, disconnect, refetch: fetchStatus };
};
