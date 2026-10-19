import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CockpitLayout } from 'src/layouts/cockpit/layout';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------
// /proposta — as mesmas telas do /dashboard dentro do chassi do Cockpit.
// ----------------------------------------------------------------------

const RelatoriosPage = lazy(() => import('src/pages/dashboard/relatorios'));
const ExecucoesPage = lazy(() => import('src/pages/dashboard/execucoes'));
const BotsPage = lazy(() => import('src/pages/dashboard/bots'));
const UsersPage = lazy(() => import('src/pages/dashboard/users'));
const PainelPage = lazy(() => import('src/pages/dashboard/painel'));
const CatalogoPage = lazy(() => import('src/pages/dashboard/catalogo'));
const ProcessosPage = lazy(() => import('src/pages/dashboard/processos'));
const EspecificacaoPage = lazy(() => import('src/pages/dashboard/especificacao'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const propostaLayout = () => (
  <AuthGuard>
    <CockpitLayout>
      <SuspenseOutlet />
    </CockpitLayout>
  </AuthGuard>
);

export const propostaRoutes: RouteObject[] = [
  {
    path: 'proposta',
    element: propostaLayout(),
    children: [
      { element: <Navigate to="/proposta/execucoes" replace />, index: true },
      { path: 'relatorios', element: <RelatoriosPage /> },
      { path: 'execucoes', element: <ExecucoesPage /> },
      { path: 'bots', element: <BotsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'painel', element: <PainelPage /> },
      { path: 'catalogo', element: <CatalogoPage /> },
      { path: 'processos', element: <ProcessosPage /> },
      { path: 'especificacao', element: <EspecificacaoPage /> },
    ],
  },
];
