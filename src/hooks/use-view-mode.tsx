import type { ReactNode } from 'react';

import { useState, useEffect, useContext, createContext } from 'react';

// ----------------------------------------------------------------------
// Nível de detalhe (Operação vs Interno) é uma preferência de sessão do
// usuário, não um estado por tela — por isso vive num context global em
// vez de duplicado em cada view (Catálogo e Painel usavam cada um o seu).
// ----------------------------------------------------------------------

export type ViewMode = 'operacao' | 'interno';

const STORAGE_KEY = 'rpa-dashboard-view-mode';

interface ViewModeContextValue {
  view: ViewMode;
  setView: (view: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

function readStoredView(): ViewMode {
  if (typeof window === 'undefined') return 'operacao';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'interno' ? 'interno' : 'operacao';
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewMode>(readStoredView);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, view);
  }, [view]);

  return <ViewModeContext.Provider value={{ view, setView }}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within a ViewModeProvider');
  return ctx;
}
