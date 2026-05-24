import React, { useState } from 'react';
import { Plus, Search, Eye, EyeOff, KeyRound, ExternalLink, Trash2 } from 'lucide-react';
import { useCredentials, useRevealCredential, useCreateCredential, useDeleteCredential } from '@/hooks/useCredentials';
import { useProjects } from '@/hooks/useProjects';
import { Badge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { EmptyState } from '@/components/UI/EmptyState';
import { Spinner } from '@/components/UI/Spinner';
import { getErrorMessage } from '@/utils/formatters';
import toast from 'react-hot-toast';
import type { Credential } from '@/types';

type FormData = { label: string; username: string; password: string; url: string; notes: string; category: string; projectId: string };
const INIT: FormData = { label: '', username: '', password: '', url: '', notes: '', category: '', projectId: '' };

export function Credentials() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null);
  const [revealed, setRevealed] = useState<Record<string, { username: string; password: string }>>({});
  const [form, setForm] = useState<FormData>(INIT);

  const { data: projects } = useProjects();
  const { data: credentials, isLoading } = useCredentials({ projectId: projectId || undefined, search: search || undefined });
  const revealMut = useRevealCredential();
  const createMut = useCreateCredential();
  const deleteMut = useDeleteCredential();

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
      await createMut.mutateAsync({ ...form, projectId: form.projectId || undefined });
      toast.success('Credential saved');
      setShowCreate(false);
      setForm(INIT);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('Credential deleted');
      setDeleteTarget(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
          <input className="input-base pl-8" placeholder="Search credentials..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-base max-w-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">All projects</option>
          {projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Add Credential
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="text-[#39D0D8]" /></div>
      ) : !credentials?.length ? (
        <EmptyState icon={KeyRound} title="No credentials yet" description="Store your project credentials securely." action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Add Credential</button>} />
      ) : (
        <div className="space-y-2">
          {credentials.map((c) => {
            const rev = revealed[c.id];
            return (
              <div key={c.id} className="card p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-[rgba(139,92,246,0.12)] flex items-center justify-center shrink-0">
                  <KeyRound size={15} className="text-[#8B5CF6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-[#E6EDF3]">{c.label}</p>
                    {c.category && <Badge label={c.category} size="xs" color="violet" />}
                    {c.project && <Badge label={c.project.name} size="xs" />}
                  </div>
                  {rev ? (
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-[#8B949E]">{rev.username}</span>
                      <span className="text-[#39D0D8] select-all">{rev.password}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-[#484F58] font-mono">••••••••••••</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2" title="Open URL">
                      <ExternalLink size={14} />
                    </a>
                  )}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Credential" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Label *</label>
            <input className="input-base" placeholder="GitHub SSH Key" value={form.label} onChange={(e) => set('label', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Username / Key</label>
              <input className="input-base" value={form.username} onChange={(e) => set('username', e.target.value)} /></div>
            <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Password / Secret</label>
              <input className="input-base" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">URL</label>
            <input className="input-base" placeholder="https://..." value={form.url} onChange={(e) => set('url', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Category</label>
            <input className="input-base" placeholder="API, SSH, Database..." value={form.category} onChange={(e) => set('category', e.target.value)} /></div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Project</label>
            <select className="input-base" value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              <option value="">No project</option>
              {projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select></div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Notes</label>
            <textarea className="input-base resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMut.isPending}>{createMut.isPending ? 'Saving...' : 'Save Credential'}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} message={`Delete credential "${deleteTarget?.label}"?`} loading={deleteMut.isPending} />
    </div>
  );
}