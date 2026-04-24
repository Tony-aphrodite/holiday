import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useAuth } from './AuthContext';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

export type TimeFormat = '12h' | '24h';
export type DateFormat = 'MDY' | 'DMY' | 'YMD';

export interface TimeSettings {
  timezone: string; // IANA, or 'system' to use the browser's zone
  timeFormat: TimeFormat;
  dateFormat: DateFormat;
}

const DEFAULTS: TimeSettings = {
  timezone: 'system',
  timeFormat: '24h',
  dateFormat: 'MDY',
};

const PREFIX = 'holidaze.settings.time.';

function storageKey(userId: string | null | undefined): string {
  return PREFIX + (userId ?? 'anon');
}

function loadSettings(userId: string | null | undefined): TimeSettings {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<TimeSettings>;
    return {
      timezone: typeof parsed.timezone === 'string' ? parsed.timezone : DEFAULTS.timezone,
      timeFormat: parsed.timeFormat === '12h' || parsed.timeFormat === '24h' ? parsed.timeFormat : DEFAULTS.timeFormat,
      dateFormat:
        parsed.dateFormat === 'MDY' || parsed.dateFormat === 'DMY' || parsed.dateFormat === 'YMD'
          ? parsed.dateFormat
          : DEFAULTS.dateFormat,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function systemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function resolveZone(tz: string): string {
  return tz === 'system' ? systemTimezone() : tz;
}

function timePatternFor(fmt: TimeFormat): string {
  return fmt === '24h' ? 'HH:mm' : 'h:mm A';
}

function datePatternFor(fmt: DateFormat): string {
  return fmt === 'DMY' ? 'DD/MM/YYYY' : fmt === 'YMD' ? 'YYYY-MM-DD' : 'MM/DD/YYYY';
}

function prettyDatePatternFor(fmt: DateFormat): string {
  // Human-friendly variant used for things like the Dashboard "Updated"
  return fmt === 'DMY' ? 'D MMM YYYY' : fmt === 'YMD' ? 'YYYY MMM D' : 'MMM D, YYYY';
}

interface SettingsContextValue {
  settings: TimeSettings;
  resolvedTimezone: string;
  setTimezone: (tz: string) => void;
  setTimeFormat: (f: TimeFormat) => void;
  setDateFormat: (f: DateFormat) => void;
  reset: () => void;
  // Formatters that honor the user's preferences. Inputs accept ISO strings,
  // Date objects, or anything dayjs() understands.
  formatTime: (input: string | number | Date | dayjs.Dayjs) => string;
  formatDate: (input: string | number | Date | dayjs.Dayjs) => string;
  formatDateTime: (input: string | number | Date | dayjs.Dayjs) => string;
  formatPrettyDate: (input: string | number | Date | dayjs.Dayjs) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [settings, setSettings] = useState<TimeSettings>(() => loadSettings(userId));

  // Reload when auth user changes.
  useEffect(() => {
    setSettings(loadSettings(userId));
  }, [userId]);

  // Persist whenever settings change.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings, userId]);

  const resolvedTimezone = useMemo(() => resolveZone(settings.timezone), [settings.timezone]);

  const setTimezone = useCallback((tz: string) => setSettings((s) => ({ ...s, timezone: tz })), []);
  const setTimeFormat = useCallback((f: TimeFormat) => setSettings((s) => ({ ...s, timeFormat: f })), []);
  const setDateFormat = useCallback((f: DateFormat) => setSettings((s) => ({ ...s, dateFormat: f })), []);
  const reset = useCallback(() => setSettings({ ...DEFAULTS }), []);

  const timePattern = timePatternFor(settings.timeFormat);
  const datePattern = datePatternFor(settings.dateFormat);
  const prettyDatePattern = prettyDatePatternFor(settings.dateFormat);

  const formatTime = useCallback(
    (input: string | number | Date | dayjs.Dayjs) =>
      dayjs(input).tz(resolvedTimezone).format(timePattern),
    [resolvedTimezone, timePattern],
  );
  const formatDate = useCallback(
    (input: string | number | Date | dayjs.Dayjs) =>
      dayjs(input).tz(resolvedTimezone).format(datePattern),
    [resolvedTimezone, datePattern],
  );
  const formatDateTime = useCallback(
    (input: string | number | Date | dayjs.Dayjs) =>
      dayjs(input).tz(resolvedTimezone).format(`${datePattern} ${timePattern}`),
    [resolvedTimezone, datePattern, timePattern],
  );
  const formatPrettyDate = useCallback(
    (input: string | number | Date | dayjs.Dayjs) =>
      dayjs(input).tz(resolvedTimezone).format(prettyDatePattern),
    [resolvedTimezone, prettyDatePattern],
  );

  const value = useMemo(
    () => ({
      settings,
      resolvedTimezone,
      setTimezone,
      setTimeFormat,
      setDateFormat,
      reset,
      formatTime,
      formatDate,
      formatDateTime,
      formatPrettyDate,
    }),
    [settings, resolvedTimezone, setTimezone, setTimeFormat, setDateFormat, reset, formatTime, formatDate, formatDateTime, formatPrettyDate],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

// Common IANA timezones — kept short; users can also pick 'system'.
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: 'system', label: 'System default' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'America/Denver', label: 'Denver (MT)' },
  { value: 'America/Chicago', label: 'Chicago (CT)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris / Berlin' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Africa/Cairo', label: 'Cairo' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'Kolkata / Mumbai' },
  { value: 'Asia/Bangkok', label: 'Bangkok' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Shanghai', label: 'Shanghai / Beijing' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
];
