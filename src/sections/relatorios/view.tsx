import type { Task, DonutItem, TaskStatus, ReportData, TimelineItem, RpaReportItem } from 'src/types';

import { useMemo, useState } from 'react';
import { Download, BarChart3, Presentation } from 'lucide-react';
import {
  Bar, Pie, Cell, Area, XAxis, YAxis, Legend, Tooltip,
  BarChart, PieChart, AreaChart, LabelList,
  CartesianGrid, ResponsiveContainer,
} from 'recharts';

import { exportToCsv } from 'src/utils/export-csv';
import { normalizeList } from 'src/utils/normalize-list';
import { exportReportToPptx } from 'src/utils/export-pptx';

import axios, { endpoints } from 'src/lib/axios';
import { generateMockTasks } from 'src/lib/mock-data';
import { RPA_CONFIG } from 'src/assets/data/rpa-config';
import { DashboardContent } from 'src/layouts/dashboard';

import {
  Card,
  Empty,
  Input,
  Label,
  Alert,
  Button,
  Select,
  CardTitle,
  AlertTitle,
  SelectItem,
  CardHeader,
  CardContent,
  SelectValue,
  SelectContent,
  SelectTrigger,
  LoadingButton,
  AlertDescription,
} from 'src/components/ui';

// ----------------------------------------------------------------------

const ALL = '__all__';

const CHART_COLORS: Record<TaskStatus, string> = {
  COMPLETED: '#16a34a',
  FAILED: '#dc2626',
  IN_PROGRESS: '#f59e0b',
  PENDING: '#a3a3a3',
};

const STATUS_LABEL_PT: Record<TaskStatus, string> = {
  COMPLETED: 'Sucesso',
  FAILED: 'Falha',
  IN_PROGRESS: 'Em andamento',
  PENDING: 'Pendente',
};

const ORIGEM_OPTIONS = [
  { value: 'schedule', label: 'Agendado' },
  { value: 'Manual', label: 'Manual' },
  { value: 'Teste', label: 'Teste' },
];

// ----------------------------------------------------------------------

interface EnrichedForReport extends Task {
  _rpa: { name: string; shortName: string; motor: string };
  _cnpj: string | null;
  _origem: string;
  _base: string | null;
  _competencia: string | null;
}

function getRpaInfo(queue: string) {
  return RPA_CONFIG[queue] ?? { name: queue, shortName: queue, motor: 'Desconhecido', responsavel: '—' };
}

function extractCnpj(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const vars = payload.variables as Record<string, string> | undefined;
  return (payload.CNPJ as string) ?? vars?.CNPJ ?? vars?.cnpj ?? null;
}

function extractCompetencia(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  const vars = payload.variables as Record<string, string> | undefined;
  return (payload.competencia as string) ?? vars?.competencia ?? vars?.competence ?? null;
}

function extractBase(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  return (payload.base as string) ?? null;
}

function extractOrigem(task: Task): string {
  const vars = task.payload?.variables as Record<string, string> | undefined;
  const origem = vars?.origem;
  if (origem) return origem;
  const ck = task.correlation_key ?? '';
  if (
    ck.includes('pilot') ||
    ck.startsWith('trigger-test-') ||
    ck.startsWith('teste-') ||
    (task.payload?.trigger_only as boolean)
  )
    return 'Teste';
  if (ck.includes('entrega-manual')) return 'Manual';
  if (ck.startsWith('iss-sp-')) return 'iss-sp';
  if (ck.startsWith('fgts-')) return 'fgts';
  if (ck.startsWith('proc-')) return 'Processo manual';
  return 'schedule';
}

function enrichTasks(tasks: Task[]): EnrichedForReport[] {
  return tasks.map((task) => ({
    ...task,
    _rpa: getRpaInfo(task.queue),
    _cnpj: extractCnpj(task.payload),
    _origem: extractOrigem(task),
    _base: extractBase(task.payload),
    _competencia: extractCompetencia(task.payload),
  }));
}

interface ReportFilters {
  motor: string;
  rpa: string;
  status: string;
  origem: string;
  base: string;
  competencia: string;
  dateFrom: string;
  dateTo: string;
}

function computeReportData(enriched: EnrichedForReport[], filters: ReportFilters): ReportData | null {
  let result = enriched;
  if (filters.motor) result = result.filter((t) => t._rpa.motor === filters.motor);
  if (filters.rpa) result = result.filter((t) => t.queue === filters.rpa);
  if (filters.status) result = result.filter((t) => t.status === filters.status);
  if (filters.origem) result = result.filter((t) => t._origem === filters.origem);
  if (filters.base) result = result.filter((t) => t._base?.toLowerCase().includes(filters.base.toLowerCase()));
  if (filters.competencia) result = result.filter((t) => t._competencia === filters.competencia);
  if (filters.dateFrom) result = result.filter((t) => t.updated_at >= filters.dateFrom);
  if (filters.dateTo) result = result.filter((t) => t.updated_at <= `${filters.dateTo}T23:59:59`);

  if (!result.length) return null;

  const byRpa: Record<string, RpaReportItem> = {};
  for (const task of result) {
    if (!byRpa[task.queue]) {
      byRpa[task.queue] = {
        rpa: task._rpa.shortName || task._rpa.name,
        fullName: task._rpa.name,
        motor: task._rpa.motor,
        COMPLETED: 0,
        FAILED: 0,
        PENDING: 0,
        IN_PROGRESS: 0,
        total: 0,
        taxa: 0,
      };
    }
    byRpa[task.queue][task.status]++;
    byRpa[task.queue].total++;
  }

  const rpaData: RpaReportItem[] = Object.values(byRpa)
    .map((d) => {
      const finished = d.COMPLETED + d.FAILED;
      return { ...d, taxa: finished > 0 ? Math.round((d.COMPLETED / finished) * 100) : 0 };
    })
    .sort((a, b) => b.taxa - a.taxa);

  const totals = result.reduce<Partial<Record<TaskStatus, number>>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const finished = (totals.COMPLETED ?? 0) + (totals.FAILED ?? 0);
  const successRate = finished > 0 ? Math.round(((totals.COMPLETED ?? 0) / finished) * 100) : 0;

  const donutData: DonutItem[] = (['COMPLETED', 'FAILED', 'PENDING', 'IN_PROGRESS'] as TaskStatus[])
    .map((s) => ({ name: STATUS_LABEL_PT[s], value: totals[s] ?? 0, status: s }))
    .filter((d) => d.value > 0);

  const byMonth: Record<string, TimelineItem> = {};
  for (const task of result) {
    const month = task.updated_at?.slice(0, 7);
    if (!month) continue;
    if (!byMonth[month]) {
      byMonth[month] = { month, label: month.replace('-', '/'), COMPLETED: 0, FAILED: 0, PENDING: 0, IN_PROGRESS: 0 };
    }
    byMonth[month][task.status]++;
  }
  const timelineData = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

  return { rpaData, donutData, timelineData, totals, successRate, total: result.length };
}

// ----------------------------------------------------------------------

const RADIAN = Math.PI / 180;

interface DonutLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

function renderDonutLabel({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: DonutLabelProps) {
  if (percent < 0.08) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 12, fontWeight: 600 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function TaxaSucessoChart({ data }: { data: RpaReportItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Sucesso por RPA (%)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 62)}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 52, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="rpa" width={110} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}%`, 'Taxa de sucesso']} />
            <Bar dataKey="taxa" fill={CHART_COLORS.COMPLETED} radius={[0, 4, 4, 0]} maxBarSize={32}>
              <LabelList dataKey="taxa" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 11, fill: '#637381', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DistribuicaoChart({ data }: { data: DonutItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} cx="50%" cy="45%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" labelLine={false} label={renderDonutLabel}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={CHART_COLORS[entry.status] ?? '#ccc'} />
              ))}
            </Pie>
            <Tooltip formatter={(v, name) => [`${v} execuç${Number(v) !== 1 ? 'ões' : 'ão'}`, String(name)]} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function TimelineChart({ data }: { data: TimelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Execuções por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.COMPLETED} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_COLORS.COMPLETED} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.FAILED} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_COLORS.FAILED} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Area type="monotone" dataKey="COMPLETED" name="Sucesso" stroke={CHART_COLORS.COMPLETED} fill="url(#gradCompleted)" strokeWidth={2} dot={{ r: 4 } as any} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Area type="monotone" dataKey="FAILED" name="Falha" stroke={CHART_COLORS.FAILED} fill="url(#gradFailed)" strokeWidth={2} dot={{ r: 4 } as any} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Area type="monotone" dataKey="PENDING" name="Pendente" stroke={CHART_COLORS.PENDING} fill="none" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 } as any} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function VolumeRpaChart({ data }: { data: RpaReportItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume de Execuções por RPA</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="rpa" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="COMPLETED" name="Sucesso" stackId="a" fill={CHART_COLORS.COMPLETED} maxBarSize={52} />
            <Bar dataKey="FAILED" name="Falha" stackId="a" fill={CHART_COLORS.FAILED} maxBarSize={52} />
            <Bar dataKey="PENDING" name="Pendente" stackId="a" fill={CHART_COLORS.PENDING} radius={[4, 4, 0, 0]} maxBarSize={52} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function RelatoriosView() {
  const [filterMotor, setFilterMotor] = useState('');
  const [filterRpa, setFilterRpa] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrigem, setFilterOrigem] = useState('');
  const [filterBase, setFilterBase] = useState('');
  const [filterCompetencia, setFilterCompetencia] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [exportingPptx, setExportingPptx] = useState(false);
  // undefined = não gerado | null = sem dados | {...} = tem dados
  const [reportData, setReportData] = useState<ReportData | null | undefined>(undefined);

  const availableRpas = useMemo(() => {
    const queues = Object.keys(RPA_CONFIG);
    return queues
      .filter((q) => !filterMotor || RPA_CONFIG[q]?.motor === filterMotor)
      .map((q) => ({ queue: q, name: RPA_CONFIG[q].name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filterMotor]);

  const resetReport = () => setReportData(undefined);

  const handleMotorChange = (value: string) => {
    setFilterMotor(value);
    setFilterRpa('');
    resetReport();
  };

  const handleRpaChange = (value: string) => {
    setFilterRpa(value);
    resetReport();
  };

  const currentFilters: ReportFilters = {
    motor: filterMotor,
    rpa: filterRpa,
    status: filterStatus,
    origem: filterOrigem,
    base: filterBase,
    competencia: filterCompetencia,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
  };

  const handleGerar = async () => {
    setFetching(true);
    setFetchError(null);
    setReportData(undefined);
    try {
      const params: Record<string, unknown> = { all: 'true' };
      if (filterRpa) params.queue = filterRpa;

      const res = await axios.get(endpoints.tasks.list, { params });
      const fetched = normalizeList<Task>(res.data);
      // Protótipo sem back-end real conectado: uma resposta vazia não deve
      // resultar numa tela sem nada pra mostrar numa demo.
      const items = fetched.length > 0 ? fetched : generateMockTasks();
      const enriched = enrichTasks(items);
      const data = computeReportData(enriched, currentFilters);
      setReportData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar dados da API.';
      setFetchError(message);
      setReportData(null);
    } finally {
      setFetching(false);
    }
  };

  const handleExportCsv = () => {
    if (!reportData) return;
    exportToCsv(
      'relatorio-rpa',
      reportData.rpaData.map((d) => ({
        rpa: d.fullName,
        motor: d.motor,
        sucesso: d.COMPLETED,
        falha: d.FAILED,
        pendente: d.PENDING + d.IN_PROGRESS,
        total: d.total,
        taxa_sucesso: `${d.taxa}%`,
      }))
    );
  };

  const handleExportPptx = async () => {
    if (!reportData) return;
    setExportingPptx(true);
    try {
      await exportReportToPptx(reportData, {
        motor: filterMotor,
        rpa: availableRpas.find((r) => r.queue === filterRpa)?.name ?? '',
        status: filterStatus ? STATUS_LABEL_PT[filterStatus as TaskStatus] : '',
        origem: ORIGEM_OPTIONS.find((o) => o.value === filterOrigem)?.label ?? '',
        base: filterBase,
        competencia: filterCompetencia,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
      });
    } finally {
      setExportingPptx(false);
    }
  };

  const successRateColorClass =
    (reportData?.successRate ?? 0) >= 80
      ? 'text-[var(--success-text)]'
      : (reportData?.successRate ?? 0) >= 60
        ? 'text-[var(--warning-text)]'
        : 'text-destructive';

  return (
    <DashboardContent maxWidth="xl">
      <h4 className="mb-6 text-2xl font-semibold">Relatórios</h4>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">Motor</Label>
            <Select value={filterMotor || ALL} onValueChange={(v) => handleMotorChange(v === ALL ? '' : v)}>
              <SelectTrigger className="w-[130px] shrink-0">
                <SelectValue placeholder="Motor: Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                <SelectItem value="Fiscal">Fiscal</SelectItem>
                <SelectItem value="DP">DP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">RPA</Label>
            <Select value={filterRpa || ALL} onValueChange={(v) => handleRpaChange(v === ALL ? '' : v)}>
              <SelectTrigger className="w-[240px] shrink-0">
                <SelectValue placeholder="RPA: Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {availableRpas.map((r) => (
                  <SelectItem key={r.queue} value={r.queue}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">Status</Label>
            <Select value={filterStatus || ALL} onValueChange={(v) => { setFilterStatus(v === ALL ? '' : v); resetReport(); }}>
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue placeholder="Status: Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                <SelectItem value="COMPLETED">Sucesso</SelectItem>
                <SelectItem value="FAILED">Falha</SelectItem>
                <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">Origem</Label>
            <Select value={filterOrigem || ALL} onValueChange={(v) => { setFilterOrigem(v === ALL ? '' : v); resetReport(); }}>
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue placeholder="Origem: Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {ORIGEM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">Base</Label>
            <Input
              placeholder="Ex: Base 3"
              aria-label="Base"
              value={filterBase}
              onChange={(e) => { setFilterBase(e.target.value); resetReport(); }}
              className="w-[130px] shrink-0"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">Competência</Label>
            <Input
              type="month"
              aria-label="Competência"
              value={filterCompetencia}
              onChange={(e) => { setFilterCompetencia(e.target.value); resetReport(); }}
              className="w-[152px] shrink-0"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">De</Label>
            <Input
              type="date"
              aria-label="De"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); resetReport(); }}
              className="w-[152px] shrink-0"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">Até</Label>
            <Input
              type="date"
              aria-label="Até"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); resetReport(); }}
              className="w-[152px] shrink-0"
            />
          </div>

          <LoadingButton
            variant="default"
            onClick={handleGerar}
            loading={fetching}
            loadingText="Carregando..."
            className="ml-auto"
          >
            Gerar Relatório
          </LoadingButton>
        </CardContent>
      </Card>

      {fetchError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      {reportData === undefined && !fetching && (
        <Empty
          icon={<BarChart3 />}
          title='Selecione os filtros e clique em "Gerar Relatório"'
          description="Os gráficos serão exibidos aqui após a geração"
        />
      )}

      {reportData === null && !fetchError && (
        <Alert variant="info">
          <AlertTitle>Sem resultados</AlertTitle>
          <AlertDescription>
            Nenhuma execução encontrada para os filtros selecionados. Tente ajustar o período ou os filtros.
          </AlertDescription>
        </Alert>
      )}

      {reportData && (
        <>
          <div className="mb-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="size-4" />
              Exportar CSV
            </Button>
            <LoadingButton
              variant="outline"
              size="sm"
              onClick={handleExportPptx}
              loading={exportingPptx}
              loadingText="Gerando..."
            >
              <Presentation className="size-4" />
              Exportar Apresentação
            </LoadingButton>
          </div>

          <Card className="mb-6">
            <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-4 divide-x divide-border">
              <div>
                <p className="text-xs text-muted-foreground">Total de execuções</p>
                <p className="text-3xl font-semibold">{reportData.total}</p>
              </div>
              <div className="pl-8">
                <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
                <p className={`text-3xl font-semibold ${successRateColorClass}`}>{reportData.successRate}%</p>
              </div>
              <div className="pl-8">
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-3xl font-semibold text-[var(--success-text)]">{reportData.totals.COMPLETED ?? 0}</p>
              </div>
              <div className="pl-8">
                <p className="text-xs text-muted-foreground">Falhas</p>
                <p className="text-3xl font-semibold text-destructive">{reportData.totals.FAILED ?? 0}</p>
              </div>
              {(reportData.totals.PENDING ?? 0) > 0 && (
                <div className="pl-8">
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-semibold text-muted-foreground">{reportData.totals.PENDING}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-[3fr_2fr]">
            <TaxaSucessoChart data={reportData.rpaData} />
            <DistribuicaoChart data={reportData.donutData} />
          </div>

          {reportData.timelineData.length > 0 && (
            <div className="mb-6">
              <TimelineChart data={reportData.timelineData} />
            </div>
          )}

          <VolumeRpaChart data={reportData.rpaData} />
        </>
      )}
    </DashboardContent>
  );
}
