import type { Task } from 'src/types';
import type { KpiCategory } from './kpi-catalog';
import type { CatalogoViewMode } from 'src/sections/catalogo/view';

import { ChevronRight } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import {
  Bar,
  Pie,
  Cell,
  Area,
  XAxis,
  YAxis,
  Legend,
  BarChart,
  PieChart,
  AreaChart,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts';

import axios, { endpoints } from 'src/lib/axios';
import { generateMockTasks } from 'src/lib/mock-data';
import { DashboardContent } from 'src/layouts/dashboard';
import { PROCESSOS, computeTrackingKpis } from 'src/assets/data/processos';

import { TrackingKpiStrip } from 'src/components/tracking-kpis';
import {
  cn,
  Card,
  Tabs,
  Alert,
  Label,
  Button,
  Select,
  TabsList,
  CardTitle,
  SelectItem,
  CardHeader,
  AlertTitle,
  CardContent,
  TabsTrigger,
  TabsContent,
  SelectValue,
  SelectContent,
  SelectTrigger,
  AlertDescription,
} from 'src/components/ui';

import { NaoConformidades } from 'src/sections/catalogo/nao-conformidades';

import { KpiCard } from './kpi-card';
import { ContratoDados } from './contrato-dados';
import { ProcessoAccordion } from './processo-accordion';
import { KPI_CATALOG, CATEGORY_META } from './kpi-catalog';

// ----------------------------------------------------------------------

const CATEGORY_ORDER: KpiCategory[] = ['volume', 'confiabilidade', 'eficiencia', 'governanca'];
const KPI_GRID = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

const DONUT_DATA = [
  { name: 'Sucesso', value: 1122, color: 'var(--success-border)' },
  { name: 'Falha', value: 118, color: 'var(--destructive)' },
  { name: 'Pendente', value: 28, color: 'var(--color-neutral-400)' },
  { name: 'Em andamento', value: 16, color: 'var(--warning-border)' },
];

const VOLUME_DATA = [
  { label: 'jan', sucesso: 148, falha: 12 },
  { label: 'fev', sucesso: 162, falha: 18 },
  { label: 'mar', sucesso: 171, falha: 15 },
  { label: 'abr', sucesso: 189, falha: 21 },
  { label: 'mai', sucesso: 204, falha: 14 },
  { label: 'jun', sucesso: 248, falha: 38 },
];

const ALL = '__all__';

function extractCompetencia(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  return (payload.competencia as string) ?? null;
}

function extractBase(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  return (payload.base as string) ?? null;
}

// ----------------------------------------------------------------------

export function KpisPrototipoView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterMotor, setFilterMotor] = useState('');
  const [filterProcesso, setFilterProcesso] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBase, setFilterBase] = useState('');
  const [filterCompetencia, setFilterCompetencia] = useState('');
  const [view, setView] = useState<CatalogoViewMode>('operacao');
  const [contratoOpen, setContratoOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get(endpoints.tasks.list, { params: { all: 'true' } });
        const items = (res.data.items as Task[]) ?? [];
        // Protótipo de demonstração: se a API real não tem tasks ainda, preenche com dados fake
        if (active) setTasks(items.length > 0 ? items : generateMockTasks());
      } catch {
        // API inacessível — preenche com dados fake em vez de zerar tudo
        if (active) setTasks(generateMockTasks());
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const bases = useMemo(
    () => [...new Set(tasks.map((t) => extractBase(t.payload)).filter((b): b is string => Boolean(b)))].sort(),
    [tasks]
  );
  const competencias = useMemo(
    () =>
      [...new Set(tasks.map((t) => extractCompetencia(t.payload)).filter((c): c is string => Boolean(c)))].sort(
        (a, b) => b.localeCompare(a)
      ),
    [tasks]
  );

  const processosFiltrados = useMemo(
    () =>
      PROCESSOS.filter((p) => {
        if (filterMotor && p.motor !== filterMotor) return false;
        if (filterProcesso && p.id !== filterProcesso) return false;
        return true;
      }),
    [filterMotor, filterProcesso]
  );

  const tasksFiltradas = useMemo(() => {
    const queues = processosFiltrados.flatMap((p) => p.stages.map((s) => s.queue));
    return tasks.filter((t) => {
      if (!queues.includes(t.queue)) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterBase && extractBase(t.payload) !== filterBase) return false;
      if (filterCompetencia && extractCompetencia(t.payload) !== filterCompetencia) return false;
      return true;
    });
  }, [tasks, processosFiltrados, filterStatus, filterBase, filterCompetencia]);

  const trackingKpis = useMemo(
    () => computeTrackingKpis(tasksFiltradas, processosFiltrados),
    [tasksFiltradas, processosFiltrados]
  );

  return (
    <DashboardContent maxWidth="xl">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 className="text-2xl font-semibold">Painel</h4>
          <p className="text-sm text-muted-foreground">
            Acompanhamento dos processos + amostragem de indicadores para stakeholders.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
            <Button
              size="sm"
              variant={view === 'operacao' ? 'default' : 'ghost'}
              className="h-7 px-3 text-xs"
              onClick={() => setView('operacao')}
            >
              Operação
            </Button>
            <Button
              size="sm"
              variant={view === 'interno' ? 'default' : 'ghost'}
              className="h-7 px-3 text-xs"
              onClick={() => setView('interno')}
            >
              Interno · detalhe
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground">Mesma base, dois níveis de detalhe</span>
        </div>
      </div>

      <Alert variant="warning" className="mt-4 mb-6">
        <AlertTitle>Dados ilustrativos</AlertTitle>
        <AlertDescription>
          Os KPIs de amostragem abaixo são fictícios, apenas para validar layout e conteúdo — não refletem
          execuções reais. A faixa de acompanhamento no topo usa os dados carregados de fato.
        </AlertDescription>
      </Alert>

      <div className="mb-6 flex flex-wrap items-end gap-2.5">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Motor</Label>
          <Select value={filterMotor || ALL} onValueChange={(v) => setFilterMotor(v === ALL ? '' : v)}>
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
          <Label className="text-[11px] text-muted-foreground">Processo</Label>
          <Select value={filterProcesso || ALL} onValueChange={(v) => setFilterProcesso(v === ALL ? '' : v)}>
            <SelectTrigger className="w-[200px] shrink-0">
              <SelectValue placeholder="Processo: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {PROCESSOS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Status</Label>
          <Select value={filterStatus || ALL} onValueChange={(v) => setFilterStatus(v === ALL ? '' : v)}>
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
          <Label className="text-[11px] text-muted-foreground">Base</Label>
          <Select value={filterBase || ALL} onValueChange={(v) => setFilterBase(v === ALL ? '' : v)}>
            <SelectTrigger className="w-[130px] shrink-0">
              <SelectValue placeholder="Base: Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {bases.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Competência</Label>
          <Select value={filterCompetencia || ALL} onValueChange={(v) => setFilterCompetencia(v === ALL ? '' : v)}>
            <SelectTrigger className="w-[170px] shrink-0">
              <SelectValue placeholder="Competência: Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {competencias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(filterMotor || filterProcesso || filterStatus || filterBase || filterCompetencia) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFilterMotor('');
              setFilterProcesso('');
              setFilterStatus('');
              setFilterBase('');
              setFilterCompetencia('');
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="mb-8">
        <TrackingKpiStrip kpis={trackingKpis} totalProcessos={processosFiltrados.length} />
      </div>

      <div className="mb-8">
        <h5 className="mb-1 text-base font-semibold">Processos</h5>
        <p className="mb-3 text-xs text-muted-foreground">
          Ordenado por volume de falhas. Clique no processo para abrir a trilha de bots e as listas de CNPJs.
        </p>
        <div className="flex flex-col gap-2.5">
          {[...processosFiltrados]
            .sort((a, b) => {
              const failA = tasksFiltradas.filter((t) => t.queue === a.stages[0]?.queue && t.status === 'FAILED').length;
              const failB = tasksFiltradas.filter((t) => t.queue === b.stages[0]?.queue && t.status === 'FAILED').length;
              return failB - failA;
            })
            .map((processo, idx) => (
              <ProcessoAccordion
                key={processo.id}
                processo={processo}
                tasks={tasksFiltradas}
                view={view}
                defaultOpen={idx === 0}
              />
            ))}
          {processosFiltrados.length === 0 && (
            <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum processo com os filtros atuais.
            </div>
          )}
        </div>
      </div>

      {view === 'interno' && (
        <div className="mb-8">
          <h5 className="mb-1 text-base font-semibold">Não conformidades</h5>
          <p className="mb-3 text-xs text-muted-foreground">
            Falhas agrupadas por categoria — o que define se o caso vira debug do bot ou tratativa humana.
          </p>
          <NaoConformidades
            tasks={tasksFiltradas}
            queues={processosFiltrados.flatMap((p) => p.stages.map((s) => s.queue))}
          />
        </div>
      )}

      <div className="mb-8">
        <button
          type="button"
          onClick={() => setContratoOpen((prev) => !prev)}
          className="mb-1 flex w-full items-center gap-1.5 text-left"
        >
          <ChevronRight className={cn('size-4 text-muted-foreground transition-transform', contratoOpen && 'rotate-90')} />
          <h5 className="text-base font-semibold">Contrato de dados</h5>
        </button>
        <p className="mb-3 pl-5.5 text-xs text-muted-foreground">
          O que o back-end precisa enviar por execução para o painel conseguir montar tudo acima.
        </p>
        {contratoOpen && <ContratoDados />}
      </div>

      <div className="mb-3">
        <h5 className="text-base font-semibold">Amostragem de KPIs</h5>
        <p className="text-xs text-muted-foreground">
          Indicadores ilustrativos organizados por categoria — separados por aba para comparar o que faz sentido
          expor.
        </p>
      </div>

      <Tabs defaultValue={CATEGORY_ORDER[0]} className="mb-8">
        <TabsList>
          {CATEGORY_ORDER.map((category) => (
            <TabsTrigger key={category} value={category}>
              {CATEGORY_META[category].label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORY_ORDER.map((category) => {
          const meta = CATEGORY_META[category];
          const items = KPI_CATALOG.filter((k) => k.category === category);

          return (
            <TabsContent key={category} value={category} className="mt-4">
              <p className="mb-3 text-xs text-muted-foreground">{meta.description}</p>
              <div className={`grid gap-3 ${KPI_GRID}`}>
                {items.map((kpi) => (
                  <KpiCard key={kpi.id} kpi={kpi} />
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tendência temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={VOLUME_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="protoGradSucesso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success-border)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--success-border)" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="protoGradFalha" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <RTooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="sucesso"
                  name="Sucesso"
                  stroke="var(--success-border)"
                  fill="url(#protoGradSucesso)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="falha"
                  name="Falha"
                  stroke="var(--destructive)"
                  fill="url(#protoGradFalha)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desfecho do período</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={DONUT_DATA}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={92}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {DONUT_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Volume por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={VOLUME_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <RTooltip />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sucesso" name="Sucesso" stackId="a" fill="var(--success-border)" radius={[0, 0, 0, 0]} maxBarSize={48} />
              <Bar dataKey="falha" name="Falha" stackId="a" fill="var(--destructive)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
