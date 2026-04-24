import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Bell,
  ArrowRight,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  MessageSquare,
  Calendar,
  X,
} from 'lucide-react';
import { useCustomers } from '../lib/CustomersContext';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useSettings } from '../lib/SettingsContext';
import { useNotifications, type MessageNotif, type HolidayNotif } from '../lib/NotificationsContext';
import { getCountries } from '../lib/holidays';
import { initials } from '../lib/customers';
import Avatar from './Avatar';
import { cn } from '../lib/cn';

export default function Topbar() {
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
        <div className="flex-1 max-w-[18rem] relative">
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
          <ThemeToggle />
          <NotificationsBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg bg-bg-soft border border-border hover:bg-bg-hover transition text-text-muted hover:text-text"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function NotificationsBell() {
  const { messages, holidays, totalCount, clearMessagesFor, dismissHoliday, dismissAll } =
    useNotifications();
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

  const badgeLabel = totalCount > 9 ? '9+' : String(totalCount);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg bg-bg-soft border border-border hover:bg-bg-hover transition text-text-muted hover:text-text"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent-rose text-white text-[9px] font-semibold flex items-center justify-center leading-none tabular-nums">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-bg-card border border-border rounded-xl shadow-card overflow-hidden animate-slide-up z-40">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-text">Notifications</div>
              <div className="text-[11px] text-text-muted">
                {totalCount === 0
                  ? "You're all caught up."
                  : `${totalCount} new ${totalCount === 1 ? 'item' : 'items'}`}
              </div>
            </div>
            {totalCount > 0 && (
              <button
                onClick={dismissAll}
                className="text-[11px] text-text-muted hover:text-text transition"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {totalCount === 0 && (
              <div className="px-4 py-10 text-center text-text-dim">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-60" />
                <div className="text-sm">No new notifications</div>
                <div className="text-[11px] mt-1">
                  You'll see new messages and upcoming holidays here.
                </div>
              </div>
            )}

            {messages.map((m) => (
              <MessageRow
                key={m.peerId}
                notif={m}
                onOpen={() => {
                  clearMessagesFor(m.peerId);
                  setOpen(false);
                  navigate({ name: 'chat', peerId: m.peerId });
                }}
                onDismiss={() => clearMessagesFor(m.peerId)}
              />
            ))}

            {holidays.map((h) => (
              <HolidayRow
                key={h.id}
                notif={h}
                onOpen={() => {
                  setOpen(false);
                  navigate({ name: 'customer', id: h.customerId });
                }}
                onDismiss={() => dismissHoliday(h.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageRow({
  notif,
  onOpen,
  onDismiss,
}: {
  notif: MessageNotif;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { formatTime } = useSettings();
  return (
    <div className="relative group hover:bg-bg-hover transition">
      <button onClick={onOpen} className="w-full flex items-start gap-3 px-4 py-3 text-left">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-violet grid place-items-center text-xs font-semibold text-white shrink-0">
          {initials(notif.peerName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-text truncate">{notif.peerName}</div>
            <div className="text-[10px] text-text-dim shrink-0">
              {formatTime(notif.at)}
            </div>
          </div>
          <div className="text-[11px] text-text-muted truncate mt-0.5 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 shrink-0 text-brand-300" />
            {notif.preview}
          </div>
          {notif.count > 1 && (
            <div className="text-[10px] text-brand-300 mt-1 font-medium">
              {notif.count} new messages
            </div>
          )}
        </div>
      </button>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded text-text-dim hover:text-text hover:bg-bg-soft opacity-0 group-hover:opacity-100 transition"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function HolidayRow({
  notif,
  onOpen,
  onDismiss,
}: {
  notif: HolidayNotif;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { formatDate } = useSettings();
  const when =
    notif.daysUntil === 0
      ? 'Today'
      : notif.daysUntil === 1
        ? 'Tomorrow'
        : `In ${notif.daysUntil} days`;
  return (
    <div className="relative group hover:bg-bg-hover transition">
      <button onClick={onOpen} className="w-full flex items-start gap-3 px-4 py-3 text-left">
        <div className="w-9 h-9 rounded-full bg-bg-soft border border-border grid place-items-center text-sm shrink-0">
          {notif.flag}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-text truncate">{notif.customerName}</div>
            <div
              className={cn(
                'text-[10px] shrink-0 font-medium',
                notif.daysUntil <= 1 ? 'text-accent-amber' : 'text-text-dim',
              )}
            >
              {when}
            </div>
          </div>
          <div className="text-[11px] text-text-muted truncate mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 shrink-0 text-accent-emerald" />
            {notif.holidayName} · {formatDate(notif.holidayDate)}
          </div>
        </div>
      </button>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded text-text-dim hover:text-text hover:bg-bg-soft opacity-0 group-hover:opacity-100 transition"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
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
