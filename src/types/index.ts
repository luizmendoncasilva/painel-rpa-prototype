// ---------------------------------------------------------------------------
// API — Task
// ---------------------------------------------------------------------------

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface Task {
  task_id: string;
  queue: string;
  status: TaskStatus;
  priority: number;
  created_at: string;
  updated_at: string;
  worker_id: string | null;
  lease_expires_at: string | null;
  attempt: number;
  max_attempts: number;
  correlation_key: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  error_payload: Record<string, unknown> | null;
}

export interface TaskListResponse {
  items: Task[];
  count: number;
  next_cursor: string | null;
}

// ---------------------------------------------------------------------------
// API — User
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface UserFormData {
  email?: string;
  password?: string;
}

// ---------------------------------------------------------------------------
// API — Bot
// ---------------------------------------------------------------------------

export interface BotLoja {
  loja: number;
  sped_checked: boolean;
}

export interface Bot {
  id: string;
  name: string;
  bot_id: string;
  description?: string;
  machine_id?: string;
  max_attempts?: number;
  priority?: number;
  triggered_by?: string;
  payload?: Record<string, unknown> & { lojas?: BotLoja[] };
  created_at?: string;
  updated_at?: string;
}

export interface BotFormData {
  name: string;
  bot_id: string;
  description?: string;
  machine_id?: string;
  max_attempts: number;
  priority: number;
  triggered_by: string;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// RPA Config
// ---------------------------------------------------------------------------

export type Motor = 'Fiscal' | 'DP';

export interface RpaConfigEntry {
  name: string;
  shortName: string;
  motor: Motor;
  responsavel: string;
}

export type RpaConfigMap = Record<string, RpaConfigEntry>;

// ---------------------------------------------------------------------------
// Catálogo de RPAs (processos de negócio)
// ---------------------------------------------------------------------------

export interface ProcessStage {
  queue: string;
  label: string;
}

export interface ProcessoConfig {
  id: string;
  nome: string;
  descricao: string;
  motor: Motor;
  praca: string;
  responsavel: string;
  empresasElegiveis: number;
  stages: ProcessStage[];
}

export type ComboStatus = 'sucesso' | 'sucesso_parcial' | 'falha' | 'em_andamento' | 'pendente';

export interface ProcessoCaseRow {
  key: string;
  empresa: string;
  cnpj: string | null;
  competencia: string | null;
  stageStatus: Record<string, TaskStatus | null>;
  comboStatus: ComboStatus;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Enriched Task (view layer)
// ---------------------------------------------------------------------------

export interface EnrichedTask extends Task {
  _rpa: RpaConfigEntry & { name: string; motor: string; responsavel: string };
  _cnpj: string | null;
  _competencia: string | null;
  _empresa: string;
  _duracao: string | null;
  _origem: string;
}

// ---------------------------------------------------------------------------
// Report data (computed from tasks)
// ---------------------------------------------------------------------------

export interface RpaReportItem {
  rpa: string;
  fullName: string;
  motor: string;
  COMPLETED: number;
  FAILED: number;
  PENDING: number;
  IN_PROGRESS: number;
  total: number;
  taxa: number;
}

export interface TimelineItem {
  month: string;
  label: string;
  COMPLETED: number;
  FAILED: number;
  PENDING: number;
  IN_PROGRESS: number;
}

export interface DonutItem {
  name: string;
  value: number;
  status: TaskStatus;
}

export interface ReportData {
  rpaData: RpaReportItem[];
  donutData: DonutItem[];
  timelineData: TimelineItem[];
  totals: Partial<Record<TaskStatus, number>>;
  successRate: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Auth context
// ---------------------------------------------------------------------------

export interface AppUser {
  id: string;
  email: string;
}

export interface AppSession {
  user: AppUser;
}

export interface AuthContextValue {
  user: AppUser | null;
  session: AppSession | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}
