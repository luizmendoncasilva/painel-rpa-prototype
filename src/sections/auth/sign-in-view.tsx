import type { FormEvent } from 'react';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';

import { CONFIG } from 'src/global-config';

import {
  Card,
  Alert,
  Input,
  Label,
  Button,
  Spinner,
  IconButton,
  AlertTitle,
  CardContent,
  AlertDescription,
} from 'src/components/ui';

import { useAuthContext } from 'src/auth/context';

// ----------------------------------------------------------------------

export function SignInView() {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn({ email, password });
      navigate('/dashboard/execucoes', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Credenciais inválidas.';
      setError(message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--color-neutral-950)] p-4">
      <Card className="w-full max-w-[420px] shadow-2xl">
        <CardContent className="flex flex-col gap-7">
          <div className="flex flex-col items-center gap-3">
            <img
              src={`${CONFIG.assetsDir}/logo/logo-single.png`}
              alt="SPED RPA"
              className="h-16 w-16 object-contain"
            />
            <span className="text-base font-semibold tracking-tight text-foreground">SPED RPA</span>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Bem-vindo</h1>
            <p className="text-sm text-muted-foreground">Entrar no Painel de RPA.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Protótipo — use qualquer e-mail e a senha <span className="font-mono font-medium">123456</span>
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <IconButton
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <Eye /> : <EyeOff />}
                </IconButton>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || !email || !password}
              className="bg-[var(--coral-bold)] text-white hover:bg-[var(--color-pink-600)]"
            >
              {loading && <Spinner />}
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
