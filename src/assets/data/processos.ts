import type { Task, TaskStatus, ComboStatus, StageFailure, ProcessoConfig, ProcessoCaseRow } from 'src/types';

// ----------------------------------------------------------------------
// Catálogo de processos de negócio — glossário pedido pelo produto na call
// de alinhamento (27/ago): nome, o que o processo faz, quais bots/etapas o
// compõem, praça/cliente atendido e quantas empresas são elegíveis hoje.
// Alguns processos (ex.: Escrituração ISS — SP) são formados por mais de um
// bot em sequência; o status combinado ("sucesso parcial" quando uma etapa
// falha e outra não) é calculado a partir das execuções de cada etapa.
// ----------------------------------------------------------------------

export const PROCESSOS: ProcessoConfig[] = [
  {
    id: 'iss-sp',
    nome: 'Escrituração ISS — São Paulo',
    descricao:
      'Apura e emite a guia mensal de ISS das empresas de São Paulo e entrega o documento já conciliado dentro do Gestta do cliente — sem intervenção manual em nenhuma das duas etapas.',
    motor: 'Fiscal',
    praca: 'São Paulo',
    responsavel: 'Danilo',
    empresasElegiveis: 184,
    stages: [
      { queue: 'emissao-iss-sp', label: 'Emissão da guia' },
      { queue: 'gestta-express-uploader', label: 'Entrega no Gestta' },
    ],
  },
  {
    id: 'iss-sp-ultrafast',
    nome: 'Escrituração ISS — São Paulo (Ultrafast)',
    descricao:
      'Mesma emissão da guia de ISS de São Paulo, numa esteira dedicada e mais rápida — usada para competências com prazo apertado ou reprocessamento prioritário.',
    motor: 'Fiscal',
    praca: 'São Paulo',
    responsavel: 'Danilo',
    empresasElegiveis: 42,
    stages: [{ queue: 'emissao-iss-sp-ultrafast', label: 'Emissão da guia (ultrafast)' }],
  },
  {
    id: 'fgts-digital',
    nome: 'FGTS Digital',
    descricao:
      'Apura e emite a guia do FGTS Digital das empresas atendidas pelo time de DP, a partir da folha processada no mês.',
    motor: 'DP',
    praca: 'Nacional',
    responsavel: 'BHub',
    empresasElegiveis: 96,
    stages: [{ queue: 'fgts-emissao-guia', label: 'Emissão da guia' }],
  },
  {
    id: 'dp-admissao',
    nome: 'Admissão — DP',
    descricao:
      'Processa a admissão de novos funcionários nos sistemas do cliente a partir dos dados enviados pelo RH, eliminando o preenchimento manual do cadastro.',
    motor: 'DP',
    praca: 'Nacional',
    responsavel: 'BHub',
    empresasElegiveis: 61,
    stages: [{ queue: 'dp-admissao', label: 'Cadastro de admissão' }],
  },
  {
    id: 'sped-agrocontar',
    nome: 'SPED ERS Agrocontar',
    descricao:
      'Gera e transmite o SPED fiscal das empresas do grupo Agrocontar, cobrindo a escrituração recorrente do mês.',
    motor: 'Fiscal',
    praca: 'Agrocontar',
    responsavel: 'Guilherme Santos',
    empresasElegiveis: 27,
    stages: [{ queue: 'poc-rpa-engine-danilo-queue', label: 'Geração e envio do SPED' }],
  },
];

export function getProcessoByQueue(queue: string): ProcessoConfig | undefined {
  return PROCESSOS.find((p) => p.stages.some((s) => s.queue === queue));
}

// ----------------------------------------------------------------------
// Status combinado — junta as execuções de cada etapa por empresa +
// competência e deriva um status único do processo (inclusive "sucesso
// parcial", pedido explicitamente na call para o caso do ISS-SP).
// ----------------------------------------------------------------------

function extractCnpj(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const vars = payload.variables as Record<string, string> | undefined;
  return (payload.CNPJ as string) ?? vars?.CNPJ ?? vars?.cnpj ?? null;
}

function extractCompetencia(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const vars = payload.variables as Record<string, string> | undefined;
  return (payload.competencia as string) ?? vars?.competencia ?? null;
}

function extractBase(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  return (payload.base as string) ?? null;
}

function extractFailure(task: Task | undefined): StageFailure | null {
  if (!task || task.status !== 'FAILED' || !task.error_payload) return null;
  const p = task.error_payload;
  const categoria = p.categoria as string | undefined;
  if (!categoria) return null;
  return {
    categoria,
    mensagem: (p.mensagem as string | undefined) ?? task.error ?? '',
    chamado: (p.chamado as string | undefined) ?? '',
  };
}

function combineStatuses(statuses: (TaskStatus | null)[]): ComboStatus {
  const present = statuses.filter((s): s is TaskStatus => s !== null);
  if (present.length === 0) return 'pendente';
  if (present.some((s) => s === 'IN_PROGRESS')) return 'em_andamento';
  if (present.some((s) => s === 'PENDING')) return 'pendente';

  const completed = present.filter((s) => s === 'COMPLETED').length;
  const failed = present.filter((s) => s === 'FAILED').length;

  if (failed === 0) return 'sucesso';
  if (completed === 0) return 'falha';
  return 'sucesso_parcial';
}

export function buildProcessoCases(processo: ProcessoConfig, tasks: Task[]): ProcessoCaseRow[] {
  const relevant = tasks.filter((t) => processo.stages.some((s) => s.queue === t.queue));
  const groups = new Map<string, Task[]>();

  for (const task of relevant) {
    const cnpj = extractCnpj(task.payload) ?? 'sem-cnpj';
    const competencia = extractCompetencia(task.payload) ?? task.updated_at.slice(0, 7);
    const key = `${cnpj}__${competencia}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(task);
  }

  const rows: ProcessoCaseRow[] = [];
  for (const [key, groupTasks] of groups) {
    const [cnpj, competencia] = key.split('__');
    const stageStatus: Record<string, TaskStatus | null> = {};
    const stageFailure: Record<string, StageFailure | null> = {};
    for (const stage of processo.stages) {
      const stageTask = groupTasks.find((t) => t.queue === stage.queue);
      stageStatus[stage.queue] = stageTask?.status ?? null;
      stageFailure[stage.queue] = extractFailure(stageTask);
    }
    const empresa =
      (groupTasks.find((t) => t.result?.razao_social)?.result?.razao_social as string | undefined) ??
      (cnpj !== 'sem-cnpj' ? cnpj : 'Empresa não identificada');
    const updatedAt = groupTasks.reduce((max, t) => (t.updated_at > max ? t.updated_at : max), groupTasks[0].updated_at);
    const durationSeconds = groupTasks.reduce((sum, t) => {
      if (t.status !== 'COMPLETED' && t.status !== 'FAILED') return sum;
      const diff = (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 1000;
      return diff > 0 ? sum + diff : sum;
    }, 0);

    rows.push({
      key,
      empresa,
      cnpj: cnpj === 'sem-cnpj' ? null : cnpj,
      competencia: competencia || null,
      base: extractBase(groupTasks[0].payload),
      stageStatus,
      stageFailure,
      comboStatus: combineStatuses(processo.stages.map((s) => stageStatus[s.queue])),
      updatedAt,
      durationSeconds,
    });
  }

  return rows.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export const COMBO_STATUS_LABEL: Record<ComboStatus, string> = {
  sucesso: 'Sucesso',
  sucesso_parcial: 'Sucesso parcial',
  falha: 'Falha',
  em_andamento: 'Em andamento',
  pendente: 'Pendente',
};

export const COMBO_STATUS_VARIANT: Record<ComboStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  sucesso: 'success',
  sucesso_parcial: 'warning',
  falha: 'destructive',
  em_andamento: 'warning',
  pendente: 'secondary',
};

// ----------------------------------------------------------------------
// KPIs de acompanhamento — mesma leitura do modelo de referência trazido
// pelos stakeholders (Processos monitorados / Êxitos / Falhas / Taxa de
// êxito / Tempo de robô). Reutilizado no Catálogo e no Painel.
// ----------------------------------------------------------------------

export interface TrackingKpis {
  processos: number;
  ok: number;
  fail: number;
  rate: number;
  horasRobo: number;
}

export function computeTrackingKpis(tasks: Task[], processos: ProcessoConfig[]): TrackingKpis {
  const queues = processos.flatMap((p) => p.stages.map((s) => s.queue));
  const relevant = tasks.filter((t) => queues.includes(t.queue));
  const ok = relevant.filter((t) => t.status === 'COMPLETED').length;
  const fail = relevant.filter((t) => t.status === 'FAILED').length;
  const rate = ok + fail > 0 ? Math.round((ok / (ok + fail)) * 1000) / 10 : 0;

  const totalSeconds = relevant.reduce((sum, t) => {
    if (t.status !== 'COMPLETED' && t.status !== 'FAILED') return sum;
    const diff = (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / 1000;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  const monitorados = processos.filter((p) => p.stages.some((s) => relevant.some((t) => t.queue === s.queue))).length;

  return { processos: monitorados, ok, fail, rate, horasRobo: Math.round(totalSeconds / 3600) };
}
