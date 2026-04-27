// Run the schema against Neon. Usage: node scripts/migrate.mjs
// Requires DATABASE_URL in env (pulled from Vercel via .env.development.local).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.development.local if present.
try {
  const envText = readFileSync(resolve(__dirname, '..', '.env.development.local'), 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|(.*))$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2] ?? m[3] ?? '';
  }
} catch {
  /* optional */
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(url);

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
     id            TEXT PRIMARY KEY,
     email         TEXT NOT NULL UNIQUE,
     name          TEXT NOT NULL,
     password_hash TEXT NOT NULL,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`,
  `CREATE TABLE IF NOT EXISTS customers (
     id           TEXT PRIMARY KEY,
     user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     name         TEXT NOT NULL,
     country_code TEXT NOT NULL,
     email        TEXT,
     whatsapp     TEXT,
     phone        TEXT,
     company      TEXT,
     notes        TEXT,
     tags         TEXT[] NOT NULL DEFAULT '{}',
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS customers_user_idx ON customers (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS messages (
     id           TEXT PRIMARY KEY,
     from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     to_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     body         TEXT NOT NULL,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     read_at      TIMESTAMPTZ
   )`,
  `CREATE INDEX IF NOT EXISTS messages_thread_idx
     ON messages (LEAST(from_user_id, to_user_id), GREATEST(from_user_id, to_user_id), created_at)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_lead_days INT NOT NULL DEFAULT 3`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_send_hour INT NOT NULL DEFAULT 9`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_timezone TEXT NOT NULL DEFAULT 'UTC'`,
  `CREATE TABLE IF NOT EXISTS holiday_email_log (
     id             TEXT PRIMARY KEY,
     user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     customer_id    TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
     holiday_date   DATE NOT NULL,
     holiday_name   TEXT NOT NULL,
     sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     CONSTRAINT holiday_email_log_unique UNIQUE (user_id, customer_id, holiday_date, holiday_name)
   )`,
  `CREATE INDEX IF NOT EXISTS holiday_email_log_user_idx ON holiday_email_log (user_id, sent_at DESC)`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS projects_completed INT NOT NULL DEFAULT 0`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0`,
  `ALTER TABLE customers ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'`,
];

for (const stmt of statements) {
  const head = stmt.slice(0, 60).replace(/\s+/g, ' ').trim();
  process.stdout.write(`→ ${head}… `);
  // eslint-disable-next-line no-await-in-loop
  await sql.query(stmt);
  process.stdout.write('ok\n');
}

console.log('\nSchema applied.');
