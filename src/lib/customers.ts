export interface Customer {
  id: string;
  name: string;
  countryCode: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
}

export type CustomerDraft = Omit<Customer, 'id' | 'createdAt'>;

const LEGACY_KEY = 'holidaze.customers.v1';
const STORAGE_PREFIX = 'holidaze.customers.v2.';

function keyFor(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadCustomers(userId: string): Customer[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Customer[];
  } catch {
    return [];
  }
}

export function saveCustomers(userId: string, list: Customer[]): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
}

// One-time migration: if the legacy global customer list exists and the
// current user has no data yet, adopt it. This preserves the original
// single-user dataset when the owner creates their first account.
export function migrateLegacyCustomers(userId: string): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    if (localStorage.getItem(keyFor(userId))) return;
    localStorage.setItem(keyFor(userId), legacy);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

export function createCustomer(draft: CustomerDraft): Customer {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return {
    id,
    createdAt: new Date().toISOString(),
    ...draft,
  };
}

// Deterministic avatar accent derived from name
export function avatarColor(name: string): { bg: string; fg: string } {
  const palette = [
    { bg: 'bg-gradient-to-br from-brand-500 to-accent-violet', fg: 'text-white' },
    { bg: 'bg-gradient-to-br from-accent-rose to-accent-amber', fg: 'text-white' },
    { bg: 'bg-gradient-to-br from-accent-emerald to-accent-sky', fg: 'text-white' },
    { bg: 'bg-gradient-to-br from-accent-violet to-accent-sky', fg: 'text-white' },
    { bg: 'bg-gradient-to-br from-accent-amber to-accent-rose', fg: 'text-white' },
    { bg: 'bg-gradient-to-br from-brand-400 to-accent-emerald', fg: 'text-white' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
