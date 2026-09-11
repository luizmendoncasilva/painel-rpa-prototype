import type { ProcessoConfig } from 'src/types';

import { useState } from 'react';

import {
  Input,
  Label,
  Button,
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
} from 'src/components/ui';

// ----------------------------------------------------------------------

interface Props {
  open: boolean;
  processo: ProcessoConfig | null;
  onClose: () => void;
  onSave: (processoId: string, empresasElegiveis: number) => void;
}

export function EmpresasElegiveisDialog({ open, processo, onClose, onSave }: Props) {
  const [value, setValue] = useState(String(processo?.empresasElegiveis ?? 0));
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const parsed = parseInt(value, 10);
    if (!value || Number.isNaN(parsed) || parsed < 0) {
      setError('Informe um número válido (0 ou maior)');
      return;
    }
    if (!processo) return;
    onSave(processo.id, parsed);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Empresas elegíveis — {processo?.nome}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="empresas-elegiveis">Quantidade de empresas elegíveis</Label>
          <Input
            id="empresas-elegiveis"
            type="number"
            min={0}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <p className={error ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
            {error || 'Sem fonte automática no bhubot — a operação mantém esse número manualmente.'}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
