import type { KpiCategory } from './kpi-catalog';

import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import {
  Bar,
  Pie,
  Cell,
  Area,
  XAxis,
  YAxis,
  Legend,
  BarChart,
  PieChart,
  AreaChart,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from 'recharts';

import { DashboardContent } from 'src/layouts/dashboard';

import {
  cn,
  Card,
  Alert,
  Badge,
  Button,
  CardTitle,
  IconButton,
  CardHeader,
  AlertTitle,
  CardContent,
  AlertDescription,
} from 'src/components/ui';

import { KpiCard } from './kpi-card';
import { KPI_CATALOG, CATEGORY_META, LAYOUT_PRESETS } from './kpi-catalog';

// ----------------------------------------------------------------------

const CATEGORY_ORDER: KpiCategory[] = ['volume', 'confiabilidade', 'eficiencia', 'governanca'];

const DONUT_DATA = [
  { name: 'Sucesso', value: 1122, color: 'var(--success-border)' },
  { name: 'Falha', value: 118, color: 'var(--destructive)' },
  { name: 'Pendente', value: 28, color: 'var(--color-neutral-400)' },
  { name: 'Em andamento', value: 16, color: 'var(--warning-border)' },
];

const VOLUME_DATA = [
  { label: 'jan', sucesso: 148, falha: 12 },
  { label: 'fev', sucesso: 162, falha: 18 },
  { label: 'mar', sucesso: 171, falha: 15 },
  { label: 'abr', sucesso: 189, falha: 21 },
  { label: 'mai', sucesso: 204, falha: 14 },
  { label: 'jun', sucesso: 248, falha: 38 },
];

// ----------------------------------------------------------------------

export function KpisPrototipoView() {
  const [layoutId, setLayoutId] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const layout = LAYOUT_PRESETS.find((p) => p.id === layoutId) ?? LAYOUT_PRESETS[0];
  const compact = layout.density === 'compact';

  return (
    <div className={cn(layout.dark && 'dark')}>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        <DashboardContent maxWidth="xl">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="text-2xl font-semibold">Protótipo de KPIs</h4>
              <p className="text-sm text-muted-foreground">
                Amostragem de indicadores para stakeholders — todos calculáveis com os dados que a API já expõe.
              </p>
            </div>
            <Badge variant="outline" className="gap-1.5">
              Estilo {layout.id} · {layout.name}
            </Badge>
          </div>

          <Alert variant="warning" className="mt-4 mb-6">
            <AlertTitle>Dados ilustrativos</AlertTitle>
            <AlertDescription>
              Os valores desta tela são fictícios, apenas para validar layout e conteúdo dos KPIs — não refletem
              execuções reais.
            </AlertDescription>
          </Alert>

          {CATEGORY_ORDER.map((category) => {
            const meta = CATEGORY_META[category];
            const items = KPI_CATALOG.filter((k) => k.category === category);

            return (
              <section key={category} className={cn(compact ? 'mb-6' : 'mb-8')}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h5 className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>{meta.label}</h5>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </div>

                <div className={cn('grid gap-3', layout.gridCols)}>
                  {items.map((kpi) => (
                    <KpiCard
                      key={kpi.id}
                      kpi={kpi}
                      density={layout.density}
                      accent={layout.accent}
                      padding={layout.cardPadding}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
            <Card padding={layout.cardPadding}>
              <CardHeader>
                <CardTitle>Tendência temporal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={compact ? 200 : 260}>
                  <AreaChart data={VOLUME_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="protoGradSucesso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success-border)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--success-border)" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="protoGradFalha" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <RTooltip />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="sucesso"
                      name="Sucesso"
                      stroke="var(--success-border)"
                      fill="url(#protoGradSucesso)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="falha"
                      name="Falha"
                      stroke="var(--destructive)"
                      fill="url(#protoGradFalha)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card padding={layout.cardPadding}>
              <CardHeader>
                <CardTitle>Desfecho do período</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={compact ? 200 : 260}>
                  <PieChart>
                    <Pie
                      data={DONUT_DATA}
                      cx="50%"
                      cy="45%"
                      innerRadius={compact ? 44 : 55}
                      outerRadius={compact ? 74 : 92}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {DONUT_DATA.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RTooltip />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card padding={layout.cardPadding} className="mt-6">
            <CardHeader>
              <CardTitle>Volume por mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={compact ? 200 : 260}>
                <BarChart data={VOLUME_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <RTooltip />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sucesso" name="Sucesso" stackId="a" fill="var(--success-border)" radius={[0, 0, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="falha" name="Falha" stackId="a" fill="var(--destructive)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </DashboardContent>

        {/* FAB — alterna entre os 5 estilos de layout */}
        <div className="fixed bottom-6 right-6 z-50">
          {pickerOpen && (
            <Card padding="sm" className="mb-2 w-64 shadow-xl">
              <CardHeader>
                <CardTitle className="text-sm">Estilo do protótipo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {LAYOUT_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={preset.id === layoutId ? 'default' : 'ghost'}
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => {
                      setLayoutId(preset.id);
                      setPickerOpen(false);
                    }}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px]">
                      {preset.id}
                    </span>
                    <span className="flex flex-col items-start">
                      <span className="text-xs font-semibold leading-tight">{preset.name}</span>
                      <span className="text-[11px] font-normal leading-tight opacity-70">{preset.subtitle}</span>
                    </span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <IconButton
            aria-label="Alternar estilo do layout"
            size="lg"
            className="size-14 rounded-full shadow-lg"
            onClick={() => setPickerOpen((prev) => !prev)}
          >
            <LayoutGrid className="size-5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
