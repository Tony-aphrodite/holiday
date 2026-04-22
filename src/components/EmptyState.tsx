import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card p-8 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 grid place-items-center mb-3">
        <Icon className="w-5 h-5 text-brand-300" />
      </div>
      <div className="text-base font-semibold text-text">{title}</div>
      <div className="text-sm text-text-muted mt-1 max-w-sm">{description}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
