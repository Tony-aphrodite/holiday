// Delete smoketest users (and via cascade, their customers) from Neon.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envText = readFileSync(resolve(__dirname, '..', '.env.development.local'), 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|(.*))$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2] ?? m[3] ?? '';
  }
} catch {}

const sql = neon(process.env.DATABASE_URL);
const deleted = await sql`
  DELETE FROM users
  WHERE email LIKE 'smoketest+%@example.com' OR email LIKE 'second+%@example.com'
  RETURNING email
`;
console.log('Deleted:', deleted);
