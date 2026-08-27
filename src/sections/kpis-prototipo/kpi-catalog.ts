import { PROCESSOS } from 'src/assets/data/processos';

// ----------------------------------------------------------------------
// Catálogo de KPIs — dados ILUSTRATIVOS para prototipagem de layout.
// Cada item representa um indicador que já é calculável com os dados
// hoje expostos pela API (tasks, execution_logs, bots). Ver CLAUDE.md.
// "Empresas elegíveis" e "Processos catalogados" são computados a partir
// do catálogo de RPAs (src/assets/data/processos.ts).
// ----------------------------------------------------------------------

const TOTAL_EMPRESAS_ELEGIVEIS = PROCESSOS.reduce((sum, p) => sum + p.empresasElegiveis, 0);
const TOTAL_PROCESSOS_MULTI_ETAPA = PROCESSOS.filter((p) => p.stages.length > 1).length;

export type KpiCategory = 'volume' | 'confiabilidade' | 'eficiencia' | 'governanca';
export type KpiTrend = 'up' | 'down' | 'neutral';

export interface KpiDef {
  id: string;
  category: KpiCategory;
  title: string;
  hint: string;
  value: string;
  delta?: string;
  trend?: KpiTrend;
}

export const CATEGORY_META: Record<KpiCategory, { label: string; description: string }> = {
  volume: {
    label: 'Volume',
    description: 'Quanto a operação está processando.',
  },
  confiabilidade: {
    label: 'Confiabilidade',
    description: 'O quanto dá para confiar no que os robôs entregam.',
  },
  eficiencia: {
    label: 'Eficiência',
    description: 'Velocidade e saúde da execução.',
  },
  governanca: {
    label: 'Governança',
    description: 'Cadastro e cobertura da frota de robôs.',
  },
};

export const KPI_CATALOG: KpiDef[] = [
  // Volume ------------------------------------------------------------
  {
    id: 'total-execucoes',
    category: 'volume',
    title: 'Total de execuções',
    hint: 'Quantidade total de tasks processadas no período selecionado, somando todos os status (sucesso, falha, pendente, em andamento).',
    value: '1.284',
    delta: '+6,2% vs. mês anterior',
    trend: 'up',
  },
  {
    id: 'execucoes-por-motor',
    category: 'volume',
    title: 'Execuções por motor',
    hint: 'Distribui o volume de execuções entre os dois motores de automação do ecossistema: Fiscal e Departamento Pessoal (DP).',
    value: '812 / 472',
    delta: 'Fiscal / DP',
    trend: 'neutral',
  },
  {
    id: 'execucoes-por-origem',
    category: 'volume',
    title: 'Execuções por origem',
    hint: 'Separa o que foi disparado automaticamente pela rotina diária (schedule) do que foi acionado manualmente ou é apenas teste.',
    value: '91%',
    delta: 'via rotina automática',
    trend: 'neutral',
  },
  {
    id: 'backlog-atual',
    category: 'volume',
    title: 'Backlog atual',
    hint: 'Soma de tarefas pendentes (PENDING) e em andamento (IN_PROGRESS) neste momento — o que ainda está na fila para ser processado.',
    value: '37',
    delta: '-12 vs. ontem',
    trend: 'up',
  },

  // Confiabilidade ------------------------------------------------------
  {
    id: 'taxa-sucesso-geral',
    category: 'confiabilidade',
    title: 'Taxa de sucesso geral',
    hint: 'Percentual de execuções concluídas com sucesso sobre o total de execuções já finalizadas (sucesso + falha) no período.',
    value: '87,4%',
    delta: '+2,1 p.p.',
    trend: 'up',
  },
  {
    id: 'taxa-sucesso-por-rpa',
    category: 'confiabilidade',
    title: 'Taxa de sucesso por RPA',
    hint: 'Mesmo cálculo da taxa de sucesso geral, mas quebrado por robô — evidencia quais RPAs estão mais instáveis e precisam de atenção.',
    value: '12 robôs',
    delta: '3 abaixo de 80%',
    trend: 'down',
  },
  {
    id: 'falhas-recentes',
    category: 'confiabilidade',
    title: 'Falhas recentes',
    hint: 'Lista as últimas execuções que terminaram em erro, com mensagem e horário, para investigação e resposta rápida.',
    value: '9',
    delta: 'nas últimas 24h',
    trend: 'down',
  },
  {
    id: 'top-erros',
    category: 'confiabilidade',
    title: 'Top erros (tipo de exceção)',
    hint: 'Agrupa as falhas pelo tipo de exceção (exception_type) para identificar o problema mais recorrente e priorizar a correção.',
    value: 'Timeout',
    delta: '38% das falhas',
    trend: 'down',
  },
  {
    id: 'esgotamento-tentativas',
    category: 'confiabilidade',
    title: 'Esgotamento de tentativas',
    hint: 'Percentual de execuções que falharam mesmo depois de usar todas as tentativas permitidas (attempt = max_attempts) — falha "definitiva".',
    value: '4,1%',
    delta: 'do total de falhas',
    trend: 'neutral',
  },
  {
    id: 'cobertura-lojas',
    category: 'confiabilidade',
    title: 'Cobertura de lojas',
    hint: 'Para robôs que processam múltiplas lojas, mostra quantas lojas foram concluídas com sucesso versus quantas falharam no mês.',
    value: '94%',
    delta: 'lojas concluídas',
    trend: 'up',
  },
  {
    id: 'sucesso-parcial',
    category: 'confiabilidade',
    title: 'Sucesso parcial em processos multi-etapa',
    hint: 'Para processos formados por mais de um bot (ex.: emissão + entrega), mostra quantos casos tiveram uma etapa com sucesso e outra com falha — nem sucesso completo, nem falha total.',
    value: `${TOTAL_PROCESSOS_MULTI_ETAPA}`,
    delta: 'processos com etapas encadeadas',
    trend: 'neutral',
  },

  // Eficiência ----------------------------------------------------------
  {
    id: 'duracao-media',
    category: 'eficiencia',
    title: 'Duração média de execução',
    hint: 'Tempo médio entre o início e o fim de uma execução, geral ou por robô — indica o ganho de eficiência trazido pela automação.',
    value: '6m 42s',
    delta: '-38s vs. mês anterior',
    trend: 'up',
  },
  {
    id: 'execucoes-travadas',
    category: 'eficiencia',
    title: 'Execuções travadas',
    hint: 'Tarefas em andamento cujo prazo de execução (lease_expires_at) já venceu — sinal de robô travado ou máquina indisponível.',
    value: '2',
    delta: 'requer intervenção',
    trend: 'down',
  },
  {
    id: 'tendencia-temporal',
    category: 'eficiencia',
    title: 'Tendência temporal',
    hint: 'Evolução das execuções (sucesso vs. falha) ao longo dos dias ou meses — mostra se a operação está melhorando ou piorando.',
    value: 'Ver gráfico',
    delta: '6 meses de histórico',
    trend: 'neutral',
  },

  // Governança ------------------------------------------------------------
  {
    id: 'bots-cadastrados',
    category: 'governanca',
    title: 'Bots cadastrados',
    hint: 'Total de robôs cadastrados no painel, com credenciais e payload prontos para serem disparados.',
    value: '24',
    delta: '+2 este mês',
    trend: 'up',
  },
  {
    id: 'bots-rotina-ativa',
    category: 'governanca',
    title: 'Bots com rotina diária ativa',
    hint: 'Quantos bots têm o disparo automático diário (triggered_by = schedule) ligado, em vez de dependerem de acionamento manual.',
    value: '19 / 24',
    delta: '79% da frota',
    trend: 'neutral',
  },
  {
    id: 'bots-silenciosos',
    category: 'governanca',
    title: 'Bots silenciosos',
    hint: 'Bots cadastrados que não tiveram nenhuma execução recente — pode indicar um bot esquecido, mal configurado ou quebrado.',
    value: '3',
    delta: 'sem execução há 30+ dias',
    trend: 'down',
  },
  {
    id: 'execucoes-por-maquina',
    category: 'governanca',
    title: 'Execuções por máquina',
    hint: 'Distribui as execuções entre as máquinas Windows que rodam os robôs — ajuda a balancear carga e localizar a máquina com problema.',
    value: '6',
    delta: 'máquinas ativas',
    trend: 'neutral',
  },
  {
    id: 'distribuicao-prioridade',
    category: 'governanca',
    title: 'Distribuição por prioridade',
    hint: 'Mostra quantos bots estão configurados em cada nível de prioridade — usado como padrão ao disparar uma execução manual.',
    value: '3',
    delta: 'níveis em uso',
    trend: 'neutral',
  },
  {
    id: 'processos-catalogados',
    category: 'governanca',
    title: 'Processos de negócio catalogados',
    hint: 'Total de processos de RPA documentados no Catálogo — o glossário que explica o que cada robô faz, pedido para dar contexto a quem não acompanha o dia a dia técnico.',
    value: `${PROCESSOS.length}`,
    delta: 'no catálogo hoje',
    trend: 'neutral',
  },
  {
    id: 'empresas-elegiveis',
    category: 'governanca',
    title: 'Empresas elegíveis',
    hint: 'Soma de empresas atendidas por todos os processos automatizados — mostra o alcance real do RPA, não só o volume de execuções.',
    value: `${TOTAL_EMPRESAS_ELEGIVEIS}`,
    delta: 'somando todos os processos',
    trend: 'up',
  },
];

// ----------------------------------------------------------------------
// Presets de layout — todos construídos só com tokens e componentes do
// src/components/ui (Card, Badge, Popover...). "dark" alterna o
// tema nativo do DS; densidade/cor mudam classes utilitárias e variantes.
// ----------------------------------------------------------------------

export type Density = 'compact' | 'comfortable';
export type AccentVariant = 'success' | 'info' | 'warning' | 'secondary' | 'default';

export interface LayoutPreset {
  id: number;
  name: string;
  subtitle: string;
  dark: boolean;
  density: Density;
  accent: AccentVariant;
  gridCols: string;
  cardPadding: 'sm' | 'md' | 'lg';
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 1,
    name: 'Fechamento',
    subtitle: 'Foco no mês: o que entrou, o que falta.',
    dark: false,
    density: 'comfortable',
    accent: 'success',
    gridCols: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
    cardPadding: 'lg',
  },
  {
    id: 2,
    name: 'Torre de Controle',
    subtitle: 'Denso, leitura rápida do agora.',
    dark: false,
    density: 'compact',
    accent: 'info',
    gridCols: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6',
    cardPadding: 'sm',
  },
  {
    id: 3,
    name: 'Funil do Processo',
    subtitle: 'Onde as execuções entram e onde travam.',
    dark: false,
    density: 'comfortable',
    accent: 'info',
    gridCols: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
    cardPadding: 'md',
  },
  {
    id: 4,
    name: 'Carteira de Clientes',
    subtitle: 'Planilha viva, pensada por cliente.',
    dark: false,
    density: 'comfortable',
    accent: 'secondary',
    gridCols: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
    cardPadding: 'md',
  },
  {
    id: 5,
    name: 'Executivo',
    subtitle: 'Uma página: entregou, e o que isso vale.',
    dark: false,
    density: 'compact',
    accent: 'default',
    gridCols: 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-6',
    cardPadding: 'sm',
  },
];
