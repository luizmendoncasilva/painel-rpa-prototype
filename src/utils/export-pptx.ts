import type { ReportData } from 'src/types';

import pptxgen from 'pptxgenjs';

import { fDate, today, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------
// Apresentação com o design da BHub (cores extraídas da logo oficial:
// verde escuro do corpo do robô e verde claro das folhas) — pensada como
// uma apresentação de resultados para stakeholders (narrativa, com
// destaques e leitura rápida), não como um relatório tabular impresso.
// ----------------------------------------------------------------------

const BRAND = {
  darkGreen: '01582E',
  darkGreen2: '024527',
  green: '4C8C2B',
  greenLight: '68A637',
  ink: '1A1A1A',
  gray: '637381',
  grayLight: 'F4F6F8',
  border: 'E3E6E8',
  white: 'FFFFFF',
  danger: 'DC2626',
  warning: 'D97706',
} as const;

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: BRAND.green,
  FAILED: BRAND.danger,
  PENDING: '9CA3AF',
  IN_PROGRESS: BRAND.warning,
};

const FONT = 'Arial';
const SLIDE_W = 10;
const SLIDE_H = 5.625;

export interface RelatorioFiltrosResumo {
  motor: string;
  rpa: string;
  status: string;
  origem: string;
  base: string;
  competencia: string;
  dateFrom: string;
  dateTo: string;
}

function formatPeriodo(f: RelatorioFiltrosResumo): string {
  if (!f.dateFrom && !f.dateTo) return 'todo o histórico';
  return `${f.dateFrom ? fDate(f.dateFrom) : '…'} a ${f.dateTo ? fDate(f.dateTo) : '…'}`;
}

function formatFiltrosLine(f: RelatorioFiltrosResumo): string {
  const parts = [
    f.motor && `Motor: ${f.motor}`,
    f.rpa && `RPA: ${f.rpa}`,
    f.status && `Status: ${f.status}`,
    f.origem && `Origem: ${f.origem}`,
    f.base && `Base: ${f.base}`,
    f.competencia && `Competência: ${f.competencia}`,
  ].filter(Boolean);
  const periodo = `Período: ${formatPeriodo(f)}`;
  return parts.length > 0 ? `${parts.join('  ·  ')}  ·  ${periodo}` : `Sem filtros aplicados  ·  ${periodo}`;
}

function buildExecutiveSummary(reportData: ReportData): string {
  const { total, successRate, totals, rpaData } = reportData;
  const completed = totals.COMPLETED ?? 0;
  const failed = totals.FAILED ?? 0;

  const performanceLine =
    successRate >= 90
      ? 'performance consistente e dentro da meta.'
      : successRate >= 75
        ? 'performance estável, com espaço para melhoria.'
        : 'performance abaixo do esperado — pede atenção da operação.';

  const sorted = [...rpaData].sort((a, b) => b.taxa - a.taxa);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const comparisonLine =
    rpaData.length > 1 && best && worst && best.rpa !== worst.rpa
      ? ` ${best.rpa} lidera com ${best.taxa}% de sucesso, enquanto ${worst.rpa} tem o menor índice (${worst.taxa}%).`
      : '';

  return (
    `No período analisado, foram registradas ${total} execuções, com ${successRate}% de taxa de sucesso — ` +
    `${performanceLine} Foram ${completed} execuções concluídas e ${failed} falhas identificadas.${comparisonLine}`
  );
}

function buildTaxaInsight(reportData: ReportData): string {
  const sorted = [...reportData.rpaData].sort((a, b) => b.taxa - a.taxa);
  const best = sorted[0];
  const abaixoDaMeta = reportData.rpaData.filter((d) => d.taxa < 95).length;
  if (!best) return '';
  return `${best.rpa} é o destaque do período, com ${best.taxa}% de sucesso. ${abaixoDaMeta} de ${reportData.rpaData.length} RPAs estão abaixo da meta de 95%.`;
}

function buildDistribuicaoInsight(reportData: ReportData): string {
  const { successRate, total } = reportData;
  return `${successRate}% das ${total} execuções do período terminaram em sucesso.`;
}

function buildTimelineInsight(reportData: ReportData): string {
  const data = reportData.timelineData;
  if (data.length < 2) return 'Volume de execuções ao longo do período.';
  const first = data[0];
  const last = data[data.length - 1];
  const firstTotal = first.COMPLETED + first.FAILED + first.PENDING + first.IN_PROGRESS;
  const lastTotal = last.COMPLETED + last.FAILED + last.PENDING + last.IN_PROGRESS;
  if (lastTotal === firstTotal) return 'Volume de execuções estável ao longo do período.';
  const trend = lastTotal > firstTotal ? 'crescimento' : 'queda';
  const pct = firstTotal > 0 ? Math.round((Math.abs(lastTotal - firstTotal) / firstTotal) * 100) : 0;
  return `${trend === 'crescimento' ? 'Crescimento' : 'Queda'} de ${pct}% no volume de execuções entre ${first.label} e ${last.label}.`;
}

function buildVolumeInsight(reportData: ReportData): string {
  const top = [...reportData.rpaData].sort((a, b) => b.total - a.total)[0];
  if (!top) return '';
  return `${top.rpa} concentra o maior volume do período, com ${top.total} execuções.`;
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addHeader(slide: pptxgen.Slide, title: string, logoData: string | null, insight?: string) {
  slide.background = { color: BRAND.white };
  slide.addShape('rect', { x: 0, y: 0, w: SLIDE_W, h: 0.08, fill: { color: BRAND.darkGreen } });
  slide.addText(title, {
    x: 0.4,
    y: 0.26,
    w: 7.8,
    h: 0.45,
    fontFace: FONT,
    fontSize: 20,
    bold: true,
    color: BRAND.ink,
  });
  if (logoData) {
    slide.addImage({ data: logoData, x: SLIDE_W - 1.05, y: 0.2, w: 0.55, h: 0.55 });
  }
  if (insight) {
    slide.addShape('rect', { x: 0.4, y: 0.76, w: 0.05, h: 0.34, fill: { color: BRAND.greenLight } });
    slide.addText(insight, {
      x: 0.58,
      y: 0.74,
      w: SLIDE_W - 1.4,
      h: 0.38,
      fontFace: FONT,
      fontSize: 11.5,
      italic: true,
      color: BRAND.gray,
      valign: 'middle',
    });
  }
  slide.addShape('line', {
    x: 0.4,
    y: insight ? 1.18 : 0.85,
    w: SLIDE_W - 0.8,
    h: 0,
    line: { color: BRAND.border, width: 1 },
  });
}

function addFooter(slide: pptxgen.Slide, pageLabel: string) {
  slide.addText('Painel RPA · BHub', {
    x: 0.4,
    y: SLIDE_H - 0.35,
    w: 4,
    h: 0.3,
    fontFace: FONT,
    fontSize: 9,
    color: BRAND.gray,
  });
  slide.addText(pageLabel, {
    x: SLIDE_W - 2.4,
    y: SLIDE_H - 0.35,
    w: 2,
    h: 0.3,
    align: 'right',
    fontFace: FONT,
    fontSize: 9,
    color: BRAND.gray,
  });
}

const CHART_Y = 1.35;
const CHART_H = SLIDE_H - 1.9;

// ----------------------------------------------------------------------

export async function exportReportToPptx(reportData: ReportData, filtros: RelatorioFiltrosResumo): Promise<void> {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'BHUB_16X9', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'BHUB_16X9';
  pptx.author = 'Painel RPA · BHub';
  pptx.title = 'Resultados de Execuções RPA';

  const logoData = await toDataUrl('/logo/logo-single.png');
  const generatedAt = fDateTime(new Date(), 'DD/MM/YYYY [às] HH:mm');

  // -- Slide 1: Capa -----------------------------------------------------
  const cover = pptx.addSlide();
  cover.background = { color: BRAND.darkGreen };

  // Composição decorativa — dois círculos concêntricos suaves no canto
  // superior direito, para a capa não ficar um bloco de cor liso.
  cover.addShape('ellipse', { x: 6.6, y: -2.2, w: 6.5, h: 6.5, fill: { color: BRAND.green, transparency: 78 } });
  cover.addShape('ellipse', { x: 7.6, y: -1.2, w: 4.2, h: 4.2, fill: { color: BRAND.greenLight, transparency: 80 } });
  cover.addShape('rect', { x: 0, y: SLIDE_H - 0.16, w: SLIDE_W, h: 0.16, fill: { color: BRAND.greenLight } });

  if (logoData) {
    cover.addImage({ data: logoData, x: 0.6, y: 0.55, w: 0.85, h: 0.85 });
  }

  cover.addText('APRESENTAÇÃO DE RESULTADOS', {
    x: 0.62,
    y: 1.95,
    w: SLIDE_W - 1.2,
    h: 0.35,
    fontFace: FONT,
    fontSize: 13,
    bold: true,
    charSpacing: 2,
    color: BRAND.greenLight,
  });
  cover.addText('Execuções RPA', {
    x: 0.6,
    y: 2.3,
    w: SLIDE_W - 1.2,
    h: 1,
    fontFace: FONT,
    fontSize: 40,
    bold: true,
    color: BRAND.white,
  });
  cover.addText(`Panorama operacional  ·  ${formatPeriodo(filtros)}`, {
    x: 0.62,
    y: 3.25,
    w: SLIDE_W - 1.2,
    h: 0.4,
    fontFace: FONT,
    fontSize: 14,
    color: BRAND.white,
  });

  cover.addText(`Gerado em ${generatedAt}  ·  ${formatFiltrosLine(filtros)}`, {
    x: 0.62,
    y: SLIDE_H - 0.62,
    w: SLIDE_W - 1.5,
    h: 0.3,
    fontFace: FONT,
    fontSize: 8.5,
    color: BRAND.greenLight,
  });

  // -- Slide 2: Resumo executivo -----------------------------------------
  const kpiSlide = pptx.addSlide();
  addHeader(kpiSlide, 'Resumo executivo', logoData);

  const cards: { label: string; value: string; color: string }[] = [
    { label: 'Total de execuções', value: String(reportData.total), color: BRAND.ink },
    { label: 'Taxa de sucesso', value: `${reportData.successRate}%`, color: BRAND.green },
    { label: 'Concluídas', value: String(reportData.totals.COMPLETED ?? 0), color: BRAND.green },
    { label: 'Falhas', value: String(reportData.totals.FAILED ?? 0), color: BRAND.danger },
  ];
  if ((reportData.totals.PENDING ?? 0) > 0) {
    cards.push({ label: 'Pendentes', value: String(reportData.totals.PENDING), color: BRAND.gray });
  }

  const cardY = 1.35;
  const cardW = (SLIDE_W - 0.8 - (cards.length - 1) * 0.25) / cards.length;
  cards.forEach((card, idx) => {
    const x = 0.4 + idx * (cardW + 0.25);
    kpiSlide.addShape('roundRect', {
      x,
      y: cardY,
      w: cardW,
      h: 1.4,
      rectRadius: 0.06,
      fill: { color: BRAND.grayLight },
      line: { color: BRAND.border, width: 1 },
    });
    kpiSlide.addShape('rect', { x, y: cardY, w: cardW, h: 0.06, fill: { color: card.color } });
    kpiSlide.addText(card.label.toUpperCase(), {
      x: x + 0.15,
      y: cardY + 0.16,
      w: cardW - 0.3,
      h: 0.4,
      fontFace: FONT,
      fontSize: 9,
      color: BRAND.gray,
      bold: true,
    });
    kpiSlide.addText(card.value, {
      x: x + 0.15,
      y: cardY + 0.48,
      w: cardW - 0.3,
      h: 0.75,
      fontFace: FONT,
      fontSize: 25,
      bold: true,
      color: card.color,
    });
  });

  const summaryY = cardY + 1.4 + 0.3;
  kpiSlide.addShape('roundRect', {
    x: 0.4,
    y: summaryY,
    w: SLIDE_W - 0.8,
    h: SLIDE_H - summaryY - 0.55,
    rectRadius: 0.06,
    fill: { color: BRAND.darkGreen },
    line: { type: 'none' },
  });
  kpiSlide.addShape('rect', { x: 0.4, y: summaryY, w: 0.06, h: SLIDE_H - summaryY - 0.55, fill: { color: BRAND.greenLight } });
  kpiSlide.addText('LEITURA DO PERÍODO', {
    x: 0.68,
    y: summaryY + 0.16,
    w: SLIDE_W - 1.3,
    h: 0.3,
    fontFace: FONT,
    fontSize: 10,
    bold: true,
    charSpacing: 1,
    color: BRAND.greenLight,
  });
  kpiSlide.addText(buildExecutiveSummary(reportData), {
    x: 0.68,
    y: summaryY + 0.48,
    w: SLIDE_W - 1.3,
    h: SLIDE_H - summaryY - 0.48 - 0.6,
    fontFace: FONT,
    fontSize: 13,
    color: BRAND.white,
    lineSpacing: 20,
    valign: 'top',
  });
  addFooter(kpiSlide, '2');

  // -- Slide 3: Taxa de sucesso por RPA ---------------------------------
  const taxaSlide = pptx.addSlide();
  addHeader(taxaSlide, 'Taxa de sucesso por RPA', logoData, buildTaxaInsight(reportData));
  taxaSlide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: 'Taxa de sucesso (%)',
        labels: reportData.rpaData.map((d) => d.rpa),
        values: reportData.rpaData.map((d) => d.taxa),
      },
    ],
    {
      x: 0.4,
      y: CHART_Y,
      w: SLIDE_W - 0.8,
      h: CHART_H,
      barDir: 'bar',
      chartColors: [BRAND.green],
      showValue: true,
      dataLabelColor: BRAND.ink,
      dataLabelPosition: 'outEnd',
      dataLabelFormatCode: '0"%"',
      valAxisMaxVal: 100,
      valAxisMinVal: 0,
      catAxisLabelFontSize: 10,
      valAxisLabelFontSize: 10,
      showLegend: false,
      showTitle: false,
    }
  );
  addFooter(taxaSlide, '3');

  // -- Slide 4: Distribuição por status ---------------------------------
  if (reportData.donutData.length > 0) {
    const donutSlide = pptx.addSlide();
    addHeader(donutSlide, 'Distribuição por status', logoData, buildDistribuicaoInsight(reportData));
    donutSlide.addChart(
      pptx.ChartType.doughnut,
      [
        {
          name: 'Status',
          labels: reportData.donutData.map((d) => d.name),
          values: reportData.donutData.map((d) => d.value),
        },
      ],
      {
        x: 1.7,
        y: CHART_Y,
        w: SLIDE_W - 3.4,
        h: CHART_H,
        chartColors: reportData.donutData.map((d) => STATUS_COLOR[d.status] ?? BRAND.gray),
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 11,
        showPercent: true,
        dataLabelColor: BRAND.white,
        dataLabelFontSize: 11,
      }
    );
    addFooter(donutSlide, '4');
  }

  // -- Slide 5: Execuções por mês ---------------------------------------
  if (reportData.timelineData.length > 0) {
    const timelineSlide = pptx.addSlide();
    addHeader(timelineSlide, 'Execuções por mês', logoData, buildTimelineInsight(reportData));
    timelineSlide.addChart(
      pptx.ChartType.area,
      [
        {
          name: 'Sucesso',
          labels: reportData.timelineData.map((d) => d.label),
          values: reportData.timelineData.map((d) => d.COMPLETED),
        },
        {
          name: 'Falha',
          labels: reportData.timelineData.map((d) => d.label),
          values: reportData.timelineData.map((d) => d.FAILED),
        },
      ],
      {
        x: 0.4,
        y: CHART_Y,
        w: SLIDE_W - 0.8,
        h: CHART_H,
        chartColors: [BRAND.green, BRAND.danger],
        chartColorsOpacity: 35,
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 11,
        catAxisLabelFontSize: 10,
        valAxisLabelFontSize: 10,
      }
    );
    addFooter(timelineSlide, '5');
  }

  // -- Slide 6: Volume por RPA -------------------------------------------
  const volumeSlide = pptx.addSlide();
  addHeader(volumeSlide, 'Volume de execuções por RPA', logoData, buildVolumeInsight(reportData));
  volumeSlide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: 'Sucesso',
        labels: reportData.rpaData.map((d) => d.rpa),
        values: reportData.rpaData.map((d) => d.COMPLETED),
      },
      {
        name: 'Falha',
        labels: reportData.rpaData.map((d) => d.rpa),
        values: reportData.rpaData.map((d) => d.FAILED),
      },
      {
        name: 'Pendente',
        labels: reportData.rpaData.map((d) => d.rpa),
        values: reportData.rpaData.map((d) => d.PENDING + d.IN_PROGRESS),
      },
    ],
    {
      x: 0.4,
      y: CHART_Y,
      w: SLIDE_W - 0.8,
      h: CHART_H,
      barDir: 'col',
      barGrouping: 'stacked',
      chartColors: [BRAND.green, BRAND.danger, '9CA3AF'],
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 11,
      catAxisLabelFontSize: 10,
      valAxisLabelFontSize: 10,
    }
  );
  addFooter(volumeSlide, '6');

  // -- Slide 7: Anexo — detalhamento por RPA ------------------------------
  const tableSlide = pptx.addSlide();
  addHeader(tableSlide, 'Anexo — detalhamento por RPA', logoData);

  const headerRow: pptxgen.TableRow = [
    'RPA',
    'Motor',
    'Sucesso',
    'Falha',
    'Pendente',
    'Total',
    'Taxa (%)',
  ].map((text) => ({
    text,
    options: { bold: true, color: BRAND.white, fill: { color: BRAND.darkGreen }, fontSize: 10 },
  }));

  const bodyRows: pptxgen.TableRow[] = reportData.rpaData.map((d, idx) => {
    const rowFill = { color: idx % 2 === 0 ? BRAND.white : BRAND.grayLight };
    const center: pptxgen.HAlign = 'center';
    const cells: pptxgen.TableCell[] = [
      { text: d.fullName, options: { fontSize: 9.5, fill: rowFill } },
      { text: d.motor, options: { fontSize: 9.5, fill: rowFill } },
      { text: String(d.COMPLETED), options: { fontSize: 9.5, color: BRAND.green, align: center, fill: rowFill } },
      { text: String(d.FAILED), options: { fontSize: 9.5, color: BRAND.danger, align: center, fill: rowFill } },
      { text: String(d.PENDING + d.IN_PROGRESS), options: { fontSize: 9.5, align: center, fill: rowFill } },
      { text: String(d.total), options: { fontSize: 9.5, align: center, bold: true, fill: rowFill } },
      { text: `${d.taxa}%`, options: { fontSize: 9.5, align: center, bold: true, fill: rowFill } },
    ];
    return cells;
  });

  tableSlide.addTable([headerRow, ...bodyRows], {
    x: 0.4,
    y: CHART_Y,
    w: SLIDE_W - 0.8,
    fontFace: FONT,
    border: { type: 'solid', color: BRAND.border, pt: 0.5 },
    autoPage: true,
    autoPageLineWeight: 0.5,
  });
  addFooter(tableSlide, '7');

  const filename = `apresentacao-rpa-${today('YYYY-MM-DD')}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
