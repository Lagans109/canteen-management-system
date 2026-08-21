import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React error boundaries must be class components — there's no hook
// equivalent. Wraps the entire app (see main.tsx) so a rendering error
// anywhere in the component tree is caught and replaced with a friendly
// fallback screen, instead of unmounting the whole app to a blank page.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  // Called by React when a descendant component throws during rendering;
  // switches this boundary into its fallback UI.
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  // Side-effect hook for the same error — used here just to log it, since
  // getDerivedStateFromError must stay a pure function.
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: 18, marginTop: 0 }}>Something went wrong</h1>
            <p style={{ color: 'var(--color-muted)' }}>
              An unexpected error occurred. Please reload the page and try again.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
