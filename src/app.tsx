import 'src/global.css';

import type { ReactNode } from 'react';

import { useEffect } from 'react';
import { Toaster } from '@bhubai/bhub-design-system';

import { usePathname } from 'src/routes/hooks';

import { ProgressBar } from 'src/components/progress-bar';

import { AuthProvider } from 'src/auth/context';

// ----------------------------------------------------------------------

export default function App({ children }: { children: ReactNode }) {
  useScrollToTop();

  return (
    <AuthProvider>
      <ProgressBar />
      <Toaster position="top-right" richColors />
      {children}
    </AuthProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
