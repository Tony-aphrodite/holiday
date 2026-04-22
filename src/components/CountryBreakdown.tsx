import { useMemo } from 'react';
import type { Customer } from '../lib/customers';
import { getCountries } from '../lib/holidays';

interface CountryBreakdownProps {
  customers: Customer[];
}

export default function CountryBreakdown({ customers }: CountryBreakdownProps) {
  const countries = useMemo(() => getCountries(), []);
  const byCode = useMemo(() => Object.fromEntries(countries.map((c) => [c.code, c])), [countries]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of customers) {
      if (!c.countryCode) continue;
      map.set(c.countryCode, (map.get(c.countryCode) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [customers]);

  const max = Math.max(1, ...counts.map(([, v]) => v));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text">Customers by country</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {counts.length > 0
              ? `${counts.length} ${counts.length === 1 ? 'country' : 'countries'} represented`
              : 'No customers yet'}
          </p>
        </div>
      </div>

      {counts.length === 0 ? (
        <div className="text-xs text-text-dim py-6 text-center">
          Add customers to see your country mix here.
        </div>
      ) : (
        <div className="space-y-2.5">
          {counts.map(([code, count]) => {
            const country = byCode[code];
            const pct = (count / max) * 100;
            return (
              <div key={code} className="flex items-center gap-3">
                <span className="text-base w-5 text-center shrink-0">{country?.flag ?? '🏳️'}</span>
                <span className="text-sm text-text-muted w-28 truncate shrink-0">
                  {country?.name ?? code}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-bg-soft overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-violet"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-text tabular-nums w-6 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
