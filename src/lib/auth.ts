export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

const USERS_KEY = 'holidaze.users.v1';
const SESSION_KEY = 'holidaze.session.v1';

// Non-cryptographic hash — this is a client-only demo app with no server.
// It prevents casual plaintext-password snooping of localStorage but is NOT
// a substitute for a real auth backend with bcrypt/argon2 + HTTPS.
function hashPassword(password: string): string {
  const salt = 'holidaze-v1';
  const input = `${salt}::${password}`;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return n.toString(36) + input.length.toString(36);
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

function toPublic(u: StoredUser): User {
  const { passwordHash: _pw, ...pub } = u;
  void _pw;
  return pub;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `u_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: string };
    if (!parsed?.userId) return null;
    const user = loadUsers().find((u) => u.id === parsed.userId);
    return user ? toPublic(user) : null;
  } catch {
    return null;
  }
}

function saveSession(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}

export interface AuthError {
  message: string;
}

export function signUp(input: {
  name: string;
  email: string;
  password: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  const users = loadUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const user: StoredUser = {
    id: newId(),
    name,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  saveSession(user.id);
  return { ok: true, user: toPublic(user) };
}

export function signIn(input: {
  email: string;
  password: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !password) {
    return { ok: false, error: 'Enter your email and password.' };
  }
  const users = loadUsers();
  const user = users.find((u) => u.email === email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'Incorrect email or password.' };
  }
  saveSession(user.id);
  return { ok: true, user: toPublic(user) };
}

export function signOut(): void {
  saveSession(null);
}
