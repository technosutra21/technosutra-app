// Debug utilities for TECHNO SUTRA
// Helps identify and resolve runtime errors

import { logger } from '@/lib/logger';

/**
 * Debug information about the environment
 */
export const getDebugInfo = () => {
  const info = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    location: {
      href: window.location.href,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    },
    environment: {
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    },
    browser: {
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      language: navigator.language,
    },
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  return info;
};

/**
 * Log comprehensive debug information
 */
export const logDebugInfo = () => {
  try {
    const debugInfo = getDebugInfo();
    logger.info('🔍 Debug Information:', debugInfo);
    return debugInfo;
  } catch (error) {
    logger.error('Failed to get debug info:', error);
    return null;
  }
};

/**
 * Safe error logging with context
 */
export const logErrorWithContext = (error: Error, context: string = 'Unknown') => {
  try {
    const debugInfo = getDebugInfo();
    
    logger.error(`❌ Error in ${context}:`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      debugInfo
    });
    
    // Store in localStorage for debugging
    const errorLog = {
      timestamp: Date.now(),
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      debugInfo
    };
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('technosutra-error-logs') || '[]');
      existingLogs.push(errorLog);
      
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      
      localStorage.setItem('technosutra-error-logs', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }
    
  } catch (debugError) {
    console.error('Failed to log error with context:', debugError);
  }
};

/**
 * Get stored error logs for debugging
 */
export const getStoredErrorLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('technosutra-error-logs') || '[]');
  } catch (error) {
    logger.warn('Failed to get stored error logs:', error);
    return [];
  }
};

/**
 * Clear stored error logs
 */
export const clearStoredErrorLogs = () => {
  try {
    localStorage.removeItem('technosutra-error-logs');
    logger.info('Cleared stored error logs');
  } catch (error) {
    logger.warn('Failed to clear error logs:', error);
  }
};

/**
 * Initialize debug utilities
 */
export const initializeDebugUtils = () => {
  try {
    // Log initial debug info
    logDebugInfo();
    
    // Set up global error handler
    window.addEventListener('error', (event) => {
      logErrorWithContext(event.error || new Error(event.message), 'Global Error Handler');
    });
    
    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      logErrorWithContext(error, 'Unhandled Promise Rejection');
    });
    
    logger.info('🔧 Debug utilities initialized');
  } catch (error) {
    console.error('Failed to initialize debug utilities:', error);
  }
};
