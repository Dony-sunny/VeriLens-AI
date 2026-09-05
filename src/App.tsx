import { Suspense } from 'react';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
import { SkipNavLink } from './components/ui/SkipNavLink';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function LoadingFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#020817]"
      role="status"
      aria-label="Loading VeriLens AI"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
        <p className="text-sm text-slate-500">Loading VeriLens AI...</p>
      </div>
    </div>
  );
}

function App() {
  const scrollToAnalyze = () => {
    const el = document.getElementById('analyze');
    el?.scrollIntoView({ behavior: 'smooth' });
    // Move focus to the section for screen readers
    el?.focus();
  };

  return (
    <div className="min-h-screen bg-[#020817]">
      {/* Accessibility: Skip navigation */}
      <SkipNavLink />

      {/* Page header */}
      <Header onAnalyzeClick={scrollToAnalyze} />

      {/* Main content */}
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <main id="main-content" tabIndex={-1} className="outline-none">
            <LandingPage />
          </main>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
