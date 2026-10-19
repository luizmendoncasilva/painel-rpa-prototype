import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { cn } from 'src/components/ui';

import { navData } from '../nav-config-dashboard';

// ----------------------------------------------------------------------
// Os painéis RPA, que antes eram itens da sidebar própria, viram abas dentro
// de "Painéis" no Cockpit. Cada aba continua sendo uma rota — link direto e
// botão de voltar do navegador seguem funcionando.
// ----------------------------------------------------------------------

export function PaineisTabs() {
  const pathname = usePathname();

  return (
    <div className="shrink-0 border-b border-border bg-white px-6">
      <nav aria-label="Painéis RPA" className="-mb-px flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none]">
        {navData.map((item) => {
          // Mesmas telas do /dashboard, servidas sob /proposta.
          const href = item.path.replace(paths.dashboard.root, paths.proposta.root);
          const active = pathname.startsWith(href);
          return (
            <RouterLink
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3 pt-3 pb-2.5 text-sm whitespace-nowrap transition-colors',
                active
                  ? 'border-coral-bold font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <item.icon size={15} />
              {item.title}
            </RouterLink>
          );
        })}
      </nav>
    </div>
  );
}
