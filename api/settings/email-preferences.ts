import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { requireSession } from '../_lib/session.js';

interface PrefRow {
  email_notifications_enabled: boolean;
  email_lead_days: number;
  email_send_hour: number;
  email_timezone: string;
}

const ALLOWED_LEAD_DAYS = [1, 3, 7, 14, 30];

function clampHour(h: unknown): number | null {
  if (typeof h !== 'number' || !Number.isInteger(h)) return null;
  if (h < 0 || h > 23) return null;
  return h;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const rows = (await sql`
      SELECT email_notifications_enabled, email_lead_days, email_send_hour, email_timezone
      FROM users
      WHERE id = ${session.userId}
      LIMIT 1
    `) as PrefRow[];
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.status(200).json({
      preferences: {
        enabled: row.email_notifications_enabled,
        leadDays: row.email_lead_days,
        sendHour: row.email_send_hour,
        timezone: row.email_timezone,
      },
    });
    return;
  }

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const enabled = 'enabled' in body ? Boolean(body.enabled) : null;
    const leadDaysRaw = 'leadDays' in body ? body.leadDays : null;
    const sendHourRaw = 'sendHour' in body ? body.sendHour : null;
    const timezoneRaw = 'timezone' in body ? body.timezone : null;

    const leadDays =
      leadDaysRaw === null
        ? null
        : typeof leadDaysRaw === 'number' && ALLOWED_LEAD_DAYS.includes(leadDaysRaw)
          ? leadDaysRaw
          : undefined;
    if (leadDays === undefined) {
      res.status(400).json({ error: `leadDays must be one of ${ALLOWED_LEAD_DAYS.join(', ')}.` });
      return;
    }

    const sendHour = sendHourRaw === null ? null : clampHour(sendHourRaw);
    if (sendHourRaw !== null && sendHour === null) {
      res.status(400).json({ error: 'sendHour must be an integer 0-23.' });
      return;
    }

    const timezone =
      timezoneRaw === null
        ? null
        : typeof timezoneRaw === 'string' && timezoneRaw.trim().length > 0
          ? timezoneRaw.trim()
          : undefined;
    if (timezone === undefined) {
      res.status(400).json({ error: 'timezone must be a non-empty IANA zone string.' });
      return;
    }

    const rows = (await sql`
      UPDATE users SET
        email_notifications_enabled = COALESCE(${enabled}, email_notifications_enabled),
        email_lead_days             = COALESCE(${leadDays}, email_lead_days),
        email_send_hour             = COALESCE(${sendHour}, email_send_hour),
        email_timezone              = COALESCE(${timezone}, email_timezone)
      WHERE id = ${session.userId}
      RETURNING email_notifications_enabled, email_lead_days, email_send_hour, email_timezone
    `) as PrefRow[];

    const row = rows[0];
    res.status(200).json({
      preferences: {
        enabled: row.email_notifications_enabled,
        leadDays: row.email_lead_days,
        sendHour: row.email_send_hour,
        timezone: row.email_timezone,
      },
    });
    return;
  }

  res.setHeader('Allow', 'GET, PATCH');
  res.status(405).json({ error: 'Method not allowed.' });
}
