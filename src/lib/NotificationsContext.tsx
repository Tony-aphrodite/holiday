import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from './router';
import { useCustomers } from './CustomersContext';
import { usePeople } from './PeopleContext';
import { getPusherClient, userChannel, type NewMessageEvent } from './pusher';
import { computeUpcomingCustomerHolidays } from './aggregate';
import { getCountries } from './holidays';

export interface MessageNotif {
  kind: 'message';
  peerId: string;
  peerName: string;
  preview: string;
  at: string;
  count: number;
}

export interface HolidayNotif {
  kind: 'holiday';
  id: string;
  customerId: string;
  customerName: string;
  holidayName: string;
  holidayDate: string;
  flag: string;
  daysUntil: number;
}

export type Notif = MessageNotif | HolidayNotif;

interface NotificationsContextValue {
  messages: MessageNotif[];
  holidays: HolidayNotif[];
  totalCount: number;
  clearMessagesFor: (peerId: string) => void;
  dismissHoliday: (id: string) => void;
  dismissAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const DISMISSED_KEY_PREFIX = 'holidaze.notif.dismissedHolidays.';
const HOLIDAY_WINDOW_DAYS = 7;

function readDismissed(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY_PREFIX + userId);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeDismissed(userId: string, set: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY_PREFIX + userId, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { route } = useRouter();
  const { customers } = useCustomers();
  const { people } = usePeople();

  const [messages, setMessages] = useState<MessageNotif[]>([]);
  const [dismissedHolidays, setDismissedHolidays] = useState<Set<string>>(() => new Set());

  // Load dismissed set when user changes.
  useEffect(() => {
    if (!user) {
      setDismissedHolidays(new Set());
      return;
    }
    setDismissedHolidays(readDismissed(user.id));
  }, [user]);

  // Subscribe to Pusher app-wide so we collect notifications even when the
  // chat page isn't open.
  useEffect(() => {
    if (!user) return;
    const client = getPusherClient();
    if (!client) return;

    const channel = client.subscribe(userChannel(user.id));
    const handler = (ev: NewMessageEvent) => {
      // Ignore my own outgoing messages (the server echoes to me too so other
      // tabs stay in sync).
      if (ev.fromUserId === user.id) return;

      // If the user is currently viewing the chat with this sender, don't
      // add a notification — they're already looking at it.
      if (route.name === 'chat' && route.peerId === ev.fromUserId && document.visibilityState === 'visible') {
        return;
      }

      setMessages((prev) => {
        const existing = prev.find((m) => m.peerId === ev.fromUserId);
        const peer = people.find((p) => p.id === ev.fromUserId);
        const peerName = peer?.name ?? existing?.peerName ?? 'Someone';
        const preview = ev.body.length > 80 ? ev.body.slice(0, 77) + '…' : ev.body;
        if (existing) {
          return prev.map((m) =>
            m.peerId === ev.fromUserId
              ? { ...m, preview, at: ev.createdAt, count: m.count + 1, peerName }
              : m,
          );
        }
        return [
          { kind: 'message', peerId: ev.fromUserId, peerName, preview, at: ev.createdAt, count: 1 },
          ...prev,
        ];
      });
    };
    channel.bind('new-message', handler);
    return () => {
      channel.unbind('new-message', handler);
      client.unsubscribe(userChannel(user.id));
    };
  }, [user, route, people]);

  // When the user navigates to a chat, clear that peer's unread count.
  useEffect(() => {
    if (route.name !== 'chat') return;
    setMessages((prev) => prev.filter((m) => m.peerId !== route.peerId));
  }, [route]);

  const clearMessagesFor = useCallback((peerId: string) => {
    setMessages((prev) => prev.filter((m) => m.peerId !== peerId));
  }, []);

  const dismissHoliday = useCallback(
    (id: string) => {
      if (!user) return;
      setDismissedHolidays((prev) => {
        const next = new Set(prev);
        next.add(id);
        writeDismissed(user.id, next);
        return next;
      });
    },
    [user],
  );

  const countries = useMemo(() => getCountries(), []);
  const countryByCode = useMemo(
    () => Object.fromEntries(countries.map((c) => [c.code, c])),
    [countries],
  );

  const holidays: HolidayNotif[] = useMemo(() => {
    if (!user) return [];
    const upcoming = computeUpcomingCustomerHolidays(customers, HOLIDAY_WINDOW_DAYS);
    const out: HolidayNotif[] = [];
    for (const u of upcoming) {
      const id = `${u.customer.id}:${u.holiday.date}`;
      if (dismissedHolidays.has(id)) continue;
      out.push({
        kind: 'holiday',
        id,
        customerId: u.customer.id,
        customerName: u.customer.name,
        holidayName: u.holiday.name,
        holidayDate: u.holiday.date,
        flag: countryByCode[u.customer.countryCode]?.flag ?? '🏳️',
        daysUntil: u.daysUntil,
      });
    }
    return out;
  }, [user, customers, dismissedHolidays, countryByCode]);

  const dismissAll = useCallback(() => {
    setMessages([]);
    if (!user) return;
    setDismissedHolidays((prev) => {
      const next = new Set(prev);
      for (const h of holidays) next.add(h.id);
      writeDismissed(user.id, next);
      return next;
    });
  }, [user, holidays]);

  const totalCount = useMemo(
    () => messages.reduce((acc, m) => acc + m.count, 0) + holidays.length,
    [messages, holidays],
  );

  const value = useMemo(
    () => ({ messages, holidays, totalCount, clearMessagesFor, dismissHoliday, dismissAll }),
    [messages, holidays, totalCount, clearMessagesFor, dismissHoliday, dismissAll],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
