import React, { useState } from 'react';
import { Plus, Database, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useDbConnections, useRevealDbConnection, useCreateDbConnection, useDeleteDbConnection } from '@/hooks/useDbConnections';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { EmptyState } from '@/components/UI/EmptyState';
import { Spinner } from '@/components/UI/Spinner';
import { getErrorMessage } from '@/utils/formatters';
import toast from 'react-hot-toast';
import type { DbConnection, DbType } from '@/types';

const DB_TYPES: DbType[] = ['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'other'];
const DB_COLORS: Record<string, 'cyan' | 'green' | 'amber' | 'violet' | 'red' | 'muted'> = {
  postgresql: 'cyan', mysql: 'amber', sqlite: 'green', mongodb: 'green', redis: 'red', other: 'muted'
};

type FormData = { label: string; type: DbType; host: string; port: string; dbName: string; username: string; password: string; notes: string; projectId: string };
const INIT: FormData = { label: '', type: 'postgresql', host: '', port: '', dbName: '', username: '', password: '', notes: '', projectId: '' };

export function DatabasePage() {
  const [projectId, setProjectId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbConnection | null>(null);
  const [revealed, setRevealed] = useState<Record<string, { username: string; password: string }>>({});
  const [form, setForm] = useState<FormData>(INIT);

  const { data: projects } = useProjects();
  const { data: connections, isLoading } = useDbConnections({ projectId: projectId || undefined });
  const revealMut = useRevealDbConnection();
  const createMut = useCreateDbConnection();
  const deleteMut = useDeleteDbConnection();

  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleReveal(id: string) {
    if (revealed[id]) { setRevealed((r) => { const n = { ...r }; delete n[id]; return n; }); return; }
    try {
      const data = await revealMut.mutateAsync(id);
      setRevealed((r) => ({ ...r, [id]: data }));
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createMut.mutateAsync({ ...form, projectId: form.projectId || undefined, port: form.port ? parseInt(form.port) : undefined } as Partial<DbConnection>);
      toast.success('Connection saved');
      setShowCreate(false);
      setForm(INIT);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('Connection deleted');
      setDeleteTarget(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-[#8B949E]">Database connections are stored with encrypted credentials.</p>
        <div className="flex items-center gap-3">
          <select className="input-base max-w-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Add Connection
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="text-[#39D0D8]" /></div>
      ) : !connections?.length ? (
        <EmptyState icon={Database} title="No connections yet" description="Save your database connection details securely." action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Add Connection</button>} />
      ) : (
        <div className="space-y-2">
          {connections.map((c) => {
            const rev = revealed[c.id];
            return (
              <div key={c.id} className="card p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-[#161B22] flex items-center justify-center shrink-0">
                  <Database size={15} className="text-[#8B949E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#E6EDF3]">{c.label}</p>
                    <Badge label={c.type} size="xs" color={DB_COLORS[c.type] ?? 'muted'} />
                    {c.project && <Badge label={c.project.name} size="xs" />}
                  </div>
                  <p className="text-xs font-mono text-[#8B949E]">
                    {rev ? `${rev.username}@${c.host ?? 'localhost'}:${c.port ?? '5432'}/${c.dbName ?? ''}` : `****@${c.host ?? '****'}:${c.port ?? '****'}/${c.dbName ?? '****'}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="btn-ghost p-2" onClick={() => handleReveal(c.id)} title={rev ? 'Hide' : 'Reveal'}>
                    {rev ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button className="btn-ghost p-2 hover:text-[#EF4444]" onClick={() => setDeleteTarget(c)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add DB Connection" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Label *</label>
              <input className="input-base" placeholder="Production DB" value={form.label} onChange={(e) => set('label', e.target.value)} required /></div>
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Type</label>
              <select className="input-base" value={form.type} onChange={(e) => set('type', e.target.value as DbType)}>
                {DB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Host</label>
              <input className="input-base" placeholder="localhost" value={form.host} onChange={(e) => set('host', e.target.value)} /></div>
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Port</label>
              <input className="input-base" placeholder="5432" value={form.port} onChange={(e) => set('port', e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Database Name</label>
            <input className="input-base" value={form.dbName} onChange={(e) => set('dbName', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Project</label>
            <select className="input-base" value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              <option value="">No project</option>
              {projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Username</label>
              <input className="input-base" value={form.username} onChange={(e) => set('username', e.target.value)} /></div>
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Password</label>
              <input className="input-base" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Notes</label>
            <textarea className="input-base resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMut.isPending}>{createMut.isPending ? 'Saving...' : 'Save Connection'}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} message={`Delete connection "${deleteTarget?.label}"?`} loading={deleteMut.isPending} />
    </div>
  );
}