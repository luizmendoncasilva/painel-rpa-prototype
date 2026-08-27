import type { Bot, BotLoja, BotFormData } from 'src/types';

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

import {
  Badge,
  Input,
  Label,
  Button,
  Select,
  Dialog,
  Textarea,
  SelectItem,
  DialogTitle,
  SelectValue,
  DialogFooter,
  DialogHeader,
  DialogContent,
  SelectContent,
  SelectTrigger,
  LoadingButton,
} from 'src/components/ui';

// ----------------------------------------------------------------------

interface Props {
  open: boolean;
  bot: Bot | null;
  onClose: () => void;
  onSave: (data: BotFormData) => Promise<void>;
}

const DEFAULT_PAYLOAD = '{}';

function toPayloadText(payload: Record<string, unknown> | undefined): string {
  if (!payload || typeof payload !== 'object') return DEFAULT_PAYLOAD;
  const { lojas: _lojas, ...rest } = payload;
  return Object.keys(rest).length > 0 ? JSON.stringify(rest, null, 2) : DEFAULT_PAYLOAD;
}

// ----------------------------------------------------------------------

export function BotFormDialog({ open, bot, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [botId, setBotId] = useState('');
  const [description, setDescription] = useState('');
  const [machineId, setMachineId] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('3');
  const [priority, setPriority] = useState('0');
  const [triggeredBy, setTriggeredBy] = useState('schedule');
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [payloadError, setPayloadError] = useState('');
  const [saving, setSaving] = useState(false);

  const [lojas, setLojas] = useState<BotLoja[]>([]);
  const [lojaInput, setLojaInput] = useState('');
  const [lojaError, setLojaError] = useState('');

  useEffect(() => {
    if (open) {
      setName(bot?.name ?? '');
      setBotId(bot?.bot_id ?? '');
      setDescription(bot?.description ?? '');
      setMachineId(bot?.machine_id ?? '');
      setMaxAttempts(String(bot?.max_attempts ?? 3));
      setPriority(String(bot?.priority ?? 0));
      setTriggeredBy(bot?.triggered_by ?? 'schedule');
      setLojas(Array.isArray(bot?.payload?.lojas) ? (bot.payload.lojas as BotLoja[]) : []);
      setPayloadText(toPayloadText(bot?.payload));
      setPayloadError('');
      setLojaInput('');
      setLojaError('');
    }
  }, [bot, open]);

  const handleAddLoja = () => {
    const code = parseInt(lojaInput, 10);
    if (!lojaInput || Number.isNaN(code) || code <= 0) {
      setLojaError('Informe um código válido');
      return;
    }
    if (lojas.some((l) => l.loja === code)) {
      setLojaError('Loja já adicionada');
      return;
    }
    setLojas((prev) => [...prev, { loja: code, sped_checked: false }]);
    setLojaInput('');
    setLojaError('');
  };

  const handleRemoveLoja = (code: number) => {
    setLojas((prev) => prev.filter((l) => l.loja !== code));
  };

  const handlePayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPayloadText(e.target.value);
    setPayloadError('');
  };

  const handleSubmit = async () => {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      setPayloadError('JSON inválido — verifique a sintaxe');
      return;
    }

    if (lojas.length > 0) {
      payload.lojas = lojas;
    }

    setSaving(true);
    try {
      await onSave({
        name,
        bot_id: botId,
        description: description || undefined,
        machine_id: machineId || undefined,
        max_attempts: parseInt(maxAttempts, 10),
        priority: parseInt(priority, 10),
        triggered_by: triggeredBy,
        payload,
      });
    } finally {
      setSaving(false);
    }
  };

  const isValid = Boolean(
    name.trim() && botId.trim() && parseInt(maxAttempts, 10) >= 1 && parseInt(priority, 10) >= 0
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{bot ? 'Editar Bot' : 'Novo Bot'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bot-name">Nome</Label>
              <Input
                id="bot-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bot-id">Bot ID</Label>
              <Input
                id="bot-id"
                value={botId}
                onChange={(e) => setBotId(e.target.value)}
                required
                disabled={Boolean(bot)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {bot ? 'O Bot ID não pode ser alterado' : 'Ex: sulgoiano_bot'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bot-description">Descrição</Label>
            <Input
              id="bot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <hr className="border-border" />

          <p className="text-sm font-medium text-muted-foreground">Configuração de execução</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-[minmax(0,1fr)_140px_120px_120px]">
            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="bot-machine-id">Machine ID</Label>
              <Input
                id="bot-machine-id"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Deixe vazio para qualquer máquina</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Triggered by</Label>
              <Select value={triggeredBy} onValueChange={(v) => v && setTriggeredBy(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">schedule</SelectItem>
                  <SelectItem value="manual">manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bot-max-attempts">Max attempts</Label>
              <Input
                id="bot-max-attempts"
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bot-priority">Prioridade</Label>
              <Input
                id="bot-priority"
                type="number"
                min={0}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                required
              />
            </div>
          </div>

          <hr className="border-border" />

          <p className="text-sm font-medium text-muted-foreground">Lojas</p>

          <div className="flex items-start gap-2">
            <div className="flex w-45 flex-col gap-1.5">
              <Label htmlFor="loja-input">Código da loja</Label>
              <Input
                id="loja-input"
                type="number"
                min={1}
                value={lojaInput}
                onChange={(e) => { setLojaInput(e.target.value); setLojaError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLoja()}
              />
              <p className="min-h-4 text-xs text-destructive">{lojaError || ' '}</p>
            </div>
            <Button variant="outline" onClick={handleAddLoja} disabled={!lojaInput} className="mt-6">
              Adicionar
            </Button>
          </div>

          {lojas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lojas
                .slice()
                .sort((a, b) => a.loja - b.loja)
                .map((l) => (
                  <Badge key={l.loja} variant="secondary" className="gap-1">
                    Loja {l.loja}
                    <button
                      type="button"
                      aria-label={`Remover loja ${l.loja}`}
                      onClick={() => handleRemoveLoja(l.loja)}
                      className="inline-flex items-center rounded-full hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          )}

          <hr className="border-border" />

          <p className="text-sm font-medium text-muted-foreground">Payload (JSON)</p>

          <div className="flex flex-col gap-1.5">
            <Textarea
              value={payloadText}
              onChange={handlePayloadChange}
              rows={8}
              className="font-mono text-[13px]"
            />
            <p className={payloadError ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
              {payloadError || 'Credenciais e configurações do bot em formato JSON (lojas são gerenciadas acima)'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <LoadingButton onClick={handleSubmit} loading={saving} loadingText="Salvando..." disabled={!isValid}>
            Salvar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
