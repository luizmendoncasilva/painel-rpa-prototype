import type { ReactNode } from 'react';

import { useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { ViewModeProvider } from 'src/hooks/use-view-mode';

import { ViewModeSwitch } from 'src/components/view-mode-switch';

import { CockpitTopbar } from './topbar';
import { CockpitSidebar } from './sidebar';
import { PaineisTabs } from './paineis-tabs';

// ----------------------------------------------------------------------
// Chassi do Cockpit (novo-chassi-v1, BHubAI/prototype-cockpit-evolucoes):
// sidebar azul-marinho e, ao lado, o cartão branco com cantos arredondados —
// folga em cima, embaixo e à direita, nenhuma à esquerda. Sem a sidebar
// própria do painel: os painéis RPA viram abas logo abaixo da topbar.
// ----------------------------------------------------------------------

const VIEW_MODE_ROUTES = ['/proposta/catalogo', '/proposta/painel'];

export function CockpitLayout({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const showViewModeSwitch = VIEW_MODE_ROUTES.some((route) => pathname.startsWith(route));

  // O delta de tema do Cockpit (global.css, `html.cockpit`) vai no <html> e não
  // num wrapper: dialogs, selects e popovers renderizam em portal no <body>.
  useEffect(() => {
    document.documentElement.classList.add('cockpit');
    return () => document.documentElement.classList.remove('cockpit');
  }, []);

  return (
    <ViewModeProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--cockpit-navy)]">
        <CockpitSidebar />
        <div className="flex min-w-0 flex-1 py-2 pr-2">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-white">
            <CockpitTopbar tela="Painéis" actions={showViewModeSwitch ? <ViewModeSwitch /> : undefined} />
            <PaineisTabs />
            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-muted/30">{children}</main>
          </div>
        </div>
      </div>
    </ViewModeProvider>
  );
}
