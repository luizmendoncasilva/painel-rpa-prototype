import type { AppUser, AppSession, AuthContextValue } from 'src/types';

import { useState, useContext, useCallback, createContext } from 'react';

// ----------------------------------------------------------------------
// Protótipo — sem backend de autenticação real. Qualquer e-mail é aceito
// desde que a senha seja DEMO_PASSWORD. A sessão é apenas local (sessionStorage).
// ----------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'rpas-dashboard:session';
const DEMO_PASSWORD = '123456';

function readSession(): AppSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(readSession);
  const [user, setUser] = useState<AppUser | null>(session?.user ?? null);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    if (password !== DEMO_PASSWORD) {
      throw new Error(`Credenciais inválidas. Use a senha "${DEMO_PASSWORD}".`);
    }

    const demoUser: AppUser = { id: 'demo-user', email };
    const demoSession: AppSession = { user: demoUser };

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
