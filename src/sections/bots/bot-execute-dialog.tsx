import type { Bot } from 'src/types';

import { useState } from 'react';
import {
  Dialog,
  Button,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  LoadingButton,
  DialogDescription,
} from '@bhubai/bhub-design-system';

// ----------------------------------------------------------------------

interface Props {
  open: boolean;
  bot: Bot | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function BotExecuteDialog({ open, bot, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" style={{ maxWidth: '28rem' }}>
        <DialogHeader>
          <DialogTitle>Executar Bot</DialogTitle>
          <DialogDescription>
            Criar uma nova execução para <strong>{bot?.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          A execução entrará na fila como PENDING e será processada pela próxima máquina disponível
          com o bot <strong>{bot?.bot_id}</strong>.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <LoadingButton variant="success" onClick={handleConfirm} loading={loading} loadingText="Criando...">
            Confirmar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
