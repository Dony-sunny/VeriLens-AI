import { Shield, Cpu, FileSearch, Fingerprint } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { cn } from '../lib/utils';
import type { AnalysisResult } from '../../types/analysis';

interface DetectorEvidenceCardProps {
  result: AnalysisResult;
}

export function DetectorEvidenceCard({ result }: DetectorEvidenceCardProps) {
  const { providers, metadata, isLiveResult, isDemo } = result;
  const hive = providers?.hive;
  const sightengine = providers?.sightengine;

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="green" size="sm">Active</Badge>;
      case 'failed':
        return <Badge variant="red" size="sm">Failed</Badge>;
      default:
        return <Badge variant="ghost" size="sm">Unavailable</Badge>;
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
            <Cpu className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Detector Evidence & Attribution</h3>
            <p className="text-xs text-slate-500">
              Independent multi-model forensic analysis (Hive + Sightengine)
            </p>
          </div>
        </div>
        {isDemo && (
          <span className="text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
            Simulated Detector Data
          </span>
        )}
        {isLiveResult && (
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
            Live Detector Data
          </span>
        )}
      </div>

      {/* Grid for Detectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Hive AI Detector */}
        <div className="rounded-xl border border-white/8 bg-white/3 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">Hive AI Engine</span>
            </div>
            {getStatusBadge(hive?.status ?? (isDemo ? 'success' : 'unavailable'))}
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">AI Generation Signal</span>
                <span className="font-mono text-white">
                  {hive?.aiGeneratedScore !== null && hive?.aiGeneratedScore !== undefined
                    ? `${hive.aiGeneratedScore}%`
                    : isDemo
                    ? `${result.scores.aiGenerationProbability}%`
                    : 'Not available'}
                </span>
              </div>
              <ProgressBar
                value={hive?.aiGeneratedScore ?? (isDemo ? result.scores.aiGenerationProbability : 0)}
                color="red"
                size="sm"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Deepfake Detection</span>
                <span className="font-mono text-white">
                  {hive?.deepfakeScore !== null && hive?.deepfakeScore !== undefined
                    ? `${hive.deepfakeScore}%`
                    : isDemo
                    ? `${result.scores.manipulationProbability}%`
                    : 'Not available'}
                </span>
              </div>
              <ProgressBar
                value={hive?.deepfakeScore ?? (isDemo ? result.scores.manipulationProbability : 0)}
                color="amber"
                size="sm"
              />
            </div>

            {/* Generator Attribution */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-500">Generator Attribution:</span>
              <span className="text-slate-300 font-medium">
                {hive?.generator ?? 'None identified'}
              </span>
            </div>

            {/* C2PA Provenance */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Fingerprint className="h-3 w-3 text-cyan-400" /> C2PA Provenance:
              </span>
              <span className={cn(
                "font-medium",
                hive?.c2pa ? "text-emerald-400" : "text-slate-400"
              )}>
                {hive?.c2pa ? 'Provenance information detected' : 'No provenance detected'}
              </span>
            </div>
          </div>
        </div>

        {/* Sightengine Detector */}
        <div className="rounded-xl border border-white/8 bg-white/3 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Sightengine Engine</span>
            </div>
            {getStatusBadge(sightengine?.status ?? (isDemo ? 'success' : 'unavailable'))}
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">AI Generation Signal</span>
                <span className="font-mono text-white">
                  {sightengine?.aiGeneratedScore !== null && sightengine?.aiGeneratedScore !== undefined
                    ? `${sightengine.aiGeneratedScore}%`
                    : isDemo
                    ? `${Math.max(0, result.scores.aiGenerationProbability - 5)}%`
                    : 'Not available'}
                </span>
              </div>
              <ProgressBar
                value={sightengine?.aiGeneratedScore ?? (isDemo ? Math.max(0, result.scores.aiGenerationProbability - 5) : 0)}
                color="red"
                size="sm"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Deepfake Detection</span>
                <span className="font-mono text-white">
                  {sightengine?.deepfakeScore !== null && sightengine?.deepfakeScore !== undefined
                    ? `${sightengine.deepfakeScore}%`
                    : isDemo
                    ? `${Math.max(0, result.scores.manipulationProbability - 4)}%`
                    : 'Not available'}
                </span>
              </div>
              <ProgressBar
                value={sightengine?.deepfakeScore ?? (isDemo ? Math.max(0, result.scores.manipulationProbability - 4) : 0)}
                color="amber"
                size="sm"
              />
            </div>

            {/* Generator Attribution */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-500">Generator Attribution:</span>
              <span className="text-slate-300 font-medium">
                {sightengine?.generator ?? 'None identified'}
              </span>
            </div>

            {/* Cross-Validation Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Model Agreement:</span>
              <span className="text-emerald-400 font-medium">
                {result.verdictLevel === 'inconclusive' ? 'Divergent signals' : 'Consistent signals'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Panel */}
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileSearch className="h-4 w-4 text-slate-400" />
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Technical Metadata Forensics
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-black/20 p-2.5">
            <span className="text-slate-500 block mb-1">MIME Type</span>
            <span className="font-mono text-slate-200">
              {metadata?.mimeType || result.mediaInput.mimeType || 'unknown'}
            </span>
          </div>

          <div className="rounded-lg bg-black/20 p-2.5">
            <span className="text-slate-500 block mb-1">File Size</span>
            <span className="font-mono text-slate-200">
              {metadata?.size ? formatBytes(metadata.size) : `${result.mediaInput.sizeMb} MB`}
            </span>
          </div>

          <div className="rounded-lg bg-black/20 p-2.5">
            <span className="text-slate-500 block mb-1">Dimensions</span>
            <span className="font-mono text-slate-200">
              {metadata?.width && metadata?.height
                ? `${metadata.width} × ${metadata.height}`
                : 'Not available'}
            </span>
          </div>

          <div className="rounded-lg bg-black/20 p-2.5">
            <span className="text-slate-500 block mb-1">EXIF Metadata</span>
            <span className="font-mono text-slate-200">
              {metadata?.exifAvailable === true
                ? 'EXIF present'
                : metadata?.exifAvailable === false
                ? 'EXIF stripped'
                : 'Metadata unavailable — inconclusive signal.'}
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          * Note: Absence of EXIF or C2PA metadata does not prove manipulation; many social media platforms strip metadata upon upload. Thresholds applied are application-level decision rules, not scientific certainty.
        </p>
      </div>
    </GlassCard>
  );
}
