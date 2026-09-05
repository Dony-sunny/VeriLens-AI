// ─────────────────────────────────────────────
//  VeriLens AI — Evidence Extractor Tests
// ─────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { extractSignals } from '../modules/evidenceExtractor';
import type { MediaInput, DetectionScores } from '../types/analysis';

const imageInput: MediaInput = {
  id: 'img-1',
  name: 'photo.jpg',
  type: 'image',
  mimeType: 'image/jpeg',
  sizeMb: 2,
  isDemo: false,
};

const videoInput: MediaInput = {
  id: 'vid-1',
  name: 'clip.mp4',
  type: 'video',
  mimeType: 'video/mp4',
  sizeMb: 15,
  isDemo: false,
};

const audioInput: MediaInput = {
  id: 'aud-1',
  name: 'voice.mp3',
  type: 'audio',
  mimeType: 'audio/mpeg',
  sizeMb: 3,
  isDemo: false,
};

const lowScores: DetectionScores = {
  aiGenerationProbability: 5,
  manipulationProbability: 8,
  sourceConfidence: 90,
  overallConfidence: 10,
};

const highScores: DetectionScores = {
  aiGenerationProbability: 95,
  manipulationProbability: 90,
  sourceConfidence: 15,
  overallConfidence: 93,
};

describe('extractSignals', () => {
  it('returns signals relevant to image type only', () => {
    const signals = extractSignals(imageInput, lowScores);
    const ids = signals.map((s) => s.id);
    expect(ids).not.toContain('frame_inconsistencies');
    expect(ids).not.toContain('face_voice_sync');
    expect(ids).not.toContain('voice_synthesis');
  });

  it('returns signals relevant to video type', () => {
    const signals = extractSignals(videoInput, highScores);
    const ids = signals.map((s) => s.id);
    expect(ids).toContain('frame_inconsistencies');
    expect(ids).toContain('face_voice_sync');
  });

  it('returns signals relevant to audio type', () => {
    const signals = extractSignals(audioInput, lowScores);
    const ids = signals.map((s) => s.id);
    expect(ids).toContain('voice_synthesis');
    expect(ids).toContain('spectral_anomalies');
  });

  it('all signals have required fields including source', () => {
    const signals = extractSignals(imageInput, highScores);
    signals.forEach((signal) => {
      expect(signal.id).toBeTruthy();
      expect(signal.category).toBeTruthy();
      expect(signal.label).toBeTruthy();
      expect(['clear', 'warning', 'critical', 'unavailable']).toContain(signal.status);
      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(100);
      expect(signal.explanation).toBeTruthy();
      expect(['live', 'estimated', 'demo']).toContain(signal.source);
    });
  });

  it('signals from extractSignals are labelled as estimated (not live)', () => {
    const signals = extractSignals(imageInput, highScores);
    signals.forEach((s) => expect(s.source).toBe('estimated'));
  });

  it('produces more critical signals for high detection scores', () => {
    const lowSignals = extractSignals(imageInput, lowScores);
    const highSignals = extractSignals(imageInput, highScores);
    const lowCritical = lowSignals.filter((s) => s.status === 'critical').length;
    const highCritical = highSignals.filter((s) => s.status === 'critical').length;
    expect(highCritical).toBeGreaterThan(lowCritical);
  });

  it('returns a non-empty array for all media types', () => {
    expect(extractSignals(imageInput, lowScores).length).toBeGreaterThan(0);
    expect(extractSignals(videoInput, lowScores).length).toBeGreaterThan(0);
    expect(extractSignals(audioInput, lowScores).length).toBeGreaterThan(0);
  });
});
