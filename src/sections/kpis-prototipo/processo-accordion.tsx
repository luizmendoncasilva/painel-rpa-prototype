import type { Task, ProcessoConfig } from 'src/types';
import type { CatalogoViewMode } from 'src/sections/catalogo/view';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { fDateTime } from 'src/utils/format-time';

import { buildProcessoCases, COMBO_STATUS_LABEL, COMBO_STATUS_VARIANT } from 'src/assets/data/processos';

import {
  cn,
  Badge,
  Table,
  TableRow,
  TabsList,
  TableBody,
  TableCell,
  TableHead,
  TabsTrigger,
  TableHeader,
  TabsContent,
  Tabs as TabsRoot,
} from 'src/components/ui';

import { MiniTrail } from 'src/sections/catalogo/mini-trail';

// ----------------------------------------------------------------------

function fDuration(seconds: number): string {
  if (seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m ${secs}s`;
}

interface Props {
  processo: ProcessoConfig;
  tasks: Task[];
  view: CatalogoViewMode;
  defaultOpen?: boolean;
}

export function ProcessoAccordion({ processo, tasks, view, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const interno = view === 'interno';

  const cases = useMemo(() => buildProcessoCases(processo, tasks), [processo, tasks]);
  const exitos = cases.filter((c) => c.comboStatus === 'sucesso');
  const falhas = cases.filter((c) => c.comboStatus === 'falha' || c.comboStatus === 'sucesso_parcial');
  const pendentes = cases.filter((c) => c.comboStatus === 'pendente' || c.comboStatus === 'em_andamento');
  const rate = exitos.length + falhas.length > 0 ? Math.round((exitos.length / (exitos.length + falhas.length)) * 100) : 0;

  const stageSummary = processo.stages.map((stage) => {
    const stageTasks = tasks.filter((t) => t.queue === stage.queue);
    const ok = stageTasks.filter((t) => t.status === 'COMPLETED').length;
    const fail = stageTasks.filter((t) => t.status === 'FAILED').length;
    return { stage, ok, fail, pctFail: ok + fail > 0 ? Math.round((fail / (ok + fail)) * 100) : 0 };
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="grid w-full grid-cols-1 items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 sm:grid-cols-[minmax(220px,1fr)_auto]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold">{processo.nome}</span>
          <Badge variant="outline" className="text-[11px]">
            {processo.motor}
          </Badge>
          <Badge variant="secondary" className="text-[11px]">
            {processo.stages.length} bot{processo.stages.length > 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <span className="block text-lg font-bold leading-none text-[var(--success-text)]">{exitos.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Êxitos</span>
          </div>
          <div className="text-right">
            <span className="block text-lg font-bold leading-none text-destructive">{falhas.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Falhas</span>
          </div>
          <div className="text-right">
            <span className="block text-lg font-bold leading-none text-muted-foreground">{pendentes.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Pend.</span>
          </div>
          <div className="min-w-28">
            <span className="text-xs font-semibold text-muted-foreground">{rate}% de êxito</span>
            <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted">
              <span
                className="h-full bg-success"
                style={{ width: `${cases.length ? (exitos.length / cases.length) * 100 : 0}%` }}
              />
              <span
                className="h-full bg-destructive"
                style={{ width: `${cases.length ? (falhas.length / cases.length) * 100 : 0}%` }}
              />
              <span
                className="h-full bg-[var(--color-neutral-300)]"
                style={{ width: `${cases.length ? (pendentes.length / cases.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/20 px-4 pb-4 pt-4">
          {interno && (
            <div className="mb-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Trilha do processo — {processo.stages.length} bot{processo.stages.length > 1 ? 's' : ''} em sequência
              </p>
              <div className="flex flex-wrap gap-3">
                {stageSummary.map(({ stage, ok, fail, pctFail }, idx) => (
                  <div
                    key={stage.queue}
                    className={cn(
                      'min-w-40 flex-1 rounded-md border bg-card px-3 py-2.5',
                      fail > 0 ? 'border-destructive/30' : 'border-border'
                    )}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {idx + 1}/{processo.stages.length} · {stage.queue}
                    </span>
                    <p className="mb-1.5 text-sm font-semibold leading-tight">{stage.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {ok} passaram · <span className="font-semibold text-destructive">{fail} quebraram</span>
                    </p>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-success-subtle">
                      <span className="block h-full bg-destructive" style={{ width: `${pctFail}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TabsRoot defaultValue="exitos">
            <TabsList>
              <TabsTrigger value="exitos">Êxitos ({exitos.length})</TabsTrigger>
              <TabsTrigger value="falhas">Falhas ({falhas.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="exitos" className="mt-3">
              <CaseTable cases={exitos} processo={processo} interno={false} />
            </TabsContent>
            <TabsContent value="falhas" className="mt-3">
              <CaseTable cases={falhas} processo={processo} interno={interno} />
            </TabsContent>
          </TabsRoot>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------

function CaseTable({
  cases,
  processo,
  interno,
}: {
  cases: ReturnType<typeof buildProcessoCases>;
  processo: ProcessoConfig;
  interno: boolean;
}) {
  if (cases.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum caso nesta aba com os filtros atuais.
      </div>
    );
  }

  const visible = cases.slice(0, 30);

  return (
    <div className="max-h-72 overflow-auto rounded-md border border-border bg-card">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            <TableHead>Empresa / Cliente</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>Trilha</TableHead>
            {interno && <TableHead>Quebrou em</TableHead>}
            <TableHead>Duração</TableHead>
            <TableHead>Data / hora</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((c) => {
            const failedStage = processo.stages.find((s) => c.stageFailure[s.queue]);
            const failure = failedStage ? c.stageFailure[failedStage.queue] : null;
            return (
              <TableRow key={c.key}>
                <TableCell className="text-sm font-medium">{c.empresa}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.cnpj ?? '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.base ?? '—'}</TableCell>
                <TableCell>
                  <MiniTrail stages={processo.stages} stageStatus={c.stageStatus} />
                </TableCell>
                {interno && (
                  <TableCell>
                    {failure ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="destructive" className="w-fit text-[10px]">
                          {failure.categoria}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">{failure.chamado}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {fDuration(c.durationSeconds)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {fDateTime(c.updatedAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={COMBO_STATUS_VARIANT[c.comboStatus]} className="text-[10px]">
                    {COMBO_STATUS_LABEL[c.comboStatus]}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {cases.length > visible.length && (
        <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          Mostrando {visible.length} de {cases.length}. Lista completa no CSV exportado.
        </p>
      )}
    </div>
  );
}
