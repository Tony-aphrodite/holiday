import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import CustomerModal from './components/CustomerModal';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import { CustomersProvider, useCustomers } from './lib/CustomersContext';
import { RouterProvider, useRouter } from './lib/router';
import type { CustomerDraft } from './lib/customers';

function AppShell() {
  const { route, navigate } = useRouter();
  const { addCustomer } = useCustomers();
  const [creating, setCreating] = useState(false);

  function handleCreate(draft: CustomerDraft) {
    const created = addCustomer(draft);
    setCreating(false);
    navigate({ name: 'customer', id: created.id });
  }

  return (
    <div className="flex h-full bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onAddCustomer={() => setCreating(true)} />
        <main className="flex-1 overflow-y-auto">
          {route.name === 'dashboard' && (
            <Dashboard onAddCustomer={() => setCreating(true)} />
          )}
          {route.name === 'customers' && (
            <Customers onAddCustomer={() => setCreating(true)} />
          )}
          {route.name === 'customer' && <CustomerDetail id={route.id} />}
        </main>
      </div>

      <CustomerModal
        open={creating}
        mode="create"
        onClose={() => setCreating(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

export default function App() {
  return (
    <CustomersProvider>
      <RouterProvider>
        <AppShell />
      </RouterProvider>
    </CustomersProvider>
  );
}
