import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireSession } from '../_lib/session.js';
import { getPusher, userChannel } from '../_lib/pusher.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const session = await requireSession(req, res);
  if (!session) return;

  const pusher = getPusher();
  if (!pusher) {
    res.status(503).json({ error: 'Realtime not configured on the server.' });
    return;
  }

  // pusher-js posts application/x-www-form-urlencoded by default; Vercel parses
  // it into req.body for us. Accept JSON too as a fallback.
  const body = (req.body ?? {}) as Record<string, unknown>;
  const socketId = typeof body.socket_id === 'string' ? body.socket_id : '';
  const channelName = typeof body.channel_name === 'string' ? body.channel_name : '';
  if (!socketId || !channelName) {
    res.status(400).json({ error: 'Missing socket_id or channel_name.' });
    return;
  }

  // Only allow subscribing to the caller's own inbox channel.
  if (channelName !== userChannel(session.userId)) {
    res.status(403).json({ error: 'Forbidden channel.' });
    return;
  }

  const auth = pusher.authorizeChannel(socketId, channelName);
  res.status(200).json(auth);
}
