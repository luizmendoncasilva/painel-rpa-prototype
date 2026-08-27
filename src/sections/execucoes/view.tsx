import type { Task, TaskStatus, EnrichedTask } from 'src/types';

import { useRef, useMemo, useState, useEffect } from 'react';
import { X, Search, ArrowUp, ArrowDown, RefreshCw, ChevronLeft, ArrowUpDown, ChevronRight } from 'lucide-react';

import { fDateTime } from 'src/utils/format-time';

import axios, { endpoints } from 'src/lib/axios';
import { RPA_CONFIG } from 'src/assets/data/rpa-config';
import { DashboardContent } from 'src/layouts/dashboard';

import {
  cn,
  Card,
  Alert,
  Badge,
  Empty,
  Input,
  Table,
  Button,
  Select,
  Tooltip,
  Spinner,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  AlertTitle,
  IconButton,
  SelectItem,
  SelectValue,
  TableHeader,
  SelectContent,
  SelectTrigger,
  TooltipContent,
  TooltipTrigger,
  AlertDescription,
} from 'src/components/ui';

import { ExecutionDetailDialog } from './execution-detail-dialog';

// ----------------------------------------------------------------------

const STATUS_VARIANT: Record<TaskStatus, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  COMPLETED: 'success',
  FAILED: 'destructive',
  IN_PROGRESS: 'warning',
  PENDING: 'secondary',
};

const STATUS_LABEL_PT: Record<TaskStatus, string> = {
  COMPLETED: 'Sucesso',
  FAILED: 'Falha',
  IN_PROGRESS: 'Em andamento',
  PENDING: 'Pendente',
};

const PAGE_LIMIT = 100;

// ----------------------------------------------------------------------

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

function extractEmpresa(task: Task): string {
  if (task.result?.razao_social) return task.result.razao_social as string;
  const cnpj = extractCnpj(task.payload);
  if (!cnpj) return '—';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
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

function calcDuration(
  created_at: string,
  updated_at: string,
  status: TaskStatus
): string | null {
  if (status === 'PENDING' || !updated_at || !created_at) return null;
  const diff = new Date(updated_at).getTime() - new Date(created_at).getTime();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m ${secs}s`;
}

function formatCnpj(cnpj: string | null): string | null {
  if (!cnpj) return null;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Queues that belong to each motor, derived from config
function getMotorQueues(motor: string): string[] {
  return Object.entries(RPA_CONFIG)
    .filter(([, info]) => info.motor === motor)
    .map(([queue]) => queue);
}

// ----------------------------------------------------------------------

interface SortableHeaderProps {
  label: string;
  column: keyof EnrichedTask;
  orderBy: keyof EnrichedTask;
  order: 'asc' | 'desc';
  onSort: (col: keyof EnrichedTask) => void;
  align?: 'left' | 'center';
}

function SortableHeader({ label, column, orderBy, order, onSort, align = 'left' }: SortableHeaderProps) {
  const active = orderBy === column;
  const Icon = active ? (order === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 font-medium hover:text-foreground ${
        active ? 'text-foreground' : 'text-muted-foreground'
      } ${align === 'center' ? 'justify-center w-full' : ''}`}
    >
      {label}
      <Icon className="size-3.5" />
    </button>
  );
}

interface TruncatedCellProps {
  text: string;
  className?: string;
}

function TruncatedCell({ text, className }: TruncatedCellProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('block max-w-full truncate', className)}>{text}</span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

// ----------------------------------------------------------------------

export function ExecucoesView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCapped, setIsCapped] = useState(false);

  // Server-side filters (status + queue/rpa)
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRpa, setFilterRpa] = useState('');

  // Client-side filters applied after load
  const [filterMotor, setFilterMotor] = useState('');
  const [filterOrigem, setFilterOrigem] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Search with debounce: searchInput is the live value, search triggers fetch
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Pagination (only active when no client-side filters)
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const pageNumber = cursorHistory.length + 1;

  const [orderBy, setOrderBy] = useState<keyof EnrichedTask>('updated_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);

  // Whether any client-side filter is active (requires loading full dataset)
  const needsAll = Boolean(search || filterMotor || filterOrigem || filterDateFrom || filterDateTo);

  // Stable ref for values used inside the async fetch
  const filtersRef = useRef({ filterStatus, filterRpa, filterMotor, needsAll, filterDateFrom, filterDateTo });
  filtersRef.current = { filterStatus, filterRpa, filterMotor, needsAll, filterDateFrom, filterDateTo };

  const doFetch = async (fetchCursor?: string) => {
    setLoading(true);
    setFetchError(null);
    setIsCapped(false);

    const { filterStatus: status, filterRpa: rpa, filterMotor: motor, needsAll: all } = filtersRef.current;
    const { filterDateFrom: dateFrom, filterDateTo: dateTo } = filtersRef.current;

    try {
      if (motor && !rpa && all) {
        // Motor filter without specific RPA: parallel calls per motor queue
        const queues = getMotorQueues(motor);
        const results = await Promise.all(
          queues.map((q) =>
            axios.get(endpoints.tasks.list, {
              params: {
                queue: q,
                ...(status && { status }),
                ...(dateFrom && { updated_at_from: dateFrom }),
                ...(dateTo && { updated_at_to: `${dateTo}T23:59:59` }),
                all: 'true',
              },
            })
          )
        );
        const merged = results.flatMap((r) => (r.data.items as Task[]) ?? []);
        const motorCapped = results.some((r) => Boolean(r.data.capped));
        setTasks(merged);
        setIsCapped(motorCapped);
        setNextCursor(null);
        setCursor(undefined);
        setCursorHistory([]);
      } else if (all) {
        // Any other client-side filter: fetch all with server-side filters
        const params: Record<string, string> = { all: 'true' };
        if (status) params.status = status;
        if (rpa) params.queue = rpa;
        if (dateFrom) params.updated_at_from = dateFrom;
        if (dateTo) params.updated_at_to = `${dateTo}T23:59:59`;
        const res = await axios.get(endpoints.tasks.list, { params });
        setTasks((res.data.items as Task[]) ?? []);
        setIsCapped(Boolean(res.data.capped));
        setNextCursor(null);
        setCursor(undefined);
        setCursorHistory([]);
      } else {
        // No client-side filters: paginated mode
        const params: Record<string, string | number> = { limit: PAGE_LIMIT };
        if (status) params.status = status;
        if (rpa) params.queue = rpa;
        if (fetchCursor) params.cursor = fetchCursor;
        const res = await axios.get(endpoints.tasks.list, { params });
        setTasks((res.data.items as Task[]) ?? []);
        setNextCursor(res.data.next_cursor ?? null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar execuções.';
      setFetchError(message || 'Erro ao carregar execuções. Verifique a conexão com a API.');
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever any filter dependency changes (server or client)
  useEffect(() => {
    setCursor(undefined);
    setNextCursor(null);
    setCursorHistory([]);
    doFetch(undefined);
     
  }, [filterStatus, filterRpa, filterMotor, search, filterOrigem, filterDateFrom, filterDateTo]);

  const handleNextPage = () => {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, cursor ?? '']);
    setCursor(nextCursor);
    doFetch(nextCursor);
  };

  const handlePrevPage = () => {
    if (cursorHistory.length === 0) return;
    const prev = [...cursorHistory];
    const prevCursor = prev.pop() || undefined;
    setCursorHistory(prev);
    setCursor(prevCursor);
    doFetch(prevCursor);
  };

  const handleSort = (col: keyof EnrichedTask) => {
    setOrder((prev) => (orderBy === col && prev === 'asc' ? 'desc' : 'asc'));
    setOrderBy(col);
  };

  const enrichedTasks = useMemo<EnrichedTask[]>(
    () =>
      tasks.map((task) => ({
        ...task,
        _rpa: getRpaInfo(task.queue),
        _cnpj: extractCnpj(task.payload),
        _competencia: extractCompetencia(task.payload),
        _empresa: extractEmpresa(task),
        _duracao: calcDuration(task.created_at, task.updated_at, task.status),
        _origem: extractOrigem(task),
      })),
    [tasks]
  );

  // RPA options always from config (independent of current page)
  const availableRpas = useMemo(
    () =>
      Object.entries(RPA_CONFIG)
        .filter(([, info]) => !filterMotor || info.motor === filterMotor)
        .map(([queue, info]) => ({ queue, name: info.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [filterMotor]
  );

  const availableOrigens = useMemo(
    () => [...new Set(enrichedTasks.map((t) => t._origem))].sort(),
    [enrichedTasks]
  );

  const filtered = useMemo(() => {
    let result = enrichedTasks;
    // Motor filter only needed client-side when no RPA selected (RPA already filters server-side)
    if (filterMotor && !filterRpa) result = result.filter((t) => t._rpa.motor === filterMotor);
    if (filterOrigem) result = result.filter((t) => t._origem === filterOrigem);
    if (filterDateFrom) result = result.filter((t) => t.updated_at >= filterDateFrom);
    if (filterDateTo) result = result.filter((t) => t.updated_at <= `${filterDateTo}T23:59:59`);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t._empresa.toLowerCase().includes(q) ||
          (t._cnpj ?? '').includes(q.replace(/\D/g, '')) ||
          t._rpa.name.toLowerCase().includes(q) ||
          t.task_id.toLowerCase().includes(q) ||
          (t.correlation_key ?? '').toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const aVal = String(a[orderBy] ?? '');
      const bVal = String(b[orderBy] ?? '');
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [enrichedTasks, filterMotor, filterRpa, filterOrigem, filterDateFrom, filterDateTo, search, orderBy, order]);

  const hasFilters = Boolean(
    search || filterMotor || filterRpa || filterStatus || filterOrigem || filterDateFrom || filterDateTo
  );

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setFilterMotor('');
    setFilterRpa('');
    setFilterStatus('');
    setFilterOrigem('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <DashboardContent maxWidth="xl">
      <h4 className="mb-6 text-2xl font-semibold">Execuções</h4>

      {fetchError && (
        <Alert variant="destructive" className="relative mb-4 pr-10">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
          <IconButton
            aria-label="Fechar alerta"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={() => setFetchError(null)}
          >
            <X className="size-4" />
          </IconButton>
        </Alert>
      )}

      {isCapped && !loading && (
        <Alert variant="warning" className="relative mb-4 pr-10">
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Exibindo os primeiros 5.000 registros. Selecione um status ou RPA para ver o conjunto completo.
          </AlertDescription>
          <IconButton
            aria-label="Fechar alerta"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
            onClick={() => setIsCapped(false)}
          >
            <X className="size-4" />
          </IconButton>
        </Alert>
      )}

      <Card padding="none" className="min-w-0">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5 px-4 pt-4 pb-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa, CNPJ, task ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filterMotor}
            onValueChange={(v: string) => {
              setFilterMotor(v);
              setFilterRpa('');
            }}
          >
            <SelectTrigger className="w-[104px] shrink-0">
              <SelectValue placeholder="Motor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fiscal">Fiscal</SelectItem>
              <SelectItem value="DP">DP</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRpa} onValueChange={(v: string) => setFilterRpa(v)}>
            <SelectTrigger className="w-[104px] shrink-0 sm:w-[180px]">
              <SelectValue placeholder="RPA" />
            </SelectTrigger>
            <SelectContent>
              {availableRpas.map((r) => (
                <SelectItem key={r.queue} value={r.queue}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v: string) => setFilterStatus(v)}>
            <SelectTrigger className="w-[104px] shrink-0 sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">Sucesso</SelectItem>
              <SelectItem value="FAILED">Falha</SelectItem>
              <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterOrigem} onValueChange={(v: string) => setFilterOrigem(v)}>
            <SelectTrigger className="w-[104px] shrink-0 sm:w-[140px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              {availableOrigens.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-[140px] shrink-0"
            aria-label="De"
          />

          <Input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-[140px] shrink-0"
            aria-label="Até"
          />

          {hasFilters && (
            <Button size="sm" variant="outline" onClick={handleClearFilters}>
              Limpar
            </Button>
          )}
        </div>

        {/* Tabela */}
        <div className="min-w-0 max-h-[600px] overflow-auto border-t border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="w-[92px] min-w-0 px-3">
                  <SortableHeader label="Status" column="status" orderBy={orderBy} order={order} onSort={handleSort} />
                </TableHead>
                <TableHead className="w-[64px] min-w-0 px-3">Motor</TableHead>
                <TableHead className="w-[170px] min-w-0 px-3">
                  <SortableHeader label="RPA" column="queue" orderBy={orderBy} order={order} onSort={handleSort} />
                </TableHead>
                <TableHead className="w-[160px] min-w-0 px-3">Empresa / Cliente</TableHead>
                <TableHead className="w-[120px] min-w-0 px-3">CNPJ</TableHead>
                <TableHead className="w-[84px] min-w-0 px-3">Competência</TableHead>
                <TableHead className="w-[72px] min-w-0 px-3">Duração</TableHead>
                <TableHead className="w-[144px] min-w-0 px-3">
                  <SortableHeader
                    label="Data / Hora"
                    column="updated_at"
                    orderBy={orderBy}
                    order={order}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="w-[64px] min-w-0 px-3 text-center">
                  <SortableHeader
                    label="Tent."
                    column="attempt"
                    orderBy={orderBy}
                    order={order}
                    onSort={handleSort}
                    align="center"
                  />
                </TableHead>
                <TableHead className="w-[100px] min-w-0 px-3">Origem</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size="lg" />
                      {needsAll && (
                        <span className="text-xs text-muted-foreground">Buscando em todos os registros…</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-16">
                    <Empty
                      title="Nenhuma execução encontrada."
                      description={
                        hasFilters
                          ? 'Nenhuma execução encontrada para os filtros aplicados.'
                          : 'Nenhuma execução encontrada.'
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((task) => (
                  <TableRow
                    key={task.task_id}
                    onClick={() => setSelectedTask(task)}
                    className="cursor-pointer"
                  >
                    <TableCell className="w-[92px] px-3">
                      <Badge variant={STATUS_VARIANT[task.status] ?? 'secondary'}>
                        {STATUS_LABEL_PT[task.status] ?? task.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="w-[64px] px-3">
                      <Badge variant="outline" className="text-[10px]">
                        {task._rpa.motor}
                      </Badge>
                    </TableCell>

                    <TableCell className="w-[170px] px-3">
                      <TruncatedCell text={task._rpa.name} className="text-xs" />
                    </TableCell>

                    <TableCell className="w-[160px] px-3">
                      <TruncatedCell text={task._empresa} className="text-xs" />
                    </TableCell>

                    <TableCell className="w-[120px] px-3">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatCnpj(task._cnpj) ?? '—'}
                      </span>
                    </TableCell>

                    <TableCell className="w-[84px] px-3">
                      <span className="text-sm text-muted-foreground">{task._competencia ?? '—'}</span>
                    </TableCell>

                    <TableCell className="w-[72px] px-3">
                      <span className="text-sm text-muted-foreground">{task._duracao ?? '—'}</span>
                    </TableCell>

                    <TableCell className="w-[144px] px-3">
                      <span className="text-[11px] text-muted-foreground">{fDateTime(task.updated_at)}</span>
                    </TableCell>

                    <TableCell className="w-[64px] px-3 text-center">
                      <span
                        className={cn(
                          'text-sm',
                          task.attempt >= task.max_attempts && task.status === 'FAILED'
                            ? 'text-destructive'
                            : 'text-foreground'
                        )}
                      >
                        {task.attempt}/{task.max_attempts}
                      </span>
                    </TableCell>

                    <TableCell className="w-[100px] px-3">
                      <TruncatedCell
                        text={task._origem}
                        className="rounded-full border border-border px-2.5 py-0.5 text-center text-[10px] font-medium"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer: contagem + paginação */}
        {!loading && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {needsAll
                ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''} (de ${enrichedTasks.length} carregados)`
                : `${enrichedTasks.length} execuções — página ${pageNumber}`}
            </span>

            {!needsAll && (
              <div className="flex items-center gap-1">
                <IconButton
                  aria-label="Página anterior"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={cursorHistory.length === 0}
                >
                  <ChevronLeft className="size-4" />
                </IconButton>

                <span className="px-1 text-xs text-muted-foreground">{pageNumber}</span>

                <IconButton
                  aria-label="Próxima página"
                  variant="ghost"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!nextCursor}
                >
                  <ChevronRight className="size-4" />
                </IconButton>

                <IconButton
                  aria-label="Recarregar"
                  variant="ghost"
                  size="sm"
                  className="ml-1"
                  onClick={() => doFetch(cursor)}
                >
                  <RefreshCw className="size-4" />
                </IconButton>
              </div>
            )}

            {needsAll && (
              <IconButton aria-label="Recarregar" variant="ghost" size="sm" onClick={() => doFetch(undefined)}>
                <RefreshCw className="size-4" />
              </IconButton>
            )}
          </div>
        )}
      </Card>

      <ExecutionDetailDialog task={selectedTask} onClose={() => setSelectedTask(null)} />
    </DashboardContent>
  );
}
