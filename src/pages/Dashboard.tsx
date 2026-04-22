import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Users, Globe2, Calendar, Sparkles, UserPlus, ArrowRight } from 'lucide-react';
import { useCustomers } from '../lib/CustomersContext';
import { useRouter } from '../lib/router';
import { computeUpcomingCustomerHolidays } from '../lib/aggregate';
import StatCard from '../components/StatCard';
import CustomerHolidayRow from '../components/CustomerHolidayRow';
import CustomerCard from '../components/CustomerCard';
import CountryBreakdown from '../components/CountryBreakdown';
import EmptyState from '../components/EmptyState';
import { holidayTypeColor } from '../lib/holidays';
import { getCountries } from '../lib/holidays';
import { cn } from '../lib/cn';

interface DashboardProps {
  onAddCustomer: () => void;
}

export default function Dashboard({ onAddCustomer }: DashboardProps) {
  const { customers } = useCustomers();
  const { navigate } = useRouter();
  const countries = useMemo(() => getCountries(), []);
  const countryByCode = useMemo(
    () => Object.fromEntries(countries.map((c) => [c.code, c])),
    [countries],
  );

  const upcoming = useMemo(
    () => computeUpcomingCustomerHolidays(customers, 180),
    [customers],
  );

  const today = dayjs();
  const in30 = upcoming.filter((u) => u.daysUntil <= 30);
  const thisMonth = upcoming.filter((u) =>
    dayjs(u.holiday.date).isSame(today, 'month'),
  );
  const distinctCountries = new Set(customers.map((c) => c.countryCode).filter(Boolean));
  const next = upcoming[0];

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text tracking-tight">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {customers.length === 0
              ? 'Start by adding your first customer.'
              : `Tracking ${customers.length} ${customers.length === 1 ? 'customer' : 'customers'} across ${distinctCountries.size} ${distinctCountries.size === 1 ? 'country' : 'countries'}.`}
          </p>
        </div>
        <div className="text-xs text-text-dim">Updated {today.format('MMM D, YYYY')}</div>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No customers yet"
          description="Add your first customer — pick their country and Holidaze will automatically track their national holidays so you can reach out at the right moments."
          action={
            <button onClick={onAddCustomer} className="btn-primary">
              <UserPlus className="w-4 h-4" />
              Add your first customer
            </button>
          }
        />
      ) : (
        <>
          {next ? (
            <NextCustomerHero
              item={next}
              onOpen={() => navigate({ name: 'customer', id: next.customer.id })}
              countryName={countryByCode[next.customer.countryCode]?.name ?? next.customer.countryCode}
              countryFlag={countryByCode[next.customer.countryCode]?.flag ?? '🏳️'}
            />
          ) : null}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total customers"
              value={customers.length}
              hint={`${distinctCountries.size} ${distinctCountries.size === 1 ? 'country' : 'countries'}`}
              icon={Users}
              accent="brand"
            />
            <StatCard
              label="Upcoming in 30 days"
              value={in30.length}
              hint="Across all customers"
              icon={Calendar}
              accent="violet"
            />
            <StatCard
              label="This month"
              value={thisMonth.length}
              hint={today.format('MMMM YYYY')}
              icon={Sparkles}
              accent="rose"
            />
            <StatCard
              label="Countries"
              value={distinctCountries.size}
              hint="Unique locales"
              icon={Globe2}
              accent="emerald"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h3 className="text-base font-semibold text-text">Upcoming customer holidays</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Next {Math.min(upcoming.length, 10)} of {upcoming.length} in the next 6 months
                  </p>
                </div>
                <button
                  onClick={() => navigate({ name: 'customers' })}
                  className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition"
                >
                  All customers <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {upcoming.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Calendar className="w-8 h-8 text-text-dim mx-auto mb-2" />
                  <p className="text-sm text-text-muted">
                    No upcoming holidays in the next 6 months.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {upcoming.slice(0, 10).map((item, i) => (
                    <li key={`${item.customer.id}-${item.holiday.date}-${i}`}>
                      <CustomerHolidayRow
                        item={item}
                        onClick={() => navigate({ name: 'customer', id: item.customer.id })}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-5">
              <CountryBreakdown customers={customers} />

              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="text-base font-semibold text-text">Recent customers</h3>
                  <button
                    onClick={() => navigate({ name: 'customers' })}
                    className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition"
                  >
                    All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ul className="divide-y divide-border">
                  {customers.slice(0, 5).map((c) => {
                    const country = countryByCode[c.countryCode];
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => navigate({ name: 'customer', id: c.id })}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-bg-hover transition text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-bg-hover border border-border grid place-items-center text-[10px] font-mono text-text-muted shrink-0">
                            {country?.flag ?? '🏳️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-text truncate">{c.name}</div>
                            <div className="text-[11px] text-text-muted truncate">
                              {country?.name ?? c.countryCode}
                              {c.email && ` · ${c.email}`}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-text-dim" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {customers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text">Your customers</h3>
                <button
                  onClick={() => navigate({ name: 'customers' })}
                  className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {customers.slice(0, 8).map((c) => (
                  <CustomerCard
                    key={c.id}
                    customer={c}
                    onOpen={() => navigate({ name: 'customer', id: c.id })}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <footer className="pt-4 text-center text-xs text-text-dim">
        Data powered by{' '}
        <a
          href="https://github.com/commenthol/date-holidays"
          target="_blank"
          rel="noreferrer"
          className="text-text-muted hover:text-text transition"
        >
          date-holidays
        </a>{' '}
        · 200+ countries · lunar & substitute holidays supported
      </footer>
    </div>
  );
}

interface NextCustomerHeroProps {
  item: import('../lib/aggregate').CustomerHoliday;
  countryName: string;
  countryFlag: string;
  onOpen: () => void;
}

function NextCustomerHero({ item, countryName, countryFlag, onOpen }: NextCustomerHeroProps) {
  const d = dayjs(item.holiday.date);
  const progress = Math.max(0, Math.min(100, ((30 - Math.min(item.daysUntil, 30)) / 30) * 100));

  return (
    <button
      onClick={onOpen}
      className="card relative overflow-hidden p-6 w-full text-left hover:border-brand-500/30 transition"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-accent-violet/10 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grid-faint bg-[size:32px_32px] opacity-20 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-brand-300 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Next customer holiday
          </div>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-text tracking-tight">
            {item.customer.name}
          </h2>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-text-muted flex-wrap">
            <span className="flex items-center gap-1">
              {countryFlag} {countryName}
            </span>
            <span className="text-text-dim">·</span>
            <span className="text-text font-medium">{item.holiday.name}</span>
            <span
              className={cn(
                'stat-chip border capitalize',
                holidayTypeColor(item.holiday.type),
              )}
            >
              {item.holiday.type}
            </span>
          </div>
          <div className="mt-1 text-xs text-text-dim">{d.format('dddd, MMMM D, YYYY')}</div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">
            {item.daysUntil === 0 ? 'Today' : 'Days away'}
          </div>
          <div className="mt-1 flex items-baseline gap-1 justify-end">
            <span className="text-5xl font-bold text-text tabular-nums tracking-tight">
              {item.daysUntil === 0 ? '🎉' : item.daysUntil}
            </span>
            {item.daysUntil !== 0 && <span className="text-sm text-text-muted">days</span>}
          </div>
          <div className="mt-3 w-32 h-1 rounded-full bg-bg-soft overflow-hidden ml-auto">
            <div
              className="h-full bg-gradient-to-r from-brand-400 to-accent-violet transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
