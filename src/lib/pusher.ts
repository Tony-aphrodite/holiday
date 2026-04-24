import PusherClient from 'pusher-js';

const KEY = import.meta.env.VITE_PUSHER_KEY as string | undefined;
const CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER as string | undefined;

let client: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (!KEY || !CLUSTER) return null;
  if (client) return client;
  client = new PusherClient(KEY, {
    cluster: CLUSTER,
    channelAuthorization: {
      endpoint: '/api/pusher/auth',
      transport: 'ajax',
    },
  });
  return client;
}

export function userChannel(userId: string): string {
  return `private-user-${userId}`;
}

export interface NewMessageEvent {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: string;
}
