import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare readonly props: Readonly<ErrorBoundaryProps>;
  declare state: ErrorBoundaryState;
  declare setState: (state: Partial<ErrorBoundaryState>) => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('UI ErrorBoundary caught error:', error?.message || 'unknown error', info?.componentStack ? '(stack omitted)' : '');
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 rounded-2xl bg-white dark:bg-[#152019] border border-[#E8DFC9] dark:border-[#23352A] text-center max-w-md mx-auto space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#D97843] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h3>
          <p className="text-xs text-[#6B7A72] dark:text-[#8DA195]">
            A display error occurred in this section. Your data is safe—try refreshing this view.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A] text-[#284435] dark:text-[#EDF3EF] text-xs font-semibold cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
