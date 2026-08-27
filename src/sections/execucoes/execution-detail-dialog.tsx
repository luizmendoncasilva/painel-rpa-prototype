import type { TaskStatus, EnrichedTask } from 'src/types';

import { fDateTime } from 'src/utils/format-time';

import { RPA_CONFIG } from 'src/assets/data/rpa-config';

import {
  Badge,
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
} from 'src/components/ui';

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

function JsonBlock({ data }: { data: unknown }) {
  if (!data) return <span className="text-sm text-muted-foreground/70">—</span>;
  return (
    <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono text-xs">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-[140px] shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function formatCnpj(cnpj: string | null): string | null {
  if (!cnpj) return null;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
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
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
  return `${mins}m ${secs}s`;
}

// ----------------------------------------------------------------------

interface Props {
  task: EnrichedTask | null;
  onClose: () => void;
}

export function ExecutionDetailDialog({ task, onClose }: Props) {
  if (!task) return null;

  const rpaInfo = RPA_CONFIG[task.queue] ?? {
    name: task.queue,
    shortName: task.queue,
    motor: 'Desconhecido' as const,
    responsavel: '—',
  };

  const cnpj =
    (task.payload?.CNPJ as string | undefined) ??
    (task.payload?.variables as Record<string, string> | undefined)?.CNPJ ??
    (task.payload?.variables as Record<string, string> | undefined)?.cnpj ??
    null;

  const competencia =
    (task.payload?.competencia as string | undefined) ??
    (task.payload?.variables as Record<string, string> | undefined)?.competencia ??
    (task.payload?.variables as Record<string, string> | undefined)?.competence ??
    null;

  const empresa = (task.result?.razao_social as string | undefined) ?? null;
  const duracao = calcDuration(task.created_at, task.updated_at, task.status);

  return (
    <Dialog open={Boolean(task)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px]">
              {rpaInfo.motor}
            </Badge>
            <DialogTitle className="truncate">{rpaInfo.name}</DialogTitle>
          </div>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {task.correlation_key || task.task_id}
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Identificação */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-muted-foreground">Identificação</span>

            <InfoRow label="Task ID">
              <span className="font-mono text-xs">{task.task_id}</span>
            </InfoRow>

            <InfoRow label="Status">
              <Badge variant={STATUS_VARIANT[task.status] ?? 'secondary'}>
                {STATUS_LABEL_PT[task.status] ?? task.status}
              </Badge>
            </InfoRow>

            <InfoRow label="Fila">
              <Badge variant="outline" className="text-[11px]">
                {task.queue}
              </Badge>
            </InfoRow>

            {empresa && (
              <InfoRow label="Empresa">
                <span className="text-sm">{empresa}</span>
              </InfoRow>
            )}

            {cnpj && (
              <InfoRow label="CNPJ">
                <span className="text-sm">{formatCnpj(cnpj)}</span>
              </InfoRow>
            )}

            {competencia && (
              <InfoRow label="Competência">
                <span className="text-sm">{competencia}</span>
              </InfoRow>
            )}

            <InfoRow label="Responsável">
              <span className="text-sm">{rpaInfo.responsavel}</span>
            </InfoRow>

            <InfoRow label="Tentativas">
              <span className="text-sm">
                {task.attempt} / {task.max_attempts}
              </span>
            </InfoRow>

            <InfoRow label="Início">
              <span className="text-sm">{fDateTime(task.created_at)}</span>
            </InfoRow>

            <InfoRow label="Término">
              <span className="text-sm">{fDateTime(task.updated_at)}</span>
            </InfoRow>

            {duracao && (
              <InfoRow label="Duração">
                <span className="text-sm">{duracao}</span>
              </InfoRow>
            )}

            {task.worker_id && (
              <InfoRow label="Worker">
                <span className="font-mono text-xs">{task.worker_id}</span>
              </InfoRow>
            )}
          </div>

          <div className="border-t border-border" />

          {/* Payload */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">Payload</span>
            <JsonBlock data={task.payload} />
          </div>

          {/* Resultado */}
          {task.result && (
            <>
              <div className="border-t border-border" />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Resultado</span>
                <JsonBlock data={task.result} />
              </div>
            </>
          )}

          {/* Erro */}
          {task.error && (
            <>
              <div className="border-t border-border" />
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-destructive">Erro</span>
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <pre className="whitespace-pre-wrap break-all font-mono text-xs text-destructive">
                    {task.error}
                  </pre>
                </div>
              </div>
            </>
          )}

          {task.error_payload && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Detalhes do erro</span>
              <JsonBlock data={task.error_payload} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
