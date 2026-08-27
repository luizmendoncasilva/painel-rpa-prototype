import type { Bot } from 'src/types';

import { useState, useEffect, useCallback } from 'react';
import { X, Info, ChevronLeft, ChevronRight } from 'lucide-react';

import axios, { endpoints } from 'src/lib/axios';

import {
  Badge,
  Table,
  Dialog,
  Button,
  Spinner,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  DialogTitle,
  TableHeader,
  DialogHeader,
  DialogContent,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui';

// ----------------------------------------------------------------------

const PAGE_SIZE = 20;

interface StatusFilter {
  label: string;
  value: string;
}

const STATUS_FILTERS: StatusFilter[] = [
  { label: 'Todos', value: '' },
  { label: 'Sucesso', value: 'COMPLETED' },
  { label: 'Erros', value: 'FAILED' },
];

interface ErrorPayload {
  screenshot_url?: string;
  step?: string;
  bot_id?: string;
  correlation_key?: string;
  stacktrace?: string;
  [key: string]: unknown;
}

interface ExecutionLog {
  id: string;
  machine_id: string | null;
  status: 'COMPLETED' | 'FAILED';
  started_at: string | null;
  finished_at: string | null;
  attempt: number;
  error?: string | null;
  error_payload?: ErrorPayload | null;
}

interface Props {
  open: boolean;
  bot: Bot | null;
  onClose: () => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDuration(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt || !finishedAt) return '—';
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

// ----------------------------------------------------------------------

export function BotLogsDialog({ open, bot, onClose }: Props) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailLog, setDetailLog] = useState<ExecutionLog | null>(null);

  const fetchLogs = useCallback(
    async (botId: string, pageNum: number, filter: string) => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          bot_id: botId,
          page: pageNum + 1,
          page_size: PAGE_SIZE,
        };
        if (filter) params.status = filter;
        const res = await axios.get(endpoints.executionLogs.list, { params });
        setLogs((res.data.items as ExecutionLog[]) ?? []);
        setTotal((res.data.total as number) ?? 0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load logs whenever the dialog opens for a given bot (mirrors the previous
  // Dialog TransitionProps.onEntered behavior).
  useEffect(() => {
    if (!open || !bot) return;
    setPage(0);
    setStatusFilter('');
    fetchLogs(bot.bot_id, 0, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bot?.bot_id]);

  const handleStatusFilter = (value: string) => {
    if (!bot) return;
    setStatusFilter(value);
    setPage(0);
    fetchLogs(bot.bot_id, 0, value);
  };

  const handlePrevPage = () => {
    if (!bot || page === 0) return;
    const newPage = page - 1;
    setPage(newPage);
    fetchLogs(bot.bot_id, newPage, statusFilter);
  };

  const handleNextPage = () => {
    if (!bot) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchLogs(bot.bot_id, newPage, statusFilter);
  };

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="gap-0 p-0 sm:max-w-4xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Logs — {bot?.name}</DialogTitle>

          <div className="flex items-center justify-between px-6 pt-6 pb-1">
            <div>
              <h2 className="text-lg font-semibold">Logs — {bot?.name}</h2>
              <p className="font-mono text-sm text-muted-foreground">{bot?.bot_id}</p>
            </div>
            <IconButton aria-label="Fechar" variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </div>

          <div className="flex gap-2 border-b border-border px-6 py-3">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? 'default' : 'outline'}
                onClick={() => handleStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Máquina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="text-center">Tentativa</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead className="text-center">Log Detalhado</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <Spinner size="lg" className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(log.finished_at)}
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.machine_id ?? '—'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge variant={log.status === 'COMPLETED' ? 'success' : 'destructive'}>
                          {log.status === 'COMPLETED' ? 'Sucesso' : 'Erro'}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDuration(log.started_at, log.finished_at)}
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground">{log.attempt}</span>
                      </TableCell>

                      <TableCell className="max-w-85">
                        {log.error ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block cursor-default truncate text-xs text-destructive">
                                {log.error}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{log.error}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {log.error_payload ? (
                          <IconButton
                            aria-label="Ver log detalhado"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailLog(log)}
                          >
                            <Info className="size-4" />
                          </IconButton>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-sm text-muted-foreground">
              {total === 0 ? '0 de 0' : `${from}–${to} de ${total}`}
            </span>
            <div className="flex items-center gap-1">
              <IconButton
                aria-label="Página anterior"
                variant="ghost"
                size="sm"
                disabled={!hasPrev}
                onClick={handlePrevPage}
              >
                <ChevronLeft className="size-4" />
              </IconButton>
              <IconButton
                aria-label="Próxima página"
                variant="ghost"
                size="sm"
                disabled={!hasNext}
                onClick={handleNextPage}
              >
                <ChevronRight className="size-4" />
              </IconButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail modal */}
      <Dialog open={Boolean(detailLog)} onOpenChange={(v) => !v && setDetailLog(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Detalhado</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {detailLog?.error_payload?.screenshot_url ? (
              <img
                src={detailLog.error_payload.screenshot_url}
                alt="Screenshot do erro"
                className="w-full rounded-md border border-border"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Sem screenshot</p>
            )}

            {detailLog?.error_payload && (
              <div className="flex flex-col gap-3">
                {(['step', 'bot_id', 'correlation_key'] as const).map((key) =>
                  detailLog.error_payload?.[key] ? (
                    <div key={key} className="flex flex-col gap-0.5">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{key}</span>
                      <span className="text-sm">{String(detailLog.error_payload[key])}</span>
                    </div>
                  ) : null
                )}

                {detailLog.error_payload.stacktrace && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Stacktrace</span>
                    <div className="max-h-60 overflow-auto rounded-md bg-neutral-900 p-4 text-neutral-100">
                      <pre className="m-0 whitespace-pre-wrap font-mono text-[11px]">
                        {detailLog.error_payload.stacktrace}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
