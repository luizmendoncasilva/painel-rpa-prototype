import { Bot, Users, Sparkles, BookOpen, BarChart3, ListChecks } from 'lucide-react';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export const navData = [
  {
    title: 'Execuções',
    path: paths.dashboard.execucoes,
    icon: ListChecks,
  },
  {
    title: 'Catálogo',
    path: paths.dashboard.catalogo,
    icon: BookOpen,
  },
  {
    title: 'Relatórios',
    path: paths.dashboard.relatorios,
    icon: BarChart3,
  },
  {
    title: 'Analytics',
    path: paths.dashboard.analytics,
    icon: Sparkles,
  },
  {
    title: 'Bots',
    path: paths.dashboard.bots,
    icon: Bot,
  },
  {
    title: 'Usuários',
    path: paths.dashboard.users,
    icon: Users,
  },
];
