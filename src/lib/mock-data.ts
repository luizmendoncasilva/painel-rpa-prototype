import type { Task, User, TaskStatus } from 'src/types';

import { RPA_CONFIG } from 'src/assets/data/rpa-config';

// ----------------------------------------------------------------------
// Dados fake usados apenas em ambiente de desenvolvimento (npm run dev),
// quando o back-end (rpas-dashboard API) não está acessível.
// Servem só para visualizar o layout/tema com telas preenchidas.
// Nunca são usados em build de produção.
// ----------------------------------------------------------------------

const QUEUES = Object.keys(RPA_CONFIG);

const EMPRESAS = [
  { cnpj: '12345678000190', razao_social: 'Comercial Sul Ltda' },
  { cnpj: '98765432000121', razao_social: 'Agroindustrial Mineiro S.A.' },
  { cnpj: '45612378000155', razao_social: 'Distribuidora Bahia Norte' },
  { cnpj: '32165498000102', razao_social: 'Tech Solutions BH Ltda' },
  { cnpj: '78912345000167', razao_social: 'Grupo Sulgoiano de Alimentos' },
  { cnpj: '65498712000133', razao_social: 'Metalúrgica Vale Verde' },
  { cnpj: '15975348000188', razao_social: 'Construtora Horizonte Ltda' },
  { cnpj: '35795148000199', razao_social: 'Farma Bem Estar Distribuição' },
];

const MACHINES = ['maquina-sp-01', 'maquina-sp-02', 'maquina-bh-01', 'maquina-rj-01'];

const STATUSES: TaskStatus[] = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'FAILED', 'IN_PROGRESS', 'PENDING'];

// Categoria é campo fechado (nunca texto livre) — é o que permite agrupar
// falhas em "Não conformidades" e decidir se vira debug do bot ou tratativa
// humana. A mensagem é o detalhe técnico associado a cada categoria.
const ERROR_CATEGORIES = [
  { categoria: 'Portal fora do ar', mensagem: 'HTTP 503 no portal após 3 tentativas' },
  { categoria: 'Credencial inválida', mensagem: '401 no login — senha alterada na origem' },
  { categoria: 'Inscrição municipal inválida', mensagem: 'CCM não localizado para o CNPJ informado' },
  { categoria: 'Sessão expirada', mensagem: 'sessão encerrada durante o preenchimento do formulário' },
  { categoria: 'Loja não localizada', mensagem: 'loja não encontrada no cadastro do sistema' },
  { categoria: 'Guia recusada no portal', mensagem: 'portal recusou a emissão: competência já encerrada' },
];

const BASES = ['Base 1', 'Base 2', 'Base 3', 'Base 4', 'Base 5', 'Base 6', 'Base 7', 'Base 8'];

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const rand = seededRandom(42);

function pick<T>(arr: T[], n: number): T {
  return arr[Math.floor(n) % arr.length];
}

function isoDaysAgo(days: number, hourSeed: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(hourSeed * 23), Math.floor(hourSeed * 59), 0, 0);
  return d.toISOString();
}

// ----------------------------------------------------------------------
// Tasks (/tasks)
// ----------------------------------------------------------------------

let cachedTasks: Task[] | null = null;
let ticketSeq = 1031;

export function generateMockTasks(count = 120): Task[] {
  if (cachedTasks) return cachedTasks;

  const tasks: Task[] = [];

  for (let i = 0; i < count; i += 1) {
    const r1 = rand();
    const r2 = rand();
    const r3 = rand();
    const queue = pick(QUEUES, r1 * QUEUES.length);
    const status = pick(STATUSES, r2 * STATUSES.length);
    const empresa = pick(EMPRESAS, r3 * EMPRESAS.length);
    const base = pick(BASES, r2 * BASES.length);
    const daysAgo = Math.floor(r1 * 45);
    const createdAt = isoDaysAgo(daysAgo, r2);
    const durationMin = Math.floor(r3 * 90) + 1;
    const updatedDate = new Date(createdAt);
    updatedDate.setMinutes(updatedDate.getMinutes() + durationMin);
    const updatedAt = status === 'PENDING' ? createdAt : updatedDate.toISOString();
    const errorInfo = status === 'FAILED' ? pick(ERROR_CATEGORIES, r1 * ERROR_CATEGORIES.length) : null;
    const motor = RPA_CONFIG[queue]?.motor ?? 'Fiscal';

    tasks.push({
      task_id: `task-${1000 + i}`,
      queue,
      status,
      priority: Math.floor(r1 * 3),
      created_at: createdAt,
      updated_at: updatedAt,
      worker_id: status === 'PENDING' ? null : pick(MACHINES, r2 * MACHINES.length),
      lease_expires_at: null,
      attempt: status === 'FAILED' ? Math.floor(r3 * 3) + 1 : 1,
      max_attempts: 3,
      correlation_key: `schedule-${queue}-${createdAt.slice(0, 10)}`,
      payload: {
        CNPJ: empresa.cnpj,
        competencia: createdAt.slice(0, 7),
        base,
        variables: { CNPJ: empresa.cnpj, competencia: createdAt.slice(0, 7), origem: 'schedule' },
      },
      result: status === 'COMPLETED' ? { razao_social: empresa.razao_social, arquivos_gerados: [`guia_${i}.pdf`] } : null,
      error: errorInfo ? errorInfo.mensagem : null,
      error_payload: errorInfo
        ? {
            step: 'preenchimento_formulario',
            bot_id: queue,
            categoria: errorInfo.categoria,
            mensagem: errorInfo.mensagem,
            chamado: `${motor === 'DP' ? 'DP' : 'FIS'}-${ticketSeq++}`,
            stacktrace: 'Traceback (most recent call last):\n  ...\nTimeoutError: elemento não respondeu em 30s',
          }
        : null,
    });
  }

  cachedTasks = tasks.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  return cachedTasks;
}

// ----------------------------------------------------------------------
// Bots (/bots)
// ----------------------------------------------------------------------

let cachedBots: ReturnType<typeof buildMockBots> | null = null;

function buildMockBots() {
  return QUEUES.map((queue, i) => {
    const info = RPA_CONFIG[queue];
    return {
      id: `bot-${i + 1}`,
      name: info.name,
      bot_id: queue,
      description: `Automação ${info.motor} — responsável ${info.responsavel}`,
      machine_id: pick(MACHINES, i),
      max_attempts: 3,
      priority: i % 3,
      triggered_by: i % 4 === 0 ? 'manual' : 'schedule',
      payload: {
        automation: `sped_${queue}`,
        rdp_usuario: `usuario.${queue}`,
        rdp_senha: '••••••••',
        lojas: [
          { loja: 1, sped_checked: true },
          { loja: 2, sped_checked: i % 2 === 0 },
        ],
      },
      created_at: isoDaysAgo(120 - i * 5, 0.4),
      updated_at: isoDaysAgo(i, 0.6),
    };
  });
}

export function generateMockBots() {
  if (!cachedBots) cachedBots = buildMockBots();
  return cachedBots;
}

// ----------------------------------------------------------------------
// Execution logs (/execution-logs) — usado no diálogo "Ver logs" de bots
// ----------------------------------------------------------------------

const cachedLogsByBot = new Map<string, ReturnType<typeof buildMockExecutionLogs>>();

function buildMockExecutionLogs(botId: string, count = 34) {
  const logs = [];
  for (let i = 0; i < count; i += 1) {
    const r = rand();
    const isFailed = r < 0.22;
    const startedAt = isoDaysAgo(Math.floor(r * 60), r);
    const started = new Date(startedAt);
    const finished = new Date(started.getTime() + (5 + Math.floor(r * 40)) * 60000);

    logs.push({
      id: `log-${botId}-${i}`,
      machine_id: pick(MACHINES, r * MACHINES.length),
      status: isFailed ? 'FAILED' : 'COMPLETED',
      started_at: startedAt,
      finished_at: finished.toISOString(),
      attempt: isFailed ? Math.floor(r * 3) + 1 : 1,
      error: isFailed ? pick(ERROR_CATEGORIES, r * ERROR_CATEGORIES.length).mensagem : null,
      error_payload: isFailed
        ? {
            step: 'preenchimento_formulario',
            bot_id: botId,
            categoria: pick(ERROR_CATEGORIES, r * ERROR_CATEGORIES.length).categoria,
            correlation_key: `schedule-${botId}-${startedAt.slice(0, 10)}`,
            stacktrace:
              'Traceback (most recent call last):\n  File "bot.py", line 82, in run\n    element.click()\nTimeoutError: elemento não respondeu em 30s',
          }
        : null,
    });
  }
  return logs.sort((a, b) => (a.finished_at! < b.finished_at! ? 1 : -1));
}

export function generateMockExecutionLogs(botId: string, count = 34) {
  const cacheKey = `${botId}:${count}`;
  if (!cachedLogsByBot.has(cacheKey)) {
    cachedLogsByBot.set(cacheKey, buildMockExecutionLogs(botId, count));
  }
  return cachedLogsByBot.get(cacheKey)!;
}

// ----------------------------------------------------------------------
// Users (/users)
// ----------------------------------------------------------------------

let cachedUsers: User[] | null = null;

function buildMockUsers(): User[] {
  const names = [
    'ana.silva',
    'bruno.costa',
    'carla.mendes',
    'danilo.souza',
    'guilherme.santos',
    'luiz.mendonca',
  ];
  return names.map((name, i) => ({
    id: `user-${i + 1}`,
    email: `${name}@bhub.ai`,
    created_at: isoDaysAgo(200 - i * 20, 0.3),
    last_sign_in_at: i === names.length - 1 ? new Date().toISOString() : isoDaysAgo(i + 1, 0.5),
  }));
}

export function generateMockUsers(): User[] {
  if (!cachedUsers) cachedUsers = buildMockUsers();
  return cachedUsers;
}
