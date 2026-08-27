import type { User, Session } from '@supabase/supabase-js';
import type { AuthContextValue } from 'src/types';

import { useState, useContext, useCallback, createContext } from 'react';

// ----------------------------------------------------------------------
// Protótipo — sem backend de autenticação real. Qualquer e-mail é aceito
// desde que a senha seja DEMO_PASSWORD. A sessão é apenas local (sessionStorage).
// ----------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'rpas-dashboard:session';
const DEMO_PASSWORD = '123456';

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  const [user, setUser] = useState<User | null>(session?.user ?? null);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    if (password !== DEMO_PASSWORD) {
      throw new Error(`Credenciais inválidas. Use a senha "${DEMO_PASSWORD}".`);
    }

    const demoUser = {
      id: 'demo-user',
      email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;
    const demoSession = { access_token: 'demo', refresh_token: 'demo', user: demoUser } as Session;

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(demoSession));
    setUser(demoUser);
    setSession(demoSession);
  }, []);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading: false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}
