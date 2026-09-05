// ─────────────────────────────────────────────
//  VeriLens AI — Explanation Engine
//
//  Gemini is used ONLY for explanation.
//  It never overrides detector results.
//  It never invents scores, sources, or dates.
//
//  On Gemini failure: template fallback is used.
//  The application never crashes due to Gemini.
// ─────────────────────────────────────────────

import type { MediaInput, DetectionScores, ForensicSignal, ExplanationResult } from '../types/analysis';

// ─── Template-based Explanation ───────────────

function buildTemplateExplanation(
  input: MediaInput,
  scores: DetectionScores,
  signals: ForensicSignal[]
): ExplanationResult {
  const criticalSignals = signals.filter((s) => s.status === 'critical');
  const warningSignals = signals.filter((s) => s.status === 'warning');
  const overallScore = scores.overallConfidence;

  let summary = '';
  const keySignals: string[] = [];

  if (overallScore >= 85) {
    if (scores.aiGenerationProbability >= 80) {
      summary = `Analysis of this ${input.type} found strong and consistent signals potentially associated with synthetic AI generation. `;
      summary += criticalSignals.length > 0
        ? `${criticalSignals.length} critical signal${criticalSignals.length > 1 ? 's were' : ' was'} detected, including ${criticalSignals.slice(0, 2).map((s) => s.label.toLowerCase()).join(' and ')}. `
        : '';
      summary += 'These signals suggest this media may not have originated from a real recording device. Human verification is required.';
    } else {
      summary = `Analysis of this ${input.type} did not surface strong indicators of AI generation or manipulation. `;
      summary += 'Compression patterns, signal distribution, and other indicators appear consistent with authentic media.';
    }
  } else if (overallScore >= 60) {
    summary = `Analysis of this ${input.type} identified several signals that warrant closer review. `;
    if (warningSignals.length > 0) {
      summary += `${warningSignals.length} area${warningSignals.length > 1 ? 's' : ''} of potential concern ${warningSignals.length > 1 ? 'were' : 'was'} identified, including ${warningSignals.slice(0, 2).map((s) => s.label.toLowerCase()).join(' and ')}. `;
    }
    summary += 'These findings do not conclusively indicate manipulation. Independent source verification is strongly recommended before publishing or sharing.';
  } else {
    summary = `Initial analysis of this ${input.type} does not reveal strong indicators of AI generation or manipulation. `;
    summary += 'Standard source verification is still recommended as best practice before publishing or sharing any media.';
  }

  criticalSignals.slice(0, 3).forEach((s) => {
    keySignals.push(`${s.label} raised a critical detection signal (${s.confidence}% signal strength).`);
  });
  warningSignals.slice(0, 2).forEach((s) => {
    keySignals.push(`${s.label} shows signs worth investigating further.`);
  });

  if (scores.sourceConfidence < 50) {
    keySignals.push('Source could not be verified — origin of this media is unknown.');
  }

  if (keySignals.length === 0) {
    keySignals.push('No critical manipulation signals were detected by the analysis pipeline.');
    keySignals.push('Signal distribution appears consistent with authentic media characteristics.');
  }

  return {
    summary,
    keySignals,
    uncertainty:
      'Automated detection has inherent limitations. Missing metadata, compression, or unusual encoding may affect accuracy. This assessment is probabilistic, not definitive.',
    verificationSteps: [
      'Search for the original source of this media using reverse image or video search.',
      'Check if the media has been reported or fact-checked by reputable organisations.',
      'Examine context: does the caption, date, or claimed origin match the content?',
      'Consult a professional media forensics service for high-stakes decisions.',
    ],
  };
}

// ─── Main Explanation Engine ──────────────────
//
// Note: In the live API path, Gemini is called server-side in api/analyze.ts.
// This function is only used for the demo/mock path.

export async function generateExplanation(
  input: MediaInput,
  scores: DetectionScores,
  signals: ForensicSignal[],
  _geminiApiKey?: string
): Promise<ExplanationResult> {
  // In the live path, Gemini is called server-side.
  // This function only generates template explanations for the demo pipeline.
  return buildTemplateExplanation(input, scores, signals);
}
