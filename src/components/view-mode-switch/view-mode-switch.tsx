import { useViewMode } from 'src/hooks/use-view-mode';

import { Button } from 'src/components/ui';

// ----------------------------------------------------------------------

export function ViewModeSwitch() {
  const { view, setView } = useViewMode();

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[11px] text-muted-foreground sm:inline">Nível de detalhe:</span>
      <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
        <Button
          size="sm"
          variant={view === 'operacao' ? 'default' : 'ghost'}
          className="h-7 px-3 text-xs"
          onClick={() => setView('operacao')}
        >
          Operação
        </Button>
        <Button
          size="sm"
          variant={view === 'interno' ? 'default' : 'ghost'}
          className="h-7 px-3 text-xs"
          onClick={() => setView('interno')}
        >
          Interno · detalhe
        </Button>
      </div>
    </div>
  );
}
