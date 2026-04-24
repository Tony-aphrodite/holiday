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
import Chat from './pages/Chat';
import People from './pages/People';
import Settings from './pages/Settings';
import { CustomersProvider, useCustomers } from './lib/CustomersContext';
import { RouterProvider, useRouter } from './lib/router';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { PeopleProvider } from './lib/PeopleContext';
import { ThemeProvider } from './lib/ThemeContext';
import { SettingsProvider } from './lib/SettingsContext';
import { NotificationsProvider } from './lib/NotificationsContext';
import type { CustomerDraft } from './lib/customers';

function AppShell() {
  const { route, navigate } = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const isProtected =
      route.name === 'dashboard' ||
      route.name === 'customers' ||
      route.name === 'customer' ||
      route.name === 'people' ||
      route.name === 'chat' ||
      route.name === 'settings';
    const isAuthRoute = route.name === 'login' || route.name === 'signup';
    if (!user && isProtected) {
      navigate({ name: 'login' });
    } else if (user && isAuthRoute) {
      navigate({ name: 'dashboard' });
    }
  }, [user, ready, route, navigate]);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-brand-400 animate-spin" />
      </div>
    );
  }

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

  async function handleCreate(draft: CustomerDraft) {
    const created = await addCustomer(draft);
    setCreating(false);
    if (created) navigate({ name: 'customer', id: created.id });
  }

  return (
    <div className="flex h-full bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {route.name === 'dashboard' && (
            <Dashboard onAddCustomer={() => setCreating(true)} />
          )}
          {route.name === 'customers' && (
            <Customers onAddCustomer={() => setCreating(true)} />
          )}
          {route.name === 'customer' && <CustomerDetail id={route.id} />}
          {route.name === 'people' && <People />}
          {route.name === 'chat' && <Chat peerId={route.peerId} />}
          {route.name === 'settings' && <Settings />}
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
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <RouterProvider>
            <CustomersProvider>
              <PeopleProvider>
                <NotificationsProvider>
                  <AppShell />
                </NotificationsProvider>
              </PeopleProvider>
            </CustomersProvider>
          </RouterProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
