import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CyberCard, CyberCardContent } from '@/components/ui/cyber-card';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isOnline: boolean;
  retryCount: number;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isOnline: navigator.onLine,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error with enhanced context
    const errorContext = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      isOnline: navigator.onLine,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    };

    logger.error('🚨 Enhanced Error Boundary caught an error:', error, errorContext);

    // Store error in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('technosutra-errors') || '[]');
      errorLog.push(errorContext);
      // Keep only last 10 errors
      if (errorLog.length > 10) {
        errorLog.splice(0, errorLog.length - 10);
      }
      localStorage.setItem('technosutra-errors', JSON.stringify(errorLog));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
      
      logger.info(`🔄 Retrying after error (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'low';
    }
    
    if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
      return 'medium';
    }
    
    return 'high';
  };

  getErrorSuggestion = (error: Error): string => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Verifique sua conexão com a internet e tente novamente.';
    }
    
    if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
      return 'Erro ao carregar recursos. Recarregue a página.';
    }
    
    if (errorMessage.includes('permission')) {
      return 'Verifique as permissões do navegador (GPS, câmera, etc.).';
    }
    
    return 'Erro inesperado. Tente recarregar a aplicação.';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity(this.state.error);
      const suggestion = this.getErrorSuggestion(this.state.error);
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <CyberCard className="border-red-500/30 bg-black/90">
              <CyberCardContent className="p-6 space-y-4">
                {/* Error Icon and Status */}
                <div className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-3 rounded-full bg-red-500/20 border border-red-500/30"
                  >
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </motion.div>
                </div>

                {/* Error Title */}
                <div className="text-center">
                  <h1 className="text-xl font-bold text-red-400 mb-2">
                    Oops! Algo deu errado
                  </h1>
                  <p className="text-slate-400 text-sm">
                    {suggestion}
                  </p>
                </div>

                {/* Error Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Severidade:</span>
                    <Badge className={`text-xs ${
                      severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {severity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Conexão:</span>
                    <div className="flex items-center gap-1">
                      {this.state.isOnline ? (
                        <Wifi className="w-3 h-3 text-green-400" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-xs text-slate-400">
                        {this.state.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">ID do Erro:</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {this.state.errorId.slice(-8)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {canRetry && (
                    <Button
                      onClick={this.handleRetry}
                      className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/30"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente ({this.maxRetries - this.state.retryCount} restantes)
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={this.handleReload}
                      variant="outline"
                      className="flex-1 text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recarregar
                    </Button>

                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="flex-1 text-green-400 border-green-500/30 hover:bg-green-500/10"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Início
                    </Button>
                  </div>
                </div>

                {/* Debug Info (Development) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                      <Bug className="w-3 h-3 inline mr-1" />
                      Detalhes Técnicos
                    </summary>
                    <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400 font-mono overflow-auto max-h-32">
                      <div><strong>Error:</strong> {this.state.error.message}</div>
                      <div><strong>Stack:</strong> {this.state.error.stack?.slice(0, 200)}...</div>
                    </div>
                  </details>
                )}
              </CyberCardContent>
            </CyberCard>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;
