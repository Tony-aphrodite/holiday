import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  // Fail fast on cold start rather than on first query.
  throw new Error('DATABASE_URL is not configured.');
}

export const sql = neon(url);

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  user_id: string;
  name: string;
  country_code: string;
  email: string | null;
  whatsapp: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
}

export function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
