import {
  CalendarDays,
  Globe2,
  Users,
  Sparkles,
  Bell,
  ShieldCheck,
  ArrowRight,
  Check,
  Zap,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/AuthContext';

export default function Landing() {
  const { navigate } = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-full">
      <LandingNav />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-accent-violet/10 blur-3xl" />
          <div className="absolute inset-0 bg-grid-faint bg-[size:32px_32px] opacity-30" />
        </div>

        <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/20 bg-brand-500/10 text-xs text-brand-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Never miss a customer's national holiday again
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-text">
              Reach out at the{' '}
              <span className="bg-gradient-to-r from-brand-400 via-accent-violet to-accent-rose bg-clip-text text-transparent">
                right moment
              </span>
              , every time.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl">
              Holidaze turns your customer list into a living calendar. Add a client, pick their
              country, and we'll surface every national holiday automatically — so your greetings,
              campaigns and check-ins always land on the days that matter.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <button onClick={() => navigate({ name: 'dashboard' })} className="btn-primary px-5 py-3 text-base">
                  Open dashboard <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button onClick={() => navigate({ name: 'signup' })} className="btn-primary px-5 py-3 text-base">
                    Create free account <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate({ name: 'login' })} className="btn-ghost px-5 py-3 text-base">
                    I already have an account
                  </button>
                </>
              )}
            </div>
            <div className="mt-6 flex items-center gap-5 text-xs text-text-dim flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent-emerald" /> 200+ countries supported
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent-emerald" /> Lunar & substitute holidays
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent-emerald" /> Your data stays private to you
              </span>
            </div>
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard
              icon={Globe2}
              title="Every country, out of the box"
              body="From the US to Vietnam, Mexico to Saudi Arabia — national, religious and observance holidays for 200+ locales, updated automatically."
              accent="brand"
            />
            <FeatureCard
              icon={Bell}
              title="Upcoming at a glance"
              body="A unified feed of your customers' next holidays — sorted by how many days away they are, so your outreach is never late."
              accent="violet"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Your customers stay yours"
              body="Each account is a private workspace. Other users can never see, read or reach your customer list — ever."
              accent="emerald"
            />
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto px-6 pb-24">
          <div className="card p-8 md:p-10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-accent-violet/10 to-transparent pointer-events-none" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-xs text-brand-300 font-semibold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" /> How it works
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
                  Three steps to thoughtful client relationships.
                </h2>
                <p className="mt-3 text-text-muted">
                  No integrations, no spreadsheets, no holiday calendars to maintain. Holidaze
                  handles it.
                </p>
              </div>
              <ol className="space-y-4">
                <Step
                  n={1}
                  title="Create your account"
                  body="Sign up in seconds. Your workspace is yours — no one else sees it."
                />
                <Step
                  n={2}
                  title="Add customers with their country"
                  body="Name, country, optional email or WhatsApp — that's all we need."
                />
                <Step
                  n={3}
                  title="Never miss a moment"
                  body="Holidaze shows who's celebrating what, and when, across your whole book."
                />
              </ol>
            </div>
          </div>
        </section>

        <section className="relative max-w-6xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-3 gap-5">
            <UseCaseCard
              icon={Users}
              title="Account managers"
              body="Send personal greetings on every customer's national day, without tracking 30 different calendars."
            />
            <UseCaseCard
              icon={CalendarDays}
              title="Agencies & freelancers"
              body="Know when your international clients are out of office — and plan check-ins around real local schedules."
            />
            <UseCaseCard
              icon={Sparkles}
              title="Customer success teams"
              body="Turn holidays into touchpoints. Warm relationships with timing that feels effortless."
            />
          </div>
        </section>

        <section className="relative max-w-4xl mx-auto px-6 pb-28">
          <div className="card p-8 md:p-12 text-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-accent-violet/10 to-accent-rose/10 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text">
                Start in under a minute.
              </h2>
              <p className="mt-3 text-text-muted max-w-xl mx-auto">
                Free to create an account. Your customer list is stored in your own private
                workspace — no one else in Holidaze can ever see it.
              </p>
              <div className="mt-7 flex justify-center gap-3 flex-wrap">
                {user ? (
                  <button onClick={() => navigate({ name: 'dashboard' })} className="btn-primary px-5 py-3 text-base">
                    Go to your dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button onClick={() => navigate({ name: 'signup' })} className="btn-primary px-5 py-3 text-base">
                      Create free account <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate({ name: 'login' })} className="btn-ghost px-5 py-3 text-base">
                      Log in
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-text-dim">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-accent-violet flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-white" />
            </div>
            <span>Holidaze — client holidays, handled.</span>
          </div>
          <span>
            Holiday data from{' '}
            <a
              href="https://github.com/commenthol/date-holidays"
              target="_blank"
              rel="noreferrer"
              className="text-text-muted hover:text-text transition"
            >
              date-holidays
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function LandingNav() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate({ name: 'landing' })}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-violet flex items-center justify-center shadow-glow">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight text-left">
            <div className="text-sm font-semibold text-text">Holidaze</div>
            <div className="text-[10px] uppercase tracking-wider text-text-dim">Client Holidays</div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {user ? (
            <button onClick={() => navigate({ name: 'dashboard' })} className="btn-primary">
              Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate({ name: 'login' })}
                className="btn-ghost"
              >
                Login
              </button>
              <button
                onClick={() => navigate({ name: 'signup' })}
                className="btn-primary"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  accent: 'brand' | 'violet' | 'emerald';
}

function FeatureCard({ icon: Icon, title, body, accent }: FeatureCardProps) {
  const tone =
    accent === 'brand'
      ? 'from-brand-500/15 to-brand-500/0 text-brand-300 border-brand-500/20'
      : accent === 'violet'
        ? 'from-accent-violet/15 to-accent-violet/0 text-accent-violet border-accent-violet/20'
        : 'from-accent-emerald/15 to-accent-emerald/0 text-accent-emerald border-accent-emerald/20';
  return (
    <div className="card p-6 hover:border-brand-500/30 transition">
      <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${tone} border flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm text-text-muted leading-relaxed">{body}</p>
    </div>
  );
}

function UseCaseCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6">
      <Icon className="w-5 h-5 text-text-muted" />
      <h3 className="mt-3 text-base font-semibold text-text">{title}</h3>
      <p className="mt-1.5 text-sm text-text-muted leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 font-semibold flex items-center justify-center text-sm">
        {n}
      </div>
      <div>
        <div className="text-sm font-semibold text-text">{title}</div>
        <div className="text-sm text-text-muted mt-0.5">{body}</div>
      </div>
    </li>
  );
}
