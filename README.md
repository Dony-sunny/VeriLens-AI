# VeriLens AI

> **Before you trust it, verify it.**

AI-powered media forensics for images, audio, and video. Built for journalists, researchers, and anyone who demands truth.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

## 🏗️ Architecture

The analysis pipeline is cleanly separated into discrete, independently-testable modules:

```
MediaInput → DetectionEngine → EvidenceExtractor → ExplanationEngine → SourceVerifier → FinalVerdict
```

### Module Overview

| Module | Path | Description |
|--------|------|-------------|
| `mediaInput` | `src/modules/mediaInput.ts` | File/URL parsing and type detection |
| `detectionEngine` | `src/modules/detectionEngine.ts` | Hive AI + Gemini API integration stubs |
| `evidenceExtractor` | `src/modules/evidenceExtractor.ts` | Converts scores → forensic signals |
| `explanationEngine` | `src/modules/explanationEngine.ts` | Natural-language explanation (Gemini stub) |
| `sourceVerifier` | `src/modules/sourceVerifier.ts` | Source provenance and credibility |
| `finalVerdict` | `src/modules/finalVerdict.ts` | Aggregates all outputs → verdict |

## 🔑 API Integration

Create a `.env.local` file from the template:

```bash
cp .env.example .env.local
```

Fill in your API keys to enable live analysis (optional — demo mode works without keys):

```env
VITE_HIVE_API_KEY=your_hive_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

## 🧪 Testing

Tests are written with [Vitest](https://vitest.dev/) and [@testing-library/react](https://testing-library.com/).

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Test coverage targets:
- `src/modules/` — all pipeline modules
- `src/utils/` — security utilities

## 🔒 Security

- **File validation** — MIME type + size checks before processing
- **URL sanitisation** — Blocks `javascript:`, `data:`, private IPs (SSRF mitigation)
- **No credentials in source** — API keys loaded from environment only
- **XSS prevention** — User strings sanitised before rendering
- **Content Security Policy** — Configured via `public/_headers`

## ♿ Accessibility

- Semantic HTML landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`)
- ARIA labels and roles on all interactive elements
- Keyboard navigation supported throughout
- Skip-navigation link for screen readers
- WCAG AA contrast ratios on all text
- Live regions for async status updates

## 📁 Project Structure

```
src/
  components/
    layout/         Header, Hero
    ui/             GlassCard, Badge, ProgressBar, ErrorBoundary, SkipNavLink
    media/          MediaUploader, MediaViewer
    analysis/       VerdictCard, ConfidenceRing, EvidencePanel, ExplainableAI,
                    SourceVerification, RiskRecommendation, InvestigationReport
    demo/           DemoSelector
  data/             demoCases.ts, signalDefinitions.ts
  hooks/            useMediaUpload.ts, useAnalysis.ts
  modules/          (pipeline modules — see above)
  pages/            LandingPage.tsx
  tests/            Unit tests for all modules
  types/            analysis.ts (shared TypeScript interfaces)
  utils/            security.ts
```

## 🏆 Evaluation Criteria Alignment

| Criterion | Implementation |
|-----------|---------------|
| Code Quality | Typed interfaces, separated modules, consistent naming, JSDoc comments |
| Security | Input validation, URL sanitisation, SSRF mitigation, no credentials in source |
| Efficiency | Pipeline modules, lazy state, no redundant re-renders |
| Testing | Vitest unit tests for all core modules and security utilities |
| Accessibility | Semantic HTML, ARIA labels, keyboard nav, skip links, live regions |
| Problem Alignment | Full forensic pipeline for images, audio, and video with explainable AI |

## 📦 Tech Stack

- **React 19** + **TypeScript**
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Lucide React** icons
- **Vitest** + **Testing Library** for tests
- **Radix UI** primitives
- **Vite 8** build tool

---

*VeriLens AI — For investigative use only. Not a replacement for professional forensic analysis.*
