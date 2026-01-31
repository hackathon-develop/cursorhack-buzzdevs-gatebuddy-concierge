// TimeDisplay: Monospace time display component
// Design: Swiss Rationalism - fixed-width numerals, airport departure board aesthetic

import { cn } from '@/lib/utils';

interface TimeDisplayProps {
  time: Date | number; // Date object or minutes
  format?: 'time' | 'duration' | 'countdown';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function TimeDisplay({ time, format = 'time', className, size = 'md' }: TimeDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  let displayText = '';

  if (format === 'time' && time instanceof Date) {
    displayText = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (format === 'duration' && typeof time === 'number') {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    if (hours > 0) {
      displayText = `${hours}h ${minutes}m`;
    } else {
      displayText = `${minutes}m`;
    }
  } else if (format === 'countdown' && typeof time === 'number') {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    displayText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  return (
    <span className={cn('font-mono font-medium font-mono-nums', sizeClasses[size], className)}>
      {displayText}
    </span>
  );
}
