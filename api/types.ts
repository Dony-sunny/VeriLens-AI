// ─────────────────────────────────────────────
//  VeriLens AI — Normalized API Types
//  Returned by /api/analyze to the frontend.
//  API keys, raw provider responses, and
//  internal state are NEVER included.
// ─────────────────────────────────────────────

export type ServerMediaType = 'image' | 'video' | 'audio';

export type VerdictLevel = 'low' | 'medium' | 'high' | 'inconclusive';

export type ProviderStatus = 'success' | 'failed' | 'unavailable';

export type SourceStatus = 'provided' | 'verified' | 'unverified' | 'unavailable';

export interface HiveProviderResult {
  status: ProviderStatus;
  /** AI-generated score 0–100. null = not available from this detector. */
  aiGeneratedScore: number | null;
  /** Deepfake score 0–100. null = not available. */
  deepfakeScore: number | null;
  /** Generator attribution if reported by Hive. null = not available. */
  generator: string | null;
  /** C2PA/provenance metadata if Hive returned it. null = none detected. */
  c2pa: Record<string, unknown> | null;
  /** Safe diagnostic error message if request failed. */
  error?: string | null;
}

export interface SightengineProviderResult {
  status: ProviderStatus;
  /** AI-generated score 0–100. null = not available. */
  aiGeneratedScore: number | null;
  /** Deepfake score 0–100. null = not available. */
  deepfakeScore: number | null;
  /** Generator attribution if reported by Sightengine. null = not available. */
  generator: string | null;
  /** Safe diagnostic error message if request failed. */
  error?: string | null;
}

export interface MediaMetadata {
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  /** null = could not determine. Absence of EXIF is NOT evidence of manipulation. */
  exifAvailable: boolean | null;
}

export interface ExplanationResult {
  /** 2–3 sentence plain-language summary. Always uses hedged, probabilistic language. */
  summary: string;
  /** Key signals observed. Based only on detector evidence — never invented. */
  keySignals: string[];
  /** What remains uncertain or could not be determined. */
  uncertainty: string;
  /** Practical verification steps for a journalist or researcher. */
  verificationSteps: string[];
}

export interface SourceIntelligence {
  /** The URL as provided by the user (sanitised server-side). null if not provided. */
  url: string | null;
  hostname: string | null;
  title: string | null;
  /**
   * 'provided' = user-submitted URL, not independently verified.
   * 'verified' = independently confirmed (future feature, not currently used).
   * 'unverified' = could not confirm.
   * 'unavailable' = no source provided.
   */
  status: SourceStatus;
}

/**
 * The normalized result returned by /api/analyze.
 * Safe to send to the browser — no credentials or raw API responses.
 */
export interface NormalizedAnalysisResult {
  mediaType: ServerMediaType;
  /**
   * Evidence-fused verdict.
   * Based on application-level thresholds, not scientific certainty.
   */
  verdict: VerdictLevel;
  providers: {
    hive?: HiveProviderResult;
    sightengine?: SightengineProviderResult;
  };
  metadata: MediaMetadata;
  explanation: ExplanationResult;
  source: SourceIntelligence;
  analyzedAt: string;
  /** Always false for live results — demo results never come from this endpoint. */
  isDemo: false;
}

/** Error response shape returned by /api/analyze on failure. */
export interface AnalysisErrorResponse {
  error: string;
  code: string;
}
