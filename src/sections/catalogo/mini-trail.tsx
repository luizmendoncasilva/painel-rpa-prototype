import type { TaskStatus, ProcessStage } from 'src/types';

import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui';

// ----------------------------------------------------------------------
// Trilha compacta — uma etapa = um bot. Mostra de relance em qual bot um
// caso quebrou, sem precisar abrir o detalhamento (pedido no modelo de
// referência trazido pelos stakeholders).
// ----------------------------------------------------------------------

const DOT_CLASS: Record<'ok' | 'fail' | 'idle', string> = {
  ok: 'border-success bg-success-subtle text-success-text',
  fail: 'border-destructive bg-destructive text-white',
  idle: 'border-border bg-background text-muted-foreground',
};

interface Props {
  stages: ProcessStage[];
  stageStatus: Record<string, TaskStatus | null>;
}

export function MiniTrail({ stages, stageStatus }: Props) {
  return (
    <span className="inline-flex items-center">
      {stages.map((stage, idx) => {
        const status = stageStatus[stage.queue];
        const kind = status === 'COMPLETED' ? 'ok' : status === 'FAILED' ? 'fail' : 'idle';
        const label =
          status === 'COMPLETED' ? 'concluído' : status === 'FAILED' ? 'quebrou aqui' : status ? 'em andamento' : 'não rodou';

        return (
          <span key={stage.queue} className="inline-flex items-center">
            {idx > 0 && <span className="h-px w-2.5 bg-border" />}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold',
                    DOT_CLASS[kind]
                  )}
                >
                  {idx + 1}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {stage.queue} — {stage.label}: {label}
              </TooltipContent>
            </Tooltip>
          </span>
        );
      })}
    </span>
  );
}
