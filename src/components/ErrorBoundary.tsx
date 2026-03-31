import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center bg-[var(--color-danger-tint)] rounded-lg border border-[var(--color-danger-border)] text-[var(--color-danger)] m-5">
          <AlertTriangle size={48} className="mb-4 mx-auto block" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">
            We encountered an error while rendering this view.
          </p>
          {this.state.error && (
            <pre className="text-left bg-white/50 p-3 text-[0.75rem] overflow-auto mb-4 rounded-[4px]">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-[var(--color-border)] rounded-[4px] cursor-pointer font-medium"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
