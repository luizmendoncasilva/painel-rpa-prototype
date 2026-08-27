import type { Task } from 'src/types';

import { useMemo, useState, useEffect } from 'react';
import { Eye, Search, Download, Workflow, Building2 } from 'lucide-react';

import { exportToCsv } from 'src/utils/export-csv';

import axios, { endpoints } from 'src/lib/axios';
import { PROCESSOS } from 'src/assets/data/processos';
import { DashboardContent } from 'src/layouts/dashboard';

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
  IconButton,
  CardContent,
  SelectValue,
  SelectContent,
  SelectTrigger,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui';

import { ProcessoDetailDialog } from './processo-detail-dialog';

// ----------------------------------------------------------------------

function computeSuccessRate(tasks: Task[], queues: string[]) {
  const relevant = tasks.filter((t) => queues.includes(t.queue) && (t.status === 'COMPLETED' || t.status === 'FAILED'));
  if (relevant.length === 0) return null;
  const completed = relevant.filter((t) => t.status === 'COMPLETED').length;
  return Math.round((completed / relevant.length) * 100);
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

  const handleExportAll = () => {
    exportToCsv(
      'catalogo-rpas',
      PROCESSOS.map((p) => {
        const queues = p.stages.map((s) => s.queue);
        const rate = computeSuccessRate(tasks, queues);
        return {
          processo: p.nome,
          motor: p.motor,
          praca: p.praca,
          responsavel: p.responsavel,
          etapas: p.stages.map((s) => s.label).join(' → '),
          bots: queues.join(', '),
          empresas_elegiveis: p.empresasElegiveis,
          taxa_sucesso: rate !== null ? `${rate}%` : '—',
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
        <div className="flex items-center gap-2">
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

        <Select value={filterMotor} onValueChange={setFilterMotor} isDeselectable>
          <SelectTrigger className="w-[140px] shrink-0">
            <SelectValue placeholder="Motor: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Fiscal">Fiscal</SelectItem>
            <SelectItem value="DP">DP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPraca} onValueChange={setFilterPraca} isDeselectable>
          <SelectTrigger className="w-[160px] shrink-0">
            <SelectValue placeholder="Praça: Todas" />
          </SelectTrigger>
          <SelectContent>
            {pracas.map((praca) => (
              <SelectItem key={praca} value={praca}>
                {praca}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((processo) => {
          const queues = processo.stages.map((s) => s.queue);
          const rate = loading ? null : computeSuccessRate(tasks, queues);

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

              <CardContent className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-5">
                  <span>
                    <span className="font-semibold text-foreground">{processo.empresasElegiveis}</span> empresas
                  </span>
                  <span>
                    Taxa de sucesso:{' '}
                    <span className={`font-semibold ${rateColorClass(rate)}`}>
                      {rate !== null ? `${rate}%` : '—'}
                    </span>
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      aria-label={`Ver detalhamento de ${processo.nome}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedId(processo.id)}
                    >
                      <Eye className="size-4" />
                    </IconButton>
                  </TooltipTrigger>
                  <TooltipContent>Ver detalhamento</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProcessoDetailDialog processo={selectedProcesso} tasks={tasks} onClose={() => setSelectedId(null)} />
    </DashboardContent>
  );
}
