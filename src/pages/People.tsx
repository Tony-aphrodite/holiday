import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Search, MessageSquare, Users as UsersIcon, Mail } from 'lucide-react';
import { usePeople } from '../lib/PeopleContext';
import { useRouter } from '../lib/router';
import { initials } from '../lib/customers';
import EmptyState from '../components/EmptyState';

export default function People() {
  const { people, loading } = usePeople();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    );
  }, [people, query]);

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-text tracking-tight">People</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {loading && people.length === 0
              ? 'Loading members…'
              : people.length === 0
                ? 'No other members yet — invite someone to join Holidaze.'
                : `${people.length} ${people.length === 1 ? 'member' : 'members'} on Holidaze.`}
          </p>
        </div>
      </div>

      {people.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members by name or email…"
            className="input w-full pl-9"
          />
        </div>
      )}

      {people.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No other members yet"
          description="When other people sign up on Holidaze, they'll show up here and you'll be able to start a 1:1 chat with them."
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-text-muted">
          No members match “{query}”.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate({ name: 'chat', peerId: p.id })}
              className="card p-5 text-left hover:border-brand-500/30 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-accent-violet grid place-items-center text-sm font-semibold text-white shrink-0">
                  {initials(p.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text truncate">{p.name}</div>
                  <div className="text-[11px] text-text-muted truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 shrink-0" />
                    {p.email}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-text-dim">
                <span>Joined {dayjs(p.createdAt).format('MMM D, YYYY')}</span>
                <span className="flex items-center gap-1 text-brand-300 opacity-0 group-hover:opacity-100 transition font-medium">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
