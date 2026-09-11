import { PROCESSOS } from 'src/assets/data/processos';

// ----------------------------------------------------------------------
// Catálogo de KPIs — dados ILUSTRATIVOS para prototipagem de layout.
// Organizado por PROCESSO (não por categoria de frota): pedido do
// Guilherme em 03/set — métricas de frota geral (bots cadastrados,
// execução por máquina, distribuição por prioridade etc.) não fazem
// sentido fora dos bots de SPED, então cada processo mostra só os
// indicadores que fazem sentido para ele.
// "Empresas elegíveis" usa o valor real do catálogo de processos
// (src/assets/data/processos.ts); os demais valores são fictícios.
// ----------------------------------------------------------------------

export type KpiTrend = 'up' | 'down' | 'neutral';

export interface KpiDef {
  id: string;
  title: string;
  hint: string;
  value: string;
  delta?: string;
  trend?: KpiTrend;
}

function empresasElegiveisKpi(processoId: string): KpiDef {
  const processo = PROCESSOS.find((p) => p.id === processoId);
  return {
    id: 'empresas-elegiveis',
    title: 'Empresas elegíveis',
    hint: 'Quantidade de empresas atendidas por este processo — campo mantido manualmente no catálogo de processos, não vem do bhubot.',
    value: `${processo?.empresasElegiveis ?? 0}`,
    delta: 'cadastradas no catálogo',
    trend: 'neutral',
  };
}

export const KPI_CATALOG_BY_PROCESSO: Record<string, KpiDef[]> = {
  'iss-sp': [
    {
      id: 'execucoes-periodo',
      title: 'Execuções no período',
      hint: 'Quantidade total de tasks processadas pelas etapas deste processo no período selecionado.',
      value: '412',
      delta: '+18 vs. mês anterior',
      trend: 'up',
    },
    {
      id: 'taxa-sucesso',
      title: 'Taxa de sucesso',
      hint: 'Percentual de execuções concluídas com sucesso sobre o total já finalizado (sucesso + falha).',
      value: '91,2%',
      delta: '+1,4 p.p.',
      trend: 'up',
    },
    {
      id: 'falhas-recentes',
      title: 'Falhas recentes',
      hint: 'Execuções que terminaram em erro nas últimas 24h.',
      value: '4',
      delta: 'nas últimas 24h',
      trend: 'down',
    },
    {
      id: 'duracao-media',
      title: 'Duração média',
      hint: 'Tempo médio entre início e fim de uma execução deste processo.',
      value: '5m 10s',
      delta: '-20s vs. mês anterior',
      trend: 'up',
    },
    empresasElegiveisKpi('iss-sp'),
  ],
  'gestta-upload': [
    {
      id: 'execucoes-periodo',
      title: 'Execuções no período',
      hint: 'Quantidade total de tasks de upload no Gestta processadas no período selecionado.',
      value: '176',
      delta: '+11 vs. mês anterior',
      trend: 'up',
    },
    {
      id: 'taxa-sucesso',
      title: 'Taxa de sucesso',
      hint: 'Percentual de execuções concluídas com sucesso sobre o total já finalizado (sucesso + falha).',
      value: '89,7%',
      delta: '-0,8 p.p.',
      trend: 'down',
    },
    {
      id: 'falhas-recentes',
      title: 'Falhas recentes',
      hint: 'Execuções que terminaram em erro nas últimas 24h.',
      value: '3',
      delta: 'nas últimas 24h',
      trend: 'down',
    },
    {
      id: 'duracao-media',
      title: 'Duração média',
      hint: 'Tempo médio entre início e fim de uma execução de upload no Gestta.',
      value: '2m 15s',
      delta: '+6s vs. mês anterior',
      trend: 'neutral',
    },
    empresasElegiveisKpi('gestta-upload'),
  ],
  'iss-sp-ultrafast': [
    {
      id: 'execucoes-periodo',
      title: 'Execuções no período',
      hint: 'Quantidade total de tasks processadas pela esteira ultrafast no período selecionado.',
      value: '96',
      delta: '+5 vs. mês anterior',
      trend: 'up',
    },
    {
      id: 'taxa-sucesso',
      title: 'Taxa de sucesso',
      hint: 'Percentual de execuções concluídas com sucesso sobre o total já finalizado (sucesso + falha).',
      value: '95,8%',
      delta: '+0,6 p.p.',
      trend: 'up',
    },
    {
      id: 'falhas-recentes',
      title: 'Falhas recentes',
      hint: 'Execuções que terminaram em erro nas últimas 24h.',
      value: '1',
      delta: 'nas últimas 24h',
      trend: 'neutral',
    },
    {
      id: 'duracao-media',
      title: 'Duração média',
      hint: 'Tempo médio entre início e fim de uma execução — esteira dedicada a competências com prazo apertado.',
      value: '2m 40s',
      delta: '-8s vs. mês anterior',
      trend: 'up',
    },
    empresasElegiveisKpi('iss-sp-ultrafast'),
  ],
  'fgts-digital': [
    {
      id: 'execucoes-periodo',
      title: 'Execuções no período',
      hint: 'Quantidade total de tasks de emissão da guia do FGTS Digital no período selecionado.',
      value: '210',
      delta: '+9 vs. mês anterior',
      trend: 'up',
    },
    {
      id: 'taxa-sucesso',
      title: 'Taxa de sucesso',
      hint: 'Percentual de execuções concluídas com sucesso sobre o total já finalizado (sucesso + falha).',
      value: '88,5%',
      delta: '-1,1 p.p.',
      trend: 'down',
    },
    {
      id: 'falhas-recentes',
      title: 'Falhas recentes',
      hint: 'Execuções que terminaram em erro nas últimas 24h.',
      value: '3',
      delta: 'nas últimas 24h',
      trend: 'down',
    },
    {
      id: 'duracao-media',
      title: 'Duração média',
      hint: 'Tempo médio entre início e fim de uma execução de emissão da guia.',
      value: '4m 05s',
      delta: '+12s vs. mês anterior',
      trend: 'down',
    },
    empresasElegiveisKpi('fgts-digital'),
  ],
  'dp-admissao': [
    {
      id: 'execucoes-periodo',
      title: 'Execuções no período',
      hint: 'Quantidade total de tasks de cadastro de admissão no período selecionado.',
      value: '134',
      delta: '+6 vs. mês anterior',
      trend: 'up',
    },
    {
      id: 'taxa-sucesso',
      title: 'Taxa de sucesso',
      hint: 'Percentual de execuções concluídas com sucesso sobre o total já finalizado (sucesso + falha).',
      value: '92,1%',
      delta: '+2,0 p.p.',
      trend: 'up',
    },
    {
      id: 'falhas-recentes',
      title: 'Falhas recentes',
      hint: 'Execuções que terminaram em erro nas últimas 24h.',
      value: '2',
      delta: 'nas últimas 24h',
      trend: 'neutral',
    },
    {
      id: 'duracao-media',
      title: 'Duração média',
      hint: 'Tempo médio entre início e fim de uma execução de cadastro de admissão.',
      value: '3m 20s',
      delta: '-5s vs. mês anterior',
      trend: 'up',
    },
    empresasElegiveisKpi('dp-admissao'),
  ],
  'sped-agrocontar': [
    {
      id: 'execucoes-periodo',
      title: 'Execuções no período',
      hint: 'Quantidade total de tasks de geração e envio do SPED no período selecionado.',
      value: '58',
      delta: '+2 vs. mês anterior',
      trend: 'up',
    },
    {
      id: 'taxa-sucesso',
      title: 'Taxa de sucesso',
      hint: 'Percentual de execuções concluídas com sucesso sobre o total já finalizado (sucesso + falha).',
      value: '84,3%',
      delta: '-3,2 p.p.',
      trend: 'down',
    },
    {
      id: 'falhas-recentes',
      title: 'Falhas recentes',
      hint: 'Execuções que terminaram em erro nas últimas 24h.',
      value: '2',
      delta: 'nas últimas 24h',
      trend: 'down',
    },
    {
      id: 'duracao-media',
      title: 'Duração média',
      hint: 'Tempo médio entre início e fim de uma execução de geração e envio do SPED.',
      value: '7m 45s',
      delta: '+40s vs. mês anterior',
      trend: 'down',
    },
    empresasElegiveisKpi('sped-agrocontar'),
  ],
};
