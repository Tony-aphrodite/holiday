import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Route =
  | { name: 'landing' }
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'dashboard' }
  | { name: 'customers' }
  | { name: 'customer'; id: string };

interface RouterValue {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (!h) return { name: 'landing' };
  const parts = h.split('/');
  if (parts[0] === 'customers' && parts[1]) return { name: 'customer', id: parts[1] };
  if (parts[0] === 'customers') return { name: 'customers' };
  if (parts[0] === 'dashboard') return { name: 'dashboard' };
  if (parts[0] === 'login') return { name: 'login' };
  if (parts[0] === 'signup') return { name: 'signup' };
  if (parts[0] === 'home' || parts[0] === 'landing') return { name: 'landing' };
  return { name: 'landing' };
}

function serialize(route: Route): string {
  switch (route.name) {
    case 'landing':
      return '#/';
    case 'login':
      return '#/login';
    case 'signup':
      return '#/signup';
    case 'dashboard':
      return '#/dashboard';
    case 'customers':
      return '#/customers';
    case 'customer':
      return `#/customers/${route.id}`;
  }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    function onHash() {
      setRoute(parseHash());
    }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: Route) => {
    const hash = serialize(next);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setRoute(next);
    }
  }, []);

  const value = useMemo(() => ({ route, navigate }), [route, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
