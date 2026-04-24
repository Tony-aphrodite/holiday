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
  createdAt: string;
}

export function rowToDTO(r: CustomerRow): CustomerDTO {
  const dto: CustomerDTO = {
    id: r.id,
    name: r.name,
    countryCode: r.country_code,
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
