import { useRef, useState } from 'react';
import { Hero } from '../components/layout/Hero';
import { MediaUploader } from '../components/media/MediaUploader';
import { VerdictCard } from '../components/analysis/VerdictCard';
import { EvidencePanel } from '../components/analysis/EvidencePanel';
import { ExplainableAI } from '../components/analysis/ExplainableAI';
import { SourceVerification } from '../components/analysis/SourceVerification';
import { MediaViewer } from '../components/media/MediaViewer';
import { InvestigationReport } from '../components/analysis/InvestigationReport';
import { RiskRecommendation } from '../components/analysis/RiskRecommendation';
import { DetectorEvidenceCard } from '../components/analysis/DetectorEvidenceCard';
import { VerificationChecklist } from '../components/analysis/VerificationChecklist';
import { DemoSelector } from '../components/demo/DemoSelector';
import { GlassCard } from '../components/ui/GlassCard';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useAnalysis } from '../hooks/useAnalysis';
import type { AnalysisResult } from '../types/analysis';
import { Cpu, Eye, FileSearch, Globe, Zap, Users, BookOpen, Info } from 'lucide-react';

// Suspicious region hints for demo images
const DEMO_SUSPICIOUS_REGIONS: Record<string, Array<{ x: number; y: number; width: number; height: number; label: string }>> = {
  'demo-2': [
    { x: 20, y: 10, width: 60, height: 50, label: 'GAN Artifact' },
    { x: 5, y: 60, width: 30, height: 30, label: 'Texture Mismatch' },
  ],
};

const DEMO_SUSPICIOUS_TIMESTAMPS: Record<string, Array<{ time: number; label: string }>> = {
  'demo-3': [
    { time: 11, label: 'Splice detected' },
    { time: 22, label: 'Sync mismatch' },
    { time: 29, label: 'Splice detected' },
  ],
};

export function LandingPage() {
  const analyzeRef = useRef<HTMLDivElement>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoResult, setDemoResult] = useState<AnalysisResult | null>(null);

  const {
    mediaInput,
    isDragOver,
    urlInput,
    validationError,
    setUrlInput,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleUrlSubmit,
    clearMedia,
  } = useMediaUpload();

  const { state, stepLabel, analyze, reset } = useAnalysis();

  const activeResult = demoResult ?? state.result;

  const scrollToAnalyze = () => {
    analyzeRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnalyze = () => {
    if (!mediaInput) return;
    setDemoResult(null);
    analyze(mediaInput);
  };

  const handleDemoSelect = (result: AnalysisResult) => {
    reset();
    clearMedia();
    setDemoResult(result);
    setTimeout(() => analyzeRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const suspiciousRegions = activeResult
    ? DEMO_SUSPICIOUS_REGIONS[activeResult.id] ?? []
    : [];
  const suspiciousTimestamps = activeResult
    ? DEMO_SUSPICIOUS_TIMESTAMPS[activeResult.id] ?? []
    : [];

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* ── Hero ── */}
      <Hero
        onAnalyzeClick={scrollToAnalyze}
        onDemoClick={() => setShowDemo(true)}
      />

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-500">
              The Pipeline
            </p>
            <h2 className="text-3xl font-black text-white md:text-4xl">How VeriLens Works</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { Icon: Zap, label: 'Media Input', desc: 'Upload or paste URL' },
              { Icon: Cpu, label: 'Detection', desc: 'Hive AI + Gemini' },
              { Icon: FileSearch, label: 'Evidence', desc: '14 forensic signals' },
              { Icon: BookOpen, label: 'Explanation', desc: 'Plain language AI' },
              { Icon: Globe, label: 'Source', desc: 'Provenance tracing' },
              { Icon: Eye, label: 'Verdict', desc: 'Confidence score' },
            ].map(({ Icon, label, desc }, i) => (
              <div key={label} className="relative">
                <GlassCard hover className="flex flex-col items-center gap-3 p-4 text-center h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="mb-0.5 text-xs font-bold uppercase tracking-wide text-slate-300">{label}</div>
                    <div className="text-xs text-slate-500">{desc}</div>
                  </div>
                  <div className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-black text-cyan-400 border border-cyan-500/30">
                    {i + 1}
                  </div>
                </GlassCard>
                {i < 5 && (
                  <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 text-slate-700 lg:block z-10">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Journalists ── */}
      <section id="journalists" className="py-24 px-6 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-500">
                For Journalists
              </p>
              <h2 className="mb-5 text-3xl font-black text-white md:text-4xl">
                Verify before you publish.
              </h2>
              <p className="mb-6 text-slate-400 leading-relaxed">
                In an era of synthetic media, one manipulated image or deepfake video can destroy a story's
                credibility — and your own. VeriLens gives reporters a first-pass forensic screen before
                publication, with explainable reasoning and a downloadable evidence report for your records.
              </p>
              <ul className="space-y-3">
                {[
                  'Instant first-pass forensic screening',
                  'Downloadable evidence report for your archives',
                  'Source provenance and timeline tracking',
                  'Plain-language explanations — no ML expertise needed',
                  'API-ready architecture for newsroom integration',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-white">Built for truth-seekers</h3>
              </div>
              <div className="space-y-3">
                {[
                  { role: 'Investigative Journalists', use: 'Authenticate photos before publishing breaking stories.' },
                  { role: 'Fact-Checkers', use: 'Flag viral media for deeper review before issuing verdicts.' },
                  { role: 'Researchers', use: 'Build datasets of authentic vs. synthetic media.' },
                  { role: 'Citizens', use: 'Verify news media before sharing on social platforms.' },
                ].map(({ role, use }) => (
                  <div key={role} className="rounded-xl border border-white/8 bg-white/3 p-3">
                    <div className="mb-1 text-xs font-bold text-cyan-400">{role}</div>
                    <div className="text-xs text-slate-400">{use}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-24 px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-cyan-500">About</p>
          <h2 className="mb-5 text-3xl font-black text-white md:text-4xl">
            What is VeriLens AI?
          </h2>
          <p className="mb-4 text-slate-400 leading-relaxed">
            VeriLens AI is an open forensics platform that applies machine-learning-based media analysis to
            help people detect AI-generated or manipulated images, audio, and video. It is powered by
            purpose-built detection modules and integrates with Hive AI and Google Gemini for production deployments.
          </p>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-400">
            <Info className="h-4 w-4 shrink-0" />
            No tool can guarantee 100% accuracy. VeriLens is a forensic aid — always combine it with human editorial judgment.
          </div>
        </div>
      </section>

      {/* ── Analyze Workspace ── */}
      <section id="analyze" ref={analyzeRef} className="py-16 px-6 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-500">
              Forensic Analysis
            </p>
            <h2 className="text-3xl font-black text-white md:text-4xl">Analyze Media</h2>
            <p className="mt-2 text-slate-500 text-sm">Upload a file or paste a URL to begin forensic analysis</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column: upload */}
            <div className="lg:col-span-1 space-y-4">
              <MediaUploader
                mediaInput={mediaInput}
                isDragOver={isDragOver}
                urlInput={urlInput}
                analysisStatus={state.status}
                analysisProgress={state.progress}
                stepLabel={stepLabel}
                validationError={validationError}
                onFileSelect={handleFileSelect}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onUrlChange={setUrlInput}
                onUrlSubmit={handleUrlSubmit}
                onClear={() => { clearMedia(); reset(); setDemoResult(null); }}
                onAnalyze={handleAnalyze}
              />

              {/* Demo button */}
              <button
                onClick={() => setShowDemo(true)}
                className="w-full rounded-xl border border-purple-500/30 bg-purple-500/8 py-3 text-sm font-semibold text-purple-400 transition-all hover:bg-purple-500/15"
              >
                🧪 Try Demo Cases
              </button>

              {/* Verdict card */}
              {activeResult && (
                <VerdictCard result={activeResult} />
              )}
            </div>

            {/* Right columns: results */}
            {activeResult ? (
              <div className="lg:col-span-2 space-y-6">
                {/* Media viewer */}
                <MediaViewer
                  mediaInput={activeResult.mediaInput}
                  suspiciousRegions={suspiciousRegions}
                  suspiciousTimestamps={suspiciousTimestamps}
                />

                {/* Multi-Model Detector Evidence (Hive + Sightengine + Metadata + C2PA) */}
                <DetectorEvidenceCard result={activeResult} />

                {/* Evidence panel */}
                <EvidencePanel signals={activeResult.signals} />

                {/* Explainable AI */}
                <ExplainableAI explanation={activeResult.explanation} />

                {/* Source intelligence & verification */}
                <SourceVerification
                  source={activeResult.sourceVerification}
                  sourceIntelligence={activeResult.sourceIntelligence}
                />

                {/* Journalistic Verification Checklist */}
                <VerificationChecklist result={activeResult} />

                {/* Investigation report */}
                <InvestigationReport result={activeResult} />

                {/* Risk recommendation */}
                <RiskRecommendation
                  riskLevel={activeResult.riskLevel}
                  riskMessage={activeResult.riskMessage}
                />
              </div>
            ) : (
              <div className="lg:col-span-2 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="mb-4 mx-auto h-20 w-20 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center">
                    <Eye className="h-10 w-10 text-slate-700" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-400">Analysis Results Appear Here</h3>
                  <p className="text-sm text-slate-600">
                    Upload a file or try a demo case to see the full forensic dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Veri<span className="text-cyan-400">Lens</span></span>
            <span className="text-xs text-cyan-500/70 font-medium tracking-widest">AI</span>
          </div>
          <p className="text-xs text-slate-600 text-center">
            Before you trust it, verify it. — For investigative use only. Not a replacement for professional forensic analysis.
          </p>
          <p className="text-xs text-slate-700">© 2026 VeriLens AI</p>
        </div>
      </footer>

      {/* Demo modal */}
      {showDemo && (
        <DemoSelector
          onSelect={handleDemoSelect}
          onClose={() => setShowDemo(false)}
        />
      )}
    </div>
  );
}
