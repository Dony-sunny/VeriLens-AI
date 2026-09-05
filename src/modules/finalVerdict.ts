// ─────────────────────────────────────────────
//  VeriLens AI — Final Verdict Aggregator
//
//  Two paths:
//  1. Live: converts NormalizedAnalysisResult from /api/analyze
//  2. Demo: builds from mock DetectionScores (existing behaviour)
//
//  Evidence fusion rules are documented and transparent.
//  Thresholds are application-level rules, not scientific certainty.
// ─────────────────────────────────────────────

import type {
  MediaInput,
  DetectionScores,
  ForensicSignal,
  ExplanationResult,
  SourceVerificationResult,
  SourceIntelligence,
  ProviderResults,
  MediaMetadata,
  AnalysisResult,
  VerdictLabel,
  VerdictLevel,
  RiskLevel,
} from '../types/analysis';

// ─── Application-level thresholds ─────────────
// NOT scientifically calibrated. Configurable. Used as decision rules only.

const HIGH_SIGNAL_THRESHOLD = 70;
const LOW_SIGNAL_THRESHOLD = 30;
const DISAGREEMENT_DELTA = 40;

// ─── Verdict mapping ──────────────────────────

function verdictLevelToLabel(level: VerdictLevel): VerdictLabel {
  switch (level) {
    case 'high': return 'HIGHLY_SUSPICIOUS';
    case 'medium': return 'NEEDS_REVIEW';
    case 'low': return 'LIKELY_AUTHENTIC';
    case 'inconclusive': return 'INCONCLUSIVE';
  }
}

function verdictLevelToRisk(level: VerdictLevel): { level: RiskLevel; message: string } {
  switch (level) {
    case 'low':
      return {
        level: 'SAFE_TO_REVIEW',
        message:
          'Available detection signals do not strongly indicate AI generation or manipulation. ' +
          'This is a probabilistic assessment — human verification is still recommended.',
      };
    case 'medium':
      return {
        level: 'VERIFY_BEFORE_SHARING',
        message:
          'One or more detection signals suggest potential AI generation or manipulation. ' +
          'Confirm the original source before publishing or sharing.',
      };
    case 'high':
      return {
        level: 'DO_NOT_TRUST',
        message:
          'Multiple detection signals indicate a high probability of AI generation or manipulation. ' +
          'Do not publish or share without thorough independent verification.',
      };
    case 'inconclusive':
      return {
        level: 'INCONCLUSIVE',
        message:
          'Detection results are inconclusive — detectors may disagree, have failed, or lacked sufficient data. ' +
          'Treat this media with caution and verify the source independently.',
      };
  }
}

// ─── Legacy verdict (for demo/mock path) ─────

function computeVerdictFromScores(scores: DetectionScores, signals: ForensicSignal[]): VerdictLabel {
  const criticalCount = signals.filter((s) => s.status === 'critical').length;
  const aiProb = scores.aiGenerationProbability;
  const overallScore = scores.overallConfidence;

  if (aiProb >= HIGH_SIGNAL_THRESHOLD || criticalCount >= 4 || overallScore >= 85) {
    return 'HIGHLY_SUSPICIOUS';
  }
  if (aiProb >= LOW_SIGNAL_THRESHOLD || criticalCount >= 2 || overallScore >= 60) {
    return 'NEEDS_REVIEW';
  }
  return 'LIKELY_AUTHENTIC';
}

function computeVerdictLevelFromScores(scores: DetectionScores): VerdictLevel {
  const aiProb = scores.aiGenerationProbability;
  if (aiProb >= HIGH_SIGNAL_THRESHOLD) return 'high';
  if (aiProb >= LOW_SIGNAL_THRESHOLD) return 'medium';
  return 'low';
}

function computeRisk(verdict: VerdictLabel): { level: RiskLevel; message: string } {
  switch (verdict) {
    case 'LIKELY_AUTHENTIC':
      return {
        level: 'SAFE_TO_REVIEW',
        message:
          'Detection signals do not strongly indicate AI generation or manipulation. ' +
          'This is a probabilistic assessment — standard source verification is still recommended.',
      };
    case 'NEEDS_REVIEW':
      return {
        level: 'VERIFY_BEFORE_SHARING',
        message:
          'Multiple signals suggest possible manipulation. ' +
          'Confirm the original source before publishing or sharing.',
      };
    case 'HIGHLY_SUSPICIOUS':
      return {
        level: 'DO_NOT_TRUST',
        message:
          'Strong AI generation or manipulation indicators were detected. ' +
          'Do not publish or share without thorough independent verification.',
      };
    case 'INCONCLUSIVE':
      return {
        level: 'INCONCLUSIVE',
        message:
          'Detection results are inconclusive due to divergent signals or limited evidence. ' +
          'Independent human verification is required.',
      };
  }
}

// ─── Default empty values (avoid null coalescing everywhere) ──

const EMPTY_PROVIDERS: ProviderResults = {};
const EMPTY_METADATA: MediaMetadata = {
  mimeType: '',
  size: 0,
  width: null,
  height: null,
  duration: null,
  exifAvailable: null,
};
const EMPTY_SOURCE_INTEL: SourceIntelligence = {
  url: null,
  hostname: null,
  title: null,
  status: 'unavailable',
};

// ─── Build from demo/mock scores ─────────────

export function buildFinalVerdict(
  input: MediaInput,
  scores: DetectionScores,
  signals: ForensicSignal[],
  explanation: ExplanationResult,
  sourceVerification: SourceVerificationResult
): AnalysisResult {
  const verdict = computeVerdictFromScores(scores, signals);
  const verdictLevel = computeVerdictLevelFromScores(scores);
  const risk = computeRisk(verdict);

  return {
    id: `analysis-${Date.now()}`,
    mediaInput: input,
    verdict,
    verdictLevel,
    confidenceScore: scores.overallConfidence,
    scores,
    providers: EMPTY_PROVIDERS,
    metadata: {
      mimeType: input.mimeType,
      size: Math.round(input.sizeMb * 1024 * 1024),
      width: null,
      height: null,
      duration: null,
      exifAvailable: null,
    },
    signals,
    explanation,
    sourceVerification,
    sourceIntelligence: {
      url: input.url ?? null,
      hostname: input.url
        ? (() => { try { return new URL(input.url!).hostname; } catch { return null; } })()
        : null,
      title: null,
      status: input.url ? 'provided' : 'unavailable',
    },
    riskLevel: risk.level,
    riskMessage: risk.message,
    analyzedAt: new Date().toISOString(),
    isDemo: input.isDemo ?? false,
    isLiveResult: false,
  };
}

// ─── Build from live API result ───────────────

export function buildFinalVerdictFromLive(
  input: MediaInput,
  live: {
    mediaType: string;
    verdict: VerdictLevel;
    providers: ProviderResults;
    metadata: MediaMetadata;
    explanation: ExplanationResult;
    source: SourceIntelligence;
    analyzedAt: string;
  },
  signals: ForensicSignal[],
  sourceVerification: SourceVerificationResult
): AnalysisResult {
  const verdictLevel = live.verdict;
  const verdict = verdictLevelToLabel(verdictLevel);
  const risk = verdictLevelToRisk(verdictLevel);

  // Derive a representative score for the UI confidence ring
  // from available provider scores — clearly labelled as signal strength.
  const scores = deriveScoresFromProviders(live.providers);

  return {
    id: `analysis-${Date.now()}`,
    mediaInput: input,
    verdict,
    verdictLevel,
    confidenceScore: scores.overallConfidence,
    scores,
    providers: live.providers,
    metadata: live.metadata,
    signals,
    explanation: live.explanation,
    sourceVerification,
    sourceIntelligence: live.source,
    riskLevel: risk.level,
    riskMessage: risk.message,
    analyzedAt: live.analyzedAt,
    isDemo: false,
    isLiveResult: true,
  };
}

/**
 * Derive DetectionScores for UI display from live provider results.
 * These are presented as "signal strength" not scientific probabilities.
 */
function deriveScoresFromProviders(providers: ProviderResults): DetectionScores {
  const hiveScore = providers.hive?.status === 'success' ? providers.hive.aiGeneratedScore : null;
  const seScore = providers.sightengine?.status === 'success' ? providers.sightengine?.aiGeneratedScore : null;
  const hiveDf = providers.hive?.status === 'success' ? providers.hive.deepfakeScore : null;
  const seDf = providers.sightengine?.status === 'success' ? providers.sightengine?.deepfakeScore : null;

  const aiScores = [hiveScore, seScore].filter((s): s is number => s !== null);
  const dfScores = [hiveDf, seDf].filter((s): s is number => s !== null);

  const avgAi = aiScores.length > 0
    ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length)
    : 0;
  const avgDf = dfScores.length > 0
    ? Math.round(dfScores.reduce((a, b) => a + b, 0) / dfScores.length)
    : 0;

  return {
    aiGenerationProbability: avgAi,
    manipulationProbability: avgDf,
    sourceConfidence: 0,   // Not applicable for live results
    overallConfidence: aiScores.length > 0 ? avgAi : 0,
  };
}

// ─── Exports ──────────────────────────────────

export { EMPTY_PROVIDERS, EMPTY_METADATA, EMPTY_SOURCE_INTEL };
export { verdictLevelToLabel, verdictLevelToRisk, HIGH_SIGNAL_THRESHOLD, LOW_SIGNAL_THRESHOLD, DISAGREEMENT_DELTA };
