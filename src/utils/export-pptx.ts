import type { ReportData } from 'src/types';

import pptxgen from 'pptxgenjs';

import { fDate, today, fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------
// Apresentação com o design da BHub (cores extraídas da logo oficial:
// verde escuro do corpo do robô e verde claro das folhas) — usada para
// levar um relatório gerado no Painel para uma reunião sem precisar
// printar a tela.
// ----------------------------------------------------------------------

const BRAND = {
  darkGreen: '01582E',
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

function formatFiltros(f: RelatorioFiltrosResumo): string {
  const periodo =
    f.dateFrom || f.dateTo
      ? `${f.dateFrom ? fDate(f.dateFrom) : '…'} – ${f.dateTo ? fDate(f.dateTo) : '…'}`
      : 'Todo o histórico';

  return [
    `Motor: ${f.motor || 'Todos'}`,
    `RPA: ${f.rpa || 'Todos'}`,
    `Status: ${f.status || 'Todos'}`,
    `Origem: ${f.origem || 'Todas'}`,
    `Base: ${f.base || 'Todas'}`,
    `Competência: ${f.competencia || 'Todas'}`,
    `Período: ${periodo}`,
  ].join('   ·   ');
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

function addHeader(slide: pptxgen.Slide, title: string, logoData: string | null) {
  slide.background = { color: BRAND.white };
  slide.addShape('rect', { x: 0, y: 0, w: SLIDE_W, h: 0.08, fill: { color: BRAND.darkGreen } });
  slide.addText(title, {
    x: 0.4,
    y: 0.28,
    w: 7.5,
    h: 0.5,
    fontFace: FONT,
    fontSize: 20,
    bold: true,
    color: BRAND.ink,
  });
  if (logoData) {
    slide.addImage({ data: logoData, x: SLIDE_W - 1.1, y: 0.22, w: 0.6, h: 0.6 });
  }
  slide.addShape('line', {
    x: 0.4,
    y: 0.85,
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

// ----------------------------------------------------------------------

export async function exportReportToPptx(reportData: ReportData, filtros: RelatorioFiltrosResumo): Promise<void> {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'BHUB_16X9', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'BHUB_16X9';
  pptx.author = 'Painel RPA · BHub';
  pptx.title = 'Relatório de Execuções RPA';

  const logoData = await toDataUrl('/logo/logo-single.png');
  const generatedAt = fDateTime(new Date(), 'DD/MM/YYYY [às] HH:mm');

  // -- Slide 1: Capa --------------------------------------------------
  const cover = pptx.addSlide();
  cover.background = { color: BRAND.darkGreen };
  cover.addShape('rect', {
    x: 0,
    y: SLIDE_H - 0.18,
    w: SLIDE_W,
    h: 0.18,
    fill: { color: BRAND.greenLight },
  });
  if (logoData) {
    cover.addImage({ data: logoData, x: 0.6, y: 0.6, w: 1, h: 1 });
  }
  cover.addText('Relatório de Execuções RPA', {
    x: 0.6,
    y: 2.2,
    w: SLIDE_W - 1.2,
    h: 0.9,
    fontFace: FONT,
    fontSize: 34,
    bold: true,
    color: BRAND.white,
  });
  cover.addText(`Gerado em ${generatedAt}`, {
    x: 0.6,
    y: 3.05,
    w: SLIDE_W - 1.2,
    h: 0.4,
    fontFace: FONT,
    fontSize: 13,
    color: BRAND.greenLight,
  });
  cover.addText(formatFiltros(filtros), {
    x: 0.6,
    y: 3.95,
    w: SLIDE_W - 1.2,
    h: 1,
    fontFace: FONT,
    fontSize: 11,
    color: BRAND.white,
    fill: { color: '024527' },
    align: 'left',
    valign: 'middle',
    margin: 12,
  });

  // -- Slide 2: KPIs ----------------------------------------------------
  const kpiSlide = pptx.addSlide();
  addHeader(kpiSlide, 'Resumo do período', logoData);

  const cards: { label: string; value: string; color: string }[] = [
    { label: 'Total de execuções', value: String(reportData.total), color: BRAND.ink },
    { label: 'Taxa de sucesso', value: `${reportData.successRate}%`, color: BRAND.green },
    { label: 'Concluídas', value: String(reportData.totals.COMPLETED ?? 0), color: BRAND.green },
    { label: 'Falhas', value: String(reportData.totals.FAILED ?? 0), color: BRAND.danger },
  ];
  if ((reportData.totals.PENDING ?? 0) > 0) {
    cards.push({ label: 'Pendentes', value: String(reportData.totals.PENDING), color: BRAND.gray });
  }

  const cardW = (SLIDE_W - 0.8 - (cards.length - 1) * 0.25) / cards.length;
  cards.forEach((card, idx) => {
    const x = 0.4 + idx * (cardW + 0.25);
    kpiSlide.addShape('roundRect', {
      x,
      y: 1.15,
      w: cardW,
      h: 1.5,
      rectRadius: 0.06,
      fill: { color: BRAND.grayLight },
      line: { color: BRAND.border, width: 1 },
    });
    kpiSlide.addShape('rect', { x, y: 1.15, w: cardW, h: 0.06, fill: { color: card.color } });
    kpiSlide.addText(card.label.toUpperCase(), {
      x: x + 0.15,
      y: 1.32,
      w: cardW - 0.3,
      h: 0.4,
      fontFace: FONT,
      fontSize: 9,
      color: BRAND.gray,
      bold: true,
    });
    kpiSlide.addText(card.value, {
      x: x + 0.15,
      y: 1.65,
      w: cardW - 0.3,
      h: 0.8,
      fontFace: FONT,
      fontSize: 26,
      bold: true,
      color: card.color,
    });
  });

  kpiSlide.addText('Filtros aplicados', {
    x: 0.4,
    y: 3.05,
    w: SLIDE_W - 0.8,
    h: 0.3,
    fontFace: FONT,
    fontSize: 11,
    bold: true,
    color: BRAND.ink,
  });
  kpiSlide.addText(formatFiltros(filtros), {
    x: 0.4,
    y: 3.4,
    w: SLIDE_W - 0.8,
    h: 1.3,
    fontFace: FONT,
    fontSize: 10.5,
    color: BRAND.gray,
    fill: { color: BRAND.grayLight },
    valign: 'middle',
    margin: 10,
  });
  addFooter(kpiSlide, '2');

  // -- Slide 3: Taxa de sucesso por RPA ---------------------------------
  const taxaSlide = pptx.addSlide();
  addHeader(taxaSlide, 'Taxa de sucesso por RPA', logoData);
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
      y: 1.05,
      w: SLIDE_W - 0.8,
      h: SLIDE_H - 1.6,
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
    addHeader(donutSlide, 'Distribuição por status', logoData);
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
        y: 1.05,
        w: SLIDE_W - 3.4,
        h: SLIDE_H - 1.6,
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
    addHeader(timelineSlide, 'Execuções por mês', logoData);
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
        y: 1.05,
        w: SLIDE_W - 0.8,
        h: SLIDE_H - 1.6,
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
  addHeader(volumeSlide, 'Volume de execuções por RPA', logoData);
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
      y: 1.05,
      w: SLIDE_W - 0.8,
      h: SLIDE_H - 1.6,
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

  // -- Slide 7: Tabela detalhada -----------------------------------------
  const tableSlide = pptx.addSlide();
  addHeader(tableSlide, 'Detalhamento por RPA', logoData);

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
    y: 1.05,
    w: SLIDE_W - 0.8,
    fontFace: FONT,
    border: { type: 'solid', color: BRAND.border, pt: 0.5 },
    autoPage: true,
    autoPageLineWeight: 0.5,
  });
  addFooter(tableSlide, '7');

  const filename = `relatorio-rpa-${today('YYYY-MM-DD')}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
