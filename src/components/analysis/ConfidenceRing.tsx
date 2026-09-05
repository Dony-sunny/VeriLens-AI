import { cn } from '../lib/utils';
import type { VerdictLabel } from '../../types/analysis';

interface ConfidenceRingProps {
  score: number;          // 0–100
  verdict: VerdictLabel;
  size?: number;          // SVG size in px
  strokeWidth?: number;
}

const VERDICT_STYLES: Record<VerdictLabel, { ring: string; text: string; label: string }> = {
  LIKELY_AUTHENTIC: { ring: '#10b981', text: 'text-emerald-400', label: 'LIKELY AUTHENTIC' },
  NEEDS_REVIEW: { ring: '#f59e0b', text: 'text-amber-400', label: 'NEEDS REVIEW' },
  HIGHLY_SUSPICIOUS: { ring: '#ef4444', text: 'text-red-400', label: 'HIGHLY SUSPICIOUS' },
  INCONCLUSIVE: { ring: '#94a3b8', text: 'text-slate-300', label: 'INCONCLUSIVE' },
};

export function ConfidenceRing({
  score,
  verdict,
  size = 200,
  strokeWidth = 12,
}: ConfidenceRingProps) {
  const style = VERDICT_STYLES[verdict];
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={style.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${style.ring}88)`,
          }}
        />
        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
          const r1 = radius + strokeWidth * 0.8;
          const r2 = radius + strokeWidth * 1.3;
          const x1 = center + r1 * Math.cos(angle);
          const y1 = center + r1 * Math.sin(angle);
          const x2 = center + r2 * Math.cos(angle);
          const y2 = center + r2 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={i % 5 === 0 ? 2 : 1}
            />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute flex flex-col items-center">
        <span className={cn('text-4xl font-black tabular-nums', style.text)}>{score}%</span>
        <span className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Confidence
        </span>
      </div>
    </div>
  );
}
