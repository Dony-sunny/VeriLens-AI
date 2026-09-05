import { Brain, ChevronRight, HelpCircle, CheckSquare } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import type { ExplanationResult } from '../../types/analysis';

interface ExplainableAIProps {
  explanation: ExplanationResult;
}

export function ExplainableAI({ explanation }: ExplainableAIProps) {
  const keySignals = explanation.keySignals ?? [];

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10"
          aria-hidden="true"
        >
          <Brain className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Explainable AI</h3>
          <p className="text-xs text-slate-500">Plain-language interpretation of detection evidence</p>
        </div>
      </div>

      {/* Summary paragraph */}
      <div
        className="mb-5 rounded-xl border border-white/8 bg-white/3 p-4"
        role="region"
        aria-label="Analysis summary"
      >
        <p className="text-sm leading-relaxed text-slate-300">{explanation.summary}</p>
      </div>

      {/* Key signals */}
      {keySignals.length > 0 && (
        <section aria-labelledby="key-signals-heading" className="mb-4">
          <h4
            id="key-signals-heading"
            className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500"
          >
            Key Detection Signals
          </h4>
          <ul className="space-y-2" role="list">
            {keySignals.map((signal, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                <ChevronRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500/70"
                  aria-hidden="true"
                />
                {signal}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Uncertainty statement */}
      {explanation.uncertainty && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <HelpCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed text-amber-300">{explanation.uncertainty}</p>
        </div>
      )}

      {/* Verification steps */}
      {explanation.verificationSteps && explanation.verificationSteps.length > 0 && (
        <section aria-labelledby="verification-steps-heading">
          <h4
            id="verification-steps-heading"
            className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500"
          >
            Recommended Verification Steps
          </h4>
          <ol className="space-y-2" role="list">
            {explanation.verificationSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                <CheckSquare
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/70"
                  aria-hidden="true"
                />
                {step}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="mt-4 text-xs text-slate-600">
        * Probabilistic assessment only. Human verification is always required.
      </p>
    </GlassCard>
  );
}
