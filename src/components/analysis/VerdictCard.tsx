import { ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle, FlaskConical, Zap } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { ConfidenceRing } from './ConfidenceRing';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../lib/utils';
import type { AnalysisResult, VerdictLabel } from '../../types/analysis';

const VERDICT_CONFIG: Record<
  VerdictLabel,
  {
    icon: typeof ShieldCheck;
    label: string;
    sublabel: string;
    bgGlow: string;
    border: string;
    text: string;
    progressColor: 'green' | 'amber' | 'red' | 'cyan';
  }
> = {
  LIKELY_AUTHENTIC: {
    icon: ShieldCheck,
    label: 'LOW RISK',
    sublabel: 'Likely Authentic',
    bgGlow: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    progressColor: 'green',
  },
  NEEDS_REVIEW: {
    icon: AlertTriangle,
    label: 'MEDIUM RISK',
    sublabel: 'Requires Human Verification',
    bgGlow: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    progressColor: 'amber',
  },
  HIGHLY_SUSPICIOUS: {
    icon: ShieldAlert,
    label: 'HIGH RISK',
    sublabel: 'Potential Manipulation Detected',
    bgGlow: 'bg-red-500/5',
    border: 'border-red-500/20',
    text: 'text-red-400',
    progressColor: 'red',
  },
  INCONCLUSIVE: {
    icon: HelpCircle,
    label: 'INCONCLUSIVE',
    sublabel: 'Divergent or Limited Signals',
    bgGlow: 'bg-slate-500/5',
    border: 'border-slate-500/20',
    text: 'text-slate-300',
    progressColor: 'cyan',
  },
};

interface VerdictCardProps {
  result: AnalysisResult;
}

export function VerdictCard({ result }: VerdictCardProps) {
  const config = VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG.INCONCLUSIVE;
  const Icon = config.icon;

  return (
    <GlassCard className={cn('p-6 border', config.border, config.bgGlow)}>
      {/* Demo badge vs Live badge */}
      {result.isDemo && (
        <div className="mb-4 flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400">
          <FlaskConical className="h-3.5 w-3.5 shrink-0" />
          <span>DEMO ANALYSIS — SIMULATED DETECTOR RESULTS</span>
        </div>
      )}

      {result.isLiveResult && (
        <div className="mb-4 flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400">
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span>LIVE ANALYSIS — VERIFIED API RESULTS</span>
        </div>
      )}

      {/* Verdict header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', config.bgGlow, 'border', config.border)}>
          <Icon className={cn('h-5 w-5', config.text)} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Overall Verdict</p>
          <h3 className={cn('text-xl font-black tracking-tight', config.text)}>{config.label}</h3>
          <p className="text-xs text-slate-400">{config.sublabel}</p>
        </div>
      </div>

      {/* Confidence ring */}
      <div className="flex justify-center mb-6">
        <ConfidenceRing score={result.confidenceScore} verdict={result.verdict} size={180} />
      </div>

      {/* Sub-scores */}
      <div className="space-y-3 border-t border-white/8 pt-5">
        {[
          { label: 'AI Generation Signal', value: result.scores.aiGenerationProbability, color: 'red' as const },
          { label: 'Deepfake Signal', value: result.scores.manipulationProbability, color: 'red' as const },
          { label: 'Signal Strength', value: result.scores.overallConfidence, color: config.progressColor },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">{label}</span>
              <span className="font-mono font-semibold text-white">{value}%</span>
            </div>
            <ProgressBar value={value} color={color} size="sm" />
          </div>
        ))}
      </div>

      {/* Probabilistic notice */}
      <p className="mt-4 text-[11px] text-slate-500 text-center leading-relaxed">
        Probabilistic assessment based on application decision rules. Not scientific certainty.
      </p>

      {/* Timestamp */}
      <p className="mt-2 text-[11px] text-slate-600 text-center font-mono">
        Analyzed {new Date(result.analyzedAt).toLocaleString()}
      </p>
    </GlassCard>
  );
}
