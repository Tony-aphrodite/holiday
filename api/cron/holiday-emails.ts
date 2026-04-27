import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, newId } from '../_lib/db.js';
import {
  addDays,
  countryName,
  diffDays,
  flagFromCode,
  holidaysForCountry,
  todayInZone,
} from '../_lib/holidays.js';
import { sendHolidayEmail, type HolidayForEmail } from '../_lib/email.js';

interface UserRow {
  id: string;
  name: string;
  email: string;
  email_notifications_enabled: boolean;
  email_lead_days: number;
  email_send_hour: number;
  email_timezone: string;
}

interface CustomerRow {
  id: string;
  name: string;
  country_code: string;
}

/**
 * Vercel Cron target. Runs every hour. Protected by CRON_SECRET — Vercel
 * includes the secret in the Authorization header for scheduled invocations
 * (when CRON_SECRET is set in env vars).
 *
 * Strategy per user:
 *  1. If notifications disabled → skip.
 *  2. If the current hour in the user's configured timezone ≠ their preferred
 *     send hour → skip.
 *  3. Look at each customer's country, find holidays that are *exactly*
 *     `lead_days` days away in the user's local calendar.
 *  4. For each match not already in holiday_email_log, add to the email.
 *  5. Send one email covering all matches. Record each match in the log.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth: allow if Authorization header matches CRON_SECRET, OR if a
  // ?key=... query param matches (for manual test runs).
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.authorization ?? '';
    const queryKey = typeof req.query.key === 'string' ? req.query.key : '';
    const ok = header === `Bearer ${secret}` || queryKey === secret;
    if (!ok) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }
  }

  const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';
  const forceUserId = typeof req.query.userId === 'string' ? req.query.userId : null;

  const users = forceUserId
    ? ((await sql`
        SELECT id, name, email,
               email_notifications_enabled,
               email_lead_days,
               email_send_hour,
               email_timezone
        FROM users
        WHERE id = ${forceUserId}
      `) as UserRow[])
    : ((await sql`
        SELECT id, name, email,
               email_notifications_enabled,
               email_lead_days,
               email_send_hour,
               email_timezone
        FROM users
        WHERE email_notifications_enabled = TRUE
      `) as UserRow[]);

  const report: Array<{
    userId: string;
    email: string;
    skipped?: string;
    sent?: { count: number; id?: string };
    error?: string;
  }> = [];

  for (const user of users) {
    if (!user.email_notifications_enabled) {
      report.push({ userId: user.id, email: user.email, skipped: 'notifications disabled' });
      continue;
    }

    const tz = user.email_timezone || 'UTC';
    const today = todayInZone(tz);
    const targetDate = addDays(today, user.email_lead_days);

    const customers = (await sql`
      SELECT id, name, country_code
      FROM customers
      WHERE user_id = ${user.id}
    `) as CustomerRow[];

    // Build candidate matches: (customer × holiday) landing on targetDate.
    const matches: Array<{
      customer: CustomerRow;
      holidayDate: string;
      holidayName: string;
      holidayNameLocal?: string;
      holidayType: string;
    }> = [];

    const year = parseInt(targetDate.slice(0, 4), 10);
    for (const c of customers) {
      const holidays = holidaysForCountry(c.country_code, year);
      for (const h of holidays) {
        if (h.date === targetDate) {
          matches.push({
            customer: c,
            holidayDate: h.date,
            holidayName: h.name,
            holidayNameLocal: h.nameLocal,
            holidayType: h.type,
          });
        }
      }
    }

    if (matches.length === 0) {
      report.push({ userId: user.id, email: user.email, skipped: 'no holidays on target date' });
      continue;
    }

    // Dedupe against holiday_email_log (so retries / re-runs don't re-send).
    const dedupedMatches: typeof matches = [];
    for (const m of matches) {
      const seen = (await sql`
        SELECT 1 FROM holiday_email_log
        WHERE user_id = ${user.id}
          AND customer_id = ${m.customer.id}
          AND holiday_date = ${m.holidayDate}
          AND holiday_name = ${m.holidayName}
        LIMIT 1
      `) as unknown[];
      if (seen.length === 0) dedupedMatches.push(m);
    }

    if (dedupedMatches.length === 0) {
      report.push({
        userId: user.id,
        email: user.email,
        skipped: 'all matches already sent',
      });
      continue;
    }

    const payload: HolidayForEmail[] = dedupedMatches.map((m) => {
      const item: HolidayForEmail = {
        customerName: m.customer.name,
        countryName: countryName(m.customer.country_code),
        flag: flagFromCode(m.customer.country_code),
        holidayName: m.holidayName,
        holidayDate: m.holidayDate,
        daysUntil: diffDays(today, m.holidayDate),
        type: m.holidayType,
      };
      if (m.holidayNameLocal) item.holidayNameLocal = m.holidayNameLocal;
      return item;
    });

    if (dryRun) {
      report.push({
        userId: user.id,
        email: user.email,
        sent: { count: payload.length },
        skipped: 'dry run (no email sent, no log rows)',
      });
      continue;
    }

    const sendRes = await sendHolidayEmail(user.email, user.name, payload, tz);
    if (!sendRes.ok) {
      report.push({ userId: user.id, email: user.email, error: sendRes.error });
      continue;
    }

    // Log each match so we don't resend.
    for (const m of dedupedMatches) {
      try {
        await sql`
          INSERT INTO holiday_email_log (id, user_id, customer_id, holiday_date, holiday_name)
          VALUES (${newId('hel')}, ${user.id}, ${m.customer.id}, ${m.holidayDate}, ${m.holidayName})
          ON CONFLICT ON CONSTRAINT holiday_email_log_unique DO NOTHING
        `;
      } catch (err) {
        console.error('holiday_email_log insert failed', err);
      }
    }

    report.push({
      userId: user.id,
      email: user.email,
      sent: { count: payload.length, id: sendRes.id },
    });
  }

  res.status(200).json({
    ok: true,
    at: new Date().toISOString(),
    processed: users.length,
    report,
  });
}
