// ─────────────────────────────────────────────
//  VeriLens AI — Skip Navigation Link
//  Accessibility: allows keyboard users to skip
//  the header and jump directly to main content.
// ─────────────────────────────────────────────

export function SkipNavLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed left-4 top-4 z-[200]
        rounded-xl bg-cyan-600 px-4 py-2
        text-sm font-bold text-white
        shadow-lg shadow-cyan-500/30
        focus:outline-none focus:ring-2 focus:ring-white/50
        transition-all
      "
    >
      Skip to main content
    </a>
  );
}
