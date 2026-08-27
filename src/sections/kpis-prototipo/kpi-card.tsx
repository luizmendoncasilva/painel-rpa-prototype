import type { KpiDef } from './kpi-catalog';

import { Info, ArrowUp, ArrowDown } from 'lucide-react';

import {
  cn,
  Card,
  Icon,
  Tooltip,
  CardContent,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui';

// ----------------------------------------------------------------------

const TREND_CLASS: Record<NonNullable<KpiDef['trend']>, string> = {
  up: 'text-[var(--success-text)]',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
};

interface KpiCardProps {
  kpi: KpiDef;
}

export function KpiCard({ kpi }: KpiCardProps) {
  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {kpi.title}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Para que serve: ${kpi.title}`}
                className="shrink-0 text-muted-foreground/70 hover:text-foreground"
              >
                <Icon icon={Info} size="sm" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-pretty">{kpi.hint}</TooltipContent>
          </Tooltip>
        </div>

        <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{kpi.value}</span>

        {kpi.delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              kpi.trend ? TREND_CLASS[kpi.trend] : 'text-muted-foreground'
            )}
          >
            {kpi.trend === 'up' && <ArrowUp className="size-3" />}
            {kpi.trend === 'down' && <ArrowDown className="size-3" />}
            {kpi.delta}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
