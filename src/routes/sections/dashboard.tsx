import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const RelatoriosPage = lazy(() => import('src/pages/dashboard/relatorios'));
const ExecucoesPage = lazy(() => import('src/pages/dashboard/execucoes'));
const BotsPage = lazy(() => import('src/pages/dashboard/bots'));
const UsersPage = lazy(() => import('src/pages/dashboard/users'));
const AnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const CatalogoPage = lazy(() => import('src/pages/dashboard/catalogo'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <AuthGuard>
    <DashboardLayout>
      <SuspenseOutlet />
    </DashboardLayout>
  </AuthGuard>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: dashboardLayout(),
    children: [
      { element: <Navigate to="/dashboard/execucoes" replace />, index: true },
      { path: 'relatorios', element: <RelatoriosPage /> },
      { path: 'execucoes', element: <ExecucoesPage /> },
      { path: 'bots', element: <BotsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'catalogo', element: <CatalogoPage /> },
    ],
  },
];
