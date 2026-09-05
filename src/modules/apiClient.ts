// ─────────────────────────────────────────────
//  VeriLens AI — API Client
//
//  Calls our own /api/analyze endpoint.
//  NEVER calls Hive, Sightengine, or Gemini directly.
//  API credentials stay server-side only.
// ─────────────────────────────────────────────

import type {
  MediaInput,
  ProviderResults,
  MediaMetadata,
  ExplanationResult,
  SourceIntelligence,
  VerdictLevel,
} from '../types/analysis';

/** Shape returned by /api/analyze */
export interface LiveAnalysisResponse {
  mediaType: string;
  verdict: VerdictLevel;
  providers: ProviderResults;
  metadata: MediaMetadata;
  explanation: ExplanationResult;
  source: SourceIntelligence;
  analyzedAt: string;
  isDemo: false;
}

/** Error response from /api/analyze */
interface ApiErrorResponse {
  error: string;
  code: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * The /api/analyze endpoint URL.
 * In development this proxies through Vite to the Vercel dev server.
 * In production it's the same origin.
 */
const ANALYZE_ENDPOINT = '/api/analyze';

/**
 * Submit media to the server-side analysis endpoint.
 * Returns normalized results — credentials never touch the browser.
 *
 * @throws {ApiError} if the server returns an error
 * @throws {Error} if the network request fails
 */
export async function submitForAnalysis(
  input: MediaInput,
  signal?: AbortSignal
): Promise<LiveAnalysisResponse> {
  const form = new FormData();

  if (input.file) {
    // Send actual file
    form.append('file', input.file, input.name);
    form.append('mimeType', input.mimeType);
  } else if (input.url) {
    // Send URL for server to fetch (server will validate URL)
    // We re-validate client-side too, but server is authoritative
    form.append('url', input.url);
    form.append('mimeType', input.mimeType);
    form.append('name', input.name);
  } else {
    throw new Error('No file or URL provided for analysis.');
  }

  const res = await fetch(ANALYZE_ENDPOINT, {
    method: 'POST',
    body: form,
    signal,
  });

  if (!res.ok) {
    let body: ApiErrorResponse | null = null;
    try {
      body = await res.json() as ApiErrorResponse;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(
      body?.error ?? `Server returned ${res.status}`,
      body?.code ?? 'SERVER_ERROR',
      res.status
    );
  }

  return res.json() as Promise<LiveAnalysisResponse>;
}

/**
 * Check if live analysis is available (i.e., /api/analyze endpoint exists).
 * Falls back gracefully if the endpoint is not deployed.
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const res = await fetch(ANALYZE_ENDPOINT, {
      method: 'OPTIONS',
      signal: AbortSignal.timeout(3000),
    });
    // 2xx or 405 (method not allowed but endpoint exists) both confirm availability
    return res.status < 500;
  } catch {
    return false;
  }
}
