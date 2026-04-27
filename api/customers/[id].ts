import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, type CustomerRow } from '../_lib/db.js';
import { requireSession } from '../_lib/session.js';
import { optionalString, stringArray, trimString } from '../_lib/validation.js';
import { rowToDTO } from '../_lib/customer.js';

const ALLOWED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'INR', 'BRL', 'MXN', 'CAD', 'AUD', 'CHF', 'SGD', 'HKD', 'AED',
];

function clampInt(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const n = Math.floor(v);
  if (n < 0 || n > 1_000_000) return null;
  return n;
}

function clampDecimal(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (v < 0 || v > 99_999_999_999.99) return null;
  return Math.round(v * 100) / 100;
}

function normalizeCurrency(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const u = v.trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.includes(u)) return null;
  return u;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) {
    res.status(400).json({ error: 'Missing customer id.' });
    return;
  }

  if (req.method === 'PATCH') {
    const body = (req.body ?? {}) as Record<string, unknown>;

    const name = 'name' in body ? trimString(body.name) : null;
    const countryCode =
      'countryCode' in body ? trimString(body.countryCode).toUpperCase() : null;
    const email = 'email' in body ? optionalString(body.email) : undefined;
    const whatsapp = 'whatsapp' in body ? optionalString(body.whatsapp) : undefined;
    const phone = 'phone' in body ? optionalString(body.phone) : undefined;
    const company = 'company' in body ? optionalString(body.company) : undefined;
    const notes = 'notes' in body ? optionalString(body.notes) : undefined;
    const tags = 'tags' in body ? stringArray(body.tags) : undefined;
    const projectsCompleted = 'projectsCompleted' in body ? clampInt(body.projectsCompleted) : null;
    const totalRevenue = 'totalRevenue' in body ? clampDecimal(body.totalRevenue) : null;
    const currency = 'currency' in body ? normalizeCurrency(body.currency) : null;

    if ('projectsCompleted' in body && projectsCompleted === null) {
      res.status(400).json({ error: 'projectsCompleted must be a non-negative integer.' });
      return;
    }
    if ('totalRevenue' in body && totalRevenue === null) {
      res.status(400).json({ error: 'totalRevenue must be a non-negative number.' });
      return;
    }
    if ('currency' in body && currency === null) {
      res.status(400).json({ error: 'currency must be a supported ISO 4217 code.' });
      return;
    }

    const rows = (await sql`
      UPDATE customers SET
        name               = COALESCE(${name}, name),
        country_code       = COALESCE(${countryCode}, country_code),
        email              = CASE WHEN ${email === undefined} THEN email ELSE ${email ?? null} END,
        whatsapp           = CASE WHEN ${whatsapp === undefined} THEN whatsapp ELSE ${whatsapp ?? null} END,
        phone              = CASE WHEN ${phone === undefined} THEN phone ELSE ${phone ?? null} END,
        company            = CASE WHEN ${company === undefined} THEN company ELSE ${company ?? null} END,
        notes              = CASE WHEN ${notes === undefined} THEN notes ELSE ${notes ?? null} END,
        tags               = CASE WHEN ${tags === undefined} THEN tags ELSE ${tags ?? []}::text[] END,
        projects_completed = COALESCE(${projectsCompleted}, projects_completed),
        total_revenue      = COALESCE(${totalRevenue}, total_revenue),
        currency           = COALESCE(${currency}, currency)
      WHERE id = ${id} AND user_id = ${session.userId}
      RETURNING id, user_id, name, country_code, email, whatsapp, phone, company, notes, tags,
                projects_completed, total_revenue, currency, created_at
    `) as CustomerRow[];

    if (rows.length === 0) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    res.status(200).json({ customer: rowToDTO(rows[0]) });
    return;
  }

  if (req.method === 'DELETE') {
    const result = (await sql`
      DELETE FROM customers
      WHERE id = ${id} AND user_id = ${session.userId}
      RETURNING id
    `) as { id: string }[];
    if (result.length === 0) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  res.status(405).json({ error: 'Method not allowed.' });
}
