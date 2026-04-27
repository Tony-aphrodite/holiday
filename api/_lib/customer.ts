import type { CustomerRow } from './db.js';

export interface CustomerDTO {
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
  totalRevenue: number;
  currency: string;
  createdAt: string;
}

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function rowToDTO(r: CustomerRow): CustomerDTO {
  const dto: CustomerDTO = {
    id: r.id,
    name: r.name,
    countryCode: r.country_code,
    projectsCompleted: toNumber(r.projects_completed, 0),
    totalRevenue: toNumber(r.total_revenue, 0),
    currency: r.currency ?? 'USD',
    createdAt: r.created_at,
  };
  if (r.email) dto.email = r.email;
  if (r.whatsapp) dto.whatsapp = r.whatsapp;
  if (r.phone) dto.phone = r.phone;
  if (r.company) dto.company = r.company;
  if (r.notes) dto.notes = r.notes;
  if (r.tags && r.tags.length > 0) dto.tags = r.tags;
  return dto;
}
