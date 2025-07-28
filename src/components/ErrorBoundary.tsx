import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translations } from '@/lib/translations';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Get current language from localStorage or default to 'pt'
      const currentLanguage = (localStorage.getItem('language') as 'pt' | 'en') || 'pt';
      const t = (key: string) => translations[currentLanguage][key] || key;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md mx-auto">
            <div className="flex justify-center">
              <AlertTriangle className="w-16 h-16 text-destructive animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {t('error.somethingWentWrong')}
              </h1>
              <p className="text-muted-foreground">
                {t('error.unexpectedError')}
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-card p-4 rounded-lg border">
                <h3 className="font-semibold text-sm text-destructive mb-2">
                  {t('error.debugInfo')}
                </h3>
                <pre className="text-xs text-muted-foreground overflow-auto">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                {t('error.tryAgain')}
              </Button>
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                {t('error.reloadPage')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;