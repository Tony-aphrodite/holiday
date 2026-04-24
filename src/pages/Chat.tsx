import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import dayjs from 'dayjs';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { usePeople } from '../lib/PeopleContext';
import { initials } from '../lib/customers';
import { getPusherClient, userChannel, type NewMessageEvent } from '../lib/pusher';

interface ChatMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: string;
}

interface PeerInfo {
  id: string;
  name: string;
  email: string;
}

interface ChatProps {
  peerId: string;
}

// Realtime comes from Pusher; we keep a slow poll as a safety net for
// missed events during reconnects or if Pusher isn't configured.
const POLL_MS = 30_000;

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function Chat({ peerId }: ChatProps) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { getById: getPerson } = usePeople();

  const [peer, setPeer] = useState<PeerInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSeenRef = useRef<string | null>(null);

  // Optimistic prefill peer info from the sidebar list so the header doesn't flash.
  useEffect(() => {
    const local = getPerson(peerId);
    if (local && (!peer || peer.id !== peerId)) {
      setPeer({ id: local.id, name: local.name, email: local.email });
    }
  }, [peerId, getPerson, peer]);

  // Initial thread load + reset on peer change.
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    lastSeenRef.current = null;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch(`/api/messages/${encodeURIComponent(peerId)}`, {
          credentials: 'same-origin',
        });
        if (cancelled) return;
        if (!res.ok) {
          const data = (await parseJson(res)) as { error?: string } | null;
          setLoadError(data?.error ?? 'Could not load chat.');
          return;
        }
        const data = (await parseJson(res)) as
          | { peer?: PeerInfo; messages?: ChatMessage[] }
          | null;
        if (cancelled) return;
        if (data?.peer) setPeer(data.peer);
        const initial = data?.messages ?? [];
        setMessages(initial);
        lastSeenRef.current = initial.length > 0 ? initial[initial.length - 1].createdAt : null;
      } catch {
        if (!cancelled) setLoadError('Network error.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [peerId]);

  // Pusher subscription: listen for new-message events on my inbox channel and
  // only apply those that belong to the thread with the current peer.
  useEffect(() => {
    if (!user) return;
    const client = getPusherClient();
    if (!client) return; // Pusher not configured — polling below still covers us.

    const channel = client.subscribe(userChannel(user.id));
    const handler = (ev: NewMessageEvent) => {
      const inThisThread =
        (ev.fromUserId === user.id && ev.toUserId === peerId) ||
        (ev.fromUserId === peerId && ev.toUserId === user.id);
      if (!inThisThread) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === ev.id)) return prev;
        const next = [...prev, ev];
        lastSeenRef.current = ev.createdAt;
        return next;
      });
    };
    channel.bind('new-message', handler);
    return () => {
      channel.unbind('new-message', handler);
      client.unsubscribe(userChannel(user.id));
    };
  }, [user, peerId]);

  // Safety-net poll for missed events (reconnects, Pusher outage, or when
  // Pusher env is not configured locally).
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) return;
      const since = lastSeenRef.current;
      const qs = since ? `?since=${encodeURIComponent(since)}` : '';
      try {
        const res = await fetch(`/api/messages/${encodeURIComponent(peerId)}${qs}`, {
          credentials: 'same-origin',
        });
        if (!res.ok || cancelled) return;
        const data = (await parseJson(res)) as { messages?: ChatMessage[] } | null;
        const fresh = data?.messages ?? [];
        if (fresh.length === 0) return;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const add = fresh.filter((m) => !seen.has(m.id));
          if (add.length === 0) return prev;
          const combined = [...prev, ...add];
          lastSeenRef.current = combined[combined.length - 1].createdAt;
          return combined;
        });
      } catch {
        /* transient, keep polling */
      }
    }

    const iv = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, [peerId]);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const grouped = useMemo(() => groupByDay(messages), [messages]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending || !user) return;

    setSending(true);
    setSendError(null);

    // Optimistic insert.
    const tempId = `temp_${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      fromUserId: user.id,
      toUserId: peerId,
      body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');

    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(peerId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = (await parseJson(res)) as { error?: string } | null;
        throw new Error(data?.error ?? 'Send failed.');
      }
      const data = (await parseJson(res)) as { message?: ChatMessage } | null;
      const real = data?.message;
      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        if (!real) return without;
        lastSeenRef.current = real.createdAt;
        return [...without, real];
      });
    } catch (err) {
      // Roll back optimistic message and restore the draft.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(body);
      setSendError(err instanceof Error ? err.message : 'Send failed.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <header className="shrink-0 px-5 py-4 border-b border-border bg-bg-soft/40 backdrop-blur flex items-center gap-3">
        <button
          onClick={() => navigate({ name: 'dashboard' })}
          className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-bg-hover transition md:hidden"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-violet grid place-items-center text-xs font-semibold text-white shrink-0">
          {initials(peer?.name ?? '?')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-text truncate">
            {peer?.name ?? 'Loading…'}
          </div>
          {peer?.email && (
            <div className="text-[11px] text-text-muted truncate">{peer.email}</div>
          )}
        </div>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-text-dim">
            Loading conversation…
          </div>
        ) : loadError ? (
          <div className="h-full flex items-center justify-center text-sm text-accent-rose">
            {loadError}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-text-dim">
            <div className="w-10 h-10 rounded-full bg-bg-hover border border-border grid place-items-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="text-sm">
              Say hi to <span className="text-text-muted">{peer?.name ?? 'them'}</span> — this chat is empty.
            </div>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.day} className="space-y-2">
              <div className="text-center">
                <span className="inline-block text-[10px] uppercase tracking-wider text-text-dim font-semibold px-2 py-1 rounded-full bg-bg-hover/60 border border-border">
                  {group.dayLabel}
                </span>
              </div>
              {group.items.map((m) => {
                const mine = user?.id === m.fromUserId;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        mine
                          ? 'bg-brand-500 text-white rounded-br-sm'
                          : 'bg-bg-hover text-text border border-border rounded-bl-sm'
                      }`}
                    >
                      <div>{m.body}</div>
                      <div
                        className={`text-[10px] mt-1 tabular-nums ${
                          mine ? 'text-white/60' : 'text-text-dim'
                        }`}
                      >
                        {dayjs(m.createdAt).format('HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="shrink-0 border-t border-border bg-bg-soft/40 backdrop-blur p-3 md:p-4">
        {sendError && (
          <div className="mb-2 text-xs text-accent-rose bg-accent-rose/10 border border-accent-rose/30 rounded-lg px-3 py-1.5">
            {sendError}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Message ${peer?.name ?? ''}…`}
            rows={1}
            className="input flex-1 resize-none max-h-40 min-h-[2.5rem] py-2"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="btn-primary px-3 py-2 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-text-dim">
          Enter to send · Shift+Enter for newline
        </div>
      </form>
    </div>
  );
}

function groupByDay(messages: ChatMessage[]) {
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  const groups: { day: string; dayLabel: string; items: ChatMessage[] }[] = [];

  for (const m of messages) {
    const d = dayjs(m.createdAt).startOf('day');
    const key = d.format('YYYY-MM-DD');
    let label: string;
    if (d.isSame(today)) label = 'Today';
    else if (d.isSame(yesterday)) label = 'Yesterday';
    else label = d.format('MMM D, YYYY');
    const last = groups[groups.length - 1];
    if (last && last.day === key) {
      last.items.push(m);
    } else {
      groups.push({ day: key, dayLabel: label, items: [m] });
    }
  }
  return groups;
}
