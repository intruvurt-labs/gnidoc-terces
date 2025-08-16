import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
          <div className="glass-morph rounded-xl p-8 max-w-md w-full text-center border border-cyber-red/50">
            <i className="fas fa-exclamation-triangle text-cyber-red text-4xl mb-4"></i>
            <h2 className="text-xl font-orbitron font-bold text-cyber-red mb-4">
              System Error
            </h2>
            <p className="text-gray-300 mb-4">
              Something went wrong. Please refresh the page to continue.
            </p>
            <button
              className="cyber-border rounded-lg px-6 py-3 text-cyber-green hover:animate-glow-pulse transition-all"
              onClick={() => window.location.reload()}
            >
              <i className="fas fa-refresh mr-2"></i>
              Reload Application
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-cyber-cyan cursor-pointer text-sm">
                  Technical Details
                </summary>
                <pre className="text-xs text-gray-400 mt-2 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
