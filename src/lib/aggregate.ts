import dayjs from 'dayjs';
import type { Customer } from './customers';
import type { Holiday } from './holidays';
import { getHolidaysForYear } from './holidays';

export interface CustomerHoliday {
  customer: Customer;
  holiday: Holiday;
  daysUntil: number;
}

export function computeUpcomingCustomerHolidays(
  customers: Customer[],
  horizonDays = 180,
  from = dayjs(),
): CustomerHoliday[] {
  const today = from.startOf('day');
  const yearsNeeded = new Set<number>([today.year()]);
  if (today.add(horizonDays, 'day').year() !== today.year()) {
    yearsNeeded.add(today.year() + 1);
  }

  const result: CustomerHoliday[] = [];
  for (const customer of customers) {
    if (!customer.countryCode) continue;
    for (const year of yearsNeeded) {
      let list: Holiday[] = [];
      try {
        list = getHolidaysForYear(customer.countryCode, year);
      } catch {
        continue;
      }
      for (const holiday of list) {
        const d = dayjs(holiday.date).startOf('day');
        const diff = d.diff(today, 'day');
        if (diff >= 0 && diff <= horizonDays) {
          result.push({ customer, holiday, daysUntil: diff });
        }
      }
    }
  }
  result.sort((a, b) => a.daysUntil - b.daysUntil);
  return result;
}

export function nextHolidayForCustomer(customer: Customer, from = dayjs()): CustomerHoliday | undefined {
  if (!customer.countryCode) return undefined;
  const today = from.startOf('day');
  const years = [today.year(), today.year() + 1];
  for (const year of years) {
    let list: Holiday[] = [];
    try {
      list = getHolidaysForYear(customer.countryCode, year);
    } catch {
      continue;
    }
    for (const holiday of list) {
      const d = dayjs(holiday.date).startOf('day');
      const diff = d.diff(today, 'day');
      if (diff >= 0) return { customer, holiday, daysUntil: diff };
    }
  }
  return undefined;
}
