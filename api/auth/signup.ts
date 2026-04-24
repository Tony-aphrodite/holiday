import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { sql, newId, type UserRow } from '../_lib/db.js';
import { createSessionToken, setSessionCookie } from '../_lib/session.js';
import { emailValid, normalizeEmail, trimString } from '../_lib/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const name = trimString(body.name);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name) {
    res.status(400).json({ error: 'Please enter your name.' });
    return;
  }
  if (!emailValid(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }

  const existing = (await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`) as { id: string }[];
  if (existing.length > 0) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const id = newId('u');
  const hash = await bcrypt.hash(password, 10);

  const inserted = (await sql`
    INSERT INTO users (id, email, name, password_hash)
    VALUES (${id}, ${email}, ${name}, ${hash})
    RETURNING id, email, name, created_at
  `) as Pick<UserRow, 'id' | 'email' | 'name' | 'created_at'>[];

  const user = inserted[0];
  const token = await createSessionToken({ userId: user.id, email: user.email });
  setSessionCookie(res, token);

  res.status(200).json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
  });
}
