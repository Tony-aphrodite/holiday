import { useMemo, useState } from 'react';
import { Search, UserPlus, Users, Filter } from 'lucide-react';
import { useCustomers } from '../lib/CustomersContext';
import { useRouter } from '../lib/router';
import { getCountries } from '../lib/holidays';
import CustomerCard from '../components/CustomerCard';
import EmptyState from '../components/EmptyState';
import { cn } from '../lib/cn';

interface CustomersProps {
  onAddCustomer: () => void;
}

export default function Customers({ onAddCustomer }: CustomersProps) {
  const { customers } = useCustomers();
  const { navigate } = useRouter();
  const countries = useMemo(() => getCountries(), []);
  const countryByCode = useMemo(
    () => Object.fromEntries(countries.map((c) => [c.code, c])),
    [countries],
  );

  const [query, setQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const activeCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of customers) if (c.countryCode) set.add(c.countryCode);
    return [...set]
      .map((code) => countryByCode[code])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, countryByCode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (countryFilter && c.countryCode !== countryFilter) return false;
      if (!q) return true;
      const country = countryByCode[c.countryCode]?.name.toLowerCase() ?? '';
      return (
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        country.includes(q)
      );
    });
  }, [customers, query, countryFilter, countryByCode]);

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text tracking-tight">Customers</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {customers.length === 0
              ? 'No customers yet.'
              : `${customers.length} total · ${filtered.length} shown`}
          </p>
        </div>
        <button onClick={onAddCustomer} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Add customer
        </button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer. Pick their country and Holidaze will automatically surface their national holidays."
          action={
            <button onClick={onAddCustomer} className="btn-primary">
              <UserPlus className="w-4 h-4" />
              Add customer
            </button>
          }
        />
      ) : (
        <>
          <div className="card p-3 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, company, country..."
                className="input w-full pl-9"
              />
            </div>

            {activeCountries.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <Filter className="w-3.5 h-3.5 text-text-dim shrink-0" />
                <button
                  onClick={() => setCountryFilter(null)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs transition whitespace-nowrap',
                    countryFilter === null
                      ? 'bg-brand-500/10 text-text border border-brand-500/20'
                      : 'text-text-muted hover:text-text border border-transparent hover:bg-bg-hover',
                  )}
                >
                  All
                </button>
                {activeCountries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCountryFilter(c.code === countryFilter ? null : c.code)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs transition whitespace-nowrap flex items-center gap-1.5',
                      countryFilter === c.code
                        ? 'bg-brand-500/10 text-text border border-brand-500/20'
                        : 'text-text-muted hover:text-text border border-transparent hover:bg-bg-hover',
                    )}
                  >
                    <span>{c.flag}</span>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              description="Try a different search term or clear the country filter."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((c) => (
                <CustomerCard
                  key={c.id}
                  customer={c}
                  onOpen={() => navigate({ name: 'customer', id: c.id })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
