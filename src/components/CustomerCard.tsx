import { useMemo } from 'react';
import dayjs from 'dayjs';
import { Mail, MessageCircle, Phone, CalendarDays, ArrowUpRight } from 'lucide-react';
import type { Customer } from '../lib/customers';
import { getCountries, holidayDisplayName } from '../lib/holidays';
import { nextHolidayForCustomer } from '../lib/aggregate';
import Avatar from './Avatar';

interface CustomerCardProps {
  customer: Customer;
  onOpen: () => void;
}

export default function CustomerCard({ customer, onOpen }: CustomerCardProps) {
  const countries = useMemo(() => getCountries(), []);
  const country = countries.find((c) => c.code === customer.countryCode);
  const next = useMemo(() => nextHolidayForCustomer(customer), [customer]);

  return (
    <button
      onClick={onOpen}
      className="card p-5 text-left hover:border-border/80 hover:bg-bg-hover/40 transition group relative overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <Avatar name={customer.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text truncate">{customer.name}</div>
          {customer.company && (
            <div className="text-xs text-text-muted truncate">{customer.company}</div>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            {country ? (
              <>
                <span>{country.flag}</span>
                <span className="truncate">{country.name}</span>
              </>
            ) : (
              <span className="text-text-dim">No country</span>
            )}
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-text-dim group-hover:text-text transition shrink-0" />
      </div>

      <div className="mt-4 flex items-center gap-3 text-text-dim">
        {customer.email && (
          <span title={customer.email} className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
          </span>
        )}
        {customer.whatsapp && (
          <span title={customer.whatsapp} className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        )}
        {customer.phone && (
          <span title={customer.phone} className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        {next ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 grid place-items-center">
              <CalendarDays className="w-3.5 h-3.5 text-brand-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">
                Next holiday
              </div>
              <div className="text-xs text-text truncate font-medium">{holidayDisplayName(next.holiday)}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-text tabular-nums">
                {next.daysUntil === 0 ? 'Today' : `${next.daysUntil}d`}
              </div>
              <div className="text-[10px] text-text-dim">{dayjs(next.holiday.date).format('MMM D')}</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-text-dim">No upcoming holidays</div>
        )}
      </div>
    </button>
  );
}
