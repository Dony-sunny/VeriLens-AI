import { cn } from '../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'red' | 'amber' | 'green' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  cyan: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  green: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  ghost: 'bg-white/5 text-slate-400 border border-white/10',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({ children, variant = 'ghost', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium tracking-wide',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
