import { ShieldCheck, ShieldAlert, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { RiskLevel } from '../../types/analysis';

const RISK_CONFIG: Record<
  RiskLevel,
  {
    icon: typeof ShieldCheck;
    label: string;
    borderColor: string;
    bgColor: string;
    textColor: string;
    iconColor: string;
    glowColor: string;
  }
> = {
  SAFE_TO_REVIEW: {
    icon: ShieldCheck,
    label: 'LOW RISK — SAFE TO REVIEW',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/8',
    textColor: 'text-emerald-400',
    iconColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/10',
  },
  VERIFY_BEFORE_SHARING: {
    icon: AlertTriangle,
    label: 'MEDIUM RISK — VERIFY BEFORE SHARING',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/8',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-400',
    glowColor: 'shadow-amber-500/10',
  },
  DO_NOT_TRUST: {
    icon: ShieldAlert,
    label: 'HIGH RISK — DO NOT TRUST WITHOUT VERIFICATION',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/8',
    textColor: 'text-red-400',
    iconColor: 'text-red-400',
    glowColor: 'shadow-red-500/10',
  },
  INCONCLUSIVE: {
    icon: HelpCircle,
    label: 'INCONCLUSIVE — REQUIRES HUMAN JUDGMENT',
    borderColor: 'border-slate-500/30',
    bgColor: 'bg-slate-500/8',
    textColor: 'text-slate-300',
    iconColor: 'text-slate-400',
    glowColor: 'shadow-slate-500/10',
  },
};

interface RiskRecommendationProps {
  riskLevel: RiskLevel;
  riskMessage: string;
}

export function RiskRecommendation({ riskLevel, riskMessage }: RiskRecommendationProps) {
  const config = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.INCONCLUSIVE;
  const Icon = config.icon;

  return (
    <div
      role="region"
      aria-label={`Risk assessment: ${config.label}`}
      className={cn(
        'rounded-2xl border p-6 shadow-xl',
        config.borderColor,
        config.bgColor,
        config.glowColor
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
            config.borderColor,
            config.bgColor
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-6 w-6', config.iconColor)} />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Probabilistic Assessment
            </p>
          </div>
          <h3 className={cn('text-lg font-black tracking-tight mb-2', config.textColor)}>
            {config.label}
          </h3>
          <p className="text-sm leading-relaxed text-slate-400">{riskMessage}</p>
        </div>
        <Info className="h-4 w-4 shrink-0 text-slate-600 mt-1" aria-hidden="true" />
      </div>
    </div>
  );
}
