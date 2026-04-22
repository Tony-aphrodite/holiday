import { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Holiday } from '../lib/holidays';
import { groupByDate, holidayTypeDot } from '../lib/holidays';
import { cn } from '../lib/cn';

interface CalendarProps {
  holidays: Holiday[];
  year: number;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ holidays, year, selectedDate, onSelectDate }: CalendarProps) {
  const today = dayjs();
  const initial = today.year() === year ? today : dayjs(`${year}-01-01`);
  const [cursor, setCursor] = useState<Dayjs>(initial.startOf('month'));

  const byDate = useMemo(() => groupByDate(holidays), [holidays]);

  const monthStart = cursor.startOf('month');
  const gridStart = monthStart.startOf('week');
  const cells: Dayjs[] = [];
  for (let i = 0; i < 42; i++) cells.push(gridStart.add(i, 'day'));

  function prevMonth() {
    const next = cursor.subtract(1, 'month');
    if (next.year() === year) setCursor(next);
    else setCursor(dayjs(`${year}-01-01`));
  }
  function nextMonth() {
    const next = cursor.add(1, 'month');
    if (next.year() === year) setCursor(next);
    else setCursor(dayjs(`${year}-12-01`));
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text">{cursor.format('MMMM YYYY')}</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Click a day to see its holidays
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(dayjs().startOf('month'))}
            className="btn-ghost px-2.5 py-1.5 text-xs"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            disabled={cursor.month() === 0}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text disabled:opacity-30 disabled:hover:bg-transparent transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            disabled={cursor.month() === 11}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text disabled:opacity-30 disabled:hover:bg-transparent transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-[10px] uppercase tracking-wider text-text-dim font-semibold text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const key = d.format('YYYY-MM-DD');
          const inMonth = d.month() === cursor.month();
          const isToday = d.isSame(today, 'day');
          const isSelected = key === selectedDate;
          const dayHolidays = byDate.get(key) ?? [];
          const isHoliday = dayHolidays.length > 0;
          const isWeekend = d.day() === 0 || d.day() === 6;

          return (
            <button
              key={key}
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={cn(
                'aspect-square min-h-[56px] p-1.5 rounded-lg border text-left flex flex-col transition group',
                'hover:bg-bg-hover',
                inMonth ? 'border-border/50' : 'border-transparent opacity-40',
                isSelected && 'border-brand-500/60 bg-brand-500/10 hover:bg-brand-500/15',
                isHoliday && !isSelected && 'border-accent-rose/20 bg-accent-rose/[0.04]',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums',
                    isWeekend && inMonth && 'text-accent-rose/80',
                    !isWeekend && 'text-text-muted',
                    isToday && 'text-brand-300 font-bold',
                  )}
                >
                  {d.format('D')}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(67,96,245,0.8)]" />
                )}
              </div>

              {isHoliday && (
                <div className="mt-auto space-y-0.5">
                  <div className="text-[10px] leading-tight text-text truncate font-medium">
                    {dayHolidays[0].name}
                  </div>
                  <div className="flex items-center gap-1">
                    {dayHolidays.slice(0, 4).map((h, i) => (
                      <span
                        key={i}
                        className={cn('w-1 h-1 rounded-full', holidayTypeDot(h.type))}
                      />
                    ))}
                    {dayHolidays.length > 4 && (
                      <span className="text-[9px] text-text-dim">+{dayHolidays.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center flex-wrap gap-x-4 gap-y-2 text-[11px]">
        {[
          { type: 'public', label: 'Public' },
          { type: 'bank', label: 'Bank' },
          { type: 'school', label: 'School' },
          { type: 'optional', label: 'Optional' },
          { type: 'observance', label: 'Observance' },
        ].map((t) => (
          <span key={t.type} className="flex items-center gap-1.5 text-text-muted">
            <span className={cn('w-1.5 h-1.5 rounded-full', holidayTypeDot(t.type as any))} />
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
