import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Phone,
  Building2,
  Pencil,
  Trash2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { useCustomers } from '../lib/CustomersContext';
import { useRouter } from '../lib/router';
import { getCountries, getHolidaysForYear, getUpcoming, getNext, daysUntil, holidayDisplayName } from '../lib/holidays';
import { holidayTypeColor } from '../lib/holidays';
import Avatar from '../components/Avatar';
import Calendar from '../components/Calendar';
import MonthBreakdown from '../components/MonthBreakdown';
import DayDetails from '../components/DayDetails';
import StatCard from '../components/StatCard';
import CustomerModal from '../components/CustomerModal';
import type { CustomerDraft } from '../lib/customers';
import { formatMoney } from '../lib/customers';
import { cn } from '../lib/cn';

interface CustomerDetailProps {
  id: string;
}

export default function CustomerDetail({ id }: CustomerDetailProps) {
  const { getById, updateCustomer, removeCustomer } = useCustomers();
  const { navigate } = useRouter();

  const customer = getById(id);
  const [year, setYear] = useState(dayjs().year());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const countries = useMemo(() => getCountries(), []);
  const country = customer ? countries.find((c) => c.code === customer.countryCode) : undefined;

  const holidays = useMemo(
    () => (customer ? getHolidaysForYear(customer.countryCode, year) : []),
    [customer, year],
  );
  const upcoming = useMemo(() => getUpcoming(holidays), [holidays]);
  const next = useMemo(() => getNext(holidays), [holidays]);

  if (!customer) {
    return (
      <div className="p-6 animate-fade-in">
        <button
          onClick={() => navigate({ name: 'customers' })}
          className="btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="card p-8 text-center">
          <div className="text-base font-semibold text-text">Customer not found</div>
          <div className="text-sm text-text-muted mt-1">
            This customer may have been removed.
          </div>
        </div>
      </div>
    );
  }

  const selectedHolidays = selectedDate ? holidays.filter((h) => h.date === selectedDate) : [];

  function handleUpdate(draft: CustomerDraft) {
    if (!customer) return;
    updateCustomer(customer.id, draft);
    setEditing(false);
  }

  function handleDelete() {
    if (!customer) return;
    removeCustomer(customer.id);
    navigate({ name: 'customers' });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => navigate({ name: 'customers' })}
          className="btn-ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to customers
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-bg-soft border border-border rounded-lg p-0.5">
            <button
              onClick={() => setYear(year - 1)}
              className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text transition"
              aria-label="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 text-sm font-semibold tabular-nums min-w-[3.5rem] text-center">
              {year}
            </div>
            <button
              onClick={() => setYear(year + 1)}
              className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text transition"
              aria-label="Next year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setEditing(true)} className="btn-ghost">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn bg-transparent text-accent-rose hover:bg-accent-rose/10 border border-accent-rose/20"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="card relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/8 via-accent-violet/8 to-transparent pointer-events-none" />
        <div className="relative flex items-start gap-5 flex-wrap">
          <Avatar name={customer.name} size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-text tracking-tight">
              {customer.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-text-muted flex-wrap">
              {country && (
                <span className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{country.flag}</span>
                  {country.name}
                </span>
              )}
              {customer.company && (
                <>
                  <span className="text-text-dim">·</span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-dim" />
                    {customer.company}
                  </span>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {customer.email && (
                <ContactChip icon={Mail} label={customer.email} href={`mailto:${customer.email}`} />
              )}
              {customer.whatsapp && (
                <ContactChip
                  icon={MessageCircle}
                  label={customer.whatsapp}
                  href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                />
              )}
              {customer.phone && (
                <ContactChip icon={Phone} label={customer.phone} href={`tel:${customer.phone}`} />
              )}
            </div>

            {customer.notes && (
              <div className="mt-4 rounded-lg border border-border bg-bg-soft/60 p-3 flex gap-2.5">
                <StickyNote className="w-4 h-4 text-text-dim shrink-0 mt-0.5" />
                <p className="text-sm text-text-muted leading-relaxed">{customer.notes}</p>
              </div>
            )}
          </div>

          {next && (
            <div className="shrink-0 text-right">
              <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">
                Next holiday
              </div>
              <div className="mt-1 text-lg font-semibold text-text tracking-tight max-w-[220px] text-right break-words">
                {next.name}
                {next.nameLocal && next.nameLocal !== next.name && (
                  <div className="text-xs font-normal text-text-muted mt-0.5">
                    ({next.nameLocal})
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {dayjs(next.date).format('MMM D, YYYY')}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold tabular-nums">
                {daysUntil(next.date) === 0 ? 'Today' : `in ${daysUntil(next.date)} days`}
              </div>
              <div className="mt-1.5">
                <span className={cn('stat-chip border capitalize', holidayTypeColor(next.type))}>
                  {next.type}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total holidays"
          value={holidays.length}
          hint={`In ${year}`}
          icon={CalendarDays}
          accent="brand"
        />
        <StatCard
          label="Remaining"
          value={upcoming.length}
          hint="This year"
          icon={CalendarDays}
          accent="violet"
        />
        <StatCard
          label="Public"
          value={holidays.filter((h) => h.type === 'public').length}
          hint="National holidays"
          icon={CalendarDays}
          accent="rose"
        />
        <StatCard
          label="Types"
          value={new Set(holidays.map((h) => h.type)).size}
          hint="Distinct categories"
          icon={CalendarDays}
          accent="emerald"
        />
        <StatCard
          label="Projects done"
          value={customer.projectsCompleted ?? 0}
          hint="Completed with this customer"
          icon={Briefcase}
          accent="sky"
        />
        <StatCard
          label="Revenue"
          value={formatMoney(customer.totalRevenue ?? 0, customer.currency ?? 'USD')}
          hint={`Total earned · ${customer.currency ?? 'USD'}`}
          icon={DollarSign}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <Calendar
            holidays={holidays}
            year={year}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <MonthBreakdown holidays={holidays} year={year} />
        </div>

        <div className="space-y-5">
          <DayDetails
            date={selectedDate}
            holidays={selectedHolidays}
            country={country ?? { code: customer.countryCode, name: customer.countryCode, flag: '🏳️' }}
            onClose={() => setSelectedDate(null)}
          />

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-text">Upcoming for this customer</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Next {Math.min(upcoming.length, 8)} holidays in {country?.name ?? customer.countryCode}
              </p>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-text-muted">
                No more holidays this year.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.slice(0, 8).map((h, i) => {
                  const d = dayjs(h.date);
                  const delta = daysUntil(h.date);
                  return (
                    <li key={`${h.date}-${i}`}>
                      <button
                        onClick={() => setSelectedDate(h.date)}
                        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-bg-hover transition text-left"
                      >
                        <div className="shrink-0 w-12 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-text-dim font-semibold">
                            {d.format('MMM')}
                          </div>
                          <div className="text-lg font-semibold text-text tabular-nums leading-none mt-0.5">
                            {d.format('D')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text truncate">{holidayDisplayName(h)}</div>
                          <div className="mt-0.5">
                            <span
                              className={cn(
                                'stat-chip border capitalize',
                                holidayTypeColor(h.type),
                              )}
                            >
                              {h.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-text tabular-nums shrink-0">
                          {delta === 0 ? 'Today' : `${delta}d`}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <CustomerModal
        open={editing}
        mode="edit"
        initial={customer}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        onDelete={() => {
          setEditing(false);
          setConfirmDelete(true);
        }}
      />

      {confirmDelete && (
        <ConfirmDelete
          name={customer.name}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

interface ContactChipProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

function ContactChip({ icon: Icon, label, href }: ContactChipProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-soft border border-border hover:bg-bg-hover hover:border-border/80 text-sm text-text-muted hover:text-text transition"
    >
      <Icon className="w-3.5 h-3.5 text-text-dim" />
      <span className="truncate max-w-[14rem]">{label}</span>
    </a>
  );
}

interface ConfirmDeleteProps {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDelete({ name, onCancel, onConfirm }: ConfirmDeleteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-bg-card border border-border rounded-2xl shadow-card p-5 animate-slide-up">
        <div className="w-10 h-10 rounded-lg bg-accent-rose/10 border border-accent-rose/20 grid place-items-center mb-3">
          <Trash2 className="w-4 h-4 text-accent-rose" />
        </div>
        <h3 className="text-base font-semibold text-text">Delete customer?</h3>
        <p className="text-sm text-text-muted mt-1">
          <span className="text-text font-medium">{name}</span> will be removed from your
          workspace. This can’t be undone.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn bg-accent-rose hover:bg-accent-rose/90 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
