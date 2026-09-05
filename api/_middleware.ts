// ─────────────────────────────────────────────
//  VeriLens AI — API Middleware Utilities
//  Server-side validation helpers.
//  Used by api/analyze.ts.
// ─────────────────────────────────────────────

import { API_TIMEOUT_MS, MAX_FILE_SIZE } from './thresholds';
import type { ServerMediaType } from './types';

/** Supported MIME types and their media categories */
const MIME_MAP: Record<string, ServerMediaType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/bmp': 'image',
  'image/tiff': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
  'video/avi': 'video',
  'video/x-matroska': 'video',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/mp4': 'audio',
  'audio/flac': 'audio',
};

/**
 * Unsafe URL schemes — block to prevent XSS and protocol injection.
 */
const BLOCKED_SCHEMES = ['javascript:', 'data:', 'file:', 'ftp:', 'vbscript:'];

/**
 * Private/loopback IP patterns — block to prevent SSRF.
 */
const PRIVATE_IP_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|::1)/i;

/**
 * Determine the ServerMediaType from a MIME type string.
 * Returns null if the MIME type is not supported.
 */
export function resolveMediaType(mimeType: string): ServerMediaType | null {
  return MIME_MAP[mimeType.toLowerCase().split(';')[0].trim()] ?? null;
}

/**
 * Validate file size against per-media-type limits.
 */
export function validateFileSize(bytes: number, mediaType: ServerMediaType): boolean {
  const limit = MAX_FILE_SIZE[mediaType];
  return limit !== undefined && bytes > 0 && bytes <= limit;
}

/**
 * Sanitise and validate a user-provided source URL.
 * - Blocks unsafe schemes (javascript:, data:, file:, etc.)
 * - Blocks private IP ranges (SSRF mitigation)
 * - Rejects malformed URLs
 * - Strips fragment (#) to avoid client-side injection
 */
export function sanitizeSourceUrl(
  rawUrl: string
): { valid: true; sanitised: string } | { valid: false; error: string } {
  const trimmed = rawUrl.trim();

  if (!trimmed) return { valid: false, error: 'URL is empty.' };
  if (trimmed.length > 2048) return { valid: false, error: 'URL exceeds maximum length.' };

  const lowerUrl = trimmed.toLowerCase();
  for (const scheme of BLOCKED_SCHEMES) {
    if (lowerUrl.startsWith(scheme)) {
      return { valid: false, error: `URL scheme is not permitted.` };
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Malformed URL.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: `URL scheme '${parsed.protocol}' is not permitted.` };
  }

  if (PRIVATE_IP_RE.test(parsed.hostname)) {
    return { valid: false, error: 'URL points to a private or loopback address.' };
  }

  // Strip fragment to prevent hash-based injection
  parsed.hash = '';

  return { valid: true, sanitised: parsed.toString() };
}

/**
 * Create an AbortSignal that times out after API_TIMEOUT_MS.
 * Used to enforce timeouts on all external API calls.
 */
export function createTimeoutSignal(): AbortSignal {
  return AbortSignal.timeout(API_TIMEOUT_MS);
}

/**
 * Safely extract the hostname from a URL.
 * Returns null if the URL is malformed.
 */
export function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
