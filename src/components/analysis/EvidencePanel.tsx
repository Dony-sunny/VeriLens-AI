import { AlertOctagon, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, MinusCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../lib/utils';
import type { ForensicSignal, SignalStatus } from '../../types/analysis';

const STATUS_CONFIG: Record<
  SignalStatus,
  { icon: typeof CheckCircle; color: 'green' | 'amber' | 'red' | 'cyan'; badge: 'green' | 'amber' | 'red' | 'cyan'; label: string }
> = {
  clear: { icon: CheckCircle, color: 'green', badge: 'green', label: 'Clear' },
  warning: { icon: AlertTriangle, color: 'amber', badge: 'amber', label: 'Warning' },
  critical: { icon: AlertOctagon, color: 'red', badge: 'red', label: 'Critical' },
  unavailable: { icon: MinusCircle, color: 'cyan', badge: 'cyan', label: 'Unavailable' },
};

/** Label indicating where a signal came from */
const SOURCE_LABEL: Record<string, string> = {
  live: 'Live',
  estimated: 'Est.',
  demo: 'Demo',
};

function SignalCard({ signal }: { signal: ForensicSignal }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[signal.status] ?? STATUS_CONFIG.unavailable;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        signal.status === 'critical'
          ? 'border-red-500/20 bg-red-500/5'
          : signal.status === 'warning'
          ? 'border-amber-500/20 bg-amber-500/5'
          : signal.status === 'unavailable'
          ? 'border-slate-500/20 bg-slate-500/5'
          : 'border-white/8 bg-white/3'
      )}
    >
      <div
        className="flex cursor-pointer items-center gap-3"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${signal.label}: ${config.label}`}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded((v) => !v)}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0',
            signal.status === 'critical'
              ? 'text-red-400'
              : signal.status === 'warning'
              ? 'text-amber-400'
              : signal.status === 'unavailable'
              ? 'text-slate-500'
              : 'text-emerald-400'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{signal.label}</span>
            <Badge variant={config.badge as 'green' | 'amber' | 'red' | 'cyan'} size="sm">
              {config.label}
            </Badge>
            {/* Source indicator: live vs estimated vs demo */}
            {signal.source && (
              <span className={cn(
                'flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded font-medium',
                signal.source === 'live'
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : signal.source === 'demo'
                  ? 'text-purple-400 bg-purple-500/10'
                  : 'text-slate-500 bg-white/5'
              )}>
                {signal.source === 'live' && <Zap className="h-2.5 w-2.5" aria-hidden="true" />}
                {SOURCE_LABEL[signal.source] ?? signal.source}
              </span>
            )}
          </div>
          {signal.status !== 'unavailable' && (
            <ProgressBar
              value={signal.confidence}
              color={config.color as 'green' | 'amber' | 'red' | 'cyan'}
              size="sm"
              className="mt-1.5"
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {signal.status !== 'unavailable' && (
            <span className="font-mono text-xs text-slate-400" aria-hidden="true">{signal.confidence}%</span>
          )}
          {expanded
            ? <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
            : <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />}
        </div>
      </div>

      {expanded && (
        <p className="mt-3 border-t border-white/8 pt-3 text-sm leading-relaxed text-slate-400">
          {signal.explanation}
        </p>
      )}
    </div>
  );
}

interface EvidencePanelProps {
  signals: ForensicSignal[];
}

export function EvidencePanel({ signals }: EvidencePanelProps) {
  const grouped = signals.reduce<Record<string, ForensicSignal[]>>((acc, signal) => {
    if (!acc[signal.category]) acc[signal.category] = [];
    acc[signal.category].push(signal);
    return acc;
  }, {});

  const criticalCount = signals.filter((s) => s.status === 'critical').length;
  const warningCount = signals.filter((s) => s.status === 'warning').length;
  const clearCount = signals.filter((s) => s.status === 'clear').length;
  const liveCount = signals.filter((s) => s.source === 'live').length;

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-white">Evidence Panel</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Forensic signal analysis
            {liveCount > 0 && <span className="ml-1 text-cyan-500/80">({liveCount} live)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap" aria-label="Signal summary">
          {criticalCount > 0 && <Badge variant="red">{criticalCount} critical</Badge>}
          {warningCount > 0 && <Badge variant="amber">{warningCount} warning</Badge>}
          {clearCount > 0 && <Badge variant="green">{clearCount} clear</Badge>}
        </div>
      </div>

      <div className="space-y-6" role="list" aria-label="Forensic signals">
        {Object.entries(grouped).map(([category, categorySignals]) => (
          <div key={category} role="listitem">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              {category}
            </h4>
            <div className="space-y-2">
              {categorySignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-600">
        Detection signals represent probabilistic assessments, not definitive findings.
        Human verification is always required.
      </p>
    </GlassCard>
  );
}
