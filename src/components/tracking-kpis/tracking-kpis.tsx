import type { TrackingKpis } from 'src/assets/data/processos';

import { Card, CardContent } from 'src/components/ui';

// ----------------------------------------------------------------------
// Faixa de KPIs de acompanhamento — Processos monitorados / Êxitos /
// Falhas / Taxa de êxito / Tempo de robô. Usada no Catálogo e no Painel
// para dar a mesma leitura rápida do modelo trazido pelos stakeholders.
// ----------------------------------------------------------------------

const META_TAXA_EXITO = 95;

interface Props {
  kpis: TrackingKpis;
  totalProcessos: number;
}

export function TrackingKpiStrip({ kpis, totalProcessos }: Props) {
  const metaOk = kpis.rate >= META_TAXA_EXITO;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card padding="sm">
        <CardContent className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Processos monitorados
          </span>
          <span className="text-2xl font-bold tracking-tight">{kpis.processos}</span>
          <span className="text-xs text-muted-foreground">de {totalProcessos} no filtro atual</span>
        </CardContent>
      </Card>

      <Card padding="sm" className="border-t-2 border-t-success">
        <CardContent className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Êxitos</span>
          <span className="text-2xl font-bold tracking-tight text-[var(--success-text)]">{kpis.ok}</span>
          <span className="text-xs text-muted-foreground">processos concluídos ponta a ponta</span>
        </CardContent>
      </Card>

      <Card padding="sm" className="border-t-2 border-t-destructive">
        <CardContent className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Falhas</span>
          <span className="text-2xl font-bold tracking-tight text-destructive">{kpis.fail}</span>
          <span className="text-xs text-muted-foreground">aguardando tratativa ou reprocesso</span>
        </CardContent>
      </Card>

      <Card padding="sm" className={metaOk ? 'border-t-2 border-t-success' : 'border-t-2 border-t-destructive'}>
        <CardContent className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Taxa de êxito
          </span>
          <span
            className={`text-2xl font-bold tracking-tight ${metaOk ? 'text-[var(--success-text)]' : 'text-destructive'}`}
          >
            {kpis.rate}%
          </span>
          <span className="text-xs text-muted-foreground">meta interna: {META_TAXA_EXITO}%</span>
        </CardContent>
      </Card>

      <Card padding="sm" className="border-t-2 border-t-info">
        <CardContent className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Tempo de robô
          </span>
          <span className="text-2xl font-bold tracking-tight text-[var(--info-text)]">{kpis.horasRobo}h</span>
          <span className="text-xs text-muted-foreground">equivalente de trabalho manual evitado</span>
        </CardContent>
      </Card>
    </div>
  );
}
