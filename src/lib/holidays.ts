import Holidays from 'date-holidays';
import dayjs from 'dayjs';

export type HolidayType = 'public' | 'bank' | 'school' | 'optional' | 'observance';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;       // English (or the country's primary localized name)
  nameLocal?: string; // Country's native-language name, if it differs from `name`
  type: HolidayType;
  rule?: string;
  note?: string;
}

/** "English Name (Native Name)" if both differ, otherwise just the name. */
export function holidayDisplayName(h: { name: string; nameLocal?: string }): string {
  return h.nameLocal && h.nameLocal !== h.name ? `${h.name} (${h.nameLocal})` : h.name;
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

// Best-effort flag from ISO-2 country code
function flagFromCode(code: string): string {
  if (!code || code.length !== 2) return '🏳️';
  const A = 127397;
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => c.charCodeAt(0) + A));
}

const hdMeta = new Holidays();

export function getCountries(): CountryOption[] {
  const countries = hdMeta.getCountries('en') as Record<string, string>;
  return Object.entries(countries)
    .map(([code, name]) => ({ code, name, flag: flagFromCode(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getHolidaysForYear(countryCode: string, year: number): Holiday[] {
  // Use two separate instances — date-holidays caches the last language on
  // a Holidays instance, so calling getHolidays(year, 'en') and then
  // getHolidays(year) returns the same English names. Fresh instances avoid
  // that contamination.
  const hdNative = new Holidays(countryCode);
  const nativeRaw = hdNative.getHolidays(year) ?? [];
  const hdEn = new Holidays(countryCode);
  const englishRaw = hdEn.getHolidays(year, 'en') ?? [];

  const nativeByKey = new Map<string, string>();
  for (const h of nativeRaw as any[]) {
    const key = `${h.date}|${h.rule ?? ''}|${h.type ?? ''}`;
    nativeByKey.set(key, h.name as string);
  }

  return (englishRaw as any[])
    .map((h) => {
      const key = `${h.date}|${h.rule ?? ''}|${h.type ?? ''}`;
      const englishName = h.name as string;
      const native = nativeByKey.get(key);
      return {
        date: dayjs(h.date).format('YYYY-MM-DD'),
        name: englishName,
        nameLocal: native && native !== englishName ? native : undefined,
        type: (h.type as HolidayType) ?? 'public',
        rule: h.rule as string | undefined,
        note: h.note as string | undefined,
      };
    })
    .sort((a: Holiday, b: Holiday) => a.date.localeCompare(b.date));
}

export function groupByDate(holidays: Holiday[]): Map<string, Holiday[]> {
  const map = new Map<string, Holiday[]>();
  for (const h of holidays) {
    const list = map.get(h.date) ?? [];
    list.push(h);
    map.set(h.date, list);
  }
  return map;
}

export function getUpcoming(holidays: Holiday[], from = dayjs()): Holiday[] {
  return holidays.filter((h) => dayjs(h.date).isSame(from, 'day') || dayjs(h.date).isAfter(from, 'day'));
}

export function getNext(holidays: Holiday[], from = dayjs()): Holiday | undefined {
  return getUpcoming(holidays, from)[0];
}

export function daysUntil(dateStr: string, from = dayjs()): number {
  return dayjs(dateStr).startOf('day').diff(from.startOf('day'), 'day');
}

export function holidayTypeColor(type: HolidayType): string {
  switch (type) {
    case 'public':
      return 'text-accent-rose bg-accent-rose/10 border-accent-rose/20';
    case 'bank':
      return 'text-accent-amber bg-accent-amber/10 border-accent-amber/20';
    case 'school':
      return 'text-accent-sky bg-accent-sky/10 border-accent-sky/20';
    case 'optional':
      return 'text-accent-violet bg-accent-violet/10 border-accent-violet/20';
    case 'observance':
      return 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20';
    default:
      return 'text-text-muted bg-bg-hover border-border';
  }
}

export function holidayTypeDot(type: HolidayType): string {
  switch (type) {
    case 'public':
      return 'bg-accent-rose';
    case 'bank':
      return 'bg-accent-amber';
    case 'school':
      return 'bg-accent-sky';
    case 'optional':
      return 'bg-accent-violet';
    case 'observance':
      return 'bg-accent-emerald';
    default:
      return 'bg-text-dim';
  }
}
