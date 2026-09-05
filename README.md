# VeriLens AI

> **Before you trust it, verify it.**

AI-powered media forensics platform for images, video, and audio. Built for journalists, fact-checkers, intelligence analysts, and researchers to verify synthetic or manipulated media prior to publication or dissemination.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server (frontend)
npm run dev

# Run full test suite (93 unit & integration tests)
npm test

# Run test coverage report
npm run test:coverage

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## 🏗️ Architecture & Data Flow

VeriLens AI separates **Detection** from **Explanation** and uses a server-side architecture to keep credentials 100% secure:

```
Browser (React + Vite)
   │
   │ POST /api/analyze (FormData / Media / URL)
   ▼
Serverless API (Vercel Edge / Node Runtime)
   ├─ Input Validation & SSRF Sanitization (_middleware.ts)
   │
   ├─ DETECTION ENGINE (Parallel Dispatch)
   │    ├─ Hive AI API (ai-generated, deepfake, C2PA provenance)
   │    └─ Sightengine API (ai-generated, deepfake, generator attribution)
   │
   ├─ EVIDENCE FUSION (thresholds.ts)
   │    └─ LOW RISK / MEDIUM RISK / HIGH RISK / INCONCLUSIVE
   │
   ├─ EXPLANATION ENGINE (Post-Fusion)
   │    └─ Google Gemini 1.5 Flash (explains detector facts only — never overrides)
   │
   └─ Safe Normalized JSON Response (Credentials NEVER sent to client)
```

---

## 📁 Project Structure

```
c:/VeriLens AI/
├── api/                            # Server-side API Infrastructure (Vercel Serverless)
│   ├── _middleware.ts              # MIME validation, size limits, SSRF & URL sanitization
│   ├── analyze.ts                  # /api/analyze endpoint (Hive + Sightengine + Gemini)
│   ├── thresholds.ts               # Documented application-level decision thresholds
│   └── types.ts                    # Server-side normalized type contracts
├── public/                         # Static assets & server deployment headers
│   ├── _headers                    # Security headers for Netlify
│   └── favicon.svg                 # Brand icons
├── src/
│   ├── assets/                     # Hero graphics and vector assets
│   ├── components/
│   │   ├── analysis/               # Forensic Dashboard Components
│   │   │   ├── ConfidenceRing.tsx       # SVG animated signal ring (4 verdict styles)
│   │   │   ├── DetectorEvidenceCard.tsx # Hive + Sightengine breakdown + C2PA + Metadata
│   │   │   ├── EvidencePanel.tsx        # Forensic signals by category (Live/Est/Demo)
│   │   │   ├── ExplainableAI.tsx        # Plain-language explanation + verification steps
│   │   │   ├── InvestigationReport.tsx  # Exportable forensic text report (.txt)
│   │   │   ├── RiskRecommendation.tsx   # Action banner (Low/Med/High/Inconclusive)
│   │   │   ├── SourceVerification.tsx   # User-Provided vs Independently Verified source
│   │   │   ├── VerdictCard.tsx          # Overall verdict card + detection scores
│   │   │   └── VerificationChecklist.tsx# Interactive 5-step checklist for journalists
│   │   ├── demo/
│   │   │   └── DemoSelector.tsx         # Demo modal with 3 pre-populated cases
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Semantic accessible navbar with skip-links
│   │   │   └── Hero.tsx                 # Hero section with headline and stats
│   │   ├── lib/
│   │   │   └── utils.ts                 # Tailwind cn() utility
│   │   ├── media/
│   │   │   ├── MediaUploader.tsx        # Drag-and-drop / file / URL input with a11y
│   │   │   └── MediaViewer.tsx          # Image zoom, video player, audio waveform
│   │   └── ui/
│   │       ├── Badge.tsx                # Variant badges (green, amber, red, cyan, ghost)
│   │       ├── ErrorBoundary.tsx        # Class-based UI crash recovery
│   │       ├── GlassCard.tsx            # Cybersecurity glassmorphism card
│   │       ├── ProgressBar.tsx          # Animated gradient progress bars
│   │       └── SkipNavLink.tsx          # Screen reader skip-to-content link
│   ├── data/
│   │   ├── demoCases.ts            # 3 realistic forensic demo cases
│   │   └── signalDefinitions.ts    # 14 forensic signal definitions across modalities
│   ├── hooks/
│   │   ├── useAnalysis.ts          # Pipeline orchestration hook (live + fallback)
│   │   └── useMediaUpload.ts       # Upload, drag-and-drop & security validation hook
│   ├── modules/                    # Forensic Business Logic
│   │   ├── apiClient.ts            # Client caller for /api/analyze
│   │   ├── detectionEngine.ts      # Local/mock detection engine fallback
│   │   ├── evidenceExtractor.ts    # Score to signal converter + buildLiveSignals()
│   │   ├── explanationEngine.ts    # Gemini prompt builder + template fallback
│   │   ├── finalVerdict.ts         # Multi-model evidence fusion aggregator
│   │   ├── mediaInput.ts           # File/URL parsing & formatters
│   │   └── sourceVerifier.ts       # Source intelligence & provenance validation
│   ├── pages/
│   │   └── LandingPage.tsx         # Full 11-section application landing page
│   ├── tests/                      # Test Suite (93 Passing Tests)
│   │   ├── evidenceExtractor.test.ts # Forensic signal mapping tests
│   │   ├── finalVerdict.test.ts      # Evidence fusion & verdict tests
│   │   ├── integration.test.ts       # 15-scenario comprehensive integration tests
│   │   ├── mediaInput.test.ts        # File & URL parser tests
│   │   ├── security.test.ts          # SSRF, XSS, and file validator tests
│   │   └── setup.ts                  # Vitest DOM setup
│   ├── types/
│   │   └── analysis.ts             # Comprehensive TypeScript shared contracts
│   ├── utils/
│   │   └── security.ts             # Client-side validation & XSS sanitization
│   ├── App.tsx                     # Main application container with error boundary
│   └── main.tsx                    # React 19 root mount
├── .env.example                    # Server-side environment variable template
├── .gitignore                      # Excludes all .env files, node_modules, dist
├── vercel.json                     # Vercel serverless function config + CSP headers
└── vite.config.ts                  # Vite + Tailwind v4 + Vitest configuration
```

---

## 🔒 Security Architecture

1. **Zero Secret Leakage**: Secret keys (`HIVE_API_KEY`, `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET`, `GEMINI_API_KEY`) stay strictly on the server in `process.env`. No `VITE_` prefix is used for secrets.
2. **SSRF Mitigation**: All incoming URLs are inspected. Localhost, loopback (`127.0.0.1`, `::1`), and private RFC 1918 IP blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are immediately rejected.
3. **Protocol Enforcement**: Only `http:` and `https:` schemes are permitted. Dangerous schemes (`javascript:`, `data:`, `file:`, `vbscript:`) are rejected.
4. **Input Size & MIME Validation**: Images limited to 100MB, videos to 200MB, audio to 50MB. File MIME signatures are validated before forwarding to any external API.
5. **API Timeouts**: All third-party requests use `AbortSignal.timeout(30000)` to eliminate hanging processes.
6. **Hardened Headers**: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and HSTS pre-configured in `vercel.json` and `public/_headers`.

---

## 🧪 Testing Suite (93 Tests)

```bash
npm test
```

VeriLens AI has comprehensive unit and integration test coverage across all 15 required competition scenarios:

1. Valid image handling (JPEG, PNG, WebP)
2. Valid video handling (MP4, WebM)
3. Invalid file format rejection (PDF, EXE, TXT)
4. Oversized file handling (>100MB)
5. Hive AI success response handling
6. Hive AI failure fallback handling
7. Sightengine success response handling
8. Sightengine failure fallback handling
9. Both detectors agree ($\ge 70\%$) $\rightarrow$ `HIGH RISK`
10. Detectors disagree ($>40\%$ delta) $\rightarrow$ `INCONCLUSIVE`
11. No detectors available $\rightarrow$ `INCONCLUSIVE` (never fabricates scores)
12. Gemini failure fallback (retains detector scores with template explanation)
13. Invalid / malformed URL handling
14. Unsafe URL / SSRF blocking (`javascript:`, `data:`, `127.0.0.1`, private IPs)
15. Isolated Demo Mode verification (`isDemo: true`, `isLiveResult: false`)

---

## ⚖️ Hackathon Evaluation Alignment

| Criterion | Implementation in VeriLens AI |
|---|---|
| **01. Code Quality** | Clean modular architecture, TypeScript strict mode, 0 linter warnings (`oxlint`), clean separation of concerns. |
| **02. Security** | Server-side API boundary, SSRF/XSS mitigation, zero client credentials, strict CSP. |
| **03. Efficiency** | Zero database bloat, in-memory stream processing, parallel API dispatch, single-call Gemini generation. |
| **04. Testing** | 93 passing tests across 5 test suites covering all edge cases, failures, and security vectors. |
| **05. Accessibility** | WCAG AA contrast, screen-reader landmarks, ARIA live regions, skip-nav link, keyboard-accessible dropzones and cards. |
| **06. Problem Alignment** | Specifically designed for journalists and researchers with C2PA tracking, source intelligence, explainable AI, and an interactive verification checklist. |
