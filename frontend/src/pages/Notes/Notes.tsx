import React, { useState } from 'react';
import { Plus, Search, StickyNote, Pin, Trash2 } from 'lucide-react';
import { useNotes, useCreateNote, useUpdateNote, usePinNote, useDeleteNote } from '@/hooks/useNotes';
import { useProjects } from '@/hooks/useProjects';
import { Modal } from '@/components/UI/Modal';
import { EmptyState } from '@/components/UI/EmptyState';
import { Spinner } from '@/components/UI/Spinner';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { timeAgo, getErrorMessage } from '@/utils/formatters';
import toast from 'react-hot-toast';
import type { Note } from '@/types';

export function Notes() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', content: '', projectId: '' });

  const { data: projects } = useProjects();
  const { data: notes, isLoading } = useNotes({ projectId: projectId || undefined, search: search || undefined });
  const createMut = useCreateNote();
  const updateMut = useUpdateNote();
  const pinMut = usePinNote();
  const deleteMut = useDeleteNote();

  function openEdit(n: Note) { setEditing(n); setForm({ title: n.title, content: n.content, projectId: n.projectId || '' }); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...form, projectId: form.projectId || undefined });
        toast.success('Note updated');
        setEditing(null);
      } else {
        await createMut.mutateAsync({ ...form, projectId: form.projectId || undefined });
        toast.success('Note created');
        setShowCreate(false);
      }
      setForm({ title: '', content: '', projectId: '' });
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success('Note deleted');
      setDeleteTarget(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
          <input className="input-base pl-8" placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-base max-w-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">All projects</option>
          {projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <button className="btn-primary" onClick={() => { setForm({ title: '', content: '', projectId: '' }); setShowCreate(true); }}>
          <Plus size={15} /> New Note
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="text-[#39D0D8]" /></div>
      ) : !notes?.length ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Capture thoughts, docs and roadmap ideas." action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> New Note</button>} />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {notes.map((n) => (
            <div key={n.id} className={`break-inside-avoid card p-4 cursor-pointer hover:border-[rgba(57,208,216,0.3)] transition-colors ${n.isPinned ? 'border-[rgba(245,158,11,0.3)]' : ''}`} onClick={() => openEdit(n)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-[#E6EDF3] leading-snug flex-1">{n.title}</h3>
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => pinMut.mutate(n.id)} className={`p-1 rounded transition-colors ${n.isPinned ? 'text-[#F59E0B]' : 'text-[#484F58] hover:text-[#F59E0B]'}`}>
                    <Pin size={12} />
                  </button>
                  <button onClick={() => setDeleteTarget(n)} className="p-1 text-[#484F58] hover:text-[#EF4444] rounded transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {n.project && <p className="text-[10px] text-[#39D0D8] mb-2">{n.project.name}</p>}
              {n.content && <p className="text-xs text-[#8B949E] leading-relaxed line-clamp-6">{n.content}</p>}
              <p className="text-[10px] text-[#484F58] mt-3">{timeAgo(n.updatedAt)}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate || !!editing} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Note' : 'New Note'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Title *</label>
            <input className="input-base" placeholder="Note title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Content</label>
            <textarea className="input-base resize-none font-mono text-xs" rows={12} placeholder="Write your note here..." value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-[#8B949E] mb-1.5 block">Project</label>
            <select className="input-base" value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}>
              <option value="">No project</option>
              {projects?.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} message={`Delete note "${deleteTarget?.title}"?`} loading={deleteMut.isPending} />
    </div>
  );
}