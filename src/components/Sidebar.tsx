import { CalendarDays, LayoutDashboard, Users, Settings, Sparkles } from 'lucide-react';
import { cn } from '../lib/cn';
import { useCustomers } from '../lib/CustomersContext';
import { useRouter, type Route } from '../lib/router';

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
  const { route, navigate } = useRouter();

  function isActive(item: NavItem) {
    if (item.route.name === 'dashboard') return route.name === 'dashboard';
    if (item.route.name === 'customers') return route.name === 'customers' || route.name === 'customer';
    return false;
  }

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

      <nav className="flex-1 px-3 py-4 space-y-1">
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
