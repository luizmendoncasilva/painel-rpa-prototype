import type { Task } from 'src/types';

import { SlidersHorizontal } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useViewMode } from 'src/hooks/use-view-mode';

import axios, { endpoints } from 'src/lib/axios';
import { generateMockTasks } from 'src/lib/mock-data';
import { DashboardContent } from 'src/layouts/dashboard';
import { PROCESSOS, computeTrackingKpis } from 'src/assets/data/processos';

import { TrackingKpiStrip } from 'src/components/tracking-kpis';
import {
  Tabs,
  Badge,
  Alert,
  Label,
  Button,
  Select,
  Popover,
  TabsList,
  SelectItem,
  AlertTitle,
  TabsTrigger,
  TabsContent,
  SelectValue,
  SelectContent,
  SelectTrigger,
  PopoverContent,
  PopoverTrigger,
  AlertDescription,
} from 'src/components/ui';

import { NaoConformidades } from 'src/sections/catalogo/nao-conformidades';

import { KpiCard } from './kpi-card';
import { KPI_CATALOG_BY_PROCESSO } from './kpi-catalog';
import { ProcessoAccordion } from './processo-accordion';

// ----------------------------------------------------------------------

const KPI_GRID = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

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
  const { view } = useViewMode();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterMotor, setFilterMotor] = useState('');
  const [filterProcesso, setFilterProcesso] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBase, setFilterBase] = useState('');
  const [filterCompetencia, setFilterCompetencia] = useState('');
  const [kpiSampleId, setKpiSampleId] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get(endpoints.tasks.list, { params: { all: 'true' } });
        const items = (res.data.items as Task[]) ?? [];
        // Em dev, se a API real não tem tasks ainda, preenche com dados fake só para demonstrar o layout
        if (active) setTasks(items.length > 0 || !import.meta.env.DEV ? items : generateMockTasks());
      } catch {
        // silencioso em produção; em dev preenche com dados fake em vez de zerar tudo
        if (active) setTasks(import.meta.env.DEV ? generateMockTasks() : []);
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

  const kpiSampleProcesso =
    processosFiltrados.find((p) => p.id === kpiSampleId) ?? processosFiltrados[0] ?? null;

  const extraFiltersCount = [filterStatus, filterBase, filterCompetencia].filter(Boolean).length;
  const hasAnyFilter = Boolean(filterMotor || filterProcesso) || extraFiltersCount > 0;

  const clearFilters = () => {
    setFilterMotor('');
    setFilterProcesso('');
    setFilterStatus('');
    setFilterBase('');
    setFilterCompetencia('');
  };

  return (
    <DashboardContent maxWidth="xl">
      <div className="mb-6">
        <h4 className="text-2xl font-semibold">Painel</h4>
        <p className="text-sm text-muted-foreground">
          Acompanhamento operacional dos processos. Para o glossário de processos, veja o Catálogo.
        </p>
      </div>

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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="size-3.5" />
              Mais filtros
              {extraFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">
                  {extraFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] text-muted-foreground">Status</Label>
              <Select value={filterStatus || ALL} onValueChange={(v) => setFilterStatus(v === ALL ? '' : v)}>
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
              <Select
                value={filterCompetencia || ALL}
                onValueChange={(v) => setFilterCompetencia(v === ALL ? '' : v)}
              >
                <SelectTrigger className="w-full">
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
          </PopoverContent>
        </Popover>

        {hasAnyFilter && (
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="processos">Processos</TabsTrigger>
          {view === 'interno' && <TabsTrigger value="qualidade">Qualidade</TabsTrigger>}
        </TabsList>

        <TabsContent value="visao-geral" className="mt-4 flex flex-col gap-8">
          <TrackingKpiStrip kpis={trackingKpis} totalProcessos={processosFiltrados.length} />

          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h5 className="text-base font-semibold">Amostragem de KPIs por processo</h5>
                <p className="text-xs text-muted-foreground">
                  Indicadores ilustrativos de cada processo de negócio — evita misturar métricas de frota (que só
                  fazem sentido para os bots de SPED) com processos que não têm essas dimensões.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
                <RouterLink href={paths.dashboard.especificacao}>Ver especificação técnica →</RouterLink>
              </Button>
            </div>

            <Alert variant="warning" className="mb-4">
              <AlertTitle>Dados ilustrativos</AlertTitle>
              <AlertDescription>
                Os KPIs abaixo são fictícios, apenas para validar layout e conteúdo — não refletem execuções reais.
                A faixa de acompanhamento acima usa os dados carregados de fato.
              </AlertDescription>
            </Alert>

            {kpiSampleProcesso ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 sm:w-[280px]">
                  <Label className="text-[11px] text-muted-foreground">Processo</Label>
                  <Select value={kpiSampleProcesso.id} onValueChange={setKpiSampleId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {processosFiltrados.map((processo) => (
                        <SelectItem key={processo.id} value={processo.id}>
                          {processo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground">{kpiSampleProcesso.descricao}</p>
                <div className={`grid gap-3 ${KPI_GRID}`}>
                  {(KPI_CATALOG_BY_PROCESSO[kpiSampleProcesso.id] ?? []).map((kpi) => (
                    <KpiCard key={kpi.id} kpi={kpi} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum processo com os filtros atuais.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="processos" className="mt-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Ordenado por volume de falhas. Clique no processo para abrir a trilha de bots e as listas de CNPJs.
          </p>
          <div className="flex flex-col gap-2.5">
            {[...processosFiltrados]
              .sort((a, b) => {
                const failA = tasksFiltradas.filter(
                  (t) => t.queue === a.stages[0]?.queue && t.status === 'FAILED'
                ).length;
                const failB = tasksFiltradas.filter(
                  (t) => t.queue === b.stages[0]?.queue && t.status === 'FAILED'
                ).length;
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
        </TabsContent>

        {view === 'interno' && (
          <TabsContent value="qualidade" className="mt-4">
            <p className="mb-3 text-xs text-muted-foreground">
              Falhas agrupadas por categoria — o que define se o caso vira debug do bot ou tratativa humana.
            </p>
            <NaoConformidades
              tasks={tasksFiltradas}
              queues={processosFiltrados.flatMap((p) => p.stages.map((s) => s.queue))}
            />
          </TabsContent>
        )}
      </Tabs>
    </DashboardContent>
  );
}
