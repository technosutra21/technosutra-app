// Error Reporting Service for TECHNO SUTRA
// Comprehensive error tracking, reporting, and recovery

import { logger } from '@/lib/logger';

interface ErrorReport {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  buildVersion: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  recovered: boolean;
  retryCount: number;
  filename?: string;
  lineno?: number;
  colno?: number;
}

interface ErrorContext {
  route: string;
  userAction?: string;
  deviceInfo: DeviceInfo;
  appState: AppState;
  networkStatus: NetworkStatus;
}

interface DeviceInfo {
  platform: string;
  screenSize: string;
  memoryUsage?: number;
  batteryLevel?: number;
  isStandalone: boolean;
  supportsWebGL: boolean;
  supportsGeolocation: boolean;
}

interface AppState {
  isOffline: boolean;
  cachedModels: number;
  cachedCharacters: number;
  arAssetsReady: boolean;
  currentCharacter?: string;
  gpsAccuracy?: number;
}

interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
}

type ErrorCategory =
  | 'javascript'
  | 'network'
  | 'permission'
  | 'webgl'
  | 'geolocation'
  | 'storage'
  | 'ar'
  | 'model-loading'
  | 'unknown';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

class ErrorReportingService {
  private sessionId: string;
  private buildVersion: string;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 50;
  private retryAttempts = 3;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.buildVersion = this.getBuildVersion();
    this.initializeGlobalErrorHandlers();
  }

  /**
   * Initialize global error handlers
   */
  private initializeGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        category: 'javascript',
        severity: 'high'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        category: 'javascript',
        severity: 'medium'
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.reportError({
          message: `Resource loading failed: ${target.tagName}`,
          stack: `Source: ${(target as any).src || (target as any).href}`,
          category: 'network',
          severity: 'medium'
        });
      }
    }, true);
  }

  /**
   * Report an error
   */
  reportError(errorData: Partial<ErrorReport> & { message: string }): string {
    const errorId = this.generateErrorId();

    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: Date.now(),
      message: errorData.message,
      stack: errorData.stack,
      componentStack: errorData.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      buildVersion: this.buildVersion,
      category: errorData.category || this.categorizeError(errorData.message),
      severity: errorData.severity || this.determineSeverity(errorData.message),
      context: this.gatherContext(),
      recovered: false,
      retryCount: 0
    };

    // Add to queue
    this.addToQueue(errorReport);

    // Log error
    logger.error(`[${errorReport.category}] ${errorReport.message}`, errorReport);

    // Store in localStorage for offline reporting
    this.storeErrorLocally(errorReport);

    // Attempt to send error report
    this.sendErrorReport(errorReport);

    return errorId;
  }

  /**
   * Report error recovery
   */
  reportRecovery(errorId: string, recoveryMethod: string): void {
    const errorIndex = this.errorQueue.findIndex(e => e.id === errorId);
    if (errorIndex !== -1) {
      this.errorQueue[errorIndex].recovered = true;
      logger.info(`Error ${errorId} recovered using: ${recoveryMethod}`);
    }
  }

  /**
   * Report retry attempt
   */
  reportRetry(errorId: string): void {
    const errorIndex = this.errorQueue.findIndex(e => e.id === errorId);
    if (errorIndex !== -1) {
      this.errorQueue[errorIndex].retryCount++;
    }
  }

  /**
   * Categorize error based on message
   */
  private categorizeError(message: string): ErrorCategory {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('cors')) {
      return 'network';
    }
    if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
      return 'permission';
    }
    if (lowerMessage.includes('webgl') || lowerMessage.includes('three') || lowerMessage.includes('shader')) {
      return 'webgl';
    }
    if (lowerMessage.includes('geolocation') || lowerMessage.includes('gps')) {
      return 'geolocation';
    }
    if (lowerMessage.includes('storage') || lowerMessage.includes('indexeddb') || lowerMessage.includes('quota')) {
      return 'storage';
    }
    if (lowerMessage.includes('ar') || lowerMessage.includes('model-viewer') || lowerMessage.includes('webxr')) {
      return 'ar';
    }
    if (lowerMessage.includes('model') || lowerMessage.includes('.glb')) {
      return 'model-loading';
    }

    return 'unknown';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(message: string): ErrorSeverity {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal') || lowerMessage.includes('crash')) {
      return 'critical';
    }
    if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('exception')) {
      return 'high';
    }
    if (lowerMessage.includes('warning') || lowerMessage.includes('deprecated')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Gather error context
   */
  private gatherContext(): ErrorContext {
    return {
      route: window.location.pathname,
      deviceInfo: this.getDeviceInfo(),
      appState: this.getAppState(),
      networkStatus: this.getNetworkStatus()
    };
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const deviceInfo: DeviceInfo = {
      platform: navigator.platform,
      screenSize: `${screen.width}x${screen.height}`,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      supportsWebGL: this.checkWebGLSupport(),
      supportsGeolocation: 'geolocation' in navigator
    };

    // Add memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      deviceInfo.memoryUsage = memory.usedJSHeapSize;
    }

    // Add battery level if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        deviceInfo.batteryLevel = battery.level;
      }).catch(() => { });
    }

    return deviceInfo;
  }

  /**
   * Get app state
   */
  private getAppState(): AppState {
    // This would integrate with your app's state management
    return {
      isOffline: !navigator.onLine,
      cachedModels: 0, // Would get from offlineStorage
      cachedCharacters: 0, // Would get from offlineStorage
      arAssetsReady: false, // Would check AR assets
    };
  }

  /**
   * Get network status
   */
  private getNetworkStatus(): NetworkStatus {
    const networkStatus: NetworkStatus = {
      isOnline: navigator.onLine
    };

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      networkStatus.connectionType = connection.type;
      networkStatus.effectiveType = connection.effectiveType;
      networkStatus.downlink = connection.downlink;
    }

    return networkStatus;
  }

  /**
   * Check WebGL support
   */
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  /**
   * Add error to queue
   */
  private addToQueue(error: ErrorReport): void {
    this.errorQueue.push(error);

    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * Store error locally for offline reporting
   */
  private storeErrorLocally(error: ErrorReport): void {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('technosutra-error-reports') || '[]');
      storedErrors.push(error);

      // Keep only last 20 errors
      const recentErrors = storedErrors.slice(-20);
      localStorage.setItem('technosutra-error-reports', JSON.stringify(recentErrors));
    } catch (_e) {
      console.warn('Failed to store error locally:', _e);
    }
  }

  /**
   * Send error report (would integrate with error reporting service)
   */
  private async sendErrorReport(error: ErrorReport): Promise<void> {
    // In a real implementation, this would send to an error reporting service
    // like Sentry, LogRocket, or a custom endpoint

    try {
      // Simulate API call
      if (navigator.onLine) {
        console.log('📊 Error report sent:', error.id);
        // await fetch('/api/errors', { method: 'POST', body: JSON.stringify(error) });
      }
    } catch (e) {
      console.warn('Failed to send error report:', e);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoveryRate: number;
  } {
    const stats = {
      totalErrors: this.errorQueue.length,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      recoveryRate: 0
    };

    this.errorQueue.forEach(error => {
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });

    const recoveredErrors = this.errorQueue.filter(e => e.recovered).length;
    stats.recoveryRate = this.errorQueue.length > 0 ? recoveredErrors / this.errorQueue.length : 0;

    return stats;
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
    localStorage.removeItem('technosutra-error-reports');
  }

  /**
   * Helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBuildVersion(): string {
    return (window as any).__APP_VERSION__ || 'unknown';
  }
}

export const errorReportingService = new ErrorReportingService();
export default errorReportingService;
