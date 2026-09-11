import type { Task } from 'src/types';
import type { ViewMode } from 'src/hooks/use-view-mode';

import { useMemo, useState, useEffect } from 'react';
import { Eye, Search, Download, Workflow } from 'lucide-react';

import { useViewMode } from 'src/hooks/use-view-mode';

import { exportToCsv } from 'src/utils/export-csv';

import axios, { endpoints } from 'src/lib/axios';
import { PROCESSOS } from 'src/assets/data/processos';
import { DashboardContent } from 'src/layouts/dashboard';

import {
  Card,
  Badge,
  Input,
  Label,
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

import { ProcessoDetailDialog } from './processo-detail-dialog';

// ----------------------------------------------------------------------
// Catálogo é a tela de REFERÊNCIA (o que cada processo é, quem compõe,
// quantas empresas atende) — não de monitoramento. O acompanhamento
// operacional (êxitos/falhas, não conformidades, KPIs de execução) fica
// no Painel e no dialog "Detalhar" de cada processo, para não duplicar
// o mesmo dado agregado em dois lugares com leituras ligeiramente
// diferentes.
// ----------------------------------------------------------------------

export type CatalogoViewMode = ViewMode;

const ALL = '__all__';

export function CatalogoView() {
  const { view } = useViewMode();
  const [tasks, setTasks] = useState<Task[]>([]);
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
      } catch {
        // silencioso — a lista de processos é dado estático e não depende disso
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

  const selectedProcesso = PROCESSOS.find((p) => p.id === selectedId) ?? null;

  const handleExportAll = () => {
    exportToCsv(
      'catalogo-rpas',
      PROCESSOS.map((p) => ({
        processo: p.nome,
        motor: p.motor,
        praca: p.praca,
        responsavel: p.responsavel,
        etapas: p.stages.map((s) => s.label).join(' → '),
        bots: p.stages.map((s) => s.queue).join(', '),
        empresas_elegiveis: p.empresasElegiveis,
      }))
    );
  };

  return (
    <DashboardContent maxWidth="xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 className="text-2xl font-semibold">Catálogo de RPAs</h4>
          <p className="text-sm text-muted-foreground">
            Glossário dos processos automatizados — o que cada um faz, quais bots o compõem e quantas empresas
            atende. Para acompanhamento de execuções, veja o Painel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Workflow className="size-3.5" />
            {PROCESSOS.length} processos
          </Badge>
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-2.5">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nome ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Motor</Label>
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
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Praça</Label>
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
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((processo) => (
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
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{processo.empresasElegiveis}</span> empresas
                elegíveis
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setSelectedId(processo.id)}
              >
                <Eye className="size-3.5" />
                Detalhar
              </Button>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum processo com os filtros atuais.
          </div>
        )}
      </div>

      <ProcessoDetailDialog
        processo={selectedProcesso}
        tasks={tasks}
        view={view}
        onClose={() => setSelectedId(null)}
      />
    </DashboardContent>
  );
}
