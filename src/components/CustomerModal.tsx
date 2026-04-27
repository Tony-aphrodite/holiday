import { useEffect, useState } from 'react';
import { X, User, Mail, MessageCircle, Phone, Building2, StickyNote, Trash2, Briefcase, DollarSign } from 'lucide-react';
import type { Customer, CustomerDraft } from '../lib/customers';
import { COMMON_CURRENCIES } from '../lib/customers';
import CountrySelect from './CountrySelect';

interface CustomerModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Customer;
  onClose: () => void;
  onSubmit: (draft: CustomerDraft) => void;
  onDelete?: () => void;
}

const EMPTY: CustomerDraft = {
  name: '',
  countryCode: '',
  email: '',
  whatsapp: '',
  phone: '',
  company: '',
  notes: '',
  projectsCompleted: 0,
  totalRevenue: 0,
  currency: 'USD',
};

export default function CustomerModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: CustomerModalProps) {
  const [draft, setDraft] = useState<CustomerDraft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setDraft({
        name: initial.name,
        countryCode: initial.countryCode,
        email: initial.email ?? '',
        whatsapp: initial.whatsapp ?? '',
        phone: initial.phone ?? '',
        company: initial.company ?? '',
        notes: initial.notes ?? '',
        projectsCompleted: initial.projectsCompleted ?? 0,
        totalRevenue: initial.totalRevenue ?? 0,
        currency: initial.currency ?? 'USD',
      });
    } else {
      setDraft(EMPTY);
    }
    setErrors({});
  }, [open, mode, initial]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function set<K extends keyof CustomerDraft>(key: K, value: CustomerDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!draft.name.trim()) nextErrors.name = 'Name is required';
    if (!draft.countryCode) nextErrors.countryCode = 'Country is required';
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      nextErrors.email = 'Invalid email';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      ...draft,
      name: draft.name.trim(),
      email: draft.email?.trim() || undefined,
      whatsapp: draft.whatsapp?.trim() || undefined,
      phone: draft.phone?.trim() || undefined,
      company: draft.company?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      projectsCompleted: Math.max(0, Math.floor(Number(draft.projectsCompleted) || 0)),
      totalRevenue: Math.max(0, Number(draft.totalRevenue) || 0),
      currency: draft.currency || 'USD',
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-card border border-border rounded-2xl shadow-card overflow-hidden animate-slide-up max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text">
              {mode === 'create' ? 'Add new customer' : 'Edit customer'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {mode === 'create'
                ? 'Track this person’s country to surface their national holidays.'
                : 'Update contact info or change their country.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            <Field
              label="Full name"
              icon={User}
              required
              error={errors.name}
              input={
                <input
                  className="input w-full"
                  placeholder="e.g. Sarah Chen"
                  value={draft.name}
                  onChange={(e) => set('name', e.target.value)}
                  autoFocus
                />
              }
            />

            <Field
              label="Country"
              required
              error={errors.countryCode}
              input={
                <CountrySelect
                  value={draft.countryCode || null}
                  onChange={(code) => set('countryCode', code)}
                />
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Email"
                icon={Mail}
                error={errors.email}
                input={
                  <input
                    className="input w-full"
                    placeholder="sarah@example.com"
                    type="email"
                    value={draft.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                }
              />
              <Field
                label="WhatsApp"
                icon={MessageCircle}
                input={
                  <input
                    className="input w-full"
                    placeholder="+65 9123 4567"
                    value={draft.whatsapp}
                    onChange={(e) => set('whatsapp', e.target.value)}
                  />
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Phone"
                icon={Phone}
                input={
                  <input
                    className="input w-full"
                    placeholder="+1 555 000 1234"
                    value={draft.phone}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                }
              />
              <Field
                label="Company"
                icon={Building2}
                input={
                  <input
                    className="input w-full"
                    placeholder="Optional"
                    value={draft.company}
                    onChange={(e) => set('company', e.target.value)}
                  />
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Projects done"
                icon={Briefcase}
                input={
                  <input
                    className="input w-full tabular-nums"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={String(draft.projectsCompleted ?? 0)}
                    onChange={(e) =>
                      set('projectsCompleted', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                  />
                }
              />
              <Field
                label="Total revenue"
                icon={DollarSign}
                input={
                  <input
                    className="input w-full tabular-nums"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={String(draft.totalRevenue ?? 0)}
                    onChange={(e) =>
                      set('totalRevenue', Math.max(0, parseFloat(e.target.value) || 0))
                    }
                  />
                }
              />
              <Field
                label="Currency"
                input={
                  <select
                    className="input w-full"
                    value={draft.currency ?? 'USD'}
                    onChange={(e) => set('currency', e.target.value)}
                  >
                    {COMMON_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} · {c.symbol}
                      </option>
                    ))}
                  </select>
                }
              />
            </div>

            <Field
              label="Notes"
              icon={StickyNote}
              input={
                <textarea
                  className="input w-full resize-none"
                  rows={3}
                  placeholder="Any additional context..."
                  value={draft.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              }
            />
          </div>

          <div className="px-5 py-4 border-t border-border bg-bg-soft/60 flex items-center justify-between gap-2">
            {mode === 'edit' && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="btn bg-transparent text-accent-rose hover:bg-accent-rose/10 border border-accent-rose/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {mode === 'create' ? 'Add customer' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  input: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  error?: string;
}

function Field({ label, input, icon: Icon, required, error }: FieldProps) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-text-dim" />}
          {label}
          {required && <span className="text-accent-rose">*</span>}
        </span>
        {error && <span className="text-[11px] text-accent-rose">{error}</span>}
      </div>
      {input}
    </label>
  );
}
