import { useState, type FormEvent } from 'react';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { AuthShell, Field } from './Login';

export default function Signup() {
  const { signUp } = useAuth();
  const { navigate } = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await signUp(name, email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate({ name: 'dashboard' });
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Your own private workspace — no one else sees your customers."
      footer={
        <>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate({ name: 'login' })}
            className="text-brand-300 hover:text-brand-200 font-medium"
          >
            Log in
          </button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          id="name"
          label="Full name"
          type="text"
          autoComplete="name"
          icon={User}
          value={name}
          onChange={setName}
          placeholder="Riad Kamal"
          required
        />
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
          autoComplete="new-password"
          icon={Lock}
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          required
          minLength={8}
          hint="Use 8+ characters. Stored locally in your browser."
        />
        {error && (
          <div className="text-sm text-accent-rose bg-accent-rose/10 border border-accent-rose/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 disabled:opacity-50">
          <UserPlus className="w-4 h-4" />
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-[11px] text-text-dim leading-relaxed">
          By creating an account you agree that your customer data is stored privately in your own
          browser workspace.
        </p>
      </form>
    </AuthShell>
  );
}
