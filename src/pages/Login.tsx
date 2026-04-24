import { useState, type FormEvent } from 'react';
import { CalendarDays, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';

export default function Login() {
  const { signIn } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate({ name: 'dashboard' });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Holidaze workspace."
      footer={
        <>
          New to Holidaze?{' '}
          <button
            type="button"
            onClick={() => navigate({ name: 'signup' })}
            className="text-brand-300 hover:text-brand-200 font-medium"
          >
            Create an account
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          required
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          icon={Lock}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
        />
        {error && (
          <div className="text-sm text-accent-rose bg-accent-rose/10 border border-accent-rose/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 disabled:opacity-50">
          <LogIn className="w-4 h-4" />
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { navigate } = useRouter();
  return (
    <div className="min-h-full flex flex-col">
      <header className="h-16 border-b border-border/60 bg-bg/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center">
          <button onClick={() => navigate({ name: 'landing' })} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-violet flex items-center justify-center shadow-glow">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight text-left">
              <div className="text-sm font-semibold text-text">Holidaze</div>
              <div className="text-[10px] uppercase tracking-wider text-text-dim">Client Holidays</div>
            </div>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-accent-violet/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="card p-7 md:p-8">
            <h1 className="text-2xl font-semibold text-text tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          <div className="mt-5 text-center text-sm text-text-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete?: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}

export function Field({
  id,
  label,
  type,
  autoComplete,
  icon: Icon,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  hint,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-muted mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="input w-full pl-9"
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-text-dim">{hint}</p>}
    </div>
  );
}
