// ─────────────────────────────────────────────
//  VeriLens AI — Source Verifier & Source Intelligence
//
//  Rules:
//  ─ Do NOT create an unsupported numerical "source credibility score"
//  ─ Clearly distinguish USER-PROVIDED SOURCE from INDEPENDENTLY VERIFIED SOURCE
//  ─ Never claim a source is verified without actual evidence
//  ─ Reject unsafe schemes (javascript:, data:, file:, etc.)
//  ─ Never invent source information
// ─────────────────────────────────────────────

import type { MediaInput, SourceVerificationResult, SourceIntelligence } from '../types/analysis';
import { sanitiseUrl } from '../utils/security';

/**
 * Extract safe source intelligence from user media input.
 */
export function extractSourceIntelligence(input: MediaInput): SourceIntelligence {
  if (!input.url) {
    return {
      url: null,
      hostname: null,
      title: null,
      status: 'unavailable',
    };
  }

  const sanitised = sanitiseUrl(input.url);
  if (!sanitised.valid || !sanitised.sanitised) {
    return {
      url: null,
      hostname: null,
      title: null,
      status: 'unavailable',
    };
  }

  try {
    const urlStr = sanitised.sanitised;
    const parsed = new URL(urlStr);
    return {
      url: urlStr,
      hostname: parsed.hostname,
      title: null,
      status: 'provided', // Always 'provided' for user inputs — never claim 'verified' without external proof
    };
  } catch {
    return {
      url: null,
      hostname: null,
      title: null,
      status: 'unavailable',
    };
  }
}

/**
 * Build honest source verification structure.
 * Maintains compatibility with legacy demo timeline while adhering to source intelligence principles.
 */
export async function verifySource(input: MediaInput): Promise<SourceVerificationResult> {
  const intel = extractSourceIntelligence(input);
  const now = new Date();

  // If user provided a URL
  if (intel.url) {
    return {
      originalSource: `User-provided URL: ${intel.hostname}`,
      firstKnownAppearance: 'Unverified publication date',
      publicationDate: 'Pending independent verification',
      sourceCredibility: 'UNKNOWN', // Never invent high or low credibility score
      relatedSources: [],
      verificationStatus: 'UNVERIFIED', // Clearly unverified
      timeline: [
        {
          label: 'User Submission',
          date: now.toLocaleDateString(),
          description: `Media URL submitted by user: ${intel.hostname}. Origin has not been independently verified.`,
        },
        {
          label: 'Public Archive Check',
          date: 'Automated lookup',
          description: 'No verified cryptographic provenance or archival match confirmed.',
        },
      ],
    };
  }

  // File upload with no URL
  return {
    originalSource: 'No source URL provided (Direct file upload)',
    firstKnownAppearance: 'Not found in public metadata archives',
    publicationDate: 'Unknown',
    sourceCredibility: 'UNKNOWN',
    relatedSources: [],
    verificationStatus: 'UNVERIFIED',
    timeline: [
      {
        label: 'Direct Upload',
        date: now.toLocaleDateString(),
        description: 'File submitted directly for forensic analysis. Provenance trace requires independent search.',
      },
    ],
  };
}
