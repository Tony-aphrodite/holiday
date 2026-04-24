import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Peer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface PeopleContextValue {
  people: Peer[];
  loading: boolean;
  getById: (id: string) => Peer | undefined;
  refresh: () => Promise<void>;
}

const PeopleContext = createContext<PeopleContextValue | null>(null);

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function PeopleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [people, setPeople] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setPeople([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users', { credentials: 'same-origin' });
      if (!res.ok) {
        setPeople([]);
        return;
      }
      const data = (await parseJson(res)) as { users?: Peer[] } | null;
      setPeople(data?.users ?? []);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Periodic refresh so new signups appear without a page reload.
  useEffect(() => {
    if (!user) return;
    const iv = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(iv);
  }, [user, refresh]);

  const getById = useCallback((id: string) => people.find((p) => p.id === id), [people]);

  const value = useMemo(() => ({ people, loading, getById, refresh }), [people, loading, getById, refresh]);
  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export function usePeople(): PeopleContextValue {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error('usePeople must be used within PeopleProvider');
  return ctx;
}
