import { cn } from '../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md',
        hover && 'transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/8 hover:shadow-lg hover:shadow-cyan-500/5',
        className
      )}
    >
      {children}
    </div>
  );
}
