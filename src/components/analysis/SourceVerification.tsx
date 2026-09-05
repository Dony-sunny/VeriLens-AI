import { Globe, ExternalLink, Clock, AlertTriangle, ShieldCheck, Link2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { cn } from '../lib/utils';
import type { SourceVerificationResult, SourceIntelligence } from '../../types/analysis';

interface SourceVerificationProps {
  source: SourceVerificationResult;
  sourceIntelligence?: SourceIntelligence;
}

export function SourceVerification({ source, sourceIntelligence }: SourceVerificationProps) {
  const isUserProvided = sourceIntelligence?.status === 'provided' || source.originalSource.includes('User-provided');
  const isVerified = source.verificationStatus === 'VERIFIED';

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10">
            <Globe className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Source Intelligence & Provenance</h3>
            <p className="text-xs text-slate-500">Origin tracing and publication verification</p>
          </div>
        </div>

        <Badge
          variant={isVerified ? 'green' : isUserProvided ? 'amber' : 'ghost'}
          size="md"
        >
          {isVerified
            ? 'INDEPENDENTLY VERIFIED SOURCE'
            : isUserProvided
            ? 'USER-PROVIDED SOURCE'
            : 'UNVERIFIED SOURCE'}
        </Badge>
      </div>

      {/* Source banner */}
      <div className={cn(
        "mb-5 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5",
        isVerified
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
          : "border-amber-500/20 bg-amber-500/5 text-amber-300"
      )}>
        {isVerified ? (
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        )}
        <span>
          {isVerified
            ? "This media's origin has been cross-referenced and confirmed with established archival or institutional records."
            : "User-submitted URLs or files have not been independently validated. Automated tools cannot confirm original authorship without cryptographic C2PA credentials or trusted wire registry matches."}
        </span>
      </div>

      {/* Source details grid */}
      <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/8 bg-white/3 p-3">
          <p className="mb-1 text-xs text-slate-500">Source Identification</p>
          <div className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <p className="text-sm font-semibold text-white truncate">
              {sourceIntelligence?.hostname || source.originalSource}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/3 p-3">
          <p className="mb-1 text-xs text-slate-500">Source Classification</p>
          <span className="text-xs font-mono text-cyan-300">
            {isUserProvided ? 'USER-PROVIDED' : isVerified ? 'VERIFIED' : 'UNVERIFIED'}
          </span>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/3 p-3">
          <p className="mb-1 text-xs text-slate-500">First Appearance</p>
          <p className="text-sm font-semibold text-white">{source.firstKnownAppearance}</p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/3 p-3">
          <p className="mb-1 text-xs text-slate-500">Publication Date</p>
          <p className="text-sm font-semibold text-white">{source.publicationDate}</p>
        </div>
      </div>

      {/* Related sources */}
      {source.relatedSources.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            Corroborating Dissemination Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {source.relatedSources.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
              >
                <ExternalLink className="h-3 w-3 text-slate-400" />
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {source.timeline && source.timeline.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            Dissemination & Provenance Timeline
          </p>
          <div className="relative space-y-0">
            {source.timeline.map((event, i) => (
              <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
                {i < source.timeline.length - 1 && (
                  <div className="absolute left-3.5 top-7 bottom-0 w-px bg-white/10" />
                )}
                <div className="relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <div className="flex-1 rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-white">{event.label}</span>
                    <span className="font-mono text-xs text-cyan-400">{event.date}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
