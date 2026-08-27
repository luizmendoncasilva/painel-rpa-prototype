import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';

import { LoadingScreen } from 'src/components/loading-screen';

import { GuestGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const SignInPage = lazy(() => import('src/pages/auth/sign-in'));

// ----------------------------------------------------------------------

export const authRoutes: RouteObject[] = [
  {
    path: 'auth/sign-in',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <GuestGuard>
          <SignInPage />
        </GuestGuard>
      </Suspense>
    ),
  },
];
