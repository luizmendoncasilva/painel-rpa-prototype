import { useMemo } from 'react';
import { useLocation } from 'react-router';

// ----------------------------------------------------------------------

export function usePathname(): string {
  const { pathname } = useLocation();

  return useMemo(() => pathname, [pathname]);
}
