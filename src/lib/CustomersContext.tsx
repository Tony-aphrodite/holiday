import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Customer, CustomerDraft } from './customers';
import { useAuth } from './AuthContext';

interface CustomersContextValue {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  getById: (id: string) => Customer | undefined;
  addCustomer: (draft: CustomerDraft) => Promise<Customer | null>;
  updateCustomer: (id: string, patch: Partial<CustomerDraft>) => Promise<void>;
  removeCustomer: (id: string) => Promise<void>;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (!userId) {
      setCustomers([]);
      setLoading(false);
      setError(null);
      return;
    }
    const my = ++reqId.current;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch('/api/customers', { credentials: 'same-origin' });
        if (my !== reqId.current) return;
        if (!res.ok) {
          setCustomers([]);
          setError('Could not load customers.');
          return;
        }
        const data = (await parseJson(res)) as { customers?: Customer[] } | null;
        setCustomers(data?.customers ?? []);
      } catch {
        if (my !== reqId.current) return;
        setError('Network error.');
      } finally {
        if (my === reqId.current) setLoading(false);
      }
    })();
  }, [userId]);

  const addCustomer = useCallback(async (draft: CustomerDraft): Promise<Customer | null> => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        setError('Could not add customer.');
        return null;
      }
      const data = (await parseJson(res)) as { customer?: Customer } | null;
      if (!data?.customer) return null;
      const created = data.customer;
      setCustomers((prev) => [created, ...prev]);
      return created;
    } catch {
      setError('Network error.');
      return null;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, patch: Partial<CustomerDraft>) => {
    // Optimistic update: apply locally, roll back on failure.
    let previous: Customer | undefined;
    setCustomers((prev) => {
      previous = prev.find((c) => c.id === id);
      return prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
    });
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Update failed.');
      const data = (await parseJson(res)) as { customer?: Customer } | null;
      if (data?.customer) {
        const updated = data.customer;
        setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch {
      // Roll back
      if (previous) {
        const rollback = previous;
        setCustomers((prev) => prev.map((c) => (c.id === id ? rollback : c)));
      }
      setError('Could not update customer.');
    }
  }, []);

  const removeCustomer = useCallback(async (id: string) => {
    let previous: Customer[] = [];
    setCustomers((prev) => {
      previous = prev;
      return prev.filter((c) => c.id !== id);
    });
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Delete failed.');
    } catch {
      setCustomers(previous);
      setError('Could not delete customer.');
    }
  }, []);

  const getById = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  );

  const value = useMemo(
    () => ({ customers, loading, error, getById, addCustomer, updateCustomer, removeCustomer }),
    [customers, loading, error, getById, addCustomer, updateCustomer, removeCustomer],
  );

  return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
}

export function useCustomers(): CustomersContextValue {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error('useCustomers must be used within CustomersProvider');
  return ctx;
}
