// ─────────────────────────────────────────────
//  VeriLens AI — Evidence Extractor
//
//  For the DEMO/MOCK path only.
//  In the live API path, buildLiveSignals() is used
//  to convert real Hive/Sightengine results into signals.
// ─────────────────────────────────────────────

import type { MediaInput, DetectionScores, ForensicSignal, SignalStatus } from '../types/analysis';
import { SIGNAL_DEFINITIONS } from '../data/signalDefinitions';

function scoreToStatus(score: number): SignalStatus {
  if (score >= 75) return 'critical';
  if (score >= 45) return 'warning';
  return 'clear';
}

function generateSignalConfidence(
  baseScore: number,
  signalIndex: number,
  totalSignals: number
): number {
  const spread = 25;
  const offset = ((signalIndex / totalSignals) * spread * 2) - spread;
  return Math.min(99, Math.max(5, Math.round(baseScore + offset)));
}

const GENERIC_EXPLANATIONS: Record<string, (conf: number) => string> = {
  visual_artifacts: (c) =>
    c >= 75
      ? 'High-frequency GAN fingerprint patterns detected in the frequency domain, consistent with diffusion model outputs.'
      : c >= 45
      ? 'Minor pixel irregularities detected that may warrant further investigation.'
      : 'No significant unnatural pixel-level patterns detected. Noise distribution is consistent with a real camera sensor.',

  lighting_inconsistencies: (c) =>
    c >= 75
      ? 'The inferred light source direction is inconsistent across subjects and background elements — a common AI generation failure mode.'
      : c >= 45
      ? 'Minor lighting variation detected between foreground and background elements.'
      : 'Lighting direction and intensity appear consistent across the image.',

  facial_anomalies: (c) =>
    c >= 75
      ? 'Significant facial geometry anomalies detected, including unusual symmetry and edge blending artifacts around key facial landmarks.'
      : c >= 45
      ? 'Subtle blending artifacts visible around the hairline and jaw region, consistent with partial manipulation.'
      : 'Facial geometry and texture appear consistent with natural human features.',

  texture_inconsistencies: (c) =>
    c >= 75
      ? 'Skin texture is unnaturally uniform with no visible pores or micro-texture variation typical of real human skin.'
      : c >= 45
      ? 'Surface textures show some inconsistency, particularly in transition areas between subjects and backgrounds.'
      : 'Surface textures display natural randomness consistent with real-world camera capture.',

  compression_patterns: (c) =>
    c >= 75
      ? 'Compression artifacts are absent or inconsistent, suggesting the media was not processed by a standard camera pipeline.'
      : c >= 45
      ? 'Some unusual compression pattern discontinuities detected at regional boundaries.'
      : 'Compression fingerprint matches a single-save workflow typical of authentic media.',

  metadata_anomalies: (c) =>
    c >= 75
      ? 'Metadata is entirely absent. No camera model, timestamp, or GPS data present — this is an inconclusive signal, not proof of manipulation.'
      : c >= 45
      ? 'Some metadata fields are missing or contain inconsistent values.'
      : 'Metadata is present and internally consistent with the claimed source.',

  frame_inconsistencies: (c) =>
    c >= 75
      ? 'Several frames show statistical anomalies inconsistent with the video\'s natural encoding. Possible frame insertion or replacement.'
      : c >= 45
      ? 'Minor frame-level inconsistencies detected. May indicate post-processing or re-encoding.'
      : 'Frame sequence appears consistent with the video\'s natural encoding pattern.',

  face_voice_sync: (c) =>
    c >= 75
      ? 'Significant lip-sync misalignment detected throughout multiple segments. Potential indicator of audio or video replacement.'
      : c >= 45
      ? 'Lip movements do not fully align with the audio track in some segments.'
      : 'Lip movements and audio track appear well synchronized throughout the video.',

  temporal_artifacts: (c) =>
    c >= 75
      ? 'Severe motion blur discontinuities and temporal inconsistencies detected, potentially suggesting compositing or splicing.'
      : c >= 45
      ? 'Unnatural motion blur patterns detected at certain timestamps, suggesting possible compositing.'
      : 'Motion and temporal continuity appear consistent throughout the video.',

  scene_transitions: (c) =>
    c >= 75
      ? 'Multiple abrupt cuts detected that do not match the surrounding encoding bitrate — potential indicators of video splicing.'
      : c >= 45
      ? 'Some scene transitions appear more abrupt than expected, possibly indicating editing.'
      : 'Scene transitions appear natural and consistent with the video encoding pattern.',

  voice_synthesis: (c) =>
    c >= 75
      ? 'Spectral patterns show similarities to neural text-to-speech or voice cloning model outputs.'
      : c >= 45
      ? 'Some spectral characteristics are atypical for natural human speech, though not conclusive.'
      : 'Vocal spectral patterns appear consistent with natural human speech.',

  spectral_anomalies: (c) =>
    c >= 75
      ? 'Multiple frequency components fall outside typical human vocal range patterns, consistent with possible synthetic audio generation.'
      : c >= 45
      ? 'Minor spectral irregularities detected that may warrant further analysis.'
      : 'Frequency components appear consistent with natural human vocal characteristics.',

  unnatural_prosody: (c) =>
    c >= 75
      ? 'Pitch, rhythm, and stress patterns are highly atypical for natural human speech — consistent with possible TTS synthesis.'
      : c >= 45
      ? 'Some prosodic elements appear slightly unnatural, possibly due to audio processing.'
      : 'Pitch, rhythm, and stress patterns appear consistent with natural human speech.',

  background_inconsistencies: (c) =>
    c >= 75
      ? 'Background noise floor changes abruptly between segments and is suspiciously absent in certain sections.'
      : c >= 45
      ? 'Background audio shows some inconsistencies that may indicate editing or splicing.'
      : 'Background audio is consistent throughout, with no suspicious discontinuities.',
};

/** Extract forensic signals from mock/demo detection scores. All signals are labelled source:'estimated'. */
export function extractSignals(
  input: MediaInput,
  scores: DetectionScores
): ForensicSignal[] {
  const relevantDefinitions = SIGNAL_DEFINITIONS.filter((def) =>
    def.mediaTypes.includes(input.type as 'image' | 'video' | 'audio')
  );

  const baseScore = (scores.aiGenerationProbability + scores.manipulationProbability) / 2;

  return relevantDefinitions.map((def, index) => {
    const confidence = generateSignalConfidence(baseScore, index, relevantDefinitions.length);
    const status = scoreToStatus(confidence);
    const explanationFn = GENERIC_EXPLANATIONS[def.id];
    const explanation = explanationFn
      ? explanationFn(confidence)
      : `Signal analysis completed with ${confidence}% signal strength.`;

    return {
      id: def.id,
      category: def.category,
      label: def.label,
      status,
      confidence,
      explanation,
      source: 'estimated' as const,
    };
  });
}

/**
 * Provider shape for buildLiveSignals — union of Hive and Sightengine fields.
 * c2pa is only present for Hive.
 */
interface HiveLiveProvider {
  status: string;
  aiGeneratedScore: number | null;
  deepfakeScore: number | null;
  c2pa?: object | null;
}

interface SeLiveProvider {
  status: string;
  aiGeneratedScore: number | null;
  deepfakeScore: number | null;
}

/**
 * Build ForensicSignal array from live API provider results.
 * Only includes signals backed by actual detector evidence.
 * All signals are labelled source:'live'.
 */
export function buildLiveSignals(
  mediaType: 'image' | 'video' | 'audio',
  providers: {
    hive?: HiveLiveProvider;
    sightengine?: SeLiveProvider;
  }
): ForensicSignal[] {
  const signals: ForensicSignal[] = [];

  const hive = providers.hive?.status === 'success' ? providers.hive : null;
  const se = providers.sightengine?.status === 'success' ? providers.sightengine : null;

  // Helper: filter out null AND undefined
  function notNullish(v: number | null | undefined): v is number {
    return v !== null && v !== undefined;
  }

  // AI Generation signal — only if at least one detector returned a score
  const aiScores = [hive?.aiGeneratedScore, se?.aiGeneratedScore].filter(notNullish);
  if (aiScores.length > 0) {
    const avg = Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length);
    signals.push({
      id: 'ai_generation_detection',
      category: 'AI Detection',
      label: 'AI Generation Detection',
      status: avg >= 70 ? 'critical' : avg >= 30 ? 'warning' : 'clear',
      confidence: avg,
      explanation:
        avg >= 70
          ? `AI generation detectors indicate a potentially high probability of synthetic generation (combined signal: ${avg}%). This is a probabilistic assessment.`
          : avg >= 30
          ? `AI generation detectors found moderate signals. Combined score: ${avg}%. Further investigation recommended.`
          : `AI generation detectors found weak signals. Combined score: ${avg}%. Media may be authentic.`,
      source: 'live' as const,
    });
  }

  // Deepfake signal — only for image/video, only if at least one score available
  const dfScores = [hive?.deepfakeScore, se?.deepfakeScore].filter(notNullish);
  if (dfScores.length > 0 && (mediaType === 'image' || mediaType === 'video')) {
    const avg = Math.round(dfScores.reduce((a, b) => a + b, 0) / dfScores.length);
    signals.push({
      id: 'deepfake_detection',
      category: 'AI Detection',
      label: 'Deepfake Detection',
      status: avg >= 70 ? 'critical' : avg >= 30 ? 'warning' : 'clear',
      confidence: avg,
      explanation:
        avg >= 70
          ? `Deepfake detectors indicate potentially manipulated facial content (combined signal: ${avg}%). Human review required.`
          : avg >= 30
          ? `Deepfake detectors found some signals. Combined score: ${avg}%.`
          : `Deepfake detectors found weak signals (${avg}%). No strong indication of face manipulation.`,
      source: 'live' as const,
    });
  }

  // C2PA/Provenance signal — only if Hive returned a result
  if (hive) {
    const hasC2pa = Boolean(hive.c2pa);
    signals.push({
      id: 'c2pa_provenance',
      category: 'Provenance',
      label: 'C2PA / Content Provenance',
      status: hasC2pa ? 'clear' : 'warning',
      confidence: hasC2pa ? 80 : 50,
      explanation: hasC2pa
        ? 'Content provenance information (C2PA) was detected. This may indicate the media has embedded creator metadata.'
        : 'No C2PA provenance information was detected. Absence of C2PA does NOT prove manipulation — most media lacks it.',
      source: 'live' as const,
    });
  }

  // Detector failure signals
  if (providers.hive?.status === 'failed') {
    signals.push({
      id: 'hive_failed',
      category: 'Detector Status',
      label: 'Hive AI — Unavailable',
      status: 'unavailable',
      confidence: 0,
      explanation: 'Hive AI detector was unavailable or returned an error. Result is based on remaining detectors only.',
      source: 'live' as const,
    });
  }

  if (providers.sightengine?.status === 'failed') {
    signals.push({
      id: 'sightengine_failed',
      category: 'Detector Status',
      label: 'Sightengine — Unavailable',
      status: 'unavailable',
      confidence: 0,
      explanation: 'Sightengine detector was unavailable or returned an error. Result is based on remaining detectors only.',
      source: 'live' as const,
    });
  }

  return signals;
}
