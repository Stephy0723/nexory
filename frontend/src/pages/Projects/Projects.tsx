import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { Badge } from '@/components/UI/Badge';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { EmptyState } from '@/components/UI/EmptyState';
import { Spinner } from '@/components/UI/Spinner';
import { ProjectForm } from '@/components/modules/projects/ProjectForm';
import type { ProjectFormData } from '@/components/modules/projects/ProjectForm';
import { ProjectDetail } from '@/pages/Projects/ProjectDetail';
import { statusLabel, priorityLabel, formatDate, getErrorMessage } from '@/utils/formatters';
import toast from 'react-hot-toast';
import type { Project, ProjectStatus } from '@/types';

function getProjectCover(project: Project) {
  return Array.isArray(project.screenshots) && project.screenshots.length > 0 ? project.screenshots[0] : null;
}

function statusBadgeColor(s: ProjectStatus) {
  if (s === 'ACTIVE') return 'green';
  if (s === 'IN_DEVELOPMENT') return 'cyan';
  if (s === 'PAUSED') return 'amber';
  if (s === 'COMPLETED') return 'muted';
  return 'muted';
}

export function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [viewProjectId, setViewProjectId] = useState<string | null>(searchParams.get('view'));

  const { data: projects, isLoading } = useProjects({ search: search || undefined });
  const createMut = useCreateProject();
  const updateMut = useUpdateProject();
  const deleteMut = useDeleteProject();

  useEffect(() => {
    setViewProjectId(searchParams.get('view'));
  }, [searchParams]);

  function openProjectView(projectId: string) {
    const next = new URLSearchParams(searchParams);
    next.set('view', projectId);
    setSearchParams(next);
  }

  function closeProjectView() {
    const next = new URLSearchParams(searchParams);
    next.delete('view');
    setSearchParams(next);
  }

  async function handleCreate(data: ProjectFormData) {
    try {
      await createMut.mutateAsync(data as unknown as Partial<Project>);
      toast.success('Project created');
      setShowCreate(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleUpdate(data: ProjectFormData) {
    if (!editTarget) return;
    try {
      await updateMut.mutateAsync({ id: editTarget.id, ...(data as unknown as Partial<Project>) });
      toast.success('Project updated');
      setEditTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('Project deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
          <input className="input-base pl-8" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="text-[#39D0D8]" /></div>
      ) : !projects?.length ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to get started." action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> New Project</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="card p-5 flex flex-col gap-3 hover:border-[rgba(57,208,216,0.3)] transition-colors">
              {getProjectCover(p) ? (
                <button
                  type="button"
                  className="block -mx-5 -mt-5 mb-1 aspect-video overflow-hidden rounded-t-lg bg-[#080B12] border-b border-[#21262D]"
                  onClick={() => openProjectView(p.id)}
                  aria-label={`Ver ${p.name}`}
                >
                  <img src={getProjectCover(p) || ''} alt="" className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]" />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex -mx-5 -mt-5 mb-1 aspect-video items-center justify-center rounded-t-lg bg-[radial-gradient(circle_at_top,rgba(57,208,216,0.14),rgba(13,17,23,0.95))] border-b border-[#21262D]"
                  onClick={() => openProjectView(p.id)}
                  aria-label={`Ver ${p.name}`}
                >
                  <FolderKanban size={28} className="text-[#39D0D8]/60" />
                </button>
              )}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#E6EDF3] leading-tight">{p.name}</h3>
                <Badge label={statusLabel(p.status)} color={statusBadgeColor(p.status)} size="xs" />
              </div>
              {p.description && <p className="text-xs text-[#8B949E] line-clamp-2">{p.description}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge label={priorityLabel(p.priority)} size="xs" color={p.priority === 'HIGH' || p.priority === 'CRITICAL' ? 'red' : p.priority === 'MEDIUM' ? 'amber' : 'muted'} />
                {p.category && <Badge label={p.category} size="xs" />}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#484F58] mt-auto">
                <span>{p._count?.tasks ?? 0} tasks</span>
                <span>·</span>
                <span>{p._count?.credentials ?? 0} creds</span>
                {p.deliveryDate && <><span>·</span><span>Due {formatDate(p.deliveryDate)}</span></>}
              </div>
              <div className="flex gap-2 pt-2 border-t border-[#21262D]">
                <button className="btn-ghost text-xs flex-1 justify-center py-1.5" onClick={() => openProjectView(p.id)}>Ver</button>
                <button className="btn-ghost text-xs flex-1 justify-center py-1.5" onClick={() => setEditTarget(p)}>Edit</button>
                <button className="btn-ghost text-xs text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]" onClick={() => setDeleteTarget(p)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectForm open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} isLoading={createMut.isPending} />
      <ProjectForm open={!!editTarget} onClose={() => setEditTarget(null)} onSubmit={handleUpdate} project={editTarget} isLoading={updateMut.isPending} />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} message={`Delete project "${deleteTarget?.name}"? This will also delete all associated tasks, credentials, and notes.`} loading={deleteMut.isPending} />
      {viewProjectId && <ProjectDetail projectId={viewProjectId} onClose={closeProjectView} onUpdated={() => undefined} />}
    </div>
  );
}
