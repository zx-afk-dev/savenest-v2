import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production you'd forward this to your monitoring provider.
    // eslint-disable-next-line no-console
    console.error('SaveNest render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="font-display text-2xl font-bold text-ink-900">Ada yang tidak beres</h2>
          <p className="max-w-md text-ink-800/70">
            Terjadi kesalahan tak terduga pada halaman ini. Coba muat ulang halaman.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
