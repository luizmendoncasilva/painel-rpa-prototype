import type { ReactNode } from 'react';

import { Navigate, useLocation, useSearchParams } from 'react-router';

import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from './context';

// ----------------------------------------------------------------------

export function AuthGuard({ children }: { children: ReactNode }) {
  const { loading, session } = useAuthContext();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!session) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/sign-in?returnTo=${returnTo}`} replace />;
  }

  return children;
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const { loading, session } = useAuthContext();
  const [searchParams] = useSearchParams();

  if (loading) return <LoadingScreen />;
  if (session) return <Navigate to={safeReturnTo(searchParams.get('returnTo'))} replace />;

  return children;
}

// ----------------------------------------------------------------------

/** Só aceita caminhos internos do painel — nunca uma URL externa. */
export function safeReturnTo(returnTo: string | null) {
  if (returnTo && /^\/(dashboard|proposta)(\/|$|\?)/.test(returnTo)) return returnTo;
  return '/dashboard/execucoes';
}
