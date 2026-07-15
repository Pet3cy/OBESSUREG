import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-red-100">
            <h2 className="text-2xl font-bold text-brand-membership mb-4">Something went wrong</h2>
            <p className="text-slate-600 mb-4">
              An unexpected error occurred in the application.
            </p>
            <div className="bg-slate-100 p-4 rounded-lg overflow-auto text-sm font-mono text-slate-800 mb-6 max-h-48">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(this.state.error?.stack || '')}
              className="w-full mb-3 border border-slate-200 text-slate-600 py-2 rounded-xl font-medium hover:bg-slate-50"
            >
              Copy Error Details
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
