// ─────────────────────────────────────────────
//  VeriLens AI — Security Utilities
//  Input validation, URL sanitisation, and
//  file safety checks.
// ─────────────────────────────────────────────

/** Maximum allowed file size in MB (4.5 MB to align with Vercel Serverless limits). */
export const MAX_FILE_SIZE_MB = 4.5;

/** Allowed MIME type prefixes. */
const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'video/'] as const;

/** Allowed URL schemes (no javascript:, data:, etc.). */
const ALLOWED_URL_SCHEMES = ['https:', 'http:'] as const;

/** Dangerous hostname patterns (localhost, private IPs, 169.254 link-local, cloud metadata, etc.) */
const BLOCKED_HOSTNAMES = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|::1|0:0:0:0:0:0:0:1|fe80:|fd00:|fc00:)/i;
const BLOCKED_DOMAINS = /(\.local|\.internal|\.lan|\.home|\.localhost)$/i;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a File object before processing.
 * Checks MIME type prefix and file size.
 */
export function validateFile(file: File): ValidationResult {
  // MIME type check
  const allowed = ALLOWED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix));
  if (!allowed) {
    return {
      valid: false,
      error: `Unsupported file type: "${file.type}". Please upload an image, audio, or video file.`,
    };
  }

  // File size check
  const sizeMb = file.size / 1024 / 1024;
  if (sizeMb > MAX_FILE_SIZE_MB) {
    return {
      valid: false,
      error: `File is too large (${sizeMb.toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
    };
  }

  // Zero-byte file
  if (file.size === 0) {
    return { valid: false, error: 'File appears to be empty.' };
  }

  return { valid: true };
}

/**
 * Sanitise and validate a user-supplied media URL.
 * - Must use http: or https:
 * - Must not point to localhost or private IP ranges
 * - Must not exceed a reasonable length
 * - Removes any fragment identifiers
 */
export function sanitiseUrl(rawUrl: string): ValidationResult & { sanitised?: string } {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty.' };
  }

  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL is too long (max 2048 characters).' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format. Please enter a full URL starting with https://' };
  }

  // Scheme check
  const schemeAllowed = (ALLOWED_URL_SCHEMES as readonly string[]).includes(parsed.protocol);
  if (!schemeAllowed) {
    return {
      valid: false,
      error: `URL scheme "${parsed.protocol}" is not allowed. Only http and https URLs are supported.`,
    };
  }

  // Block private/loopback addresses (SSRF mitigation)
  if (BLOCKED_HOSTNAMES.test(parsed.hostname) || BLOCKED_DOMAINS.test(parsed.hostname)) {
    return {
      valid: false,
      error: 'This URL points to a private or local network address, which is not allowed.',
    };
  }

  // Strip fragment
  parsed.hash = '';

  return { valid: true, sanitised: parsed.toString() };
}

/**
 * Sanitise a string to prevent XSS when rendered as text.
 * For use when inserting user-provided strings into the DOM.
 */
export function sanitiseString(input: string, maxLength = 500): string {
  return input
    .slice(0, maxLength)
    .replace(/[<>&"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return entities[char] ?? char;
    });
}

/**
 * Safely create an object URL for a file.
 * Returns null if the browser does not support it.
 */
export function createSafeObjectUrl(file: File): string | null {
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

/**
 * Revoke an object URL created with createSafeObjectUrl.
 */
export function revokeSafeObjectUrl(url: string | null | undefined): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }
}
