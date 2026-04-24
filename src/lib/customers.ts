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
