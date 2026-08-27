import { useMemo } from 'react';
import { useParams as _useParams } from 'react-router';

// ----------------------------------------------------------------------

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): Readonly<T> {
  const params = _useParams() as T;

  return useMemo(() => params, [params]);
}
