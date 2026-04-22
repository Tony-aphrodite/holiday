import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { Holiday } from '../lib/holidays';

interface MonthBreakdownProps {
  holidays: Holiday[];
  year: number;
}

export default function MonthBreakdown({ holidays, year }: MonthBreakdownProps) {
  const counts = useMemo(() => {
    const arr = new Array(12).fill(0);
    for (const h of holidays) {
      const m = dayjs(h.date).month();
      arr[m] += 1;
    }
    return arr;
  }, [holidays]);

  const max = Math.max(1, ...counts);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text">Holidays by month</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {holidays.length} total in {year}
          </p>
        </div>
      </div>

      <div className="flex items-end gap-1.5 h-32">
        {counts.map((c, i) => {
          const h = (c / max) * 100;
          const isCurrent = dayjs().year() === year && dayjs().month() === i;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="text-[10px] font-semibold text-text-muted tabular-nums h-3">
                {c > 0 ? c : ''}
              </div>
              <div className="w-full h-full flex items-end">
                <div
                  className={`w-full rounded-t transition-all group-hover:opacity-90 ${
                    isCurrent
                      ? 'bg-gradient-to-t from-brand-500 to-brand-400'
                      : 'bg-gradient-to-t from-brand-500/30 to-brand-400/20'
                  }`}
                  style={{ height: `${Math.max(h, c > 0 ? 6 : 2)}%` }}
                />
              </div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider">
                {dayjs().month(i).format('MMM').slice(0, 1)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
