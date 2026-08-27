import type { User, UserFormData } from 'src/types';

import { Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

import {
  Input,
  Label,
  Dialog,
  Button,
  IconButton,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  LoadingButton,
} from 'src/components/ui';

// ----------------------------------------------------------------------

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
}

export function UserFormDialog({ open, user, onClose, onSave }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(user);

  useEffect(() => {
    if (open) {
      setEmail(user?.email ?? '');
      setPassword('');
      setShowPassword(false);
    }
  }, [user, open]);

  const handleSubmit = async () => {
    const data: UserFormData = {};
    if (email) data.email = email;
    if (password) data.password = password;

    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const isValid = isEdit
    ? Boolean(email.trim() || password.trim())
    : Boolean(email.trim() && password.trim());

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-email">E-mail</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required={!isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">Deixe em branco para manter o atual</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-password">Senha</Label>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEdit}
                className="pr-10"
              />
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </IconButton>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEdit ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <LoadingButton loading={saving} disabled={saving || !isValid} onClick={handleSubmit}>
            Salvar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
