import { formatDistanceToNow, format, parseISO } from 'date-fns';

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string | null | undefined, pattern = 'MMM d, yyyy'): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), pattern);
  } catch {
    return dateStr;
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Active',
    IN_DEVELOPMENT: 'In Development',
    PAUSED: 'Paused',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
    BLOCKED: 'Blocked',
  };
  return map[status] ?? status;
}

export function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  };
  return map[priority] ?? priority;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'text-nx-green',
    IN_DEVELOPMENT: 'text-nx-cyan',
    PAUSED: 'text-nx-amber',
    COMPLETED: 'text-nx-text-secondary',
    ARCHIVED: 'text-nx-text-muted',
    TODO: 'text-nx-text-secondary',
    IN_PROGRESS: 'text-nx-cyan',
    IN_REVIEW: 'text-nx-violet',
    DONE: 'text-nx-green',
    BLOCKED: 'text-nx-red',
  };
  return map[status] ?? 'text-nx-text-secondary';
}

export function priorityColor(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'text-nx-text-muted',
    MEDIUM: 'text-nx-amber',
    HIGH: 'text-nx-red',
    CRITICAL: 'text-nx-red',
  };
  return map[priority] ?? 'text-nx-text-secondary';
}

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = error as any;
  return e?.response?.data?.error ?? e?.message ?? 'Unknown error';
}
