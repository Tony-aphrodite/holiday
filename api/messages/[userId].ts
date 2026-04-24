import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, newId } from '../_lib/db.js';
import { requireSession } from '../_lib/session.js';
import { trimString } from '../_lib/validation.js';

interface MessageRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string;
}

interface UserLite {
  id: string;
  name: string;
  email: string;
}

const MAX_BODY = 4000;
const PAGE_LIMIT = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await requireSession(req, res);
  if (!session) return;

  const otherId = typeof req.query.userId === 'string' ? req.query.userId : '';
  if (!otherId) {
    res.status(400).json({ error: 'Missing user id.' });
    return;
  }
  if (otherId === session.userId) {
    res.status(400).json({ error: 'Cannot chat with yourself.' });
    return;
  }

  // Verify the peer exists so we return a sensible error instead of an empty thread.
  const peers = (await sql`
    SELECT id, name, email FROM users WHERE id = ${otherId} LIMIT 1
  `) as UserLite[];
  const peer = peers[0];
  if (!peer) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (req.method === 'GET') {
    const sinceRaw = typeof req.query.since === 'string' ? req.query.since : '';
    const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? sinceRaw : null;

    const rows = since
      ? ((await sql`
          SELECT id, from_user_id, to_user_id, body, created_at
          FROM messages
          WHERE ((from_user_id = ${session.userId} AND to_user_id = ${otherId})
              OR (from_user_id = ${otherId} AND to_user_id = ${session.userId}))
            AND created_at > ${since}
          ORDER BY created_at ASC
          LIMIT ${PAGE_LIMIT}
        `) as MessageRow[])
      : ((await sql`
          SELECT id, from_user_id, to_user_id, body, created_at
          FROM messages
          WHERE (from_user_id = ${session.userId} AND to_user_id = ${otherId})
             OR (from_user_id = ${otherId} AND to_user_id = ${session.userId})
          ORDER BY created_at ASC
          LIMIT ${PAGE_LIMIT}
        `) as MessageRow[]);

    res.status(200).json({
      peer: { id: peer.id, name: peer.name, email: peer.email },
      messages: rows.map((m) => ({
        id: m.id,
        fromUserId: m.from_user_id,
        toUserId: m.to_user_id,
        body: m.body,
        createdAt: m.created_at,
      })),
    });
    return;
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const text = trimString(body.body);
    if (!text) {
      res.status(400).json({ error: 'Message body required.' });
      return;
    }
    if (text.length > MAX_BODY) {
      res.status(400).json({ error: `Message too long (max ${MAX_BODY} chars).` });
      return;
    }

    const id = newId('m');
    const rows = (await sql`
      INSERT INTO messages (id, from_user_id, to_user_id, body)
      VALUES (${id}, ${session.userId}, ${otherId}, ${text})
      RETURNING id, from_user_id, to_user_id, body, created_at
    `) as MessageRow[];

    const m = rows[0];
    res.status(201).json({
      message: {
        id: m.id,
        fromUserId: m.from_user_id,
        toUserId: m.to_user_id,
        body: m.body,
        createdAt: m.created_at,
      },
    });
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed.' });
}
