import dayjs from 'dayjs';
import { Clock, Globe2, RotateCcw, Check } from 'lucide-react';
import { COMMON_TIMEZONES, useSettings, type DateFormat, type TimeFormat } from '../lib/SettingsContext';

export default function Settings() {
  const {
    settings,
    resolvedTimezone,
    setTimezone,
    setTimeFormat,
    setDateFormat,
    reset,
    formatTime,
    formatDate,
    formatDateTime,
  } = useSettings();

  const now = dayjs();

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-text tracking-tight">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Customize how Holidaze displays times and dates for you.
        </p>
      </div>

      <div className="card p-5 md:p-6 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-500/15 border border-brand-500/30 grid place-items-center">
            <Clock className="w-4 h-4 text-brand-300" />
          </div>
          <div>
            <div className="text-base font-semibold text-text">Time & region</div>
            <div className="text-[11px] text-text-muted">
              Affects holiday dates, chat timestamps, and everything else with a time.
            </div>
          </div>
        </div>

        {/* Timezone */}
        <Section
          icon={Globe2}
          label="Timezone"
          hint="All dates are converted to this timezone before display."
        >
          <select
            value={settings.timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="input w-full max-w-md"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
                {tz.value !== 'system' ? ` · ${tz.value}` : ''}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-text-dim mt-2">
            Currently resolved as <span className="text-text-muted font-mono">{resolvedTimezone}</span>
          </div>
        </Section>

        {/* Time format */}
        <Section
          icon={Clock}
          label="Time format"
          hint="How times are displayed in chat and timestamps."
        >
          <RadioGroup
            options={[
              { value: '24h', label: '24-hour', example: '14:30' },
              { value: '12h', label: '12-hour', example: '2:30 PM' },
            ]}
            value={settings.timeFormat}
            onChange={(v) => setTimeFormat(v as TimeFormat)}
          />
        </Section>

        {/* Date format */}
        <Section
          icon={Clock}
          label="Date format"
          hint="How dates are displayed throughout the app."
        >
          <RadioGroup
            options={[
              { value: 'MDY', label: 'Month / Day / Year', example: '04/25/2026' },
              { value: 'DMY', label: 'Day / Month / Year', example: '25/04/2026' },
              { value: 'YMD', label: 'Year - Month - Day', example: '2026-04-25' },
            ]}
            value={settings.dateFormat}
            onChange={(v) => setDateFormat(v as DateFormat)}
          />
        </Section>

        {/* Live preview */}
        <div className="border-t border-border pt-5">
          <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold mb-3">
            Live preview
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PreviewChip label="Time" value={formatTime(now)} />
            <PreviewChip label="Date" value={formatDate(now)} />
            <PreviewChip label="Date & time" value={formatDateTime(now)} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 flex-wrap gap-2">
          <div className="text-[11px] text-text-dim flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-accent-emerald" />
            Changes save automatically.
          </div>
          <button
            onClick={reset}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-text-dim" />
        <div className="text-sm font-medium text-text">{label}</div>
      </div>
      {hint && <div className="text-[11px] text-text-muted mb-2.5">{hint}</div>}
      {children}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; example: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border px-3 py-2.5 text-left transition ${
              active
                ? 'border-brand-500/50 bg-brand-500/10'
                : 'border-border bg-bg-soft hover:bg-bg-hover'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-text">{opt.label}</div>
              {active && (
                <div className="w-4 h-4 rounded-full bg-brand-500 text-white grid place-items-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5 font-mono">{opt.example}</div>
          </button>
        );
      })}
    </div>
  );
}

function PreviewChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-soft border border-border px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">{label}</div>
      <div className="text-sm text-text font-mono mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}
