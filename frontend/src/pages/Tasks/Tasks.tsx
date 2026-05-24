import React, { useState } from 'react';
import { Plus, Search, CheckSquare } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';
import { EmptyState } from '@/components/UI/EmptyState';
import { Spinner } from '@/components/UI/Spinner';
import { statusLabel, priorityLabel, getErrorMessage } from '@/utils/formatters';
import toast from 'react-hot-toast';
import type { Task, TaskStatus, Priority } from '@/types';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
const STATUS_COLORS: Record<TaskStatus, 'muted' | 'cyan' | 'violet' | 'green' | 'red'> = {
  TODO: 'muted', IN_PROGRESS: 'cyan', IN_REVIEW: 'violet', DONE: 'green', BLOCKED: 'red'
};

type FormData = { title: string; description: string; status: TaskStatus; priority: Priority; projectId: string };
const INIT: FormData = { title: '', description: '', status: 'TODO', priority: 'MEDIUM', projectId: '' };

export function Tasks() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormData>(INIT);

  const { data: projects } = useProjects();
  const { data: tasks, isLoading } = useTasks({ projectId: projectId || undefined, search: search || undefined });
  const createMut = useCreateTask();
  const statusMut = useUpdateTaskStatus();
  const deleteMut = useDeleteTask();

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const byStatus = STATUSES.reduce<Record<TaskStatus, Task[]>>((acc, s) => {
    acc[s] = (tasks ?? []).filter((t) => t.status === s);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createMut.mutateAsync({ ...form, projectId: form.projectId || undefined });
      toast.success('Task created');
      setShowCreate(false);
      setForm(INIT);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    try { await statusMut.mutateAsync({ id: taskId, status }); }
    catch (err) { toast.error(getErrorMessage(err)); }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="text-[#39D0D8]" /></div>;

  return (
    <div className="max-w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
          <input className="input-base pl-8" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-base max-w-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">All projects</option>
          {projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Task
        </button>
      </div>

      {!tasks?.length ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Create your first task." action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> New Task</button>} />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <div key={status} className="flex-1 min-w-[220px] max-w-[280px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Badge label={statusLabel(status)} color={STATUS_COLORS[status]} size="xs" />
                <span className="text-xs text-[#484F58]">{byStatus[status].length}</span>
              </div>
              <div className="space-y-2">
                {byStatus[status].map((t) => (
                  <div key={t.id} className="card p-3 cursor-default group">
                    <p className="text-xs font-medium text-[#E6EDF3] mb-2 leading-relaxed">{t.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge label={priorityLabel(t.priority)} size="xs" color={t.priority === 'HIGH' || t.priority === 'CRITICAL' ? 'red' : t.priority === 'MEDIUM' ? 'amber' : 'muted'} />
                        {t.project && <span className="text-[10px] text-[#8B949E] truncate">{t.project.name}</span>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {STATUSES.filter((s) => s !== status).slice(0, 2).map((s) => (
                          <button key={s} onClick={() => moveTask(t.id, s)} className="text-[9px] text-[#484F58] hover:text-[#39D0D8] px-1 py-0.5 rounded">
                            → {s.split('_')[0]}
                          </button>
                        ))}
                        <button onClick={() => deleteMut.mutateAsync(t.id)} className="text-[9px] text-[#484F58] hover:text-[#EF4444] px-1">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Task" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Title *</label>
            <input className="input-base" placeholder="Task title" value={form.title} onChange={(e) => set('title', e.target.value)} required /></div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Description</label>
            <textarea className="input-base resize-none" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Status</label>
              <select className="input-base" value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Priority</label>
              <select className="input-base" value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
                {(['LOW','MEDIUM','HIGH','CRITICAL'] as Priority[]).map((p) => <option key={p} value={p}>{priorityLabel(p)}</option>)}
              </select></div>
          </div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Project</label>
            <select className="input-base" value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              <option value="">No project</option>
              {projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMut.isPending}>{createMut.isPending ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}