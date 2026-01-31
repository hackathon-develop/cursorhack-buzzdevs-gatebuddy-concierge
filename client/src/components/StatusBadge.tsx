// StatusBadge: Traffic-light status indicator
// Design: Swiss Rationalism - functional color coding, instant comprehension

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'safe' | 'tight' | 'risky';
  className?: string;
  children?: React.ReactNode;
}

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md font-mono',
        status === 'safe' && 'status-safe',
        status === 'tight' && 'status-tight',
        status === 'risky' && 'status-risky',
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'safe' && 'bg-safe-foreground',
        status === 'tight' && 'bg-tight-foreground',
        status === 'risky' && 'bg-risky-foreground'
      )} />
      {children}
    </span>
  );
}
