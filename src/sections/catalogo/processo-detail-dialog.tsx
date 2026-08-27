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

// ----------------------------------------------------------------------

const STAGE_STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Sucesso',
  FAILED: 'Falha',
  IN_PROGRESS: 'Em andamento',
  PENDING: 'Pendente',
};

const STAGE_STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  COMPLETED: 'success',
  FAILED: 'destructive',
  IN_PROGRESS: 'warning',
  PENDING: 'secondary',
};

interface Props {
  processo: ProcessoConfig | null;
  tasks: Task[];
  onClose: () => void;
}

export function ProcessoDetailDialog({ processo, tasks, onClose }: Props) {
  const cases = useMemo(() => (processo ? buildProcessoCases(processo, tasks) : []), [processo, tasks]);

  const handleExport = () => {
    if (!processo) return;
    exportToCsv(
      `casos-${processo.id}`,
      cases.map((c) => ({
        empresa: c.empresa,
        cnpj: c.cnpj ?? '',
        competencia: c.competencia ?? '',
        ...Object.fromEntries(
          processo.stages.map((s) => [s.label, c.stageStatus[s.queue] ? STAGE_STATUS_LABEL[c.stageStatus[s.queue]!] : '—'])
        ),
        status_combinado: COMBO_STATUS_LABEL[c.comboStatus],
        atualizado_em: fDateTime(c.updatedAt),
      }))
    );
  };

  return (
    <Dialog open={Boolean(processo)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
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
              {processo.stages.map((stage) => (
                <Badge key={stage.queue} variant="outline" className="gap-1.5">
                  {stage.label}
                  <span className="font-mono text-[10px] text-muted-foreground">{stage.queue}</span>
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

            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Competência</TableHead>
                    {processo.stages.map((stage) => (
                      <TableHead key={stage.queue}>{stage.label}</TableHead>
                    ))}
                    <TableHead>Status combinado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={processo.stages.length + 3}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Nenhum caso encontrado neste período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cases.map((c) => (
                      <TableRow key={c.key}>
                        <TableCell className="text-sm font-medium">{c.empresa}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.competencia ?? '—'}</TableCell>
                        {processo.stages.map((stage) => {
                          const status = c.stageStatus[stage.queue];
                          return (
                            <TableCell key={stage.queue}>
                              {status ? (
                                <Badge variant={STAGE_STATUS_VARIANT[status]}>{STAGE_STATUS_LABEL[status]}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Não rodou</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          <Badge variant={COMBO_STATUS_VARIANT[c.comboStatus]}>
                            {COMBO_STATUS_LABEL[c.comboStatus]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
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
