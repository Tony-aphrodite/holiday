import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { requireSession } from '../_lib/session.js';

interface UserListRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const rows = (await sql`
    SELECT id, name, email, created_at
    FROM users
    WHERE id <> ${session.userId}
    ORDER BY created_at ASC
  `) as UserListRow[];

  res.status(200).json({
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.created_at,
    })),
  });
}
