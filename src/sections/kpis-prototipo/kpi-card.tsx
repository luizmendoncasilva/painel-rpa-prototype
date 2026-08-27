import type { KpiDef, Density, AccentVariant } from './kpi-catalog';

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

const ACCENT_BAR_CLASS: Record<AccentVariant, string> = {
  success: 'bg-[var(--success-border)]',
  info: 'bg-[var(--info-border)]',
  warning: 'bg-[var(--warning-border)]',
  secondary: 'bg-[var(--color-neutral-400)]',
  default: 'bg-foreground',
};

interface KpiCardProps {
  kpi: KpiDef;
  density: Density;
  accent: AccentVariant;
  padding: 'sm' | 'md' | 'lg';
}

export function KpiCard({ kpi, density, accent, padding }: KpiCardProps) {
  const compact = density === 'compact';

  return (
    <Card padding={padding} className="relative min-w-0 overflow-hidden">
      <span className={cn('absolute inset-y-0 left-0 w-1', ACCENT_BAR_CLASS[accent])} />

      <CardContent className="flex flex-col gap-1.5 pl-2">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'truncate font-semibold uppercase tracking-wide text-muted-foreground',
              compact ? 'text-[10px]' : 'text-xs'
            )}
          >
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

        <span
          className={cn(
            'font-semibold tracking-tight tabular-nums text-foreground',
            compact ? 'text-xl' : 'text-3xl'
          )}
        >
          {kpi.value}
        </span>

        {kpi.delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1',
              compact ? 'text-[11px]' : 'text-xs',
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
