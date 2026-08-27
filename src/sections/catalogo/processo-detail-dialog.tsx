import type { CatalogoViewMode } from './view';
import type { Task, ProcessoConfig } from 'src/types';

import { useMemo } from 'react';
import { Download } from 'lucide-react';

import { fDateTime } from 'src/utils/format-time';
import { exportToCsv } from 'src/utils/export-csv';

import { buildProcessoCases, COMBO_STATUS_LABEL, COMBO_STATUS_VARIANT } from 'src/assets/data/processos';

import {
  Badge,
  Table,
  Button,
  Dialog,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  DialogTitle,
  TableHeader,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui';

import { MiniTrail } from './mini-trail';

// ----------------------------------------------------------------------

interface Props {
  processo: ProcessoConfig | null;
  tasks: Task[];
  view: CatalogoViewMode;
  onClose: () => void;
}

export function ProcessoDetailDialog({ processo, tasks, view, onClose }: Props) {
  const cases = useMemo(() => (processo ? buildProcessoCases(processo, tasks) : []), [processo, tasks]);
  const interno = view === 'interno';

  const handleExport = () => {
    if (!processo) return;
    exportToCsv(
      `casos-${processo.id}`,
      cases.map((c) => {
        const failedStage = processo.stages.find((s) => c.stageFailure[s.queue]);
        const failure = failedStage ? c.stageFailure[failedStage.queue] : null;
        return {
          empresa: c.empresa,
          cnpj: c.cnpj ?? '',
          competencia: c.competencia ?? '',
          base: c.base ?? '',
          status_combinado: COMBO_STATUS_LABEL[c.comboStatus],
          quebrou_em: failedStage?.label ?? '',
          categoria: failure?.categoria ?? '',
          mensagem: failure?.mensagem ?? '',
          chamado: failure?.chamado ?? '',
          atualizado_em: fDateTime(c.updatedAt),
        };
      })
    );
  };

  return (
    <Dialog open={Boolean(processo)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        {processo && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{processo.motor}</Badge>
                <Badge variant="secondary">{processo.praca}</Badge>
                <DialogTitle>{processo.nome}</DialogTitle>
              </div>
              <DialogDescription>{processo.descricao}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
              <span>
                <span className="text-muted-foreground">Responsável: </span>
                <span className="font-medium">{processo.responsavel}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Empresas elegíveis: </span>
                <span className="font-medium">{processo.empresasElegiveis}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Etapas: </span>
                <span className="font-medium">{processo.stages.length}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {processo.stages.map((stage, idx) => (
                <Badge key={stage.queue} variant="outline" className="gap-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground">{idx + 1}</span>
                  {stage.label}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Casos no período — {cases.length} empresa{cases.length !== 1 ? 's' : ''}
              </span>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={cases.length === 0}>
                <Download className="size-4" />
                Exportar CSV
              </Button>
            </div>

            <div className="max-h-96 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Trilha</TableHead>
                    <TableHead>Status combinado</TableHead>
                    {interno && <TableHead>Categoria / mensagem</TableHead>}
                    {interno && <TableHead>Chamado</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={interno ? 6 : 4} className="py-10 text-center text-sm text-muted-foreground">
                        Nenhum caso encontrado neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cases.map((c) => {
                      const failedStage = processo.stages.find((s) => c.stageFailure[s.queue]);
                      const failure = failedStage ? c.stageFailure[failedStage.queue] : null;

                      return (
                        <TableRow key={c.key}>
                          <TableCell className="text-sm font-medium">{c.empresa}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.competencia ?? '—'}</TableCell>
                          <TableCell>
                            <MiniTrail stages={processo.stages} stageStatus={c.stageStatus} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={COMBO_STATUS_VARIANT[c.comboStatus]}>
                              {COMBO_STATUS_LABEL[c.comboStatus]}
                            </Badge>
                          </TableCell>
                          {interno && (
                            <TableCell>
                              {failure ? (
                                <div className="flex flex-col gap-0.5">
                                  <Badge variant="destructive" className="w-fit text-[11px]">
                                    {failure.categoria}
                                  </Badge>
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    {failure.mensagem}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                          {interno && (
                            <TableCell>
                              {failure?.chamado ? (
                                <span className="font-mono text-xs text-[var(--info-text)]">{failure.chamado}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
