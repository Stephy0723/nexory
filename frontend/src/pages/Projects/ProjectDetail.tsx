import React, { useMemo, useState } from 'react';
import { useProject } from '@/hooks/useProjects';
import { useAuthStore } from '@/store/authStore';
import { exportProjectToPDF } from '@/utils/exportPDF';
import { ProjectMembers } from '@/pages/Projects/ProjectMembers';
import type { Credential, DbConnection, MemberRole, Note, Project, Task } from '@/types';
import { useToast } from '../../utils/toast';

interface Props {
  projectId: string;
  onClose: () => void;
  onUpdated: () => void;
}

type TabId = 'overview' | 'credentials' | 'tasks' | 'database' | 'notes' | 'members';

function statusBadge(s: string) {
  const map: Record<string, string> = { ACTIVE: 'badge-active', PAUSED: 'badge-paused', COMPLETED: 'badge-completed', ARCHIVED: 'badge-archived' };
  return <span className={`badge ${map[s] ?? 'badge-archived'}`}>{s}</span>;
}

function priorityBadge(p: string) {
  const map: Record<string, string> = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
  return <span className={`badge ${map[p] ?? 'badge-low'}`}>{p}</span>;
}

function taskStatusColor(s: string) {
  const map: Record<string, string> = { TODO: 'var(--text-muted)', IN_PROGRESS: 'var(--accent-cyan)', TESTING: 'var(--accent-amber)', DONE: 'var(--accent-green)' };
  return map[s] ?? 'var(--text-muted)';
}

export function ProjectDetail({ projectId, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<TabId>('overview');
  const { toast } = useToast();
  const { data: project, isLoading } = useProject(projectId);
  const currentUser = useAuthStore((s) => s.user);
  void onUpdated;

  const detail = project as (Project & {
    tasks?: Task[];
    credentials?: Credential[];
    dbConnections?: DbConnection[];
    notes?: Note[];
  }) | undefined;

  const currentUserRole: MemberRole = detail?._access?.role ?? 'OWNER';

  const githubRepos = useMemo(() => Array.isArray(detail?.githubRepos) ? detail.githubRepos : [], [detail]);
  const screenshots = useMemo(() => Array.isArray(detail?.screenshots) ? detail.screenshots : [], [detail]);
  const notes = detail?.notes ?? [];
  const tasks = detail?.tasks ?? [];
  const credentials = detail?.credentials ?? [];
  const dbConnections = detail?.dbConnections ?? [];

  function field(label: string, value: unknown, mono = false) {
    if (!value) return null;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-display)' : undefined }}>
          {String(value)}
        </div>
      </div>
    );
  }

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast(`${label} copied!`, 'success');
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Resumen' },
    { id: 'credentials', label: 'Credenciales' },
    { id: 'tasks', label: 'Tareas' },
    { id: 'database', label: 'Base de datos' },
    { id: 'notes', label: 'Notas' },
    { id: 'members', label: 'Colaboradores' },
  ];

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer project-drawer">
        {isLoading || !detail ? (
          <div className="project-drawer__loading">Cargando proyecto...</div>
        ) : (
          <>
            <div className="project-drawer__header">
              <div className="project-drawer__header-main">
                <span className="project-drawer__eyebrow">Proyecto</span>
                <h2 className="project-drawer__title">{detail.name}</h2>
                <div className="project-drawer__meta">
                  {statusBadge(detail.status)}
                  {priorityBadge(detail.priority)}
                  {!!detail.category && <span className="project-drawer__category">{detail.category}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  className="btn-icon"
                  title="Exportar PDF"
                  onClick={() => exportProjectToPDF({ project: detail, exportedBy: currentUser?.username })}
                  style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  ↓ PDF
                </button>
                <button className="btn-icon project-drawer__close" onClick={onClose} aria-label="Cerrar panel">✕</button>
              </div>
            </div>

            <div className="project-drawer__tabs-wrap">
              <div className="project-drawer__tabs">
                {tabs.map((t) => (
                  <button key={t.id} className={`project-drawer__tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="project-drawer__body">
              {tab === 'overview' && (
                <div className="project-drawer__section">
                  {screenshots.length > 0 && (
                    <div className="project-drawer__gallery">
                      <img src={screenshots[0]} alt="" className="project-drawer__hero-image" />
                      {screenshots.length > 1 && (
                        <div className="project-drawer__thumb-row">
                          {screenshots.slice(1, 4).map((src, index) => (
                            <img key={`${src}-${index}`} src={src} alt="" className="project-drawer__thumb-image" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!!detail.description && (
                    <div className="project-drawer__description">
                      {detail.description}
                    </div>
                  )}
                  <div className="project-drawer__stats">
                    <div className="project-drawer__stat-card">
                      <div className="project-drawer__stat-label">Tareas</div>
                      <div className="project-drawer__stat-value">{tasks.length}</div>
                    </div>
                    <div className="project-drawer__stat-card">
                      <div className="project-drawer__stat-label">Credenciales</div>
                      <div className="project-drawer__stat-value">{credentials.length}</div>
                    </div>
                    <div className="project-drawer__stat-card">
                      <div className="project-drawer__stat-label">Bases de datos</div>
                      <div className="project-drawer__stat-value">{dbConnections.length}</div>
                    </div>
                    <div className="project-drawer__stat-card">
                      <div className="project-drawer__stat-label">Notas</div>
                      <div className="project-drawer__stat-value">{notes.length}</div>
                    </div>
                  </div>
                  <div className="project-drawer__fields grid-2">
                    {field('Domain', detail.domain)}
                    {field('Hosting', detail.hosting)}
                    {field('Frontend URL', detail.frontendUrl)}
                    {field('Backend URL', detail.backendUrl)}
                    {field('Start Date', detail.startDate ? new Date(detail.startDate).toLocaleDateString() : null)}
                    {field('Delivery Date', detail.deliveryDate ? new Date(detail.deliveryDate).toLocaleDateString() : null)}
                    {field('Client', detail.clientName || detail.clientCompany)}
                    {field('Main Branch', detail.mainBranch)}
                  </div>
                  {githubRepos.length > 0 && (
                      <div className="project-drawer__repo-block">
                        <div className="project-drawer__subheading">Repositorios GitHub</div>
                        {githubRepos.map((r) => (
                          <a key={r} href={r} target="_blank" rel="noreferrer" className="project-drawer__repo-link">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                            {r}
                          </a>
                        ))}
                      </div>
                  )}
                </div>
              )}

              {tab === 'credentials' && (
                <div className="project-drawer__list">
                  {credentials.length === 0 ? (
                    <p className="project-drawer__empty">No hay credenciales para este proyecto.</p>
                  ) : (
                    credentials.map((c) => (
                      <div key={c.id} className="project-drawer__item-card">
                        <div className="project-drawer__item-main">
                          <div className="project-drawer__item-title">{c.label}</div>
                          <div className="project-drawer__item-meta">{c.category || 'OTHER'}{c.username ? ` · ${c.username}` : ''}</div>
                        </div>
                        <div className="project-drawer__item-actions">
                          {!!c.username && (
                            <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => copyToClipboard(c.username || '', 'Username')}>
                              Copiar usuario
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'tasks' && (
                <div className="project-drawer__list">
                  {tasks.length === 0 ? (
                    <p className="project-drawer__empty">No hay tareas para este proyecto.</p>
                  ) : (
                    tasks.map((t) => (
                      <div key={t.id} className="project-drawer__task-row">
                        <div className="project-drawer__task-dot" style={{ background: taskStatusColor(t.status) }} />
                        <span className="project-drawer__task-title">{t.title}</span>
                        <span className="project-drawer__task-status">{t.status.replace('_', ' ')}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'database' && (
                <div className="project-drawer__list">
                  {dbConnections.length === 0 ? (
                    <p className="project-drawer__empty">No hay conexiones de base de datos para este proyecto.</p>
                  ) : (
                    dbConnections.map((db) => (
                      <div key={db.id} className="project-drawer__item-card project-drawer__item-card--stacked">
                        <div className="project-drawer__item-title">{db.label}</div>
                        <div className="project-drawer__code">
                          {db.host ? `${db.host}:${String(db.port ?? '')}/${String(db.dbName ?? '')}` : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'notes' && (
                <div className="project-drawer__list">
                  {notes.length === 0 ? (
                    <p className="project-drawer__empty">No hay notas para este proyecto.</p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="project-drawer__item-card project-drawer__item-card--stacked">
                        <div className="project-drawer__item-title">
                          {!!n.isPinned && <span style={{ marginRight: 6 }}>📌</span>}
                          {n.title}
                        </div>
                        <div className="project-drawer__note-content">
                          {n.content.slice(0, 200)}{n.content.length > 200 ? '...' : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'members' && (
                <ProjectMembers projectId={projectId} currentUserRole={currentUserRole} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
