import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Customer, CustomerDraft } from './customers';
import { createCustomer, loadCustomers, saveCustomers } from './customers';

interface CustomersContextValue {
  customers: Customer[];
  getById: (id: string) => Customer | undefined;
  addCustomer: (draft: CustomerDraft) => Customer;
  updateCustomer: (id: string, patch: Partial<CustomerDraft>) => void;
  removeCustomer: (id: string) => void;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  const addCustomer = useCallback((draft: CustomerDraft) => {
    const created = createCustomer(draft);
    setCustomers((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateCustomer = useCallback((id: string, patch: Partial<CustomerDraft>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getById = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers],
  );

  const value = useMemo(
    () => ({ customers, getById, addCustomer, updateCustomer, removeCustomer }),
    [customers, getById, addCustomer, updateCustomer, removeCustomer],
  );

  return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
}

export function useCustomers(): CustomersContextValue {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error('useCustomers must be used within CustomersProvider');
  return ctx;
}
