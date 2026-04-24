import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { sql, type UserRow } from '../_lib/db.js';
import { createSessionToken, setSessionCookie } from '../_lib/session.js';
import { normalizeEmail } from '../_lib/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'Enter your email and password.' });
    return;
  }

  const rows = (await sql`
    SELECT id, email, name, password_hash, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `) as UserRow[];

  const user = rows[0];
  const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!user || !ok) {
    res.status(401).json({ error: 'Incorrect email or password.' });
    return;
  }

  const token = await createSessionToken({ userId: user.id, email: user.email });
  setSessionCookie(res, token);

  res.status(200).json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
  });
}
