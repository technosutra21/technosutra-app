/**
 * Enhanced logger utility for TECHNO SUTRA
 * Comprehensive logging with storage and filtering
 */
interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  context?: {
    component?: string;
    userId?: string;
    sessionId?: string;
    url?: string;
  };
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = true;
  private logLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'info';

  constructor() {
    this.setupGlobalErrorHandler();
  }

  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      this.error('Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection:', {
        reason: event.reason
      });
    });
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isEnabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private writeLog(level: LogLevel, message: string, data?: any, context?: LogEntry['context']): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
      context: {
        url: window.location.href,
        ...context
      }
    };

    this.logs.push(entry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with styling
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${level.toUpperCase()}] ${timestamp}`;

    switch (level) {
      case 'debug':
        console.debug(`%c${prefix}%c ${message}`, 'color: #64748b', 'color: inherit', data);
        break;
      case 'info':
        console.info(`%c${prefix}%c ${message}`, 'color: #06b6d4', 'color: inherit', data);
        break;
      case 'warn':
        console.warn(`%c${prefix}%c ${message}`, 'color: #f59e0b', 'color: inherit', data);
        break;
      case 'error':
      case 'fatal':
        console.error(`%c${prefix}%c ${message}`, 'color: #ef4444', 'color: inherit', data);
        break;
    }

    // Store critical logs
    if (level === 'error' || level === 'fatal') {
      this.storeCriticalLog(entry);
    }
  }

  private storeCriticalLog(entry: LogEntry): void {
    try {
      const criticalLogs = JSON.parse(localStorage.getItem('technosutra-critical-logs') || '[]');
      criticalLogs.push(entry);
      localStorage.setItem('technosutra-critical-logs', JSON.stringify(criticalLogs.slice(-50)));
    } catch (error) {
      console.error('Failed to store critical log:', error);
    }
  }

  debug(message: string, data?: any, context?: LogEntry['context']): void {
    this.writeLog('debug', message, data, context);
  }

  info(message: string, data?: any, context?: LogEntry['context']): void {
    this.writeLog('info', message, data, context);
  }

  warn(message: string, data?: any, context?: LogEntry['context']): void {
    this.writeLog('warn', message, data, context);
  }

  error(message: string, data?: any, context?: LogEntry['context']): void {
    this.writeLog('error', message, data, context);
  }

  fatal(message: string, data?: any, context?: LogEntry['context']): void {
    this.writeLog('fatal', message, data, context);
  }

  // Legacy methods for backward compatibility
  legacyLog(...args: any[]): void {
    this.info(args[0], args.slice(1));
  }

  // Public log method for backward compatibility
  log(...args: any[]): void {
    this.info(args[0], args.slice(1));
  }

  // Component-specific logging
  component(componentName: string) {
    return {
      debug: (message: string, data?: any) => this.debug(message, data, { component: componentName }),
      info: (message: string, data?: any) => this.info(message, data, { component: componentName }),
      warn: (message: string, data?: any) => this.warn(message, data, { component: componentName }),
      error: (message: string, data?: any) => this.error(message, data, { component: componentName }),
      fatal: (message: string, data?: any) => this.fatal(message, data, { component: componentName }),
      log: (...args: any[]) => this.log(...args),
    };
  }

  // Get logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('technosutra-critical-logs');
  }

  // Set log level
  setLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level set to: ${level}`);
  }

  // Enable/disable logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.info('Logging enabled');
    }
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

/**
 * Security utility functions
 */
export const security = {
  /**
   * Validates external URLs against allowed domains
   */
  validateExternalUrl: (url: string): boolean => {
    const allowedDomains = [
      'cdn.statically.io',
      'drive.google.com',
      'technosutra21.github.io',
      'api.maptiler.com',
      'unpkg.com'
    ];

    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain =>
        urlObj.hostname.includes(domain) ||
        urlObj.hostname.endsWith(domain)
      );
    } catch {
      return false;
    }
  },

  /**
   * Sanitizes CSV data to prevent XSS
   */
  sanitizeCSVData: (data: any): any => {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        // Remove potentially dangerous content
        sanitized[key] = sanitized[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      }
    });

    return sanitized;
  }
};

/**
 * Accessibility helper functions
 */
export const a11y = {
  /**
   * Generates comprehensive ARIA labels for characters
   */
  getCharacterAriaLabel: (character: any): string => {
    const parts = [];

    if (character.nome) parts.push(character.nome);
    if (character.capitulo) parts.push(`Capítulo ${character.capitulo}`);
    if (character.ocupacao) parts.push(character.ocupacao);
    if (character.local) parts.push(`Local: ${character.local}`);
    if (character.significado) parts.push(`Significado: ${character.significado}`);

    return parts.join(', ');
  },

  /**
   * Manages focus for improved navigation
   */
  manageFocus: (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  },

  /**
   * Announces dynamic content changes to screen readers
   */
  announceToScreenReader: (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
};