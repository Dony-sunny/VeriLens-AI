// ─────────────────────────────────────────────
//  VeriLens AI — Error Boundary
//  Catches runtime errors and shows a graceful
//  fallback UI instead of a blank screen.
// ─────────────────────────────────────────────

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production you would send this to a monitoring service.
    console.error('[VeriLens ErrorBoundary]', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"
        >
          <AlertTriangle className="h-10 w-10 text-red-400" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="mt-1 text-sm text-slate-400">
              An unexpected error occurred in this section. You can try reloading it.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-black/40 p-3 text-left text-xs text-red-300">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
