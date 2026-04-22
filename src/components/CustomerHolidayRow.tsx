import dayjs from 'dayjs';
import type { CustomerHoliday } from '../lib/aggregate';
import { holidayTypeColor, holidayTypeDot } from '../lib/holidays';
import { cn } from '../lib/cn';
import Avatar from './Avatar';
import { getCountries } from '../lib/holidays';
import { useMemo } from 'react';

interface CustomerHolidayRowProps {
  item: CustomerHoliday;
  onClick?: () => void;
}

export default function CustomerHolidayRow({ item, onClick }: CustomerHolidayRowProps) {
  const countries = useMemo(() => getCountries(), []);
  const country = countries.find((c) => c.code === item.customer.countryCode);
  const d = dayjs(item.holiday.date);
  const delta = item.daysUntil;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-bg-hover transition text-left"
    >
      <div className="shrink-0 w-12 text-center">
        <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">
          {d.format('MMM')}
        </div>
        <div className="text-xl font-semibold text-text tabular-nums leading-none mt-0.5">
          {d.format('D')}
        </div>
        <div className="text-[10px] text-text-muted mt-0.5">{d.format('ddd')}</div>
      </div>

      <Avatar name={item.customer.name} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text truncate">{item.customer.name}</span>
          {country && (
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              {country.flag} {country.name}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted min-w-0">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', holidayTypeDot(item.holiday.type))} />
          <span className="truncate">{item.holiday.name}</span>
          <span
            className={cn(
              'stat-chip border capitalize shrink-0',
              holidayTypeColor(item.holiday.type),
            )}
          >
            {item.holiday.type}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div
          className={cn(
            'text-sm font-semibold tabular-nums',
            delta === 0 && 'text-brand-300',
            delta > 0 && 'text-text',
          )}
        >
          {delta === 0 ? 'Today' : delta === 1 ? 'Tomorrow' : `${delta}d`}
        </div>
        <div className="text-[10px] text-text-dim mt-0.5">
          {delta === 0 ? 'happening now' : 'away'}
        </div>
      </div>
    </button>
  );
}
