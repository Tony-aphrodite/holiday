import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadSession, signIn as doSignIn, signOut as doSignOut, signUp as doSignUp, type User } from './auth';

interface AuthContextValue {
  user: User | null;
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signUp: (name: string, email: string, password: string) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSession());

  const signIn = useCallback((email: string, password: string) => {
    const res = doSignIn({ email, password });
    if (res.ok) {
      setUser(res.user);
      return { ok: true as const };
    }
    return { ok: false as const, error: res.error };
  }, []);

  const signUp = useCallback((name: string, email: string, password: string) => {
    const res = doSignUp({ name, email, password });
    if (res.ok) {
      setUser(res.user);
      return { ok: true as const };
    }
    return { ok: false as const, error: res.error };
  }, []);

  const signOut = useCallback(() => {
    doSignOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signUp, signOut }), [user, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
