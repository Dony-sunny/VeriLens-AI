// ─────────────────────────────────────────────
//  VeriLens AI — Shared Type Definitions
//  Updated to support live API normalized results
//  alongside the existing UI types.
// ─────────────────────────────────────────────

export type MediaType = 'image' | 'audio' | 'video' | 'unknown';

export type VerdictLabel =
  | 'LIKELY_AUTHENTIC'
  | 'NEEDS_REVIEW'
  | 'HIGHLY_SUSPICIOUS'
  | 'INCONCLUSIVE';

/** Risk level used in evidence fusion. Maps from NormalizedAnalysisResult.verdict */
export type VerdictLevel = 'low' | 'medium' | 'high' | 'inconclusive';

export type SignalStatus = 'clear' | 'warning' | 'critical' | 'unavailable';

export type RiskLevel = 'SAFE_TO_REVIEW' | 'VERIFY_BEFORE_SHARING' | 'DO_NOT_TRUST' | 'INCONCLUSIVE';

export type ProviderStatus = 'success' | 'failed' | 'unavailable';

// ─── Media Input ──────────────────────────────

export interface MediaInput {
  id: string;
  file?: File;
  url?: string;
  name: string;
  type: MediaType;
  mimeType: string;
  sizeMb: number;
  previewUrl?: string;
  isDemo?: boolean;
}

// ─── Detection Scores (legacy / demo path) ───

export interface DetectionScores {
  aiGenerationProbability: number;   // 0–100
  manipulationProbability: number;   // 0–100
  sourceConfidence: number;          // 0–100
  overallConfidence: number;         // 0–100
}

// ─── Provider Results (live API path) ────────

export interface HiveProviderResult {
  status: ProviderStatus;
  /** AI-generated probability 0–100. null = not available. */
  aiGeneratedScore: number | null;
  /** Deepfake probability 0–100. null = not available. */
  deepfakeScore: number | null;
  /** Generator attribution if reported by provider. */
  generator: string | null;
  /** C2PA/provenance metadata if returned by Hive. */
  c2pa: Record<string, unknown> | null;
  /** Safe diagnostic error message if request failed. */
  error?: string | null;
}

export interface SightengineProviderResult {
  status: ProviderStatus;
  /** AI-generated probability 0–100. null = not available. */
  aiGeneratedScore: number | null;
  /** Deepfake probability 0–100. null = not available. */
  deepfakeScore: number | null;
  /** Generator attribution if reported by provider. */
  generator: string | null;
  /** Safe diagnostic error message if request failed. */
  error?: string | null;
}

export interface ProviderResults {
  hive?: HiveProviderResult;
  sightengine?: SightengineProviderResult;
}

// ─── Media Metadata ───────────────────────────

export interface MediaMetadata {
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  /** null = could not determine; not absence of EXIF = evidence of manipulation */
  exifAvailable: boolean | null;
}

// ─── Source Intelligence ──────────────────────

export type SourceStatus = 'provided' | 'verified' | 'unverified' | 'unavailable';

export interface SourceIntelligence {
  /** The URL as provided by the user (sanitised). null if not provided. */
  url: string | null;
  hostname: string | null;
  title: string | null;
  /**
   * Status of source intelligence.
   * 'provided' = user-submitted URL, no independent verification.
   * 'verified' = independently confirmed (future feature).
   * 'unverified' = could not confirm.
   * 'unavailable' = no source provided.
   *
   * NEVER claim 'verified' without actual evidence.
   */
  status: SourceStatus;
}

// ─── Forensic Signal ──────────────────────────

export interface ForensicSignal {
  id: string;
  category: string;
  label: string;
  status: SignalStatus;
  /**
   * Confidence 0–100.
   * For live results, this is derived from actual provider scores.
   * For demo/template, this is a deterministic estimate.
   */
  confidence: number;
  explanation: string;
  /** Whether this signal came from a live detector or is estimated. */
  source: 'live' | 'estimated' | 'demo';
}

// ─── Explanation ──────────────────────────────

export interface ExplanationResult {
  /** 2-3 sentence plain-language summary. Uses hedged language. */
  summary: string;
  /** Key detection signals observed. Empty if explanation unavailable. */
  keySignals: string[];
  /** What remains uncertain or could not be determined. */
  uncertainty: string;
  /** Practical verification steps for a journalist or researcher. */
  verificationSteps: string[];
}

// ─── Source Verification (legacy — kept for demo) ─

export interface SourceEvent {
  label: string;
  date: string;
  description: string;
}

export interface SourceVerificationResult {
  originalSource: string;
  firstKnownAppearance: string;
  publicationDate: string;
  sourceCredibility: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  relatedSources: string[];
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'DISPUTED';
  timeline: SourceEvent[];
}

// ─── Final Analysis Result ─────────────────────

export interface AnalysisResult {
  id: string;
  mediaInput: MediaInput;
  /** UI-friendly verdict label (maps from VerdictLevel for live, or computed for demo) */
  verdict: VerdictLabel;
  /** VerdictLevel from evidence fusion. Used for live results. */
  verdictLevel: VerdictLevel;
  /**
   * Overall confidence score 0-100.
   * For live results, derived from provider scores.
   * Labelled as 'detection signal strength', NOT scientific certainty.
   */
  confidenceScore: number;
  /** Legacy scores field — kept for backward compat with demo and UI */
  scores: DetectionScores;
  /** Provider-level results from Hive and Sightengine */
  providers: ProviderResults;
  /** File/media metadata */
  metadata: MediaMetadata;
  signals: ForensicSignal[];
  /** Plain-language explanation from Gemini or template fallback */
  explanation: ExplanationResult;
  /** Legacy source verification — kept for demo */
  sourceVerification: SourceVerificationResult;
  /** Live source intelligence */
  sourceIntelligence: SourceIntelligence;
  riskLevel: RiskLevel;
  riskMessage: string;
  analyzedAt: string;
  isDemo: boolean;
  /** Whether live APIs were called or this is a template/mock result */
  isLiveResult: boolean;
}

// ─── Analysis State ───────────────────────────

export type AnalysisStatus =
  | 'idle'
  | 'uploading'
  | 'detecting'
  | 'extracting'
  | 'explaining'
  | 'verifying'
  | 'complete'
  | 'error';

export interface AnalysisState {
  status: AnalysisStatus;
  progress: number;           // 0–100
  result: AnalysisResult | null;
  error: string | null;
}
