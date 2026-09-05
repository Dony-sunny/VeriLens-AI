import { useState } from 'react';
import { Scan, Menu, X, Zap } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Analyze', href: '#analyze' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For Journalists', href: '#journalists' },
  { label: 'About', href: '#about' },
];

interface HeaderProps {
  onAnalyzeClick: () => void;
}

export function Header({ onAnalyzeClick }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#020817]/80 backdrop-blur-xl"
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo — linked to top of page */}
          <a
            href="#"
            aria-label="VeriLens AI — go to top"
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
          >
            <div
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30"
              aria-hidden="true"
            >
              <Scan className="h-5 w-5 text-white" strokeWidth={2} />
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 blur" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white">
                Veri<span className="text-cyan-400">Lens</span>
              </span>
              <span className="ml-1 text-xs font-medium tracking-widest text-cyan-500/80">AI</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={onAnalyzeClick}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              Analyze Now
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen
              ? <X className="h-5 w-5" aria-hidden="true" />
              : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        hidden={!mobileOpen}
        className="border-t border-white/8 bg-[#020817]/95 px-6 pb-6 pt-4 md:hidden"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <nav className="flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => { onAnalyzeClick(); setMobileOpen(false); }}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            Analyze Now
          </button>
        </nav>
      </div>

      {/* Decorative scan line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" aria-hidden="true" />
    </header>
  );
}
