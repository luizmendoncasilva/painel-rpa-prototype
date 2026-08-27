import type { Task } from 'src/types';

import { useMemo, useState, useEffect } from 'react';
import { Eye, Search, Download, Workflow, Building2 } from 'lucide-react';

import { exportToCsv } from 'src/utils/export-csv';

import axios, { endpoints } from 'src/lib/axios';
import { DashboardContent } from 'src/layouts/dashboard';
import { PROCESSOS, computeTrackingKpis } from 'src/assets/data/processos';

import { TrackingKpiStrip } from 'src/components/tracking-kpis';
import {
  Card,
  Badge,
  Input,
  Button,
  Select,
  Tooltip,
  CardTitle,
  CardHeader,
  SelectItem,
  CardContent,
  SelectValue,
  SelectContent,
  SelectTrigger,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui';

import { NaoConformidades } from './nao-conformidades';
import { ProcessoDetailDialog } from './processo-detail-dialog';

// ----------------------------------------------------------------------

export type CatalogoViewMode = 'operacao' | 'interno';

const ALL = '__all__';

interface ProcessoCounts {
  ok: number;
  fail: number;
  pending: number;
  total: number;
  rate: number | null;
}

function computeCounts(tasks: Task[], queues: string[]): ProcessoCounts {
  const relevant = tasks.filter((t) => queues.includes(t.queue));
  const ok = relevant.filter((t) => t.status === 'COMPLETED').length;
  const fail = relevant.filter((t) => t.status === 'FAILED').length;
  const pending = relevant.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const rate = ok + fail > 0 ? Math.round((ok / (ok + fail)) * 100) : null;
  return { ok, fail, pending, total: relevant.length, rate };
}

function rateColorClass(rate: number | null) {
  if (rate === null) return 'text-muted-foreground';
  if (rate >= 80) return 'text-[var(--success-text)]';
  if (rate >= 60) return 'text-[var(--warning-text)]';
  return 'text-destructive';
}

// ----------------------------------------------------------------------

export function CatalogoView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMotor, setFilterMotor] = useState('');
  const [filterPraca, setFilterPraca] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<CatalogoViewMode>('operacao');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get(endpoints.tasks.list, { params: { all: 'true' } });
        if (active) setTasks((res.data.items as Task[]) ?? []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const pracas = useMemo(() => [...new Set(PROCESSOS.map((p) => p.praca))].sort(), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PROCESSOS.filter((p) => {
      if (filterMotor && p.motor !== filterMotor) return false;
      if (filterPraca && p.praca !== filterPraca) return false;
      if (q && !p.nome.toLowerCase().includes(q) && !p.descricao.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, filterMotor, filterPraca]);

  const totalEmpresas = useMemo(() => PROCESSOS.reduce((sum, p) => sum + p.empresasElegiveis, 0), []);
  const selectedProcesso = PROCESSOS.find((p) => p.id === selectedId) ?? null;
  const globalKpis = useMemo(() => computeTrackingKpis(tasks, filtered), [tasks, filtered]);

  const handleExportAll = () => {
    exportToCsv(
      'catalogo-rpas',
      PROCESSOS.map((p) => {
        const queues = p.stages.map((s) => s.queue);
        const counts = computeCounts(tasks, queues);
        return {
          processo: p.nome,
          motor: p.motor,
          praca: p.praca,
          responsavel: p.responsavel,
          etapas: p.stages.map((s) => s.label).join(' → '),
          bots: queues.join(', '),
          empresas_elegiveis: p.empresasElegiveis,
          exitos: counts.ok,
          falhas: counts.fail,
          pendentes: counts.pending,
          taxa_sucesso: counts.rate !== null ? `${counts.rate}%` : '—',
        };
      })
    );
  };

  return (
    <DashboardContent maxWidth="xl">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 className="text-2xl font-semibold">Catálogo de RPAs</h4>
          <p className="text-sm text-muted-foreground">
            Glossário dos processos automatizados — o que cada um faz, quais bots o compõem e quantas empresas atende.
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

      <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Workflow className="size-3.5" />
            {PROCESSOS.length} processos
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Building2 className="size-3.5" />
            {totalEmpresas} empresas elegíveis
          </Badge>
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
      </div>

      <div className="mb-6 mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterMotor || ALL} onValueChange={(v) => setFilterMotor(v === ALL ? '' : v)}>
          <SelectTrigger className="w-[140px] shrink-0">
            <SelectValue placeholder="Motor: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="Fiscal">Fiscal</SelectItem>
            <SelectItem value="DP">DP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPraca || ALL} onValueChange={(v) => setFilterPraca(v === ALL ? '' : v)}>
          <SelectTrigger className="w-[160px] shrink-0">
            <SelectValue placeholder="Praça: Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {pracas.map((praca) => (
              <SelectItem key={praca} value={praca}>
                {praca}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6">
        <TrackingKpiStrip kpis={globalKpis} totalProcessos={filtered.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((processo) => {
          const queues = processo.stages.map((s) => s.queue);
          const counts = loading ? null : computeCounts(tasks, queues);

          return (
            <Card key={processo.id} className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[11px]">
                      {processo.motor}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      {processo.praca}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{processo.nome}</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">{processo.descricao}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {processo.stages.map((stage, idx) => (
                      <Tooltip key={stage.queue}>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-default text-[11px]">
                            {idx > 0 && '→ '}
                            {stage.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>{stage.queue}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </CardContent>
              </div>

              <CardContent className="flex flex-col gap-2 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{processo.empresasElegiveis}</span> empresas
                    elegíveis
                  </span>
                  <span className={`text-xs font-semibold ${rateColorClass(counts?.rate ?? null)}`}>
                    {counts?.rate !== null && counts?.rate !== undefined ? `${counts.rate}% de êxito` : '—'}
                  </span>
                </div>

                {counts && counts.total > 0 && (
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <span className="h-full bg-success" style={{ width: `${(counts.ok / counts.total) * 100}%` }} />
                    <span
                      className="h-full bg-destructive"
                      style={{ width: `${(counts.fail / counts.total) * 100}%` }}
                    />
                    <span
                      className="h-full bg-[var(--color-neutral-300)]"
                      style={{ width: `${(counts.pending / counts.total) * 100}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {counts && counts.total > 0 ? (
                      <>
                        <span>
                          <span className="font-semibold text-[var(--success-text)]">{counts.ok}</span> êxitos
                        </span>
                        <span>
                          <span className="font-semibold text-destructive">{counts.fail}</span> falhas
                        </span>
                        <span>
                          <span className="font-semibold text-foreground">{counts.pending}</span> pend.
                        </span>
                      </>
                    ) : (
                      <span>{loading ? 'Carregando execuções...' : 'Sem execuções no período'}</span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setSelectedId(processo.id)}
                  >
                    <Eye className="size-3.5" />
                    Detalhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {view === 'interno' && (
        <div className="mt-6">
          <NaoConformidades tasks={tasks} queues={filtered.flatMap((p) => p.stages.map((s) => s.queue))} />
        </div>
      )}

      <ProcessoDetailDialog
        processo={selectedProcesso}
        tasks={tasks}
        view={view}
        onClose={() => setSelectedId(null)}
      />
    </DashboardContent>
  );
}
