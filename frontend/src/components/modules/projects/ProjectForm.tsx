import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  X, ChevronDown, ChevronRight, Eye, EyeOff, Plus, Trash2,
  Lock, Image as ImageIcon, Upload,
} from 'lucide-react';
import type { Project, ProjectStatus, Priority } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ProjectFormData {
  // Basic
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  category: string;
  tags: string[];
  startDate: string;
  deliveryDate: string;
  // Client
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  // Financial
  billingType: string;
  budget: string;
  monthlyCost: string;
  estimatedHours: string;
  realHours: string;
  // Stack
  stackFrontend: string[];
  stackBackend: string[];
  stackDatabase: string[];
  stackDevops: string[];
  stackExternal: string[];
  // Infrastructure
  domain: string;
  domainRegistrar: string;
  domainExpiry: string;
  hosting: string;
  hostingPlan: string;
  hostingExpiry: string;
  frontendUrl: string;
  backendUrl: string;
  stagingUrl: string;
  adminPanelUrl: string;
  githubRepos: string[];
  mainBranch: string;
  technicalDocs: string;
  roadmap: string;
  setupNotes: string;
  // Server Access
  sshHost: string;
  sshPort: string;
  sshUser: string;
  sshPassword: string;
  sshKeyPath: string;
  hostingPanelType: string;
  hostingPanelUrl: string;
  hostingPanelUser: string;
  hostingPanelPass: string;
  envVars: string;
  // Screenshots
  screenshots: string[];
}

const INIT: ProjectFormData = {
  name: '', description: '', status: 'ACTIVE', priority: 'MEDIUM', category: '', tags: [],
  startDate: '', deliveryDate: '',
  clientName: '', clientCompany: '', clientEmail: '', clientPhone: '',
  billingType: '', budget: '', monthlyCost: '', estimatedHours: '', realHours: '',
  stackFrontend: [], stackBackend: [], stackDatabase: [], stackDevops: [], stackExternal: [],
  domain: '', domainRegistrar: '', domainExpiry: '', hosting: '', hostingPlan: '',
  hostingExpiry: '', frontendUrl: '', backendUrl: '', stagingUrl: '', adminPanelUrl: '',
  githubRepos: [''], mainBranch: 'main', technicalDocs: '', roadmap: '', setupNotes: '',
  sshHost: '', sshPort: '22', sshUser: '', sshPassword: '', sshKeyPath: '',
  hostingPanelType: '', hostingPanelUrl: '', hostingPanelUser: '', hostingPanelPass: '',
  envVars: '', screenshots: [],
};

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  project?: Project | null;
  isLoading?: boolean;
}

// ─── Presets ──────────────────────────────────────────────────────────────────
const STACK_PRESETS = {
  stackFrontend: ['React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Bootstrap', 'Vite', 'shadcn/ui'],
  stackBackend: ['Node.js', 'Express', 'Fastify', 'NestJS', 'Django', 'Laravel', 'FastAPI', 'Go', 'PHP', 'Python', '.NET'],
  stackDatabase: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis', 'Supabase', 'Firebase', 'DynamoDB'],
  stackDevops: ['Docker', 'Nginx', 'GitHub Actions', 'Vercel', 'Railway', 'Render', 'AWS', 'DigitalOcean', 'PM2', 'Cloudflare'],
  stackExternal: ['Stripe', 'PayPal', 'SendGrid', 'Twilio', 'Cloudinary', 'AWS S3', 'OpenAI', 'Anthropic', 'Pusher', 'Sentry'],
};

const CATEGORIES = ['Web App', 'API/Backend', 'Mobile', 'Internal Tool', 'Client Project', 'Idea/R&D', 'CLI/Script', 'Design System'];
const BILLING_TYPES = ['Fixed', 'Hourly', 'Monthly', 'Free'];
const DOMAIN_REGISTRARS = ['GoDaddy', 'Namecheap', 'Cloudflare'];
const HOSTING_PROVIDERS = ['Vercel', 'DigitalOcean', 'AWS', 'Railway', 'VPS'];
const PANEL_TYPES = ['cPanel', 'Plesk', 'ServerPilot', 'Laravel Forge', 'Other'];

// ─── Helper: section has data ──────────────────────────────────────────────────
function sectionHasData(form: ProjectFormData, section: string): boolean {
  switch (section) {
    case 'client':
      return !!(form.clientName || form.clientCompany || form.clientEmail || form.clientPhone);
    case 'financial':
      return !!(form.billingType || form.budget || form.monthlyCost || form.estimatedHours || form.realHours);
    case 'stack':
      return [form.stackFrontend, form.stackBackend, form.stackDatabase, form.stackDevops, form.stackExternal].some((a) => a.length > 0);
    case 'infra':
      return !!(form.domain || form.frontendUrl || form.backendUrl || form.stagingUrl || form.technicalDocs || form.setupNotes || (form.githubRepos.some((r) => r.trim())));
    case 'server':
      return !!(form.sshHost || form.hostingPanelUrl || form.envVars);
    case 'screenshots':
      return form.screenshots.length > 0;
    default:
      return false;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#8B949E] mb-1.5 uppercase tracking-wide">
      {children}
      {optional && <span className="text-[#484F58] normal-case font-normal tracking-normal">optional</span>}
    </label>
  );
}

function SectionHeader({
  title, isOpen, onToggle, hasData,
}: { title: string; isOpen: boolean; onToggle: () => void; hasData: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 px-0 text-left group"
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full transition-colors ${hasData ? 'bg-[#39D0D8]' : 'bg-[#21262D]'}`}
        />
        <span className="text-[13px] font-semibold text-[#C9D1D9] group-hover:text-white transition-colors">{title}</span>
      </div>
      {isOpen ? <ChevronDown size={14} className="text-[#484F58]" /> : <ChevronRight size={14} className="text-[#484F58]" />}
    </button>
  );
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  function add() {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  }
  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-[#0D1117] border border-[#21262D] rounded-md min-h-[38px] items-center focus-within:border-[#39D0D8] transition-colors">
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(57,208,216,0.12)] border border-[rgba(57,208,216,0.3)] rounded text-[11px] text-[#39D0D8]">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="hover:text-white">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[80px] bg-transparent text-xs text-[#E6EDF3] placeholder:text-[#484F58] outline-none"
        value={draft}
        placeholder={placeholder || 'Type + Enter'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
      />
    </div>
  );
}

function StackInput({
  label, layer, value, onChange,
}: { label: string; layer: keyof typeof STACK_PRESETS; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <Label optional>{label}</Label>
      <TagInput value={value} onChange={onChange} />
      <div className="flex flex-wrap gap-1 mt-2">
        {STACK_PRESETS[layer].map((chip) => {
          const active = value.includes(chip);
          return (
            <button
              key={chip}
              type="button"
              onClick={() => {
                if (active) onChange(value.filter((v) => v !== chip));
                else onChange([...value, chip]);
              }}
              className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${active
                ? 'border-[#39D0D8] bg-[rgba(57,208,216,0.15)] text-[#39D0D8]'
                : 'border-[#21262D] bg-[#0D1117] text-[#484F58] hover:border-[#484F58] hover:text-[#8B949E]'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PasswordField({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className="input-base pr-9"
        placeholder={placeholder || '••••••••'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#8B949E]">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProjectForm({ open, onClose, onSubmit, project, isLoading }: ProjectFormProps) {
  function projectToForm(p: Project): ProjectFormData {
    function parseArr(s: unknown): string[] {
      if (Array.isArray(s)) return s;
      try { return JSON.parse(s as string) || []; } catch { return []; }
    }
    return {
      name: p.name || '',
      description: p.description || '',
      status: p.status,
      priority: p.priority,
      category: p.category || '',
      tags: parseArr(p.tags),
      startDate: p.startDate ? p.startDate.split('T')[0] : '',
      deliveryDate: p.deliveryDate ? p.deliveryDate.split('T')[0] : '',
      clientName: (p as any).clientName || '',
      clientCompany: (p as any).clientCompany || '',
      clientEmail: (p as any).clientEmail || '',
      clientPhone: (p as any).clientPhone || '',
      billingType: (p as any).billingType || '',
      budget: (p as any).budget || '',
      monthlyCost: (p as any).monthlyCost || '',
      estimatedHours: (p as any).estimatedHours?.toString() || '',
      realHours: (p as any).realHours?.toString() || '',
      stackFrontend: parseArr((p as any).stackFrontend),
      stackBackend: parseArr((p as any).stackBackend),
      stackDatabase: parseArr((p as any).stackDatabase),
      stackDevops: parseArr((p as any).stackDevops),
      stackExternal: parseArr((p as any).stackExternal),
      domain: p.domain || '',
      domainRegistrar: (p as any).domainRegistrar || '',
      domainExpiry: (p as any).domainExpiry ? (p as any).domainExpiry.split('T')[0] : '',
      hosting: p.hosting || '',
      hostingPlan: (p as any).hostingPlan || '',
      hostingExpiry: (p as any).hostingExpiry ? (p as any).hostingExpiry.split('T')[0] : '',
      frontendUrl: p.frontendUrl || '',
      backendUrl: p.backendUrl || '',
      stagingUrl: (p as any).stagingUrl || '',
      adminPanelUrl: (p as any).adminPanelUrl || '',
      githubRepos: parseArr(p.githubRepos).length ? parseArr(p.githubRepos) : [''],
      mainBranch: (p as any).mainBranch || 'main',
      technicalDocs: p.technicalDocs || '',
      roadmap: p.roadmap || '',
      setupNotes: (p as any).setupNotes || '',
      sshHost: (p as any).sshHost || '',
      sshPort: (p as any).sshPort || '22',
      sshUser: (p as any).sshUser || '',
      sshPassword: '',
      sshKeyPath: (p as any).sshKeyPath || '',
      hostingPanelType: (p as any).hostingPanelType || '',
      hostingPanelUrl: (p as any).hostingPanelUrl || '',
      hostingPanelUser: (p as any).hostingPanelUser || '',
      hostingPanelPass: '',
      envVars: '',
      screenshots: parseArr((p as any).screenshots),
    };
  }

  const [form, setForm] = useState<ProjectFormData>(project ? projectToForm(project) : INIT);
  const [sections, setSections] = useState({ basic: true, client: false, financial: false, stack: false, infra: false, server: false, screenshots: false });
  const [tagDraft, setTagDraft] = useState('');
  const [descLen, setDescLen] = useState(form.description.length);
  const drawerRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(project ? projectToForm(project) : INIT);
      setSections({ basic: true, client: false, financial: false, stack: false, infra: false, server: false, screenshots: false });
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [open, project]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const set = useCallback(<K extends keyof ProjectFormData>(k: K, v: ProjectFormData[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

  function toggleSection(s: keyof typeof sections) {
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = { ...form };
    payload.githubRepos = form.githubRepos.filter((r) => r.trim());
    await onSubmit(payload);
  }

  function handleScreenshotDrop(e: React.DragEvent) {
    e.preventDefault();
    processImageFiles(Array.from(e.dataTransfer.files));
  }

  function processImageFiles(files: File[]) {
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        set('screenshots', [...form.screenshots, b64]);
      };
      reader.readAsDataURL(file);
    });
  }

  if (!open) return null;

  const canSave = form.name.trim().length > 0;

  // Status button config
  const STATUS_OPTS: { value: ProjectStatus; label: string; color: string }[] = [
    { value: 'ACTIVE', label: 'Active', color: '#22C55E' },
    { value: 'PAUSED', label: 'Paused', color: '#F59E0B' },
    { value: 'IN_DEVELOPMENT', label: 'In Dev', color: '#A78BFA' },
    { value: 'COMPLETED', label: 'Done', color: '#39D0D8' },
    { value: 'ARCHIVED', label: 'Archived', color: '#484F58' },
  ];

  const PRIORITY_OPTS: { value: Priority; label: string; emoji: string; color: string }[] = [
    { value: 'CRITICAL', label: 'Critical', emoji: '🔴', color: '#EF4444' },
    { value: 'HIGH', label: 'High', emoji: '🟠', color: '#F59E0B' },
    { value: 'MEDIUM', label: 'Medium', emoji: '🔵', color: '#3B82F6' },
    { value: 'LOW', label: 'Low', emoji: '⚪', color: '#484F58' },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[9990] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-[680px] max-w-full z-[9991] flex flex-col bg-[#0D1117] border-l border-[#21262D] shadow-2xl overflow-hidden"
        style={{ animation: 'slideInRight 0.25s ease' }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262D] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#E6EDF3]">{project ? 'Edit Project' : 'New Project'}</h2>
            <p className="text-[11px] text-[#484F58] mt-0.5">Only name is required — fill the rest anytime</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[#21262D] rounded-md text-[#484F58] hover:text-[#E6EDF3] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-0">

          {/* ── SECTION 1: BASIC INFO ── */}
          <SectionHeader title="Basic Info" isOpen={sections.basic} onToggle={() => toggleSection('basic')} hasData={!!form.name} />
          {sections.basic && (
            <div className="pb-4 space-y-4 border-b border-[#21262D]">
              {/* Name */}
              <div>
                <Label>Project Name *</Label>
                <input
                  ref={nameRef}
                  className="input-base text-sm font-medium"
                  placeholder="My Awesome Project"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label optional>
                  Description
                  <span className="ml-auto text-[#484F58] font-normal normal-case tracking-normal">{descLen}/500</span>
                </Label>
                <textarea
                  className="input-base resize-none"
                  rows={3}
                  placeholder="Brief description of the project..."
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => { set('description', e.target.value); setDescLen(e.target.value.length); }}
                />
              </div>

              {/* Status */}
              <div>
                <Label optional>Status</Label>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => set('status', s.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${form.status === s.value ? 'border-current' : 'border-[#21262D] bg-[#0D1117] text-[#484F58] hover:border-[#484F58]'}`}
                      style={form.status === s.value ? { color: s.color, background: `${s.color}18`, borderColor: `${s.color}80` } : {}}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <Label optional>Priority</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITY_OPTS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set('priority', p.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${form.priority === p.value ? 'border-current' : 'border-[#21262D] bg-[#0D1117] text-[#484F58] hover:border-[#484F58]'}`}
                      style={form.priority === p.value ? { color: p.color, background: `${p.color}18`, borderColor: `${p.color}80` } : {}}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <Label optional>Category</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('category', form.category === c ? '' : c)}
                      className={`px-2.5 py-1 rounded text-xs border transition-all ${form.category === c ? 'border-[#A78BFA] bg-[rgba(167,139,250,0.12)] text-[#A78BFA]' : 'border-[#21262D] text-[#484F58] hover:border-[#484F58] hover:text-[#8B949E]'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label optional>Tags</Label>
                <TagInput value={form.tags} onChange={(v) => set('tags', v)} placeholder="Type + Enter to add tags" />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label optional>Start Date</Label>
                  <input type="date" className="input-base" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </div>
                <div>
                  <Label optional>Delivery Date</Label>
                  <input type="date" className="input-base" value={form.deliveryDate} onChange={(e) => set('deliveryDate', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 2: CLIENT INFO ── */}
          <div className="py-1 border-b border-[#21262D]">
            <SectionHeader title="Client Info" isOpen={sections.client} onToggle={() => toggleSection('client')} hasData={sectionHasData(form, 'client')} />
            {sections.client && (
              <div className="pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Client Name</Label><input className="input-base" placeholder="John Doe" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} /></div>
                  <div><Label optional>Company</Label><input className="input-base" placeholder="Acme Corp" value={form.clientCompany} onChange={(e) => set('clientCompany', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Email</Label><input className="input-base" type="email" placeholder="john@acme.com" value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} /></div>
                  <div><Label optional>Phone</Label><input className="input-base" type="tel" placeholder="+1 555 000" value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} /></div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 3: FINANCIAL ── */}
          <div className="py-1 border-b border-[#21262D]">
            <SectionHeader title="Financial" isOpen={sections.financial} onToggle={() => toggleSection('financial')} hasData={sectionHasData(form, 'financial')} />
            {sections.financial && (
              <div className="pb-4 space-y-3">
                <div>
                  <Label optional>Billing Type</Label>
                  <div className="flex gap-2">
                    {BILLING_TYPES.map((b) => (
                      <button key={b} type="button" onClick={() => set('billingType', form.billingType === b ? '' : b)}
                        className={`px-3 py-1.5 rounded text-xs border transition-all ${form.billingType === b ? 'border-[#39D0D8] bg-[rgba(57,208,216,0.12)] text-[#39D0D8]' : 'border-[#21262D] text-[#484F58] hover:border-[#484F58]'}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Budget</Label><input className="input-base" placeholder="$2,500" value={form.budget} onChange={(e) => set('budget', e.target.value)} /></div>
                  <div><Label optional>Monthly Cost</Label><input className="input-base" placeholder="$45/mo" value={form.monthlyCost} onChange={(e) => set('monthlyCost', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Estimated Hours</Label><input className="input-base" type="number" placeholder="80" value={form.estimatedHours} onChange={(e) => set('estimatedHours', e.target.value)} /></div>
                  <div><Label optional>Real Hours</Label><input className="input-base" type="number" placeholder="95" value={form.realHours} onChange={(e) => set('realHours', e.target.value)} /></div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 4: TECH STACK ── */}
          <div className="py-1 border-b border-[#21262D]">
            <SectionHeader title="Tech Stack" isOpen={sections.stack} onToggle={() => toggleSection('stack')} hasData={sectionHasData(form, 'stack')} />
            {sections.stack && (
              <div className="pb-4 space-y-4">
                <StackInput label="Frontend" layer="stackFrontend" value={form.stackFrontend} onChange={(v) => set('stackFrontend', v)} />
                <StackInput label="Backend" layer="stackBackend" value={form.stackBackend} onChange={(v) => set('stackBackend', v)} />
                <StackInput label="Database" layer="stackDatabase" value={form.stackDatabase} onChange={(v) => set('stackDatabase', v)} />
                <StackInput label="DevOps" layer="stackDevops" value={form.stackDevops} onChange={(v) => set('stackDevops', v)} />
                <StackInput label="External APIs" layer="stackExternal" value={form.stackExternal} onChange={(v) => set('stackExternal', v)} />
              </div>
            )}
          </div>

          {/* ── SECTION 5: INFRASTRUCTURE ── */}
          <div className="py-1 border-b border-[#21262D]">
            <SectionHeader title="Infrastructure" isOpen={sections.infra} onToggle={() => toggleSection('infra')} hasData={sectionHasData(form, 'infra')} />
            {sections.infra && (
              <div className="pb-4 space-y-3">
                {/* Domain */}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Domain</Label><input className="input-base" placeholder="example.com" value={form.domain} onChange={(e) => set('domain', e.target.value)} /></div>
                  <div>
                    <Label optional>Domain Registrar</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DOMAIN_REGISTRARS.map((r) => (
                        <button key={r} type="button" onClick={() => set('domainRegistrar', form.domainRegistrar === r ? '' : r)}
                          className={`px-2 py-1 rounded text-[11px] border transition-all ${form.domainRegistrar === r ? 'border-[#39D0D8] bg-[rgba(57,208,216,0.12)] text-[#39D0D8]' : 'border-[#21262D] text-[#484F58] hover:border-[#484F58]'}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Domain Expiry</Label><input type="date" className="input-base" value={form.domainExpiry} onChange={(e) => set('domainExpiry', e.target.value)} /></div>
                  <div>
                    <Label optional>Hosting</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {HOSTING_PROVIDERS.map((h) => (
                        <button key={h} type="button" onClick={() => set('hosting', form.hosting === h ? '' : h)}
                          className={`px-2 py-1 rounded text-[11px] border transition-all ${form.hosting === h ? 'border-[#39D0D8] bg-[rgba(57,208,216,0.12)] text-[#39D0D8]' : 'border-[#21262D] text-[#484F58] hover:border-[#484F58]'}`}>
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Hosting Plan</Label><input className="input-base" placeholder="Pro, $20/mo" value={form.hostingPlan} onChange={(e) => set('hostingPlan', e.target.value)} /></div>
                  <div><Label optional>Hosting Expiry</Label><input type="date" className="input-base" value={form.hostingExpiry} onChange={(e) => set('hostingExpiry', e.target.value)} /></div>
                </div>
                {/* URLs */}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Frontend URL</Label><input className="input-base" placeholder="https://app.example.com" value={form.frontendUrl} onChange={(e) => set('frontendUrl', e.target.value)} /></div>
                  <div><Label optional>Backend URL</Label><input className="input-base" placeholder="https://api.example.com" value={form.backendUrl} onChange={(e) => set('backendUrl', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label optional>Staging URL</Label><input className="input-base" placeholder="https://staging.example.com" value={form.stagingUrl} onChange={(e) => set('stagingUrl', e.target.value)} /></div>
                  <div><Label optional>Admin Panel URL</Label><input className="input-base" placeholder="https://admin.example.com" value={form.adminPanelUrl} onChange={(e) => set('adminPanelUrl', e.target.value)} /></div>
                </div>
                {/* GitHub Repos */}
                <div>
                  <Label optional>GitHub Repos</Label>
                  <div className="space-y-2">
                    {form.githubRepos.map((repo, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className="input-base flex-1"
                          placeholder="https://github.com/user/repo"
                          value={repo}
                          onChange={(e) => {
                            const arr = [...form.githubRepos];
                            arr[i] = e.target.value;
                            set('githubRepos', arr);
                          }}
                        />
                        <button type="button" onClick={() => set('githubRepos', form.githubRepos.filter((_, j) => j !== i))}
                          className="p-2 hover:bg-[rgba(239,68,68,0.1)] rounded text-[#484F58] hover:text-[#EF4444] transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => set('githubRepos', [...form.githubRepos, ''])}
                      className="flex items-center gap-1.5 text-xs text-[#484F58] hover:text-[#39D0D8] transition-colors">
                      <Plus size={12} /> Add Repo
                    </button>
                  </div>
                </div>
                <div><Label optional>Main Branch</Label><input className="input-base" placeholder="main" value={form.mainBranch} onChange={(e) => set('mainBranch', e.target.value)} /></div>
                <div><Label optional>Technical Docs</Label><textarea className="input-base resize-none font-mono text-xs" rows={4} placeholder="# Setup\n\n```bash\nnpm install\n```" value={form.technicalDocs} onChange={(e) => set('technicalDocs', e.target.value)} /></div>
                <div><Label optional>Roadmap</Label><textarea className="input-base resize-none" rows={3} placeholder="Q1: MVP, Q2: Beta launch..." value={form.roadmap} onChange={(e) => set('roadmap', e.target.value)} /></div>
                <div><Label optional>Setup Notes</Label><textarea className="input-base resize-none" rows={3} placeholder="Install & deploy instructions..." value={form.setupNotes} onChange={(e) => set('setupNotes', e.target.value)} /></div>
              </div>
            )}
          </div>

          {/* ── SECTION 6: SERVER ACCESS ── */}
          <div className="py-1 border-b border-[#21262D]">
            <SectionHeader title="Server Access" isOpen={sections.server} onToggle={() => toggleSection('server')} hasData={sectionHasData(form, 'server')} />
            {sections.server && (
              <div className="pb-4 space-y-4">
                {/* Security notice */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(57,208,216,0.06)] border border-[rgba(57,208,216,0.15)] rounded-md">
                  <Lock size={12} className="text-[#39D0D8] shrink-0" />
                  <span className="text-[11px] text-[#8B949E]">All credentials encrypted with AES-256-GCM</span>
                </div>

                {/* SSH */}
                <div>
                  <p className="text-[11px] font-semibold text-[#39D0D8] uppercase tracking-wider mb-2">SSH</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label optional>Host / IP</Label><input className="input-base" placeholder="192.168.1.1" value={form.sshHost} onChange={(e) => set('sshHost', e.target.value)} /></div>
                    <div><Label optional>Port</Label><input className="input-base" placeholder="22" value={form.sshPort} onChange={(e) => set('sshPort', e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div><Label optional>SSH User</Label><input className="input-base" placeholder="root" value={form.sshUser} onChange={(e) => set('sshUser', e.target.value)} /></div>
                    <div><Label optional>SSH Password</Label><PasswordField value={form.sshPassword} onChange={(v) => set('sshPassword', v)} /></div>
                  </div>
                  <div className="mt-3"><Label optional>SSH Key Path</Label><input className="input-base" placeholder="~/.ssh/project.pem" value={form.sshKeyPath} onChange={(e) => set('sshKeyPath', e.target.value)} /></div>
                </div>

                {/* Hosting Panel */}
                <div>
                  <p className="text-[11px] font-semibold text-[#39D0D8] uppercase tracking-wider mb-2">Hosting Panel</p>
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {PANEL_TYPES.map((p) => (
                      <button key={p} type="button" onClick={() => set('hostingPanelType', form.hostingPanelType === p ? '' : p)}
                        className={`px-2.5 py-1 rounded text-[11px] border transition-all ${form.hostingPanelType === p ? 'border-[#39D0D8] bg-[rgba(57,208,216,0.12)] text-[#39D0D8]' : 'border-[#21262D] text-[#484F58] hover:border-[#484F58]'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div><Label optional>Panel URL</Label><input className="input-base mb-3" placeholder="https://panel.example.com" value={form.hostingPanelUrl} onChange={(e) => set('hostingPanelUrl', e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label optional>Username</Label><input className="input-base" placeholder="admin" value={form.hostingPanelUser} onChange={(e) => set('hostingPanelUser', e.target.value)} /></div>
                    <div><Label optional>Password</Label><PasswordField value={form.hostingPanelPass} onChange={(v) => set('hostingPanelPass', v)} /></div>
                  </div>
                </div>

                {/* Env Vars */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label optional>ENV Variables</Label>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[rgba(57,208,216,0.1)] text-[#39D0D8] border border-[rgba(57,208,216,0.2)] rounded">Stored encrypted</span>
                  </div>
                  <textarea
                    className="w-full bg-[#0A0D14] border border-[#21262D] rounded-md px-3 py-2 text-xs font-mono text-[#22C55E] placeholder:text-[#2A3040] resize-none focus:outline-none focus:border-[#39D0D8] transition-colors"
                    rows={5}
                    placeholder={'DATABASE_URL=postgresql://...\nJWT_SECRET=\nANTHROPIC_API_KEY='}
                    value={form.envVars}
                    onChange={(e) => set('envVars', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION 7: SCREENSHOTS ── */}
          <div className="py-1">
            <SectionHeader title="Screenshots" isOpen={sections.screenshots} onToggle={() => toggleSection('screenshots')} hasData={sectionHasData(form, 'screenshots')} />
            {sections.screenshots && (
              <div className="pb-4 space-y-3">
                <div
                  className="border-2 border-dashed border-[#21262D] rounded-lg p-8 text-center cursor-pointer hover:border-[#39D0D8] transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleScreenshotDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={20} className="mx-auto mb-2 text-[#484F58]" />
                  <p className="text-xs text-[#484F58]">Drag & drop or click to upload</p>
                  <p className="text-[10px] text-[#2A3040] mt-1">PNG · JPG · GIF · WebP · max 5MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => processImageFiles(Array.from(e.target.files || []))} />
                </div>
                {form.screenshots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.screenshots.map((src, i) => (
                      <div key={i} className="relative group aspect-video rounded overflow-hidden bg-[#0D1117] border border-[#21262D]">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => set('screenshots', form.screenshots.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-5 h-5 bg-[rgba(0,0,0,0.7)] rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spacer for sticky footer */}
          <div className="h-20" />
        </form>

        {/* Sticky Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0D1117] border-t border-[#21262D] px-6 py-4 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-[#484F58]">Only name is required — fill the rest anytime</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button
              type="submit"
              form="project-form-inner"
              disabled={!canSave || isLoading}
              onClick={handleSubmit}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
