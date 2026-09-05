import { Shield, ArrowDown, Sparkles, FlaskConical } from 'lucide-react';

interface HeroProps {
  onAnalyzeClick: () => void;
  onDemoClick: () => void;
}

export function Hero({ onAnalyzeClick, onDemoClick }: HeroProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/3 h-[250px] w-[250px] rounded-full bg-purple-600/5 blur-3xl" />
        {/* Scanline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {/* Eyebrow */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-cyan-400 uppercase">
          <Shield className="h-3.5 w-3.5" />
          Before you trust it, verify it.
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight text-white md:text-7xl">
          Don&apos;t trust{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            what you see.
          </span>
          <br />
          <span className="text-slate-300">Verify what you&apos;re seeing.</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 leading-relaxed">
          AI-powered media forensics for{' '}
          <span className="text-slate-200">images</span>,{' '}
          <span className="text-slate-200">audio</span> and{' '}
          <span className="text-slate-200">video</span>.
          Built for journalists, researchers, and anyone who demands truth.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onAnalyzeClick}
            className="group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-cyan-500/25 transition-all duration-200 hover:shadow-cyan-500/50 hover:scale-105 active:scale-100"
          >
            <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
            Analyze Media
          </button>
          <button
            onClick={onDemoClick}
            className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/30 hover:bg-white/10 hover:text-white"
          >
            <FlaskConical className="h-5 w-5 text-cyan-400" />
            Try a Sample
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/8 pt-10">
          {[
            { label: 'Detection Accuracy', value: '96.4%' },
            { label: 'Signal Checks', value: '14+' },
            { label: 'Media Types', value: '3' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-1 text-2xl font-black text-cyan-400 md:text-3xl">{stat.value}</div>
              <div className="text-xs font-medium uppercase tracking-widest text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={onAnalyzeClick}
            className="animate-bounce text-slate-600 hover:text-cyan-400 transition-colors"
          >
            <ArrowDown className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
