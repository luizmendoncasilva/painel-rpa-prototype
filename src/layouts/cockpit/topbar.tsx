import type { ReactNode } from 'react';

import { toast } from 'sonner';
import { useRef, useState, useEffect } from 'react';
import { LogOut, Search, Settings } from 'lucide-react';

import { useAuthContext } from 'src/auth/context';

// ----------------------------------------------------------------------
// Barra de topo do Cockpit (novo-chassi-v1): à esquerda onde você está; à
// direita o que vale em qualquer tela — buscar, perguntar (BSamurai) e você.
// ----------------------------------------------------------------------

const IconeNinja = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.6c-4.6 0-7.9 3.1-7.9 7.3v3.9c0 4.2 3.3 7.3 7.9 7.3s7.9-3.1 7.9-7.3v-3.9c0-4.2-3.3-7.3-7.9-7.3zM4.6 10.5h14.8v3.3H4.6z"
    />
    <circle cx="9.1" cy="12.15" r="1.15" />
    <circle cx="14.9" cy="12.15" r="1.15" />
  </svg>
);

function MenuUsuario() {
  const { user, signOut } = useAuthContext();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  const email = user?.email ?? '';
  const iniciais = (email.split('@')[0] || 'U')
    .split(/[._-]/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    const fechaAoClicarFora = (evento: MouseEvent) => {
      if (!caixa.current?.contains(evento.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechaAoClicarFora);
    return () => document.removeEventListener('mousedown', fechaAoClicarFora);
  }, []);

  const item =
    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted';

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((estava) => !estava)}
        className={`flex size-8 items-center justify-center rounded-full bg-[var(--cockpit-navy)] text-[11px] font-semibold text-[#F9F9F9] transition-opacity hover:opacity-90 ${
          aberto ? 'ring-2 ring-border' : ''
        }`}
        aria-label={email}
        title={email}
      >
        {iniciais}
      </button>

      {aberto && (
        <div className="absolute top-10 right-0 z-50 w-[240px] overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-lg">
          <div className="px-2 py-2">
            <p className="truncate text-sm leading-snug font-medium">{email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Painéis RPA</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              toast.info('Configurações — decorativo neste protótipo.');
            }}
            className={item}
          >
            <Settings size={15} className="text-muted-foreground" />
            Configurações
          </button>
          <button type="button" onClick={signOut} className={item}>
            <LogOut size={15} className="text-muted-foreground" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

export function CockpitTopbar({ tela, actions }: { tela: string; actions?: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-white px-6">
      <span className="text-sm font-medium">{tela}</span>

      <div className="ml-auto flex items-center gap-2">
        {actions && (
          <>
            {actions}
            <span className="mx-1 h-6 w-px bg-border" aria-hidden />
          </>
        )}

        <button
          type="button"
          aria-label="Buscar"
          title="Buscar"
          onClick={() => toast.info('Busca global — decorativa neste protótipo.')}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search size={16} />
        </button>

        <button
          type="button"
          onClick={() => toast.info('BSamurai — decorativo neste protótipo.')}
          className="rounded-full p-px transition-opacity hover:opacity-90"
          style={{ backgroundImage: 'linear-gradient(120deg, var(--coral-bold), #3f8dff)' }}
        >
          <span className="flex h-[30px] items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-medium">
            <IconeNinja size={14} />
            BSamurai
          </span>
        </button>

        <span className="mx-1 h-6 w-px bg-border" aria-hidden />

        <MenuUsuario />
      </div>
    </header>
  );
}
