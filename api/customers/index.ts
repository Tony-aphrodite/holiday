import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, newId, type CustomerRow } from '../_lib/db.js';
import { requireSession } from '../_lib/session.js';
import { optionalString, stringArray, trimString } from '../_lib/validation.js';
import { rowToDTO } from '../_lib/customer.js';

const ALLOWED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'INR', 'BRL', 'MXN', 'CAD', 'AUD', 'CHF', 'SGD', 'HKD', 'AED',
];

function clampInt(v: unknown, min = 0, max = 1_000_000): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return min;
  const n = Math.floor(v);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function clampDecimal(v: unknown, min = 0, max = 99_999_999_999.99): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return Math.round(v * 100) / 100; // 2 decimals
}

function normalizeCurrency(v: unknown): string {
  if (typeof v !== 'string') return 'USD';
  const u = v.trim().toUpperCase();
  return ALLOWED_CURRENCIES.includes(u) ? u : 'USD';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const rows = (await sql`
      SELECT id, user_id, name, country_code, email, whatsapp, phone, company, notes, tags,
             projects_completed, total_revenue, currency, created_at
      FROM customers
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
    `) as CustomerRow[];
    res.status(200).json({ customers: rows.map(rowToDTO) });
    return;
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = trimString(body.name);
    const countryCode = trimString(body.countryCode).toUpperCase();
    if (!name || !countryCode) {
      res.status(400).json({ error: 'Name and country are required.' });
      return;
    }
    const id = newId('c');
    const email = optionalString(body.email);
    const whatsapp = optionalString(body.whatsapp);
    const phone = optionalString(body.phone);
    const company = optionalString(body.company);
    const notes = optionalString(body.notes);
    const tags = stringArray(body.tags);
    const projectsCompleted = clampInt(body.projectsCompleted, 0, 1_000_000);
    const totalRevenue = clampDecimal(body.totalRevenue);
    const currency = normalizeCurrency(body.currency);

    const rows = (await sql`
      INSERT INTO customers (
        id, user_id, name, country_code, email, whatsapp, phone, company, notes, tags,
        projects_completed, total_revenue, currency
      )
      VALUES (
        ${id}, ${session.userId}, ${name}, ${countryCode}, ${email}, ${whatsapp}, ${phone},
        ${company}, ${notes}, ${tags}, ${projectsCompleted}, ${totalRevenue}, ${currency}
      )
      RETURNING id, user_id, name, country_code, email, whatsapp, phone, company, notes, tags,
                projects_completed, total_revenue, currency, created_at
    `) as CustomerRow[];

    res.status(201).json({ customer: rowToDTO(rows[0]) });
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed.' });
}
