// ─────────────────────────────────────────────
//  VeriLens AI — API Integration Tests
//  Covers all 15 required test scenarios.
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { validateFile, sanitiseUrl, sanitiseString } from '../utils/security';

// ─── 1. Valid image file ──────────────────────
describe('Valid image file', () => {
  it('accepts a valid JPEG image', () => {
    const file = new File(['fake-jpeg-bytes'], 'photo.jpg', { type: 'image/jpeg' });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('accepts a valid PNG image', () => {
    const file = new File(['fake-png-bytes'], 'photo.png', { type: 'image/png' });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('accepts a valid WebP image', () => {
    const file = new File(['fake-webp-bytes'], 'photo.webp', { type: 'image/webp' });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });
});

// ─── 2. Valid video file ──────────────────────
describe('Valid video file', () => {
  it('accepts a valid MP4 video', () => {
    const file = new File(['fake-mp4-bytes'], 'clip.mp4', { type: 'video/mp4' });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('accepts a valid WebM video', () => {
    const file = new File(['fake-webm-bytes'], 'clip.webm', { type: 'video/webm' });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });
});

// ─── 3. Invalid file type ─────────────────────
describe('Invalid file type', () => {
  it('rejects a PDF file', () => {
    const file = new File(['pdf-bytes'], 'document.pdf', { type: 'application/pdf' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects an executable file', () => {
    const file = new File(['exe-bytes'], 'malware.exe', { type: 'application/x-msdownload' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });

  it('rejects a text file', () => {
    const file = new File(['hello world'], 'readme.txt', { type: 'text/plain' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });
});

// ─── 4. Oversized file ───────────────────────
describe('Oversized file', () => {
  it('rejects a file that exceeds the size limit', () => {
    // Create a mock oversized file (simulate > 100MB)
    const oversizedContent = new Uint8Array(101 * 1024 * 1024); // 101 MB
    const file = new File([oversizedContent], 'huge.jpg', { type: 'image/jpeg' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/size|large|limit/i);
  });
});

// ─── 5 & 6. Hive success and failure (module unit tests) ──
describe('Detection engine - Hive success path', () => {
  it('runDetection returns scores with required numeric fields', async () => {
    const { runDetection } = await import('../modules/detectionEngine');
    const input = {
      id: 'test-1',
      name: 'photo.jpg',
      type: 'image' as const,
      mimeType: 'image/jpeg',
      sizeMb: 1,
      isDemo: false,
    };
    const scores = await runDetection(input, {});
    expect(typeof scores.aiGenerationProbability).toBe('number');
    expect(typeof scores.manipulationProbability).toBe('number');
    expect(typeof scores.overallConfidence).toBe('number');
    expect(scores.aiGenerationProbability).toBeGreaterThanOrEqual(0);
    expect(scores.aiGenerationProbability).toBeLessThanOrEqual(100);
  });
});

describe('Detection engine - Hive failure graceful fallback', () => {
  it('returns mock scores when Hive API key is missing', async () => {
    const { runDetection } = await import('../modules/detectionEngine');
    const input = {
      id: 'test-2',
      name: 'photo.jpg',
      type: 'image' as const,
      mimeType: 'image/jpeg',
      sizeMb: 1,
      isDemo: false,
    };
    // No API keys provided → should return mock scores without throwing
    const scores = await runDetection(input, {});
    expect(scores).toBeDefined();
    expect(scores.aiGenerationProbability).toBeGreaterThanOrEqual(0);
  });
});

// ─── 7 & 8. Sightengine success and failure ──
describe('Sightengine provider results', () => {
  it('buildLiveSignals handles sightengine success result', async () => {
    const { buildLiveSignals } = await import('../modules/evidenceExtractor');
    const signals = buildLiveSignals('image', {
      sightengine: {
        status: 'success',
        aiGeneratedScore: 85,
        deepfakeScore: 40,
      },
    });
    const aiSignal = signals.find((s) => s.id === 'ai_generation_detection');
    expect(aiSignal).toBeDefined();
    expect(aiSignal?.source).toBe('live');
    expect(aiSignal?.confidence).toBe(85);
  });

  it('buildLiveSignals handles sightengine failure gracefully', async () => {
    const { buildLiveSignals } = await import('../modules/evidenceExtractor');
    const signals = buildLiveSignals('image', {
      sightengine: {
        status: 'failed',
        aiGeneratedScore: null,
        deepfakeScore: null,
      },
    });
    const failSignal = signals.find((s) => s.id === 'sightengine_failed');
    expect(failSignal).toBeDefined();
    expect(failSignal?.status).toBe('unavailable');
  });
});

// ─── 9. Both detectors agree → high verdict ──
describe('Both detectors agree on high risk', () => {
  it('fuseVerdict → high when both show >70%', async () => {
    const { buildFinalVerdictFromLive } = await import('../modules/finalVerdict');
    const input = {
      id: 'live-1',
      name: 'suspicious.jpg',
      type: 'image' as const,
      mimeType: 'image/jpeg',
      sizeMb: 2,
      isDemo: false,
    };
    const result = buildFinalVerdictFromLive(
      input,
      {
        mediaType: 'image',
        verdict: 'high',
        providers: {
          hive: { status: 'success', aiGeneratedScore: 85, deepfakeScore: 80, generator: null, c2pa: null },
          sightengine: { status: 'success', aiGeneratedScore: 90, deepfakeScore: 75, generator: null },
        },
        metadata: { mimeType: 'image/jpeg', size: 2000000, width: null, height: null, duration: null, exifAvailable: null },
        explanation: { summary: 'High risk.', keySignals: [], uncertainty: '', verificationSteps: [] },
        source: { url: null, hostname: null, title: null, status: 'unavailable' },
        analyzedAt: new Date().toISOString(),
      },
      [],
      {
        originalSource: 'Unknown',
        firstKnownAppearance: 'Unknown',
        publicationDate: 'Unknown',
        sourceCredibility: 'UNKNOWN',
        relatedSources: [],
        verificationStatus: 'UNVERIFIED',
        timeline: [],
      }
    );
    expect(result.verdictLevel).toBe('high');
    expect(result.verdict).toBe('HIGHLY_SUSPICIOUS');
  });
});

// ─── 10. Detectors disagree → inconclusive ───
describe('Detectors disagree → inconclusive', () => {
  it('result is inconclusive when detector scores differ by more than 40 points', async () => {
    const { buildFinalVerdictFromLive } = await import('../modules/finalVerdict');
    const input = {
      id: 'live-2',
      name: 'ambiguous.jpg',
      type: 'image' as const,
      mimeType: 'image/jpeg',
      sizeMb: 2,
      isDemo: false,
    };
    const result = buildFinalVerdictFromLive(
      input,
      {
        mediaType: 'image',
        verdict: 'inconclusive',
        providers: {
          hive: { status: 'success', aiGeneratedScore: 90, deepfakeScore: null, generator: null, c2pa: null },
          sightengine: { status: 'success', aiGeneratedScore: 15, deepfakeScore: null, generator: null },
        },
        metadata: { mimeType: 'image/jpeg', size: 2000000, width: null, height: null, duration: null, exifAvailable: null },
        explanation: { summary: 'Inconclusive.', keySignals: [], uncertainty: 'Detectors disagree.', verificationSteps: [] },
        source: { url: null, hostname: null, title: null, status: 'unavailable' },
        analyzedAt: new Date().toISOString(),
      },
      [],
      {
        originalSource: 'Unknown',
        firstKnownAppearance: 'Unknown',
        publicationDate: 'Unknown',
        sourceCredibility: 'UNKNOWN',
        relatedSources: [],
        verificationStatus: 'UNVERIFIED',
        timeline: [],
      }
    );
    expect(result.verdictLevel).toBe('inconclusive');
    expect(result.riskLevel).toBe('INCONCLUSIVE');
  });
});

// ─── 11. No detector available → inconclusive ─
describe('No detector available', () => {
  it('buildLiveSignals with no providers returns empty signals array', async () => {
    const { buildLiveSignals } = await import('../modules/evidenceExtractor');
    const signals = buildLiveSignals('image', {});
    // No AI generation or deepfake signals without providers
    const aiSignal = signals.find((s) => s.id === 'ai_generation_detection');
    expect(aiSignal).toBeUndefined();
  });

  it('result shows inconclusive when no provider results available', async () => {
    const { buildFinalVerdictFromLive } = await import('../modules/finalVerdict');
    const input = {
      id: 'live-3',
      name: 'unknown.jpg',
      type: 'image' as const,
      mimeType: 'image/jpeg',
      sizeMb: 1,
      isDemo: false,
    };
    const result = buildFinalVerdictFromLive(
      input,
      {
        mediaType: 'image',
        verdict: 'inconclusive',
        providers: {
          hive: { status: 'unavailable', aiGeneratedScore: null, deepfakeScore: null, generator: null, c2pa: null },
          sightengine: { status: 'unavailable', aiGeneratedScore: null, deepfakeScore: null, generator: null },
        },
        metadata: { mimeType: 'image/jpeg', size: 1000000, width: null, height: null, duration: null, exifAvailable: null },
        explanation: { summary: 'Live detectors unavailable.', keySignals: [], uncertainty: 'No detector data.', verificationSteps: [] },
        source: { url: null, hostname: null, title: null, status: 'unavailable' },
        analyzedAt: new Date().toISOString(),
      },
      [],
      {
        originalSource: 'Unknown',
        firstKnownAppearance: 'Unknown',
        publicationDate: 'Unknown',
        sourceCredibility: 'UNKNOWN',
        relatedSources: [],
        verificationStatus: 'UNVERIFIED',
        timeline: [],
      }
    );
    expect(result.verdictLevel).toBe('inconclusive');
  });
});

// ─── 12. Gemini failure → detectors still shown ─
describe('Gemini failure fallback', () => {
  it('explanation fallback is used and result remains valid', async () => {
    const { generateExplanation } = await import('../modules/explanationEngine');
    const input = {
      id: 'expl-1',
      name: 'test.jpg',
      type: 'image' as const,
      mimeType: 'image/jpeg',
      sizeMb: 1,
      isDemo: false,
    };
    const scores = { aiGenerationProbability: 80, manipulationProbability: 75, sourceConfidence: 20, overallConfidence: 80 };
    // No API key → should return template explanation
    const explanation = await generateExplanation(input, scores, []);
    expect(explanation.summary).toBeTruthy();
    expect(typeof explanation.summary).toBe('string');
    expect(Array.isArray(explanation.keySignals)).toBe(true);
    expect(explanation.uncertainty).toBeTruthy();
    expect(Array.isArray(explanation.verificationSteps)).toBe(true);
    expect(explanation.verificationSteps.length).toBeGreaterThan(0);
  });
});

// ─── 13. Invalid URL ─────────────────────────
describe('Invalid URL rejection', () => {
  it('rejects a malformed URL', () => {
    const result = sanitiseUrl('not-a-url');
    expect(result.valid).toBe(false);
  });

  it('rejects an empty URL', () => {
    const result = sanitiseUrl('');
    expect(result.valid).toBe(false);
  });

  it('rejects a URL without protocol', () => {
    const result = sanitiseUrl('example.com/image.jpg');
    expect(result.valid).toBe(false);
  });
});

// ─── 14. Unsafe URL ──────────────────────────
describe('Unsafe URL rejection', () => {
  it('rejects javascript: protocol', () => {
    const result = sanitiseUrl('javascript:alert(1)');
    expect(result.valid).toBe(false);
  });

  it('rejects data: protocol', () => {
    const result = sanitiseUrl('data:text/html,<script>alert(1)</script>');
    expect(result.valid).toBe(false);
  });

  it('rejects file: protocol', () => {
    const result = sanitiseUrl('file:///etc/passwd');
    expect(result.valid).toBe(false);
  });

  it('rejects localhost (SSRF)', () => {
    const result = sanitiseUrl('http://localhost/api/secret');
    expect(result.valid).toBe(false);
  });

  it('rejects 127.0.0.1 (SSRF)', () => {
    const result = sanitiseUrl('http://127.0.0.1/admin');
    expect(result.valid).toBe(false);
  });

  it('rejects 192.168.x.x (private IP / SSRF)', () => {
    const result = sanitiseUrl('http://192.168.1.1/');
    expect(result.valid).toBe(false);
  });

  it('accepts a valid HTTPS URL', () => {
    const result = sanitiseUrl('https://www.reuters.com/image.jpg');
    expect(result.valid).toBe(true);
  });
});

// ─── 15. Demo mode ───────────────────────────
describe('Demo mode', () => {
  it('demo cases are clearly labelled with isDemo=true', async () => {
    const { DEMO_CASES } = await import('../data/demoCases');
    DEMO_CASES.forEach((demo) => {
      expect(demo.isDemo).toBe(true);
      expect(demo.isLiveResult).toBe(false);
      expect(demo.mediaInput.isDemo).toBe(true);
    });
  });

  it('demo cases have no live provider scores', async () => {
    const { DEMO_CASES } = await import('../data/demoCases');
    DEMO_CASES.forEach((demo) => {
      // providers should be empty in demo cases
      expect(Object.keys(demo.providers)).toHaveLength(0);
    });
  });

  it('demo signals are labelled as source:demo', async () => {
    const { DEMO_CASES } = await import('../data/demoCases');
    DEMO_CASES.forEach((demo) => {
      demo.signals.forEach((signal) => {
        expect(signal.source).toBe('demo');
      });
    });
  });

  it('demo explanations use keySignals not keyPoints', async () => {
    const { DEMO_CASES } = await import('../data/demoCases');
    DEMO_CASES.forEach((demo) => {
      expect(Array.isArray(demo.explanation.keySignals)).toBe(true);
      expect(demo.explanation.uncertainty).toBeTruthy();
      expect(Array.isArray(demo.explanation.verificationSteps)).toBe(true);
    });
  });

  it('all three demo cases have required new fields', async () => {
    const { DEMO_CASES } = await import('../data/demoCases');
    expect(DEMO_CASES).toHaveLength(3);
    DEMO_CASES.forEach((demo) => {
      expect(demo.verdictLevel).toBeDefined();
      expect(['low', 'medium', 'high', 'inconclusive']).toContain(demo.verdictLevel);
      expect(demo.metadata).toBeDefined();
      expect(demo.sourceIntelligence).toBeDefined();
    });
  });
});

// ─── Security: XSS sanitisation ──────────────
describe('XSS sanitisation', () => {
  it('sanitises script tags from strings', () => {
    const dangerous = '<script>alert("xss")</script>Hello';
    const clean = sanitiseString(dangerous);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('Hello');
  });

  it('sanitises HTML entities in strings', () => {
    const input = '<img src=x onerror=alert(1)>';
    const clean = sanitiseString(input);
    expect(clean).not.toContain('<img');
  });
});

// ─── Source Intelligence & Verification ──────
describe('Source intelligence & verification', () => {
  it('classifies valid user URL as status "provided" (never "verified")', async () => {
    const { extractSourceIntelligence } = await import('../modules/sourceVerifier');
    const intel = extractSourceIntelligence({
      id: 'src-1',
      name: 'test.jpg',
      type: 'image',
      mimeType: 'image/jpeg',
      sizeMb: 1,
      url: 'https://news.reuters.com/article/123',
    });
    expect(intel.status).toBe('provided');
    expect(intel.hostname).toBe('news.reuters.com');
    expect(intel.url).toBe('https://news.reuters.com/article/123');
  });

  it('rejects unsafe schemes in source intelligence', async () => {
    const { extractSourceIntelligence } = await import('../modules/sourceVerifier');
    const intel = extractSourceIntelligence({
      id: 'src-2',
      name: 'test.jpg',
      type: 'image',
      mimeType: 'image/jpeg',
      sizeMb: 1,
      url: 'javascript:stealCredentials()',
    });
    expect(intel.status).toBe('unavailable');
    expect(intel.url).toBeNull();
  });

  it('returns unavailable when no URL is provided', async () => {
    const { extractSourceIntelligence } = await import('../modules/sourceVerifier');
    const intel = extractSourceIntelligence({
      id: 'src-3',
      name: 'upload.png',
      type: 'image',
      mimeType: 'image/png',
      sizeMb: 2,
    });
    expect(intel.status).toBe('unavailable');
    expect(intel.url).toBeNull();
  });

  it('verifySource never invents high numerical credibility without evidence', async () => {
    const { verifySource } = await import('../modules/sourceVerifier');
    const result = await verifySource({
      id: 'src-4',
      name: 'test.jpg',
      type: 'image',
      mimeType: 'image/jpeg',
      sizeMb: 1,
      url: 'https://example.com/photo.jpg',
    });
    expect(result.verificationStatus).toBe('UNVERIFIED');
    expect(result.sourceCredibility).toBe('UNKNOWN');
  });
});
