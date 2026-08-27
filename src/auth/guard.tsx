import type { ReactNode } from 'react';

import { Navigate } from 'react-router';

import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from './context';

// ----------------------------------------------------------------------

export function AuthGuard({ children }: { children: ReactNode }) {
  const { loading, session } = useAuthContext();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth/sign-in" replace />;

  return children;
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const { loading, session } = useAuthContext();

  if (loading) return <LoadingScreen />;
  if (session) return <Navigate to="/dashboard/execucoes" replace />;

  return children;
}
