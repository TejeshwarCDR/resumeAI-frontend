import React from "react";
import { useNavigate } from "react-router-dom";
import { Github, RefreshCw, FolderOpen, CheckCircle2, AlertCircle, ArrowRight, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/data-display/Card";
import { Badge } from "@/components/data-display/Badge";
import { Button } from "@/components/core/Button";
import { Alert } from "@/components/feedback/Alert";
import { CardSkeleton } from "@/components/feedback/Skeleton";
import { GitHubConnectButton } from "@/components/github/GitHubConnectButton";
import { GitHubSyncProgress } from "@/components/github/GitHubSyncProgress";
import { useGitHubSync } from "@/lib/hooks/useGitHubSync";

const SYNC_STAGES = [
  "Connecting to GitHub",
  "Fetching repositories",
  "Reading README files",
  "Detecting tech stacks",
  "Removing duplicates",
  "Enriching project summaries",
  "Saving portfolio",
  "Sync complete",
];

function stageIndex(reposProcessed: number, reposDiscovered: number, status?: string) {
  if (status !== "syncing") return status === "idle" ? SYNC_STAGES.length - 1 : 0;
  if (reposDiscovered <= 0) return 1;
  const ratio = reposProcessed / reposDiscovered;
  if (ratio < 0.15) return 2;
  if (ratio < 0.35) return 3;
  if (ratio < 0.55) return 4;
  if (ratio < 0.8) return 5;
  return 6;
}

function RepositoryStatus({ value, imported }: { value: string; imported: boolean }) {
  if (imported) return <Badge tone="success" dot>Imported</Badge>;
  if (value === "completed") return <Badge tone="success" dot>Ready</Badge>;
  if (value === "failed") return <Badge tone="danger" dot>Failed</Badge>;
  if (value === "pending" || value === "processing") return <Badge tone="warning" dot>{value}</Badge>;
  if (value === "filtered_out") return <Badge tone="neutral">Filtered</Badge>;
  return <Badge tone="neutral">{value.replace("_", " ")}</Badge>;
}

export function GitHubSyncPage() {
  const navigate = useNavigate();
  const { status, repositories, loading, error, triggerSync } = useGitHubSync();
  const isSyncing = status?.syncStatus === "syncing";
  const activeStage = stageIndex(status?.reposProcessed ?? 0, status?.reposDiscovered ?? 0, status?.syncStatus);
  const importedCount = repositories.filter((repo) => repo.imported).length;
  const failedCount = repositories.filter((repo) => repo.enrichmentStatus === "failed").length;

  return (
    <PageContainer variant="wide">
      <PageHeader
        overline="Portfolio import"
        title="GitHub Sync"
        subtitle="Import repository evidence, monitor sync health, and keep GitHub projects resume-ready."
      >
        {status?.connected ? (
          <Button
            variant="gold"
            iconLeft={<RefreshCw size={16} strokeWidth={1.9} />}
            onClick={() => void triggerSync()}
            disabled={isSyncing}
          >
            {isSyncing ? "Syncing…" : "Sync GitHub"}
          </Button>
        ) : null}
      </PageHeader>

      {loading ? (
        <CardSkeleton rows={3} />
      ) : !status?.connected ? (
        <Card variant="seal" padding="28px">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, 0.8fr)", gap: 28, alignItems: "center" }}>
            <div>
              <Badge tone="gold" dot>Recommended setup</Badge>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, color: "var(--ink-900)", margin: "14px 0 8px" }}>
                Import your best repositories into your portfolio.
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--slate-600)", lineHeight: 1.6, margin: "0 0 18px", maxWidth: 620 }}>
                Signuture reads repository metadata, READMEs, languages, and links, then turns useful repositories into editable resume-ready projects.
              </p>
              <GitHubConnectButton />
              {error && <Alert tone="danger" style={{ marginTop: 16 }}>{error}</Alert>}
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {["You review imported projects before using them", "Duplicates are detected during sync", "You can edit or remove imported content anytime"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)" }}>
                  <CheckCircle2 size={16} strokeWidth={1.9} color="var(--success-600)" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <div className="sig-page-with-rail">
          <div style={{ display: "grid", gap: 18 }}>
            <Card variant="seal" padding="22px">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {status.avatarUrl ? (
                    <img src={status.avatarUrl} alt="" width={42} height={42} style={{ borderRadius: "50%" }} />
                  ) : (
                    <span style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--ink-100)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <Github size={20} strokeWidth={1.9} color="var(--ink-700)" />
                    </span>
                  )}
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>@{status.githubUsername}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
                      {status.lastSyncedAt ? `Last synced ${new Date(status.lastSyncedAt).toLocaleString()}` : "Initial sync pending"}
                    </div>
                  </div>
                </div>
                <Badge tone={isSyncing ? "warning" : status.syncStatus === "failed" ? "danger" : "success"} dot>
                  {isSyncing ? "Syncing" : status.syncStatus === "failed" ? "Needs attention" : "Connected"}
                </Badge>
              </div>

              <GitHubSyncProgress
                syncStatus={status.syncStatus}
                reposProcessed={status.reposProcessed}
                reposDiscovered={status.reposDiscovered}
                portfolioItemsCount={status.portfolioItemsCount}
                lastSyncedAt={status.lastSyncedAt}
                syncError={status.syncError}
              />

              {error && <Alert tone="danger" style={{ marginTop: 14 }}>{error}</Alert>}
            </Card>

            <Card padding="0">
              <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--line-200)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)" }}>Repository review</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", marginTop: 2 }}>
                    Sync individual repositories when you want to retry or import a specific project.
                  </div>
                </div>
                <Button variant="secondary" size="sm" iconRight={<ArrowRight size={14} strokeWidth={1.9} />} onClick={() => navigate("/portfolio")}>
                  View projects
                </Button>
              </div>

              {repositories.length === 0 ? (
                <div style={{ padding: 22 }}>
                  <Alert tone="info" title="No repositories discovered yet">
                    Start a sync to fetch repositories from your GitHub account.
                  </Alert>
                </div>
              ) : (
                <div style={{ display: "grid" }}>
                  {repositories.slice(0, 12).map((repo, idx) => (
                    <div
                      key={repo.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: 14,
                        padding: "14px 20px",
                        borderBottom: idx < Math.min(repositories.length, 12) - 1 ? "1px solid var(--line-200)" : "none",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <GitBranch size={15} strokeWidth={1.9} color="var(--slate-500)" />
                          <a href={repo.htmlUrl} target="_blank" rel="noreferrer" style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", overflowWrap: "anywhere" }}>
                            {repo.fullName}
                          </a>
                          <RepositoryStatus value={repo.enrichmentStatus} imported={repo.imported} />
                          {repo.isDuplicate && <Badge tone="neutral">Duplicate</Badge>}
                        </div>
                        {repo.description && (
                          <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-600)", lineHeight: 1.5, margin: "6px 0 0" }}>
                            {repo.description}
                          </p>
                        )}
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)", marginTop: 5 }}>
                          {repo.primaryLanguage ?? "Unknown language"} · {repo.starsCount} stars · Updated {new Date(repo.githubPushedAt).toLocaleDateString()}
                        </div>
                        {(repo.enrichmentError || repo.duplicateReason || repo.filterReason) && (
                          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: repo.enrichmentError ? "var(--danger-600)" : "var(--slate-500)", marginTop: 5 }}>
                            {repo.enrichmentError ?? repo.duplicateReason ?? repo.filterReason}
                          </div>
                        )}
                      </div>
                      <Button variant="secondary" size="sm" disabled={isSyncing} onClick={() => void triggerSync(repo.id)}>
                        {repo.imported ? "Re-sync" : "Sync"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="sig-rail">
            <Card padding="20px">
              <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600, color: "var(--ink-900)", marginBottom: 14 }}>Sync progress</div>
              <div style={{ display: "grid", gap: 12 }}>
                {SYNC_STAGES.map((stage, idx) => {
                  const complete = !isSyncing && idx === SYNC_STAGES.length - 1 ? true : idx < activeStage;
                  const active = isSyncing && idx === activeStage;
                  return (
                    <div key={stage} style={{ display: "flex", alignItems: "center", gap: 10, opacity: complete || active ? 1 : 0.45 }}>
                      {complete ? (
                        <CheckCircle2 size={17} strokeWidth={1.9} color="var(--success-600)" />
                      ) : active ? (
                        <span style={{ width: 17, height: 17, borderRadius: "50%", border: "2px solid var(--brass-500)", borderTopColor: "transparent", animation: "sig-spin 0.9s linear infinite" }} />
                      ) : (
                        <span style={{ width: 17, height: 17, borderRadius: "50%", border: "1.5px solid var(--line-300)" }} />
                      )}
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: active ? "var(--ink-900)" : "var(--slate-700)", fontWeight: active ? 700 : 500 }}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Card padding="18px">
                <FolderOpen size={18} strokeWidth={1.9} color="var(--ink-600)" />
                <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink-900)", marginTop: 10 }}>{importedCount}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>Imported projects</div>
              </Card>
              <Card padding="18px">
                <AlertCircle size={18} strokeWidth={1.9} color={failedCount ? "var(--danger-600)" : "var(--slate-500)"} />
                <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink-900)", marginTop: 10 }}>{failedCount}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>Needs retry</div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
