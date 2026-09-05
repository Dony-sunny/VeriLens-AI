// ─────────────────────────────────────────────
//  VeriLens AI — Detection Engine
//  Stub for Hive AI + Gemini Vision APIs.
//  In demo mode, returns pre-computed scores.
// ─────────────────────────────────────────────

import type { MediaInput, DetectionScores } from '../types/analysis';

// ─── API Configuration ────────────────────────

export interface DetectionEngineConfig {
  hiveApiKey?: string;
  geminiApiKey?: string;
}

// ─── Hive AI Stub ─────────────────────────────

async function callHiveAPI(
  _input: MediaInput,
  _config: DetectionEngineConfig
): Promise<Partial<DetectionScores>> {
  // TODO: Implement Hive AI API call
  // POST https://api.thehive.ai/api/v2/task/sync
  // Headers: { token: config.hiveApiKey }
  // Body: FormData with media file
  throw new Error('Hive AI API key not configured.');
}

// ─── Gemini Vision Stub ───────────────────────

async function callGeminiAPI(
  _input: MediaInput,
  _config: DetectionEngineConfig
): Promise<Partial<DetectionScores>> {
  // TODO: Implement Gemini Vision API call
  // POST https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent
  // Headers: { 'x-goog-api-key': config.geminiApiKey }
  // Body: { contents: [{ parts: [{ inlineData: { mimeType, data } }] }] }
  throw new Error('Gemini API key not configured.');
}

// ─── Mock Engine (Demo / No API Keys) ─────────

function generateMockScores(input: MediaInput): DetectionScores {
  // Deterministic based on filename so demos are repeatable
  const seed = input.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = (base: number, variance: number) =>
    Math.min(99, Math.max(1, base + (seed % variance) - variance / 2));

  return {
    aiGenerationProbability: rand(35, 30),
    manipulationProbability: rand(40, 25),
    sourceConfidence: rand(60, 20),
    overallConfidence: rand(55, 20),
  };
}

// ─── Main Detection Engine ────────────────────

export async function runDetection(
  input: MediaInput,
  config: DetectionEngineConfig = {}
): Promise<DetectionScores> {
  const hasHive = Boolean(config.hiveApiKey);
  const hasGemini = Boolean(config.geminiApiKey);

  if (hasHive && hasGemini) {
    const [hiveScores, geminiScores] = await Promise.allSettled([
      callHiveAPI(input, config),
      callGeminiAPI(input, config),
    ]);

    // Merge results — average available scores
    const merged: Partial<DetectionScores> = {};
    const sources = [hiveScores, geminiScores]
      .filter((r): r is PromiseFulfilledResult<Partial<DetectionScores>> => r.status === 'fulfilled')
      .map((r) => r.value);

    if (sources.length === 0) return generateMockScores(input);

    (['aiGenerationProbability', 'manipulationProbability', 'sourceConfidence', 'overallConfidence'] as const).forEach((key) => {
      const vals = sources.map((s) => s[key]).filter((v): v is number => v !== undefined);
      if (vals.length > 0) merged[key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    });

    return merged as DetectionScores;
  }

  if (hasHive) {
    try {
      const scores = await callHiveAPI(input, config);
      return { ...generateMockScores(input), ...scores } as DetectionScores;
    } catch {
      return generateMockScores(input);
    }
  }

  if (hasGemini) {
    try {
      const scores = await callGeminiAPI(input, config);
      return { ...generateMockScores(input), ...scores } as DetectionScores;
    } catch {
      return generateMockScores(input);
    }
  }

  // Fallback: mock engine
  return generateMockScores(input);
}
