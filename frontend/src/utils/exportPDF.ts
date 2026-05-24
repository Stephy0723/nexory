import type { Project, Task, Note } from '@/types';

interface ExportData {
  project: Project & { tasks?: Task[]; notes?: Note[] };
  exportedBy?: string;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#22c55e',
  IN_DEVELOPMENT: '#39D0D8',
  PAUSED: '#f59e0b',
  COMPLETED: '#8b949e',
  ARCHIVED: '#484f58',
};
const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#d97706',
  LOW: '#8b949e',
};

export function exportProjectToPDF({ project, exportedBy }: ExportData): void {
  const tasks = project.tasks ?? [];
  const notes = project.notes ?? [];

  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const progressPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  // ── Task table rows ────────────────────────────────────────────────────────
  const taskRows = tasks
    .slice(0, 60)
    .map(
      (t) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;">${escapeHtml(t.title)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;">
        <span style="background:${STATUS_COLOR[t.status] ?? '#999'};color:#fff;padding:2px 7px;border-radius:12px;font-size:10px;white-space:nowrap;">${t.status.replace(/_/g, ' ')}</span>
      </td>
      <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;color:${PRIORITY_COLOR[t.priority] ?? '#999'};font-weight:700;font-size:11px;">${t.priority}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;color:#777;font-size:11px;">${t.dueDate ? new Date(t.dueDate).toLocaleDateString('es') : '—'}</td>
    </tr>`
    )
    .join('');

  // ── Note blocks ────────────────────────────────────────────────────────────
  const noteBlocks = notes
    .filter((n) => n.content.trim())
    .slice(0, 10)
    .map(
      (n) => `
    <div style="margin-bottom:14px;padding:12px 14px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;page-break-inside:avoid;">
      <div style="font-weight:600;font-size:13px;color:#111;margin-bottom:6px;">${n.isPinned ? '📌 ' : ''}${escapeHtml(n.title)}</div>
      <div style="font-size:12px;color:#555;line-height:1.65;white-space:pre-wrap;">${escapeHtml(n.content.slice(0, 600))}${n.content.length > 600 ? '…' : ''}</div>
    </div>`
    )
    .join('');

  // ── Key fields ─────────────────────────────────────────────────────────────
  const fieldDefs: [string, string | null | undefined][] = [
    ['Categoría', project.category],
    ['Dominio', project.domain],
    ['Hosting', project.hosting],
    ['Frontend URL', project.frontendUrl],
    ['Backend URL', project.backendUrl],
    ['Inicio', project.startDate ? new Date(project.startDate).toLocaleDateString('es') : null],
    ['Entrega', project.deliveryDate ? new Date(project.deliveryDate).toLocaleDateString('es') : null],
    ['Cliente', project.clientName ?? project.clientCompany],
    ['Email cliente', project.clientEmail],
    ['Branch principal', project.mainBranch],
    ['Staging URL', project.stagingUrl],
  ];
  const fieldHtml = fieldDefs
    .filter(([, v]) => v)
    .map(
      ([k, v]) => `
    <div style="display:flex;gap:8px;margin-bottom:9px;">
      <span style="width:130px;flex-shrink:0;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">${k}</span>
      <span style="font-size:13px;color:#222;">${escapeHtml(String(v))}</span>
    </div>`
    )
    .join('');

  // ── Stack ──────────────────────────────────────────────────────────────────
  const stackDefs: [string, string[]][] = [
    ['Frontend', project.stackFrontend ?? []],
    ['Backend', project.stackBackend ?? []],
    ['Base de datos', project.stackDatabase ?? []],
    ['DevOps', project.stackDevops ?? []],
    ['Externos', project.stackExternal ?? []],
  ];
  const stackHtml = stackDefs
    .filter(([, arr]) => arr.length > 0)
    .map(
      ([label, arr]) => `
    <div style="margin-bottom:8px;">
      <span style="font-size:11px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-right:6px;">${label}:</span>
      ${arr.map((s) => `<span style="display:inline-block;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;border-radius:4px;padding:1px 7px;font-size:11px;margin:2px;">${escapeHtml(s)}</span>`).join('')}
    </div>`
    )
    .join('');

  const repoHtml = (project.githubRepos ?? [])
    .map((r) => `<div style="font-size:12px;color:#0969da;margin-bottom:4px;">🔗 <a href="${escapeHtml(String(r))}" style="color:#0969da;">${escapeHtml(String(r))}</a></div>`)
    .join('');

  const generatedAt = new Date().toLocaleString('es');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Reporte: ${escapeHtml(project.name)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111;background:#fff;padding:40px;max-width:900px;margin:0 auto;}
    h2{font-size:14px;color:#111;margin:28px 0 12px;border-bottom:2px solid #e5e7eb;padding-bottom:6px;text-transform:uppercase;letter-spacing:.05em;}
    table{width:100%;border-collapse:collapse;}
    th{text-align:left;padding:8px 10px;background:#f9fafb;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#666;border-bottom:2px solid #e5e7eb;}
    @media print{
      body{padding:16px;}
      a{text-decoration:none;}
      .no-print{display:none;}
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid #111;">
    <div>
      <div style="font-size:10px;color:#999;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">NEXORY · Reporte de Proyecto</div>
      <h1 style="font-size:24px;color:#111;margin-bottom:4px;">${escapeHtml(project.name)}</h1>
      ${project.description ? `<p style="font-size:13px;color:#666;margin-top:6px;max-width:520px;line-height:1.5;">${escapeHtml(project.description)}</p>` : ''}
    </div>
    <div style="text-align:right;flex-shrink:0;margin-left:16px;">
      <span style="display:inline-block;background:${STATUS_COLOR[project.status] ?? '#999'};color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;">${project.status.replace(/_/g, ' ')}</span>
      <div style="margin-top:6px;font-size:12px;color:${PRIORITY_COLOR[project.priority] ?? '#999'};font-weight:700;">${project.priority} PRIORITY</div>
    </div>
  </div>

  <!-- Progress bar -->
  ${
    tasks.length > 0
      ? `<div style="margin-bottom:24px;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="flex:1;height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${progressPct}%;background:#22c55e;border-radius:4px;"></div>
      </div>
      <span style="font-size:12px;color:#666;white-space:nowrap;">${doneTasks}/${tasks.length} tareas completadas (${progressPct}%)</span>
    </div>
  </div>`
      : ''
  }

  <!-- General info -->
  ${fieldHtml ? `<h2>Información General</h2><div style="margin-bottom:8px;">${fieldHtml}</div>` : ''}

  <!-- Stack -->
  ${stackHtml ? `<h2>Stack Tecnológico</h2>${stackHtml}` : ''}

  <!-- Repos -->
  ${repoHtml ? `<h2>Repositorios</h2>${repoHtml}` : ''}

  <!-- Roadmap -->
  ${project.roadmap ? `<h2>Roadmap</h2><div style="font-size:13px;color:#444;line-height:1.7;white-space:pre-wrap;background:#fafafa;padding:14px;border-radius:6px;border:1px solid #e5e7eb;">${escapeHtml(project.roadmap)}</div>` : ''}

  <!-- Tasks -->
  ${
    tasks.length > 0
      ? `<h2>Tareas (${tasks.length})</h2>
  <table>
    <thead><tr><th>Título</th><th>Estado</th><th>Prioridad</th><th>Vencimiento</th></tr></thead>
    <tbody>${taskRows}</tbody>
  </table>`
      : ''
  }

  <!-- Notes -->
  ${notes.filter((n) => n.content.trim()).length > 0 ? `<h2>Notas</h2>${noteBlocks}` : ''}

  <!-- Footer -->
  <div style="margin-top:48px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#bbb;display:flex;justify-content:space-between;">
    <span>NEXORY · Reporte confidencial · No incluye credenciales ni datos de acceso</span>
    <span>Generado el ${generatedAt}${exportedBy ? ' por ' + escapeHtml(exportedBy) : ''}</span>
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=720');
  if (!win) {
    alert('Permite ventanas emergentes en este sitio para exportar el PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  // Small delay so styles load before print dialog
  setTimeout(() => win.print(), 350);
}
