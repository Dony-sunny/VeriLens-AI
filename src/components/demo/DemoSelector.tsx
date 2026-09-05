import { FlaskConical, Image, Video, ChevronRight, X } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import type { AnalysisResult } from '../../types/analysis';
import { DEMO_CASES } from '../../data/demoCases';

const CASE_META = [
  { icon: Image, label: 'News Photograph', description: 'A real wire-service news image.' },
  { icon: Image, label: 'AI Generated Portrait', description: 'A synthetically created face.' },
  { icon: Video, label: 'Manipulated Video', description: 'A deepfake video clip.' },
];

const VERDICT_COLORS = {
  LIKELY_AUTHENTIC: 'green' as const,
  NEEDS_REVIEW: 'amber' as const,
  HIGHLY_SUSPICIOUS: 'red' as const,
  INCONCLUSIVE: 'ghost' as const,
};

const VERDICT_LABELS = {
  LIKELY_AUTHENTIC: 'LIKELY AUTHENTIC',
  NEEDS_REVIEW: 'NEEDS REVIEW',
  HIGHLY_SUSPICIOUS: 'HIGHLY SUSPICIOUS',
  INCONCLUSIVE: 'INCONCLUSIVE',
};

interface DemoSelectorProps {
  onSelect: (result: AnalysisResult) => void;
  onClose: () => void;
}

export function DemoSelector({ onSelect, onClose }: DemoSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl">
        <GlassCard className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10">
                <FlaskConical className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Demo Analysis Cases</h2>
                <p className="text-xs text-slate-500">Select a pre-analyzed case to explore</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Demo notice */}
          <div className="mb-5 rounded-xl border border-purple-500/20 bg-purple-500/8 p-3">
            <p className="text-xs text-purple-300">
              <strong>⚠ Demo Mode:</strong> All results below are simulated for demonstration purposes only.
              They are not produced by a real detector and should not be used for actual media verification.
            </p>
          </div>

          <div className="space-y-3">
            {DEMO_CASES.map((demoCase, i) => {
              const meta = CASE_META[i];
              const Icon = meta.icon;
              return (
                <button
                  key={demoCase.id}
                  onClick={() => { onSelect(demoCase); onClose(); }}
                  className="group w-full rounded-xl border border-white/10 bg-white/3 p-4 text-left transition-all hover:border-cyan-500/30 hover:bg-white/6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 group-hover:border-cyan-500/30">
                      <Icon className="h-6 w-6 text-cyan-400/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          Case {i + 1}
                        </span>
                        <Badge variant={VERDICT_COLORS[demoCase.verdict]}>
                          {VERDICT_LABELS[demoCase.verdict]}
                        </Badge>
                        <Badge variant="ghost">{demoCase.confidenceScore}% confidence</Badge>
                      </div>
                      <p className="font-semibold text-white">{meta.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
