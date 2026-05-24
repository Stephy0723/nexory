import React, { useState } from 'react';
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects';
import type { Project } from '../../types';
import { useToast } from '../../utils/toast';

interface Props {
  project: Project | null;
  onClose: () => void;
  onSaved: () => void;
}

type Step = 1 | 2 | 3;

const STEPS = ['Basic Info', 'Infrastructure', 'Details'];

export function ProjectModal({ project, onClose, onSaved }: Props) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'ACTIVE',
    category: project?.category ?? '',
    priority: project?.priority ?? 'MEDIUM',
    startDate: project?.startDate ? project.startDate.slice(0, 10) : '',
    deliveryDate: project?.deliveryDate ? project.deliveryDate.slice(0, 10) : '',
    domain: project?.domain ?? '',
    hosting: project?.hosting ?? '',
    frontendUrl: project?.frontendUrl ?? '',
    backendUrl: project?.backendUrl ?? '',
    githubRepos: Array.isArray(project?.githubRepos) ? project.githubRepos.join('\n') : '',
  });

  function set(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim()) { toast('Name is required', 'error'); return; }
    setIsLoading(true);
    try {
      const repos = form.githubRepos.trim() ? form.githubRepos.split('\n').map((r: string) => r.trim()).filter((r: string) => r.length > 0) : [];
      const payload = {
        ...form,
        githubRepos: repos.length ? repos : undefined,

        startDate: form.startDate || undefined,
        deliveryDate: form.deliveryDate || undefined,
      };
      if (project) {
        await updateProject.mutateAsync({ id: project.id, ...payload });
        toast('Project updated', 'success');
      } else {
        await createProject.mutateAsync(payload);
        toast('Project created', 'success');
      }
      onSaved();
    } catch {
      toast('Failed to save project', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{project ? 'Edit Project' : 'New Project'}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Steps */}
          <div className="steps">
            {STEPS.map((label, i) => {
              const n = (i + 1) as Step;
              return (
                <React.Fragment key={n}>
                  <div className="step">
                    <div
                      className={`step-dot ${step === n ? 'active' : step > n ? 'done' : 'pending'}`}
                      onClick={() => setStep(n)}
                      style={{ cursor: 'pointer' }}
                    >
                      {step > n ? '✓' : n}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`step-line${step > n ? ' done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Project name" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is this project about?" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Web App, Mobile, API, etc." />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Date</label>
                  <input type="date" className="form-input" value={form.deliveryDate} onChange={(e) => set('deliveryDate', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">Domain</label>
                <input className="form-input" value={form.domain} onChange={(e) => set('domain', e.target.value)} placeholder="myapp.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Hosting</label>
                <input className="form-input" value={form.hosting} onChange={(e) => set('hosting', e.target.value)} placeholder="Vercel, AWS, DigitalOcean..." />
              </div>
              <div className="form-group">
                <label className="form-label">Frontend URL</label>
                <input className="form-input" value={form.frontendUrl} onChange={(e) => set('frontendUrl', e.target.value)} placeholder="https://myapp.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Backend URL</label>
                <input className="form-input" value={form.backendUrl} onChange={(e) => set('backendUrl', e.target.value)} placeholder="https://api.myapp.com" />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label className="form-label">GitHub Repositories (one per line)</label>
                <textarea
                  className="form-input"
                  value={form.githubRepos}
                  onChange={(e) => set('githubRepos', e.target.value)}
                  placeholder="https://github.com/user/repo"
                  style={{ minHeight: 100 }}
                />
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {step > 1 && (
            <button className="btn btn-secondary" onClick={() => setStep((s) => (s - 1) as Step)}>← Back</button>
          )}
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => (s + 1) as Step)}>Next →</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : project ? 'Update' : 'Create'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
