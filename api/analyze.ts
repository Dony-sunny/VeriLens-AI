// ─────────────────────────────────────────────
//  VeriLens AI — /api/analyze
//  Vercel serverless function.
//
//  Security contract:
//  ─ API credentials read from process.env only
//  ─ Credentials NEVER logged or returned to client
//  ─ Input validated before any external API call
//  ─ Each external call has a 30 s timeout
//  ─ Failed detectors never block the response
//  ─ Gemini called ONCE, AFTER detector results
//  ─ Gemini NEVER overrides detector scores
//  ─ Audio detection is clearly labelled unavailable
//  ─ CORS restricted to configured origin
// ─────────────────────────────────────────────

import type { IncomingMessage, ServerResponse } from 'http';
import {
  resolveMediaType,
  validateFileSize,
  sanitizeSourceUrl,
  createTimeoutSignal,
  extractHostname,
} from './_middleware.js';
import {
  HIGH_SIGNAL_THRESHOLD,
  LOW_SIGNAL_THRESHOLD,
  DISAGREEMENT_DELTA,
  HIVE_API_TIMEOUT_MS,
  GEMINI_TIMEOUT_MS,
} from './thresholds.js';
import type {
  NormalizedAnalysisResult,
  HiveProviderResult,
  SightengineProviderResult,
  VerdictLevel,
  ExplanationResult,
  ServerMediaType,
} from './types.js';

// ─── Credentials ──────────────────────────────
// Credentials are read here, never logged, never returned to client.

function getCredentials() {
  return {
    hiveKey: process.env['HIVE_API_KEY'] ?? null,
    seUser: process.env['SIGHTENGINE_API_USER'] ?? null,
    seSecret: process.env['SIGHTENGINE_API_SECRET'] ?? null,
    geminiKey: process.env['GEMINI_API_KEY'] ?? null,
  };
}

// ─── Hive AI Detection ────────────────────────

function emptyHiveResult(): HiveProviderResult {
  return {
    status: 'failed',
    aiGeneratedScore: null,
    deepfakeScore: null,
    generator: null,
    c2pa: null,
    error: null,
  };
}

function parseHiveV3Result(data: unknown): HiveProviderResult {
  const result = emptyHiveResult();
  const output = (data as { output?: Array<{ classes?: Array<{ class?: string; value?: number }> }> })
    .output?.[0];
  const classes = output?.classes ?? [];
  const findValue = (names: string[]) => {
    const match = classes.find((entry) => entry.class && names.includes(entry.class));
    return typeof match?.value === 'number' ? Math.round(match.value * 100) : null;
  };

  result.status = 'success';
  result.aiGeneratedScore = findValue(['ai_generated', 'ai-generated', 'yes']);
  result.deepfakeScore = findValue(['deepfake']);

  const rawOutput = output as Record<string, unknown> | undefined;
  result.c2pa = (rawOutput?.['c2pa'] as Record<string, unknown> | undefined) ?? null;
  return result;
}

async function fallbackHiveWithGemini(
  fileBuffer: Buffer,
  mimeType: string,
  geminiKey: string | null
): Promise<HiveProviderResult> {
  const result = emptyHiveResult();
  if (!geminiKey) {
    result.error = 'Hive failed and Gemini fallback is not configured.';
    return result;
  }

  try {
    const prompt = `Analyze only the visible pixels of this image for signs of AI generation. Do not infer metadata, EXIF, or provenance. Return JSON only with artifact_score, classifier_score, confidence as numbers from 0 to 1, and explanation as a short sentence.`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: fileBuffer.toString('base64') } },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        }),
        signal: createTimeoutSignal(GEMINI_TIMEOUT_MS),
      }
    );

    if (!response.ok) throw new Error(`Gemini fallback HTTP ${response.status}`);
    const body = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(text.replace(/```json\n?|```/g, '').trim()) as {
      artifact_score?: number;
      classifier_score?: number;
      explanation?: string;
    };
    const aiScore = typeof parsed.classifier_score === 'number'
      ? parsed.classifier_score
      : typeof parsed.artifact_score === 'number' ? parsed.artifact_score : 0;

    return {
      status: 'success',
      aiGeneratedScore: Math.round(Math.max(0, Math.min(1, aiScore)) * 100),
      deepfakeScore: typeof parsed.artifact_score === 'number'
        ? Math.round(Math.max(0, Math.min(1, parsed.artifact_score)) * 100)
        : null,
      generator: null,
      c2pa: null,
      error: parsed.explanation ?? 'Hive unavailable; Gemini visual fallback used.',
    };
  } catch {
    result.error = 'Hive and Gemini visual detection were unavailable.';
    return result;
  }
}

async function callHive(
  fileBuffer: Buffer,
  mimeType: string,
  mediaType: ServerMediaType,
  apiKey: string,
  geminiKey: string | null
): Promise<HiveProviderResult> {
  if (mediaType !== 'image') {
    return { ...emptyHiveResult(), error: 'Hive v3 image detection is only used for images.' };
  }

  try {
    const response = await fetch(
      'https://api.thehive.ai/api/v3/hive/ai-generated-and-deepfake-content-detection',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: [{ media_base64: `data:${mimeType};base64,${fileBuffer.toString('base64')}` }],
        }),
        signal: createTimeoutSignal(HIVE_API_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      throw new Error(`Hive API error: HTTP ${response.status}`);
    }

    return parseHiveV3Result(await response.json());
  } catch (err) {
    const hiveError = err instanceof DOMException && err.name === 'TimeoutError'
      ? 'Hive request timed out while processing the media.'
      : err instanceof Error ? err.message : 'Hive request failed';
    const fallback = await fallbackHiveWithGemini(fileBuffer, mimeType, geminiKey);
    if (fallback.status === 'success') return fallback;
    return { ...fallback, error: `${hiveError} ${fallback.error ?? ''}`.trim() };
  }
}

// ─── Sightengine Detection ────────────────────

async function callSightengine(
  fileBuffer: Buffer,
  mimeType: string,
  mediaType: ServerMediaType,
  apiUser: string,
  apiSecret: string
): Promise<SightengineProviderResult> {
  const endpoint =
    mediaType === 'video'
      ? 'https://api.sightengine.com/1.0/video/check-sync.json'
      : 'https://api.sightengine.com/1.0/check.json';

  const form = new FormData();
  form.append('media', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), 'media');
  form.append('models', 'genai,deepfake');
  form.append('api_user', apiUser);
  form.append('api_secret', apiSecret);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: form,
      signal: createTimeoutSignal(),
    });

    if (process.env['NODE_ENV'] !== 'production') {
      console.log(`[VeriLens Debug] Sightengine HTTP status: ${res.status}`);
    }

    const data = (await res.json()) as Record<string, unknown>;

    if ((data['status'] as string) === 'failure') {
      const errObj = data['error'] as { message?: string; code?: number } | undefined;
      const errMsg = errObj?.message ?? `Sightengine request failed (code ${errObj?.code ?? 'unknown'})`;
      return {
        status: 'failed',
        aiGeneratedScore: null,
        deepfakeScore: null,
        generator: null,
        error: errMsg,
      };
    }

    const aiGenObj = (data['ai_generated'] ?? data['type']) as Record<string, unknown> | undefined;
    const aiRaw =
      (data['ai_generated'] as Record<string, number> | undefined)?.['score'] ??
      (data['type'] as Record<string, number> | undefined)?.['ai_generated'] ??
      (data['type'] as Record<string, number> | undefined)?.['deepfake'] ??
      null;
    const dfRaw = (data['type'] as Record<string, number> | undefined)?.['deepfake'] ?? null;

    return {
      status: 'success',
      aiGeneratedScore: aiRaw !== null ? Math.round(aiRaw * 100) : null,
      deepfakeScore: dfRaw !== null ? Math.round(dfRaw * 100) : null,
      generator: (aiGenObj?.['generator'] as string) ?? null,
      error: null,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Sightengine request failed';
    return {
      status: 'failed',
      aiGeneratedScore: null,
      deepfakeScore: null,
      generator: null,
      error: errMsg,
    };
  }
}

// ─── Evidence Fusion ──────────────────────────
// Rules documented inline. Thresholds are in api/thresholds.ts.

function fuseVerdict(
  hive: HiveProviderResult,
  se: SightengineProviderResult
): VerdictLevel {
  const hiveScore = hive.status === 'success' ? hive.aiGeneratedScore : null;
  const seScore = se.status === 'success' ? se.aiGeneratedScore : null;

  const hasHive = hiveScore !== null;
  const hasSe = seScore !== null;

  // No reliable detector results
  if (!hasHive && !hasSe) return 'inconclusive';

  // Both available — check for disagreement
  if (hasHive && hasSe) {
    const diff = Math.abs(hiveScore! - seScore!);
    if (diff > DISAGREEMENT_DELTA) return 'inconclusive';
    const avg = (hiveScore! + seScore!) / 2;
    if (avg >= HIGH_SIGNAL_THRESHOLD) return 'high';
    if (avg >= LOW_SIGNAL_THRESHOLD) return 'medium';
    return 'low';
  }

  // Only one detector available — lower confidence, use that score alone
  const score = (hasHive ? hiveScore : seScore)!;
  if (score >= HIGH_SIGNAL_THRESHOLD) return 'high';
  if (score >= LOW_SIGNAL_THRESHOLD) return 'medium';
  return 'low';
}

// ─── Gemini Explanation ───────────────────────
// Called ONCE, after detector results are known.
// Gemini explains evidence — it does NOT generate scores.

async function callGemini(
  mediaType: ServerMediaType,
  verdict: VerdictLevel,
  hive: HiveProviderResult,
  se: SightengineProviderResult,
  geminiKey: string
): Promise<ExplanationResult> {
  const fallback: ExplanationResult = {
    summary:
      'Explanation service unavailable. Please refer to the detector evidence shown above.',
    keySignals: [],
    uncertainty:
      'Human verification is always required regardless of automated assessment.',
    verificationSteps: [
      'Check the original source of the media independently.',
      'Look for contextual inconsistencies in captions or metadata.',
      'Consult a professional media forensics service for high-stakes decisions.',
    ],
  };

  // Build evidence summary for Gemini — only facts from detectors, no invented values
  const hiveInfo = hive.status === 'success'
    ? `Hive AI: AI-generated score=${hive.aiGeneratedScore ?? 'null'}/100, deepfake score=${hive.deepfakeScore ?? 'null'}/100${hive.c2pa ? ', C2PA provenance data present' : ''}`
    : `Hive AI: ${hive.status}`;

  const seInfo = se.status === 'success'
    ? `Sightengine: AI-generated score=${se.aiGeneratedScore ?? 'null'}/100, deepfake score=${se.deepfakeScore ?? 'null'}/100${se.generator ? `, generator=${se.generator}` : ''}`
    : `Sightengine: ${se.status}`;

  const prompt = `You are a media forensics assistant helping journalists verify media authenticity.

Based ONLY on the detector evidence below, write a concise plain-language explanation.

Media type: ${mediaType}
Evidence-fused risk verdict: ${verdict} (application-level rule, not scientific certainty)
Detector evidence:
- ${hiveInfo}
- ${seInfo}

Respond with ONLY a JSON object in this exact format — no prose, no markdown, no code fences:
{
  "summary": "2-3 sentences using hedged language: 'potentially', 'suggests', 'may indicate'. Never say definitely fake or definitely real.",
  "keySignals": ["one signal", "another signal"],
  "uncertainty": "One sentence about what remains uncertain.",
  "verificationSteps": ["step 1", "step 2", "step 3"]
}

STRICT RULES:
- DO NOT invent scores, sources, URLs, dates, or metadata.
- DO NOT claim certainty. Use probabilistic language only.
- keySignals must be derived solely from the detector evidence provided.
- If detectors are unavailable, say evidence is limited.
- verificationSteps must be practical actions a journalist can take.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.1 },
        }),
        signal: createTimeoutSignal(GEMINI_TIMEOUT_MS),
      }
    );

    if (!res.ok) return fallback;

    const data = await res.json() as Record<string, unknown>;
    const candidates = data['candidates'] as Array<{
      content?: { parts?: Array<{ text?: string }> };
    }> | undefined;
    const text = candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      summary: typeof parsed['summary'] === 'string' ? parsed['summary'] : fallback.summary,
      keySignals: Array.isArray(parsed['keySignals']) ? parsed['keySignals'] as string[] : [],
      uncertainty:
        typeof parsed['uncertainty'] === 'string' ? parsed['uncertainty'] : fallback.uncertainty,
      verificationSteps: Array.isArray(parsed['verificationSteps'])
        ? parsed['verificationSteps'] as string[]
        : fallback.verificationSteps,
    };
  } catch {
    // Gemini failure is non-fatal — return fallback, never crash
    return fallback;
  }
}

// ─── Multipart body parser ────────────────────

async function parseMultipart(
  req: IncomingMessage,
  boundary: string
): Promise<{ fileBuffer: Buffer | null; mimeType: string; sourceUrl: string | null }> {
  let rawBody: Buffer;
  const reqAny = req as unknown as { body?: unknown };

  if (Buffer.isBuffer(reqAny.body)) {
    rawBody = reqAny.body;
  } else if (typeof reqAny.body === 'string') {
    rawBody = Buffer.from(reqAny.body, 'binary');
  } else {
    const chunks: Buffer[] = [];
    for await (const chunk of req as AsyncIterable<Buffer>) {
      chunks.push(Buffer.from(chunk));
    }
    rawBody = Buffer.concat(chunks);
  }

  const sep = `--${boundary.trim()}`;

  let fileBuffer: Buffer | null = null;
  let mimeType = '';
  let sourceUrl: string | null = null;

  // Split on boundary (binary-safe)
  const bodyStr = rawBody.toString('binary');
  const parts = bodyStr.split(sep).slice(1);

  for (const part of parts) {
    if (part === '--\r\n' || part === '--') break;

    const sepIdx = part.indexOf('\r\n\r\n');
    if (sepIdx === -1) continue;

    const headerSection = part.slice(0, sepIdx);
    const body = part.slice(sepIdx + 4).replace(/\r\n$/, '');
    const headersLower = headerSection.toLowerCase();

    if (headersLower.includes('name="file"') || headersLower.includes('name="media"')) {
      const ctMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i);
      const parsedCt = ctMatch ? ctMatch[1].trim() : '';

      // Infer from filename if Content-Type header missing
      const filenameMatch = headerSection.match(/filename="([^"]+)"/i);
      const filename = filenameMatch ? filenameMatch[1] : '';

      if (parsedCt) {
        mimeType = parsedCt;
      } else if (filename.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (filename.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else if (filename.endsWith('.mp4')) {
        mimeType = 'video/mp4';
      } else if (filename.endsWith('.mp3')) {
        mimeType = 'audio/mpeg';
      }

      fileBuffer = Buffer.from(body, 'binary');
    } else if (headersLower.includes('name="url"')) {
      sourceUrl = body.trim();
    } else if (headersLower.includes('name="mimetype"')) {
      // Client hint for MIME type
      if (!mimeType) mimeType = body.trim();
    }
  }

  return { fileBuffer, mimeType, sourceUrl };
}

// ─── Main Handler ─────────────────────────────

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
): Promise<void> {
  // CORS — restrict to configured origin in production
  const allowedOrigin = process.env['ALLOWED_ORIGIN'] ?? '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }));
    return;
  }

  const creds = getCredentials();
  const contentType = ((req.headers as Record<string, string>)['content-type']) ?? '';

  if (process.env['NODE_ENV'] !== 'production') {
    console.log(`[VeriLens] /api/analyze called (${req.method})`);
    console.log(`[VeriLens] Hive API Key: ${creds.hiveKey ? 'configured' : 'missing'}`);
    console.log(`[VeriLens] Sightengine User: ${creds.seUser ? 'configured' : 'missing'}`);
    console.log(`[VeriLens] Sightengine Secret: ${creds.seSecret ? 'configured' : 'missing'}`);
    console.log(`[VeriLens] Gemini API Key: ${creds.geminiKey ? 'configured' : 'missing'}`);
  }

  let fileBuffer: Buffer | null = null;
  let mimeType = '';
  let sourceUrl: string | null = null;

  // ── Parse request body ────────────────────
  if (contentType.includes('multipart/form-data')) {
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid multipart boundary.', code: 'BAD_REQUEST' }));
      return;
    }
    const parsed = await parseMultipart(req, boundaryMatch[1]);
    fileBuffer = parsed.fileBuffer;
    mimeType = parsed.mimeType;
    sourceUrl = parsed.sourceUrl;
  } else if (contentType.includes('application/json')) {
    const chunks: Buffer[] = [];
    for await (const chunk of req as AsyncIterable<Buffer>) {
      chunks.push(Buffer.from(chunk));
    }
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString()) as Record<string, string>;
      sourceUrl = body['url'] ?? null;
      mimeType = body['mimeType'] ?? '';
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body.', code: 'BAD_REQUEST' }));
      return;
    }
  } else {
    res.writeHead(415, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unsupported content type.', code: 'UNSUPPORTED_CONTENT_TYPE' }));
    return;
  }

  // ── Validate and sanitise source URL ─────
  if (sourceUrl) {
    const urlCheck = sanitizeSourceUrl(sourceUrl);
    if (!urlCheck.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: urlCheck.error, code: 'INVALID_URL' }));
      return;
    }
    sourceUrl = (urlCheck as { valid: true; sanitised: string }).sanitised;
  }

  // ── Validate file presence ────────────────
  if (!fileBuffer || fileBuffer.length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No valid media file provided.', code: 'NO_FILE' }));
    return;
  }

  // ── Validate MIME type ────────────────────
  const mediaType = resolveMediaType(mimeType);
  if (!mediaType) {
    res.writeHead(415, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: `Unsupported media type: ${mimeType.substring(0, 64)}`,
      code: 'UNSUPPORTED_TYPE',
    }));
    return;
  }

  // ── Validate file size ────────────────────
  if (!validateFileSize(fileBuffer.length, mediaType)) {
    res.writeHead(413, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File exceeds the maximum allowed size.', code: 'FILE_TOO_LARGE' }));
    return;
  }

  const fileSize = fileBuffer.length;
  const baseMetadata = {
    mimeType,
    size: fileSize,
    width: null,
    height: null,
    duration: null,
    exifAvailable: null,
  };

  // ── Audio: no live detector configured ───
  if (mediaType === 'audio') {
    const audioResult: NormalizedAnalysisResult = {
      mediaType: 'audio',
      verdict: 'inconclusive',
      providers: {},
      metadata: baseMetadata,
      explanation: {
        summary:
          'Audio deepfake detection is not currently available in the live detector pipeline. Manual verification is recommended.',
        keySignals: ['Audio detection: unavailable'],
        uncertainty:
          'No detector results are available for this audio file. Manual review is required.',
        verificationSteps: [
          'Listen carefully for unnatural pauses, monotone delivery, or robotic cadence.',
          'Compare voice characteristics with known authentic recordings of the same speaker.',
          'Use a dedicated audio forensics tool such as Adobe Podcast or Resemble Detect.',
          'Consult a professional audio forensics service for high-stakes decisions.',
        ],
      },
      source: {
        url: sourceUrl,
        hostname: sourceUrl ? extractHostname(sourceUrl) : null,
        title: null,
        status: sourceUrl ? 'provided' : 'unavailable',
      },
      analyzedAt: new Date().toISOString(),
      isDemo: false,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(audioResult));
    return;
  }

  // ── Run Hive and Sightengine in parallel ──
  const unavailableHive: HiveProviderResult = {
    status: 'unavailable',
    aiGeneratedScore: null,
    deepfakeScore: null,
    generator: null,
    c2pa: null,
  };
  const unavailableSe: SightengineProviderResult = {
    status: 'unavailable',
    aiGeneratedScore: null,
    deepfakeScore: null,
    generator: null,
  };

  const [hiveResult, seResult] = await Promise.all([
    creds.hiveKey
      ? callHive(fileBuffer, mimeType, mediaType, creds.hiveKey, creds.geminiKey)
      : Promise.resolve(unavailableHive),
    creds.seUser && creds.seSecret
      ? callSightengine(fileBuffer, mimeType, mediaType, creds.seUser, creds.seSecret)
      : Promise.resolve(unavailableSe),
  ]);

  // ── Evidence fusion ───────────────────────
  const verdict = fuseVerdict(hiveResult, seResult);

  // ── Gemini explanation (once, after fusion) ──
  const explanation = creds.geminiKey
    ? await callGemini(mediaType, verdict, hiveResult, seResult, creds.geminiKey)
    : {
        summary:
          'Explanation service unavailable. Please refer to the detector evidence shown above.',
        keySignals: [],
        uncertainty:
          'Human verification is always required regardless of automated assessment.',
        verificationSteps: [
          'Check the original source of the media independently.',
          'Look for contextual inconsistencies in captions or metadata.',
          'Consult a professional media forensics service for high-stakes decisions.',
        ],
      };

  // ── Build normalized response ──────────────
  const result: NormalizedAnalysisResult = {
    mediaType,
    verdict,
    providers: {
      hive: hiveResult,
      sightengine: seResult,
    },
    metadata: baseMetadata,
    explanation,
    source: {
      url: sourceUrl,
      hostname: sourceUrl ? extractHostname(sourceUrl) : null,
      title: null,
      status: sourceUrl ? 'provided' : 'unavailable',
    },
    analyzedAt: new Date().toISOString(),
    isDemo: false,
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}
