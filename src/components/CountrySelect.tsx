import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { getCountries } from '../lib/holidays';
import { cn } from '../lib/cn';

interface CountrySelectProps {
  value: string | null;
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
}

export default function CountrySelect({ value, onChange, placeholder = 'Select country', id }: CountrySelectProps) {
  const countries = useMemo(() => getCountries(), []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = countries.find((c) => c.code === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query, countries]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-soft border border-border hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition text-sm',
          !selected && 'text-text-dim',
        )}
      >
        {selected ? (
          <>
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-text font-medium truncate">{selected.name}</span>
            <span className="text-[10px] font-mono text-text-dim ml-auto">{selected.code}</span>
          </>
        ) : (
          <span className="flex-1 text-left">{placeholder}</span>
        )}
        <ChevronDown className={cn('w-3.5 h-3.5 text-text-dim shrink-0 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-bg-card border border-border rounded-xl shadow-card overflow-hidden animate-slide-up z-40">
          <div className="p-2 border-b border-border relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country..."
              className="input w-full pl-8"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-text-dim">No matches</div>
            ) : (
              filtered.map((c) => {
                const active = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition',
                      active
                        ? 'bg-brand-500/10 text-text'
                        : 'text-text-muted hover:text-text hover:bg-bg-hover',
                    )}
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-text-dim">{c.code}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
