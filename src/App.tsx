import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import CustomerModal from './components/CustomerModal';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { CustomersProvider, useCustomers } from './lib/CustomersContext';
import { RouterProvider, useRouter } from './lib/router';
import { AuthProvider, useAuth } from './lib/AuthContext';
import type { CustomerDraft } from './lib/customers';

function AppShell() {
  const { route, navigate } = useRouter();
  const { user } = useAuth();

  // Guard: if the user is on a protected route without a session, send to login.
  // If they're on an auth/landing route while logged in, send to dashboard.
  useEffect(() => {
    const isProtected =
      route.name === 'dashboard' || route.name === 'customers' || route.name === 'customer';
    const isAuthRoute = route.name === 'login' || route.name === 'signup';
    if (!user && isProtected) {
      navigate({ name: 'login' });
    } else if (user && isAuthRoute) {
      navigate({ name: 'dashboard' });
    }
  }, [user, route, navigate]);

  if (route.name === 'landing') return <Landing />;
  if (route.name === 'login') return user ? <Dashboarded /> : <Login />;
  if (route.name === 'signup') return user ? <Dashboarded /> : <Signup />;
  if (!user) return <Login />;
  return <Dashboarded />;
}

function Dashboarded() {
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
    <AuthProvider>
      <RouterProvider>
        <CustomersProvider>
          <AppShell />
        </CustomersProvider>
      </RouterProvider>
    </AuthProvider>
  );
}
