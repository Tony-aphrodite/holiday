import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Bell, Plus, ArrowRight, LogOut, User as UserIcon } from 'lucide-react';
import { useCustomers } from '../lib/CustomersContext';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/AuthContext';
import { getCountries } from '../lib/holidays';
import { initials } from '../lib/customers';
import Avatar from './Avatar';

interface TopbarProps {
  onAddCustomer: () => void;
}

export default function Topbar({ onAddCustomer }: TopbarProps) {
  const { customers } = useCustomers();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const countries = useMemo(() => getCountries(), []);
  const countryByCode = useMemo(
    () => Object.fromEntries(countries.map((c) => [c.code, c])),
    [countries],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          countryByCode[c.countryCode]?.name.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, customers, countryByCode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="h-16 shrink-0 border-b border-border bg-bg-soft/60 backdrop-blur sticky top-0 z-20">
      <div className="h-full px-4 md:px-6 flex items-center gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            id="global-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search customers by name, email, country..."
            className="input w-full pl-9"
          />
          <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-text-dim border border-border px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>

          {focused && query && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border rounded-xl shadow-card overflow-hidden animate-slide-up z-30 max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-text-dim">
                  No customers match “{query}”
                </div>
              ) : (
                results.map((c) => {
                  const country = countryByCode[c.countryCode];
                  return (
                    <button
                      key={c.id}
                      onMouseDown={() => {
                        navigate({ name: 'customer', id: c.id });
                        setQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-bg-hover transition text-left"
                    >
                      <Avatar name={c.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-text font-medium truncate">{c.name}</div>
                        <div className="text-[11px] text-text-muted truncate">
                          {country?.flag} {country?.name}
                          {c.email && ` · ${c.email}`}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-dim" />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={onAddCustomer} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add customer</span>
          </button>

          <button className="relative p-2 rounded-lg bg-bg-soft border border-border hover:bg-bg-hover transition text-text-muted hover:text-text">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-rose" />
          </button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-violet grid place-items-center text-xs font-semibold text-white hover:ring-2 hover:ring-brand-500/40 transition"
        aria-label="Account menu"
      >
        {initials(user.name)}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-bg-card border border-border rounded-xl shadow-card overflow-hidden animate-slide-up z-30">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-violet grid place-items-center text-xs font-semibold text-white shrink-0">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-text truncate">{user.name}</div>
                <div className="text-[11px] text-text-muted truncate">{user.email}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate({ name: 'landing' });
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-bg-hover transition"
          >
            <UserIcon className="w-4 h-4 text-text-dim" />
            Home page
          </button>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
              navigate({ name: 'landing' });
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-rose hover:bg-accent-rose/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
