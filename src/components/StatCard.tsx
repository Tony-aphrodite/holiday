import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: 'brand' | 'rose' | 'amber' | 'emerald' | 'violet' | 'sky';
  trend?: { value: string; positive?: boolean };
}

const accentMap = {
  brand: 'from-brand-500/20 to-brand-500/0 text-brand-300',
  rose: 'from-accent-rose/20 to-accent-rose/0 text-accent-rose',
  amber: 'from-accent-amber/20 to-accent-amber/0 text-accent-amber',
  emerald: 'from-accent-emerald/20 to-accent-emerald/0 text-accent-emerald',
  violet: 'from-accent-violet/20 to-accent-violet/0 text-accent-violet',
  sky: 'from-accent-sky/20 to-accent-sky/0 text-accent-sky',
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'brand',
  trend,
}: StatCardProps) {
  return (
    <div className="card p-5 relative overflow-hidden group hover:border-border/80 transition">
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none',
          accentMap[accent],
        )}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-text-muted font-medium">{label}</div>
          <div className="text-2xl font-semibold text-text tabular-nums tracking-tight">{value}</div>
          {hint && <div className="text-xs text-text-dim mt-1">{hint}</div>}
        </div>
        <div
          className={cn(
            'w-9 h-9 rounded-lg grid place-items-center border border-white/5 bg-white/[0.03]',
            accentMap[accent].split(' ').pop(),
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {trend && (
        <div className="relative mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded font-medium',
              trend.positive
                ? 'bg-accent-emerald/10 text-accent-emerald'
                : 'bg-accent-rose/10 text-accent-rose',
            )}
          >
            {trend.value}
          </span>
          <span className="text-text-dim">vs previous year</span>
        </div>
      )}
    </div>
  );
}
