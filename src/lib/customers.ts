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
  projectsCompleted: number;
  totalRevenue: number; // stored as a decimal (e.g. 1234.50)
  currency: string;     // ISO 4217 (USD, EUR, KRW, ...)
  createdAt: string;
}

export const COMMON_CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', label: 'Korean Won' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', label: 'Mexican Peso' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', label: 'Hong Kong Dollar' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham' },
];

export function formatMoney(amount: number, currency: string): string {
  // Decimals: 0 for JPY/KRW (no minor unit), 2 otherwise
  const noDecimals = ['JPY', 'KRW'].includes(currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: noDecimals ? 0 : 2,
      minimumFractionDigits: noDecimals ? 0 : 2,
    }).format(amount);
  } catch {
    const sym = COMMON_CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
    return `${sym}${noDecimals ? Math.round(amount) : amount.toFixed(2)}`;
  }
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
