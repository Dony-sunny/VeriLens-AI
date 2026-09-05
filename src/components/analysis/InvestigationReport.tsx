import { useState } from 'react';
import { FileText, Download, Loader2, ChevronUp } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import type { AnalysisResult } from '../../types/analysis';

interface InvestigationReportProps {
  result: AnalysisResult;
}

function generateReportText(result: AnalysisResult): string {
  const line = '─'.repeat(60);
  const lines: string[] = [];

  lines.push('VERILENS AI — FORENSIC INVESTIGATION REPORT');
  lines.push(line);
  lines.push(`Generated: ${new Date(result.analyzedAt).toLocaleString()}`);
  if (result.isDemo) lines.push('⚠ NOTE: This is a DEMO analysis. Results are simulated, not from live detectors.');
  if (result.isLiveResult) lines.push('✓ This analysis used live detection APIs.');
  lines.push('');
  lines.push('IMPORTANT DISCLAIMER');
  lines.push(line);
  lines.push('This report is a probabilistic assessment based on automated detection.');
  lines.push('It is NOT a definitive forensic finding. Human verification is always required.');
  lines.push('Detection signals indicate probability, not certainty.');
  lines.push('');

  lines.push('MEDIA INFORMATION');
  lines.push(line);
  lines.push(`File Name:   ${result.mediaInput.name}`);
  lines.push(`Media Type:  ${result.mediaInput.type.toUpperCase()}`);
  lines.push(`MIME Type:   ${result.mediaInput.mimeType || 'N/A'}`);
  lines.push(`File Size:   ${result.mediaInput.sizeMb > 0 ? result.mediaInput.sizeMb + ' MB' : 'N/A'}`);
  if (result.metadata.width) lines.push(`Dimensions:  ${result.metadata.width}×${result.metadata.height}`);
  if (result.metadata.duration) lines.push(`Duration:    ${result.metadata.duration}s`);
  lines.push('');

  lines.push('ANALYSIS SUMMARY');
  lines.push(line);
  lines.push(`Verdict:          ${result.verdict.replace(/_/g, ' ')}`);
  lines.push(`Risk Level:       ${result.riskLevel.replace(/_/g, ' ')}`);
  lines.push(`Detection Signal: ${result.confidenceScore}% (signal strength, not certainty)`);
  lines.push('');

  // Provider results (live)
  if (result.isLiveResult) {
    lines.push('DETECTOR EVIDENCE');
    lines.push(line);
    if (result.providers.hive) {
      const h = result.providers.hive;
      lines.push(`Hive AI: ${h.status}`);
      lines.push(`  AI Generated Score: ${h.aiGeneratedScore ?? 'N/A'}`);
      lines.push(`  Deepfake Score: ${h.deepfakeScore ?? 'N/A'}`);
      if (h.generator) lines.push(`  Generator: ${h.generator}`);
      lines.push(`  C2PA: ${h.c2pa ? 'Provenance data present' : 'No provenance data'}`);
    }
    if (result.providers.sightengine) {
      const se = result.providers.sightengine;
      lines.push(`Sightengine: ${se.status}`);
      lines.push(`  AI Generated Score: ${se.aiGeneratedScore ?? 'N/A'}`);
      lines.push(`  Deepfake Score: ${se.deepfakeScore ?? 'N/A'}`);
      if (se.generator) lines.push(`  Generator: ${se.generator}`);
    }
    lines.push('');
  } else {
    lines.push('DETECTION SCORES (estimated)');
    lines.push(line);
    lines.push(`AI Generation Probability:   ${result.scores.aiGenerationProbability}%`);
    lines.push(`Manipulation Probability:    ${result.scores.manipulationProbability}%`);
    lines.push(`Overall Confidence:          ${result.scores.overallConfidence}%`);
    lines.push('');
  }

  lines.push('FORENSIC SIGNALS');
  lines.push(line);
  result.signals.forEach((signal) => {
    lines.push(`[${signal.status.toUpperCase().padEnd(8)}] ${signal.label} (${signal.confidence}%)`);
    lines.push(`  ${signal.explanation}`);
    lines.push('');
  });

  lines.push('AI EXPLANATION');
  lines.push(line);
  lines.push(result.explanation.summary);
  lines.push('');
  const keySignals = result.explanation.keySignals ?? [];
  if (keySignals.length > 0) {
    lines.push('Key Detection Signals:');
    keySignals.forEach((s) => lines.push(`• ${s}`));
    lines.push('');
  }
  if (result.explanation.uncertainty) {
    lines.push(`Uncertainty: ${result.explanation.uncertainty}`);
    lines.push('');
  }
  if (result.explanation.verificationSteps?.length) {
    lines.push('Recommended Verification Steps:');
    result.explanation.verificationSteps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    lines.push('');
  }

  lines.push('SOURCE INTELLIGENCE');
  lines.push(line);
  if (result.sourceIntelligence.url) {
    lines.push(`Provided URL:  ${result.sourceIntelligence.url}`);
    lines.push(`Hostname:      ${result.sourceIntelligence.hostname ?? 'N/A'}`);
    lines.push(`Status:        USER-PROVIDED SOURCE (not independently verified)`);
  } else {
    lines.push('No source URL was provided.');
  }
  lines.push('');

  lines.push('RECOMMENDED ACTION');
  lines.push(line);
  lines.push(`Risk Level: ${result.riskLevel.replace(/_/g, ' ')}`);
  lines.push(result.riskMessage);
  lines.push('');
  lines.push(line);
  lines.push('VeriLens AI — Before you trust it, verify it.');
  lines.push('This report is for investigative purposes only. Not a substitute for professional forensic analysis.');

  return lines.join('\n');
}

export function InvestigationReport({ result }: InvestigationReportProps) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setExpanded(true);
      setGenerating(false);
    }, 1200);
  };

  const handleDownload = () => {
    const text = generateReportText(result);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verilens-report-${result.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportText = generateReportText(result);

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-500/30 bg-slate-500/10"
          aria-hidden="true"
        >
          <FileText className="h-5 w-5 text-slate-300" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Investigation Report</h3>
          <p className="text-xs text-slate-500">Detailed forensic documentation for investigative use</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={expanded ? () => setExpanded(false) : handleGenerate}
          disabled={generating}
          aria-expanded={expanded}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Generating...
            </>
          ) : expanded ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
              Hide Report
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" aria-hidden="true" />
              Generate Evidence Report
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          aria-label="Download investigation report as text file"
          className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download
        </button>
      </div>

      {expanded && (
        <div
          className="mt-4 max-h-80 overflow-auto rounded-xl border border-white/8 bg-black/40"
          role="region"
          aria-label="Investigation report content"
        >
          <pre className="p-4 text-xs leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
            {reportText}
          </pre>
        </div>
      )}
    </GlassCard>
  );
}
