// Server-side holiday computation. Mirrors the client's logic but tuned for
// use inside the cron job (no React, no dayjs tz dependency).
import Holidays from 'date-holidays';

export interface RawHoliday {
  date: string; // YYYY-MM-DD (date only)
  name: string;
  type: string;
}

const metaCache = new Holidays();

export function countryName(code: string): string {
  try {
    const countries = metaCache.getCountries('en') as Record<string, string>;
    return countries[code] ?? code;
  } catch {
    return code;
  }
}

export function flagFromCode(code: string): string {
  if (!code || code.length !== 2) return '🏳️';
  const A = 127397;
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => c.charCodeAt(0) + A));
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function dateOnly(d: Date | string): string {
  if (typeof d === 'string') {
    // date-holidays returns strings like "2026-01-01 00:00:00" (local time).
    // Take the date prefix verbatim so we don't shift across time zones.
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return d.slice(0, 10);
    return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`;
  }
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function holidaysForCountry(countryCode: string, year: number): RawHoliday[] {
  try {
    const hd = new Holidays(countryCode);
    const raw = (hd.getHolidays(year) ?? []) as Array<{
      date: string;
      name: string;
      type?: string;
    }>;
    return raw
      .map((h) => ({
        date: dateOnly(h.date),
        name: h.name,
        type: h.type ?? 'public',
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

/** Returns the "YYYY-MM-DD" that is `daysAhead` days after `fromYmd` in UTC. */
export function addDays(fromYmd: string, daysAhead: number): string {
  const [y, m, d] = fromYmd.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysAhead);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/**
 * Returns the current date in the given IANA timezone as a YYYY-MM-DD string.
 * This is the "local calendar date" for the user — what they consider "today".
 */
export function todayInZone(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const m = parts.find((p) => p.type === 'month')?.value ?? '01';
    const d = parts.find((p) => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${d}`;
  } catch {
    return dateOnly(new Date());
  }
}

/** Current hour (0-23) in the given timezone. */
export function hourInZone(tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find((p) => p.type === 'hour')?.value ?? '0';
    const n = parseInt(h, 10);
    // Intl sometimes returns "24" for midnight in en-US hour12:false
    return n === 24 ? 0 : n;
  } catch {
    return new Date().getUTCHours();
  }
}

export function diffDays(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map((n) => parseInt(n, 10));
  const [ty, tm, td] = to.split('-').map((n) => parseInt(n, 10));
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}
