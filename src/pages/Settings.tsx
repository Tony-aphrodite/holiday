import dayjs from 'dayjs';
import { useState } from 'react';
import { Clock, Globe2, RotateCcw, Check, Mail, Bell, AlertTriangle, Info } from 'lucide-react';
import {
  COMMON_TIMEZONES,
  useSettings,
  type DateFormat,
  type LeadDays,
  type TimeFormat,
} from '../lib/SettingsContext';
import { useAuth } from '../lib/AuthContext';

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
          Customize how Holidaze displays times and when it emails you.
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

        <Section icon={Globe2} label="Timezone" hint="All dates are converted to this timezone before display.">
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

        <Section icon={Clock} label="Time format" hint="How times are displayed in chat and timestamps.">
          <RadioGroup
            options={[
              { value: '24h', label: '24-hour', example: '14:30' },
              { value: '12h', label: '12-hour', example: '2:30 PM' },
            ]}
            value={settings.timeFormat}
            onChange={(v) => setTimeFormat(v as TimeFormat)}
          />
        </Section>

        <Section icon={Clock} label="Date format" hint="How dates are displayed throughout the app.">
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
          <button onClick={reset} className="btn-ghost text-xs py-1.5 px-3" title="Reset to defaults">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to defaults
          </button>
        </div>
      </div>

      <EmailNotificationsCard />
    </div>
  );
}

function EmailNotificationsCard() {
  const { emailPrefs, emailPrefsLoading, emailPrefsError, updateEmailPrefs } = useSettings();
  const { user } = useAuth();
  const [saveError, setSaveError] = useState<string | null>(null);

  async function apply(patch: Partial<NonNullable<typeof emailPrefs>>) {
    setSaveError(null);
    const res = await updateEmailPrefs(patch);
    if (!res.ok) setSaveError(res.error ?? 'Could not save.');
  }

  return (
    <div className="card p-5 md:p-6 space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-accent-rose/15 border border-accent-rose/30 grid place-items-center">
          <Mail className="w-4 h-4 text-accent-rose" />
        </div>
        <div>
          <div className="text-base font-semibold text-text">Email notifications</div>
          <div className="text-[11px] text-text-muted">
            We'll email you before a customer's national holiday so you can reach out at the right moment.
          </div>
        </div>
      </div>

      {emailPrefsLoading && !emailPrefs ? (
        <div className="text-sm text-text-dim">Loading preferences…</div>
      ) : emailPrefsError && !emailPrefs ? (
        <div className="text-sm text-accent-rose bg-accent-rose/10 border border-accent-rose/30 rounded-lg px-3 py-2">
          {emailPrefsError}
        </div>
      ) : emailPrefs ? (
        <>
          {/* Enabled toggle */}
          <Section
            icon={Bell}
            label="Email alerts"
            hint={
              user?.email
                ? `We'll send to ${user.email}.`
                : 'We\'ll send to your account email address.'
            }
          >
            <Toggle checked={emailPrefs.enabled} onChange={(v) => apply({ enabled: v })} />
          </Section>

          {/* Lead days */}
          <Section
            icon={Clock}
            label="Lead time"
            hint="How many days before the holiday you want the email."
          >
            <RadioGroup
              disabled={!emailPrefs.enabled}
              options={[
                { value: '1', label: '1 day', example: 'day before' },
                { value: '3', label: '3 days', example: 'classic' },
                { value: '7', label: '1 week', example: 'ahead of time' },
                { value: '14', label: '2 weeks', example: 'plan ahead' },
                { value: '30', label: '30 days', example: 'far ahead' },
              ]}
              value={String(emailPrefs.leadDays)}
              onChange={(v) => apply({ leadDays: parseInt(v, 10) as LeadDays })}
            />
          </Section>

          {/* Timezone for email */}
          <Section
            icon={Globe2}
            label="Email timezone"
            hint="Determines both the delivery hour and which calendar date counts as 'today' for lead-time math."
          >
            <select
              disabled={!emailPrefs.enabled}
              value={emailPrefs.timezone}
              onChange={(e) => apply({ timezone: e.target.value })}
              className="input w-full max-w-md disabled:opacity-50"
            >
              {COMMON_TIMEZONES.filter((tz) => tz.value !== 'system').map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} · {tz.value}
                </option>
              ))}
            </select>
          </Section>

          {/* Summary strip */}
          <div className="border-t border-border pt-4">
            <div className="rounded-lg bg-bg-soft border border-border p-4">
              <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold mb-1">
                Summary
              </div>
              <div className="text-sm text-text leading-relaxed">
                {emailPrefs.enabled ? (
                  <>
                    Email me <b>{leadDaysLabel(emailPrefs.leadDays)}</b> before any customer's
                    national holiday. Calendar dates are evaluated in{' '}
                    <span className="font-mono">{emailPrefs.timezone}</span>.
                  </>
                ) : (
                  <>Email notifications are off. You won't receive holiday alerts.</>
                )}
              </div>
              <div className="mt-2.5 text-[11px] text-text-muted flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-text-dim" />
                <span>
                  Emails go out once per day. Delivery hour is determined by the server schedule (around 13:00 UTC).
                </span>
              </div>
            </div>
          </div>

          {saveError && (
            <div className="text-sm text-accent-rose bg-accent-rose/10 border border-accent-rose/30 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="text-[11px] text-text-dim flex items-center gap-1.5 border-t border-border pt-4">
            <Check className="w-3.5 h-3.5 text-accent-emerald" />
            Changes save automatically.
          </div>
        </>
      ) : null}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
        checked
          ? 'bg-brand-500 border-brand-500'
          : 'bg-bg-soft border-border'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function leadDaysLabel(n: number): string {
  if (n === 1) return '1 day';
  if (n === 7) return '1 week';
  if (n === 14) return '2 weeks';
  return `${n} days`;
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
  disabled,
}: {
  options: { value: string; label: string; example: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
