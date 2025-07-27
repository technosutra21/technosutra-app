/**
 * Logger utility that respects environment settings
 * Prevents console.log pollution in production
 */
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  }
};

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