import { CalendarDays, LayoutDashboard, Users, Settings, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '../lib/cn';
import { useCustomers } from '../lib/CustomersContext';
import { usePeople } from '../lib/PeopleContext';
import { useRouter, type Route } from '../lib/router';
import { initials } from '../lib/customers';

interface NavItem {
  id: string;
  label: string;
  route: Route;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'customers';
}

const nav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', route: { name: 'dashboard' }, icon: LayoutDashboard },
  {
    id: 'customers',
    label: 'Customers',
    route: { name: 'customers' },
    icon: Users,
    badgeKey: 'customers',
  },
];

export default function Sidebar() {
  const { customers } = useCustomers();
  const { people, loading: peopleLoading } = usePeople();
  const { route, navigate } = useRouter();

  function isActive(item: NavItem) {
    if (item.route.name === 'dashboard') return route.name === 'dashboard';
    if (item.route.name === 'customers') return route.name === 'customers' || route.name === 'customer';
    return false;
  }

  const activeChatPeerId = route.name === 'chat' ? route.peerId : null;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-bg-soft/60 backdrop-blur">
      <button
        onClick={() => navigate({ name: 'dashboard' })}
        className="flex items-center gap-2.5 px-5 h-16 border-b border-border text-left hover:bg-bg-hover/40 transition"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-violet flex items-center justify-center shadow-glow">
          <CalendarDays className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-text">Holidaze</div>
          <div className="text-[10px] uppercase tracking-wider text-text-dim">Client Holidays</div>
        </div>
      </button>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-wider text-text-dim font-semibold">
          Workspace
        </div>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const badge = item.badgeKey === 'customers' ? customers.length : undefined;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={cn(
                'w-full group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-brand-500/10 text-text border border-brand-500/20'
                  : 'text-text-muted hover:text-text hover:bg-bg-hover border border-transparent',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  active ? 'text-brand-400' : 'text-text-dim group-hover:text-text-muted',
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bg-hover text-text-muted border border-border tabular-nums">
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-2 pt-5 pb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-text-dim font-semibold">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" />
            People
          </span>
          {people.length > 0 && (
            <span className="normal-case tracking-normal text-text-dim font-medium">
              {people.length}
            </span>
          )}
        </div>

        {peopleLoading && people.length === 0 ? (
          <div className="px-3 py-2 text-[11px] text-text-dim">Loading…</div>
        ) : people.length === 0 ? (
          <div className="px-3 py-2 text-[11px] text-text-dim leading-relaxed">
            No other users yet. Invite someone to join Holidaze to start chatting.
          </div>
        ) : (
          people.map((p) => {
            const active = activeChatPeerId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => navigate({ name: 'chat', peerId: p.id })}
                className={cn(
                  'w-full group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-brand-500/10 text-text border border-brand-500/20'
                    : 'text-text-muted hover:text-text hover:bg-bg-hover border border-transparent',
                )}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-accent-violet grid place-items-center text-[10px] font-semibold text-white shrink-0">
                  {initials(p.name)}
                </div>
                <span className="flex-1 text-left truncate">{p.name}</span>
              </button>
            );
          })
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors">
          <Settings className="w-4 h-4 text-text-dim" />
          Settings
        </button>
        <div className="mt-3 rounded-lg bg-gradient-to-br from-brand-500/10 to-accent-violet/10 border border-brand-500/20 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            Pro tip
          </div>
          <div className="text-[11px] text-text-muted mt-1 leading-relaxed">
            Add customers with their country — Holidaze will automatically surface their national
            holidays so you never miss a moment.
          </div>
        </div>
      </div>
    </aside>
  );
}
