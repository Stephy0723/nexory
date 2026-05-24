// ─── Project Member ───────────────────────────────────────────────────────────
export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  canViewSecrets: boolean;
  status: string;
  invitedById: string;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; username: string; email: string };
}

export interface ProjectMembersData {
  owner: { id: string; username: string; email: string };
  members: ProjectMember[];
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
}

// ─── Project ──────────────────────────────────────────────────────────────────
export type ProjectStatus = 'ACTIVE' | 'IN_DEVELOPMENT' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  category: string | null;
  priority: Priority;
  tags: string[];
  startDate: string | null;
  deliveryDate: string | null;
  domain: string | null;
  hosting: string | null;
  frontendUrl: string | null;
  backendUrl: string | null;
  githubRepos: string[];
  envVarsEncrypted: boolean;
  technicalDocs: string | null;
  roadmap: string | null;
  // Stack
  stackFrontend: string[];
  stackBackend: string[];
  stackDatabase: string[];
  stackDevops: string[];
  stackExternal: string[];
  // Client
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  clientCompany: string | null;
  // Financial
  budget: string | null;
  monthlyCost: string | null;
  billingType: string | null;
  estimatedHours: number | null;
  realHours: number | null;
  // Infrastructure extras
  domainRegistrar: string | null;
  domainExpiry: string | null;
  hostingPlan: string | null;
  hostingExpiry: string | null;
  stagingUrl: string | null;
  adminPanelUrl: string | null;
  mainBranch: string | null;
  // Server Access
  sshHost: string | null;
  sshPort: string | null;
  sshUser: string | null;
  sshKeyPath: string | null;
  hostingPanelType: string | null;
  hostingPanelUrl: string | null;
  hostingPanelUser: string | null;
  // Misc
  setupNotes: string | null;
  screenshots: string[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    credentials: number;
    notes: number;
    dbConnections: number;
  };
  /** Present when returned from getById: current user's access level */
  _access?: { role: MemberRole; canViewSecrets: boolean };
}

export interface ProjectStats {
  byStatus: Record<ProjectStatus, number>;
  byPriority: Record<Priority, number>;
  byCategory: Record<string, number>;
  openTasks: number;
  totalCredentials: number;
}

// ─── Credential ───────────────────────────────────────────────────────────────
export interface Credential {
  id: string;
  projectId: string | null;
  userId: string;
  label: string;
  username: string | null;
  password: string | null;
  url: string | null;
  notes: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { name: string } | null;
}

// ─── Task ─────────────────────────────────────────────────────────────────────
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

export interface Task {
  id: string;
  projectId: string | null;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
  project?: { name: string } | null;
}

// ─── Note ─────────────────────────────────────────────────────────────────────
export interface Note {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  project?: { name: string } | null;
}

// ─── DB Connection ────────────────────────────────────────────────────────────
export type DbType = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'other';

export interface DbConnection {
  id: string;
  projectId: string | null;
  userId: string;
  label: string;
  type: DbType;
  host: string | null;
  port: number | null;
  dbName: string | null;
  username: string | null;
  password: string | null;
  backupUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { name: string } | null;
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export interface ActivityLog {
  id: string;
  userId: string;
  projectId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user?: { username: string };
  project?: { name: string } | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export interface AIAction {
  type: string;
  projectId?: string;
  projectName?: string;
  data?: Record<string, unknown>;
  description?: string;
}

export interface AIResponse {
  message: string;
  actions: AIAction[];
  requiresConfirmation: boolean;
  summary: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}
