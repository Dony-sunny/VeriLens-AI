// ─────────────────────────────────────────────
//  VeriLens AI — Evidence Fusion Thresholds
//
//  IMPORTANT: These are APPLICATION-LEVEL decision rules.
//  They are NOT scientifically calibrated thresholds.
//  Adjust based on your use-case and risk tolerance.
// ─────────────────────────────────────────────

/**
 * Scores at or above this value are treated as a strong positive signal.
 * Application-level rule — not a scientific threshold.
 */
export const HIGH_SIGNAL_THRESHOLD = 70;

/**
 * Scores below this value are treated as a weak/negative signal.
 * Application-level rule — not a scientific threshold.
 */
export const LOW_SIGNAL_THRESHOLD = 30;

/**
 * If two detectors' scores differ by more than this value, the result
 * is classified as INCONCLUSIVE to reflect genuine disagreement.
 * Application-level rule — not a scientific threshold.
 */
export const DISAGREEMENT_DELTA = 40;

/**
 * Timeout for each external API call in milliseconds.
 */
export const API_TIMEOUT_MS = 30_000;

/** Hive sync requests can take longer while media is queued for processing. */
export const HIVE_API_TIMEOUT_MS = 45_000;

/** Keep the optional explanation call from exceeding the serverless budget. */
export const GEMINI_TIMEOUT_MS = 8_000;

/**
 * Maximum file size per media type in bytes.
 * Set to 4.5 MB to align with Vercel Serverless Function payload limits.
 */
export const MAX_FILE_SIZE: Record<string, number> = {
  image: Math.floor(4.5 * 1024 * 1024),  // 4.5 MB
  video: Math.floor(4.5 * 1024 * 1024),  // 4.5 MB
  audio: Math.floor(4.5 * 1024 * 1024),  // 4.5 MB
};
