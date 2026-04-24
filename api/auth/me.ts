import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, type UserRow } from '../_lib/db.js';
import { getSession } from '../_lib/session.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await getSession(req);
  if (!session) {
    res.status(200).json({ user: null });
    return;
  }

  const rows = (await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `) as Pick<UserRow, 'id' | 'email' | 'name' | 'created_at'>[];

  const user = rows[0];
  if (!user) {
    res.status(200).json({ user: null });
    return;
  }
  res.status(200).json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
  });
}
