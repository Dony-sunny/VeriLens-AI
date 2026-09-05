// ─────────────────────────────────────────────
//  VeriLens AI — Final Verdict Module Tests
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { buildFinalVerdict } from '../modules/finalVerdict';
import type {
  MediaInput,
  DetectionScores,
  ForensicSignal,
  ExplanationResult,
  SourceVerificationResult,
} from '../types/analysis';

const mockInput: MediaInput = {
  id: 'test-1',
  name: 'test.jpg',
  type: 'image',
  mimeType: 'image/jpeg',
  sizeMb: 1.2,
  isDemo: false,
};

const mockExplanation: ExplanationResult = {
  summary: 'Test summary.',
  keySignals: ['Signal 1', 'Signal 2'],
  uncertainty: 'Test uncertainty.',
  verificationSteps: ['Step 1', 'Step 2'],
};

const mockSource: SourceVerificationResult = {
  originalSource: 'Test Source',
  firstKnownAppearance: '2024-01-01',
  publicationDate: '2024-01-01',
  sourceCredibility: 'HIGH',
  relatedSources: [],
  verificationStatus: 'VERIFIED',
  timeline: [],
};

const clearSignals: ForensicSignal[] = Array.from({ length: 4 }, (_, i) => ({
  id: `sig-${i}`,
  category: 'Test',
  label: `Signal ${i}`,
  status: 'clear' as const,
  confidence: 20,
  explanation: 'Clear signal.',
  source: 'estimated' as const,
}));

const criticalSignals: ForensicSignal[] = Array.from({ length: 5 }, (_, i) => ({
  id: `sig-${i}`,
  category: 'Test',
  label: `Signal ${i}`,
  status: 'critical' as const,
  confidence: 90,
  explanation: 'Critical signal.',
  source: 'estimated' as const,
}));

describe('buildFinalVerdict', () => {
  it('returns LIKELY_AUTHENTIC for low AI probability and no critical signals', () => {
    const scores: DetectionScores = {
      aiGenerationProbability: 10,
      manipulationProbability: 15,
      sourceConfidence: 85,
      overallConfidence: 20,
    };
    const result = buildFinalVerdict(mockInput, scores, clearSignals, mockExplanation, mockSource);
    expect(result.verdict).toBe('LIKELY_AUTHENTIC');
    expect(result.riskLevel).toBe('SAFE_TO_REVIEW');
  });

  it('returns HIGHLY_SUSPICIOUS for high AI probability', () => {
    const scores: DetectionScores = {
      aiGenerationProbability: 92,
      manipulationProbability: 88,
      sourceConfidence: 10,
      overallConfidence: 90,
    };
    const result = buildFinalVerdict(mockInput, scores, criticalSignals, mockExplanation, mockSource);
    expect(result.verdict).toBe('HIGHLY_SUSPICIOUS');
    expect(result.riskLevel).toBe('DO_NOT_TRUST');
  });

  it('returns NEEDS_REVIEW for moderate signals', () => {
    const scores: DetectionScores = {
      aiGenerationProbability: 55,
      manipulationProbability: 50,
      sourceConfidence: 40,
      overallConfidence: 65,
    };
    const twoWarnings: ForensicSignal[] = Array.from({ length: 2 }, (_, i) => ({
      id: `sig-${i}`,
      category: 'Test',
      label: `Signal ${i}`,
      status: 'critical' as const,
      confidence: 80,
      explanation: 'Warning signal.',
      source: 'estimated' as const,
    }));
    const result = buildFinalVerdict(mockInput, scores, twoWarnings, mockExplanation, mockSource);
    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(result.riskLevel).toBe('VERIFY_BEFORE_SHARING');
  });

  it('correctly assigns isDemo from mediaInput', () => {
    const demoInput = { ...mockInput, isDemo: true };
    const scores: DetectionScores = {
      aiGenerationProbability: 10,
      manipulationProbability: 10,
      sourceConfidence: 90,
      overallConfidence: 15,
    };
    const result = buildFinalVerdict(demoInput, scores, clearSignals, mockExplanation, mockSource);
    expect(result.isDemo).toBe(true);
  });

  it('sets isLiveResult to false for demo/mock path', () => {
    const scores: DetectionScores = {
      aiGenerationProbability: 10,
      manipulationProbability: 10,
      sourceConfidence: 90,
      overallConfidence: 15,
    };
    const result = buildFinalVerdict(mockInput, scores, clearSignals, mockExplanation, mockSource);
    expect(result.isLiveResult).toBe(false);
  });

  it('returns a valid ISO timestamp', () => {
    const scores: DetectionScores = {
      aiGenerationProbability: 10,
      manipulationProbability: 10,
      sourceConfidence: 90,
      overallConfidence: 20,
    };
    const result = buildFinalVerdict(mockInput, scores, clearSignals, mockExplanation, mockSource);
    expect(() => new Date(result.analyzedAt)).not.toThrow();
    expect(isNaN(new Date(result.analyzedAt).getTime())).toBe(false);
  });

  it('populates all required fields', () => {
    const scores: DetectionScores = {
      aiGenerationProbability: 10,
      manipulationProbability: 10,
      sourceConfidence: 90,
      overallConfidence: 20,
    };
    const result = buildFinalVerdict(mockInput, scores, clearSignals, mockExplanation, mockSource);
    expect(result.id).toBeTruthy();
    expect(result.mediaInput).toBe(mockInput);
    expect(result.scores).toBe(scores);
    expect(result.signals).toBe(clearSignals);
    expect(result.explanation).toBe(mockExplanation);
    expect(result.sourceVerification).toBe(mockSource);
    expect(result.riskMessage).toBeTruthy();
    expect(result.providers).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.sourceIntelligence).toBeDefined();
    expect(result.verdictLevel).toBeDefined();
  });
});
