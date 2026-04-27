import dayjs from 'dayjs';
import { X, MapPin } from 'lucide-react';
import type { Holiday, CountryOption } from '../lib/holidays';
import { holidayTypeColor, holidayTypeDot, holidayDisplayName } from '../lib/holidays';
import { cn } from '../lib/cn';

interface DayDetailsProps {
  date: string | null;
  holidays: Holiday[];
  country: CountryOption;
  onClose: () => void;
}

export default function DayDetails({ date, holidays, country, onClose }: DayDetailsProps) {
  if (!date) {
    return (
      <div className="card p-5 h-full flex flex-col items-center justify-center text-center min-h-[200px]">
        <div className="w-10 h-10 rounded-full bg-bg-hover grid place-items-center mb-3">
          <MapPin className="w-4 h-4 text-text-dim" />
        </div>
        <div className="text-sm font-medium text-text">Select a date</div>
        <div className="text-xs text-text-muted mt-1 max-w-xs">
          Click any day on the calendar to inspect the holidays registered for that date.
        </div>
      </div>
    );
  }

  const d = dayjs(date);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">
            {d.format('dddd')}
          </div>
          <div className="text-xl font-semibold text-text mt-0.5">
            {d.format('MMMM D, YYYY')}
          </div>
          <div className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
            <span>{country.flag}</span>
            {country.name}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {holidays.length === 0 ? (
        <div className="py-6 text-center text-sm text-text-muted border-t border-border">
          No holidays on this date.
        </div>
      ) : (
        <div className="space-y-2 border-t border-border pt-4">
          {holidays.map((h, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border bg-bg-soft/50 hover:bg-bg-hover/50 transition"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', holidayTypeDot(h.type))}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text">{holidayDisplayName(h)}</div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'stat-chip border capitalize',
                        holidayTypeColor(h.type),
                      )}
                    >
                      {h.type}
                    </span>
                    {h.rule && (
                      <span className="text-[10px] text-text-dim font-mono truncate">
                        {h.rule}
                      </span>
                    )}
                  </div>
                  {h.note && <div className="mt-2 text-xs text-text-muted">{h.note}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
