import { cn } from '../lib/utils';

interface ProgressBarProps {
  value: number;       // 0–100
  color?: 'cyan' | 'red' | 'amber' | 'green';
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}

const colorStyles = {
  cyan: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
  red: 'bg-gradient-to-r from-red-700 to-red-400',
  amber: 'bg-gradient-to-r from-amber-600 to-amber-400',
  green: 'bg-gradient-to-r from-emerald-700 to-emerald-400',
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
};

export function ProgressBar({
  value,
  color = 'cyan',
  size = 'md',
  className,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>0%</span>
          <span className="font-mono font-semibold text-white">{clamped}%</span>
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-white/10', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', colorStyles[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
