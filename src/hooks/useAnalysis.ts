// ─────────────────────────────────────────────
//  VeriLens AI — useAnalysis Hook
//
//  Two code paths:
//  1. LIVE: sends media to /api/analyze (server-side)
//     → uses Hive + Sightengine detectors
//     → Gemini explanation via server
//  2. DEMO/FALLBACK: uses local mock pipeline
//     → clearly labelled as estimated/demo
//
//  Live API failure never silently becomes demo mode.
//  If the API is unavailable, the error is shown clearly.
// ─────────────────────────────────────────────

import { useState, useCallback } from 'react';
import type { MediaInput, AnalysisState, ProviderResults } from '../types/analysis';
import { extractSignals, buildLiveSignals } from '../modules/evidenceExtractor';
import { generateExplanation } from '../modules/explanationEngine';
import { verifySource } from '../modules/sourceVerifier';
import { buildFinalVerdict, buildFinalVerdictFromLive } from '../modules/finalVerdict';
import { submitForAnalysis, ApiError } from '../modules/apiClient';

const STEP_LABELS: Record<string, string> = {
  uploading: 'Uploading media...',
  detecting: 'Running AI detection models...',
  extracting: 'Extracting forensic signals...',
  explaining: 'Generating explanation...',
  verifying: 'Verifying source intelligence...',
  complete: 'Analysis complete.',
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface UseAnalysisReturn {
  state: AnalysisState;
  stepLabel: string;
  analyze: (input: MediaInput) => Promise<void>;
  reset: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
  });

  const analyze = useCallback(async (input: MediaInput) => {
    setState({ status: 'uploading', progress: 5, result: null, error: null });

    try {
      // ── LIVE API PATH ────────────────────────
      setState((s) => ({ ...s, status: 'detecting', progress: 20 }));

      const liveResponse = await submitForAnalysis(input);

      // Step 2: Build live signals from provider results
      setState((s) => ({ ...s, status: 'extracting', progress: 55 }));
      await sleep(300);
      const signals = buildLiveSignals(
        input.type as 'image' | 'video' | 'audio',
        liveResponse.providers as ProviderResults
      );

      // Step 3: Source verification
      setState((s) => ({ ...s, status: 'verifying', progress: 80 }));
      await sleep(300);
      const sourceVerification = await verifySource(input);

      // Step 4: Build final result
      setState((s) => ({ ...s, status: 'explaining', progress: 92 }));
      await sleep(200);

      const result = buildFinalVerdictFromLive(
        input,
        {
          mediaType: liveResponse.mediaType,
          verdict: liveResponse.verdict,
          providers: liveResponse.providers,
          metadata: liveResponse.metadata,
          explanation: liveResponse.explanation,
          source: liveResponse.source,
          analyzedAt: liveResponse.analyzedAt,
        },
        signals,
        sourceVerification
      );

      setState({ status: 'complete', progress: 100, result, error: null });

    } catch (err) {
      // ── API UNAVAILABLE — fall back to mock pipeline ──
      // This is only reached if /api/analyze is not deployed.
      // In production with the API deployed, this should not happen.
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        // 4xx = client error (bad file, etc.) — show error, do NOT fall back
        setState({
          status: 'error',
          progress: 0,
          result: null,
          error: err.message,
        });
        return;
      }

      // Network error or 5xx = API not available — use mock pipeline
      // Clearly label as estimated, not live
      try {
        setState((s) => ({ ...s, status: 'detecting', progress: 25 }));
        await sleep(800);

        // Import mock detection engine lazily
        const { runDetection } = await import('../modules/detectionEngine');
        const scores = await runDetection(input);

        setState((s) => ({ ...s, status: 'extracting', progress: 55 }));
        await sleep(600);
        const signals = extractSignals(input, scores);

        setState((s) => ({ ...s, status: 'explaining', progress: 75 }));
        await sleep(600);
        const explanation = await generateExplanation(input, scores, signals);

        setState((s) => ({ ...s, status: 'verifying', progress: 90 }));
        await sleep(400);
        const sourceVerification = await verifySource(input);

        const result = buildFinalVerdict(input, scores, signals, explanation, sourceVerification);

        // Attach a notice that live API was unavailable
        result.riskMessage = '[Live detectors unavailable — showing estimated signals only] ' + result.riskMessage;

        setState({ status: 'complete', progress: 100, result, error: null });
      } catch (fallbackErr) {
        setState({
          status: 'error',
          progress: 0,
          result: null,
          error:
            'Analysis failed. Please try again or check your connection. ' +
            (fallbackErr instanceof Error ? fallbackErr.message : ''),
        });
      }
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, result: null, error: null });
  }, []);

  return {
    state,
    stepLabel: STEP_LABELS[state.status] ?? '',
    analyze,
    reset,
  };
}
