import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

type ToolState = 'empty' | 'loading' | 'success' | 'error' | 'hint';

interface ToolStateMessageProps {
  state: ToolState;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const stateMeta = {
  empty: {
    icon: Info,
    className: 'border-border bg-background text-muted-foreground',
  },
  loading: {
    icon: Loader2,
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  hint: {
    icon: Info,
    className: 'border-border bg-muted/50 text-muted-foreground',
  },
};

export const ToolStateMessage = ({ state, title, children, className = '' }: ToolStateMessageProps) => {
  const meta = stateMeta[state];
  const Icon = meta.icon;

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${meta.className} ${className}`} role={state === 'error' ? 'alert' : 'status'}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${state === 'loading' ? 'animate-spin' : ''}`} />
        <div className="min-w-0">
          {title ? <p className="font-semibold text-foreground">{title}</p> : null}
          <div className={title ? 'mt-1' : ''}>{children}</div>
          {state === 'success' ? (
            <p className="mt-2 text-xs">
              <Link
                to="/support"
                className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Enjoying FilePilot? Support its ad-free development.
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
