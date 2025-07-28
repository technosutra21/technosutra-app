// Security Service for TECHNO SUTRA
// Comprehensive security features and data protection

import { logger } from '@/lib/logger';
import { notificationManager } from '@/components/EnhancedNotificationSystem';

interface SecurityConfig {
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableDataEncryption: boolean;
  enableLocationPrivacy: boolean;
  enableSecureStorage: boolean;
  enableIntegrityChecks: boolean;
  enableSecurityHeaders: boolean;
  enableInputSanitization: boolean;
  enableSessionSecurity: boolean;
  enableThreatDetection: boolean;
  enableSecurityMonitoring: boolean;
  maxLocationAccuracy: number;
  dataRetentionDays: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  sessionId: string;
}



class SecurityService {
  private config: SecurityConfig;
  private encryptionKey: CryptoKey | null = null;
  private sessionId: string;
  private locationHistory: LocationData[] = [];
  private maxLocationHistory = 100;

  constructor() {
    this.config = this.getDefaultConfig();
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize security service
   */
  private async initialize(): Promise<void> {
    try {
      await this.initializeEncryption();
      this.setupContentSecurityPolicy();
      this.setupXSSProtection();
      this.setupSecureHeaders();
      this.cleanupOldData();

      // Initialize enhanced security features
      this.initializeEnhancedSecurity();

      logger.info('🔒 Security service initialized with enhanced features');
    } catch (error) {
      logger.error('Failed to initialize security service:', error);
    }
  }

  /**
   * Get default security configuration
   */
  private getDefaultConfig(): SecurityConfig {
    return {
      enableCSP: true,
      enableXSSProtection: true,
      enableDataEncryption: true,
      enableLocationPrivacy: true,
      enableSecureStorage: true,
      enableIntegrityChecks: true,
      enableSecurityHeaders: true,
      enableInputSanitization: true,
      enableSessionSecurity: true,
      enableThreatDetection: true,
      enableSecurityMonitoring: true,
      maxLocationAccuracy: 50, // meters
      dataRetentionDays: 30,
    };
  }

  /**
   * Initialize encryption for sensitive data
   */
  private async initializeEncryption(): Promise<void> {
    if (!this.config.enableDataEncryption || !window.crypto?.subtle) {
      return;
    }

    try {
      // Generate or retrieve encryption key
      const keyData = localStorage.getItem('technosutra-key');

      if (keyData) {
        // Import existing key
        const keyBuffer = this.base64ToArrayBuffer(keyData);
        this.encryptionKey = await window.crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        // Export and store key
        const keyBuffer = await window.crypto.subtle.exportKey('raw', this.encryptionKey);
        localStorage.setItem('technosutra-key', this.arrayBufferToBase64(keyBuffer));
      }
    } catch (error) {
      logger.warn('Failed to initialize encryption:', error);
      this.config.enableDataEncryption = false;
    }
  }

  /**
   * Setup Content Security Policy
   */
  private setupContentSecurityPolicy(): void {
    if (!this.config.enableCSP) return;

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' blob: https://ajax.googleapis.com https://unpkg.com https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.maptiler.com https://api.openrouteservice.org",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    // Add CSP meta tag if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = csp;
      document.head.appendChild(meta);
    }
  }

  /**
   * Setup XSS protection
   */
  private setupXSSProtection(): void {
    if (!this.config.enableXSSProtection) return;

    // Sanitize user inputs
    this.setupInputSanitization();

    // Add XSS protection headers via meta tags
    const xssProtection = document.createElement('meta');
    xssProtection.httpEquiv = 'X-XSS-Protection';
    xssProtection.content = '1; mode=block';
    document.head.appendChild(xssProtection);
  }

  /**
   * Setup secure headers
   */
  private setupSecureHeaders(): void {
    // X-Content-Type-Options
    const noSniff = document.createElement('meta');
    noSniff.httpEquiv = 'X-Content-Type-Options';
    noSniff.content = 'nosniff';
    document.head.appendChild(noSniff);

    // Referrer Policy
    const referrer = document.createElement('meta');
    referrer.name = 'referrer';
    referrer.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrer);
  }



  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string): Promise<string | null> {
    if (!this.config.enableDataEncryption || !this.encryptionKey) {
      return data; // Return unencrypted if encryption is disabled
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return this.arrayBufferToBase64(combined);
    } catch (error) {
      logger.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string): Promise<string | null> {
    if (!this.config.enableDataEncryption || !this.encryptionKey) {
      return encryptedData; // Return as-is if encryption is disabled
    }

    try {
      const combined = this.base64ToArrayBuffer(encryptedData);
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      logger.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Securely store location data with privacy protection
   */
  storeLocationData(latitude: number, longitude: number, accuracy: number): void {
    if (!this.config.enableLocationPrivacy) return;

    // Apply location privacy protection
    const protectedLocation = this.protectLocationPrivacy(latitude, longitude, accuracy);

    const locationData: LocationData = {
      ...protectedLocation,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.locationHistory.push(locationData);

    // Limit history size
    if (this.locationHistory.length > this.maxLocationHistory) {
      this.locationHistory = this.locationHistory.slice(-this.maxLocationHistory);
    }

    // Store encrypted location data
    this.storeSecureData('location-history', this.locationHistory);
  }

  /**
   * Protect location privacy by reducing accuracy
   */
  private protectLocationPrivacy(
    latitude: number,
    longitude: number,
    accuracy: number
  ): { latitude: number; longitude: number; accuracy: number } {
    // Reduce accuracy if it's too precise
    const maxAccuracy = this.config.maxLocationAccuracy;

    if (accuracy < maxAccuracy) {
      // Add controlled noise to coordinates
      const noise = maxAccuracy / 111000; // Convert meters to degrees (approximate)
      const randomOffset = () => (Math.random() - 0.5) * noise;

      return {
        latitude: latitude + randomOffset(),
        longitude: longitude + randomOffset(),
        accuracy: maxAccuracy,
      };
    }

    return { latitude, longitude, accuracy };
  }

  /**
   * Store data securely
   */
  async storeSecureData(key: string, data: unknown): Promise<void> {
    if (!this.config.enableSecureStorage) {
      localStorage.setItem(`technosutra-${key}`, JSON.stringify(data));
      return;
    }

    try {
      const serialized = JSON.stringify(data);
      const encrypted = await this.encryptData(serialized);

      if (encrypted) {
        localStorage.setItem(`technosutra-${key}`, encrypted);
      }
    } catch (error) {
      logger.error('Failed to store secure data:', error);
    }
  }

  /**
   * Retrieve data securely
   */
  async retrieveSecureData(key: string): Promise<unknown | null> {
    try {
      const stored = localStorage.getItem(`technosutra-${key}`);
      if (!stored) return null;

      if (!this.config.enableSecureStorage) {
        return JSON.parse(stored);
      }

      const decrypted = await this.decryptData(stored);
      return decrypted ? JSON.parse(decrypted) : null;
    } catch (error) {
      logger.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);

    // Clean location history
    this.locationHistory = this.locationHistory.filter(
      location => location.timestamp > cutoffTime
    );

    // Clean other stored data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('technosutra-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && data.timestamp < cutoffTime) {
            localStorage.removeItem(key);
          }
        } catch {
          // Ignore parsing errors
        }
      }
    });
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate API responses for security
   */
  validateAPIResponse(response: unknown, expectedFields: string[]): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Check for required fields
    for (const field of expectedFields) {
      if (!(field in response)) {
        logger.warn(`Missing required field in API response: ${field}`);
        return false;
      }
    }

    // Check for suspicious content
    const serialized = JSON.stringify(response);
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(serialized)) {
        logger.warn('Suspicious content detected in API response');
        return false;
      }
    }

    return true;
  }

  /**
   * Get security status
   */
  getSecurityStatus(): {
    encryptionEnabled: boolean;
    locationPrivacyEnabled: boolean;
    secureStorageEnabled: boolean;
    sessionId: string;
    dataRetentionDays: number;
  } {
    return {
      encryptionEnabled: this.config.enableDataEncryption && !!this.encryptionKey,
      locationPrivacyEnabled: this.config.enableLocationPrivacy,
      secureStorageEnabled: this.config.enableSecureStorage,
      sessionId: this.sessionId,
      dataRetentionDays: this.config.dataRetentionDays,
    };
  }

  /**
   * Clear all user data securely
   */
  clearUserData(): void {
    // Clear location history
    this.locationHistory = [];

    // Clear localStorage data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('technosutra-')) {
        localStorage.removeItem(key);
      }
    });

    // Generate new session ID
    this.sessionId = this.generateSessionId();

    logger.info('User data cleared securely');
  }

  /**
   * Utility methods for encryption
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Enhanced Security Features
   */

  // Integrity Checks
  setupIntegrityChecks(): void {
    if (!this.config.enableIntegrityChecks) return;

    // Check for script tampering
    this.monitorScriptIntegrity();

    // Verify critical resources
    this.verifyCriticalResources();

    logger.info('🔒 Integrity checks enabled');
  }

  private monitorScriptIntegrity(): void {
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const originalSrc = script.getAttribute('src');
      if (originalSrc) {
        // Monitor for changes to script sources
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
              const newSrc = (mutation.target as HTMLScriptElement).src;
              if (newSrc !== originalSrc) {
                this.handleSecurityThreat('Script source modified', { originalSrc, newSrc });
              }
            }
          });
        });

        observer.observe(script, { attributes: true });
      }
    });
  }

  private verifyCriticalResources(): void {
    const criticalResources = [
      '/characters.csv',
      '/chapters.csv',
      '/waypoint-coordinates.json'
    ];

    criticalResources.forEach(async (resource) => {
      try {
        const response = await fetch(resource);
        if (!response.ok) {
          this.handleSecurityThreat('Critical resource unavailable', { resource });
        }
      } catch (error) {
        this.handleSecurityThreat('Critical resource error', { resource, error });
      }
    });
  }

  // Security Headers
  setupSecurityHeaders(): void {
    if (!this.config.enableSecurityHeaders) return;

    // Set security headers via meta tags (for client-side)
    this.setSecurityMetaTags();

    logger.info('🛡️ Security headers configured');
  }

  private setSecurityMetaTags(): void {
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { name: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=()' }
    ];

    securityHeaders.forEach(header => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header.name;
      meta.content = header.content;
      document.head.appendChild(meta);
    });
  }

  // Input Sanitization
  setupInputSanitization(): void {
    if (!this.config.enableInputSanitization) return;

    // Monitor all input fields
    this.monitorInputFields();

    logger.info('🧹 Input sanitization enabled');
  }

  private monitorInputFields(): void {
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const sanitizedValue = this.sanitizeInput(target.value);
        if (sanitizedValue !== target.value) {
          target.value = sanitizedValue;
          this.handleSecurityThreat('Malicious input detected and sanitized', {
            field: target.name || target.id,
            originalValue: target.value,
            sanitizedValue
          });
        }
      }
    });
  }

  sanitizeInput(input: string): string {
    // Remove potentially dangerous characters and patterns
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>'"]/g, (match) => { // Escape HTML characters
        const escapeMap: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return escapeMap[match];
      });
  }

  // Session Security
  setupSessionSecurity(): void {
    if (!this.config.enableSessionSecurity) return;

    // Monitor session activity
    this.monitorSessionActivity();

    // Set up session timeout
    this.setupSessionTimeout();

    logger.info('⏱️ Session security enabled');
  }

  private monitorSessionActivity(): void {
    let lastActivity = Date.now();
    const maxInactivity = 30 * 60 * 1000; // 30 minutes

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Track user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check for inactivity
    setInterval(() => {
      if (Date.now() - lastActivity > maxInactivity) {
        this.handleSessionTimeout();
      }
    }, 60000); // Check every minute
  }

  private setupSessionTimeout(): void {
    // Clear sensitive data on page unload
    window.addEventListener('beforeunload', () => {
      this.clearSensitiveData();
    });
  }

  private handleSessionTimeout(): void {
    this.clearSensitiveData();
    notificationManager.warning(
      'Session Timeout',
      'Your session has expired due to inactivity. Please refresh the page.',
      { persistent: true }
    );
  }

  private clearSensitiveData(): void {
    // Clear localStorage items that might contain sensitive data
    const sensitiveKeys = ['userLocation', 'visitedCharacters', 'userProgress'];
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Threat Detection
  setupThreatDetection(): void {
    if (!this.config.enableThreatDetection) return;

    // Monitor for suspicious activities
    this.monitorSuspiciousActivity();

    // Set up anomaly detection
    this.setupAnomalyDetection();

    logger.info('🕵️ Threat detection enabled');
  }

  private monitorSuspiciousActivity(): void {
    let rapidRequests = 0;
    const requestWindow = 10000; // 10 seconds

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      rapidRequests++;

      // Reset counter after window
      setTimeout(() => {
        rapidRequests = Math.max(0, rapidRequests - 1);
      }, requestWindow);

      // Check for too many requests
      if (rapidRequests > 50) { // More than 50 requests in 10 seconds
        this.handleSecurityThreat('Suspicious request pattern detected', {
          requestCount: rapidRequests,
          timeWindow: requestWindow
        });
      }

      return originalFetch(...args);
    };
  }

  private setupAnomalyDetection(): void {
    // Monitor for unusual patterns
    let clickCount = 0;
    let keyCount = 0;

    document.addEventListener('click', () => {
      clickCount++;
      if (clickCount > 100) { // More than 100 clicks per minute
        this.handleSecurityThreat('Unusual click pattern detected', { clickCount });
        clickCount = 0;
      }
    });

    document.addEventListener('keydown', () => {
      keyCount++;
      if (keyCount > 500) { // More than 500 keystrokes per minute
        this.handleSecurityThreat('Unusual keyboard activity detected', { keyCount });
        keyCount = 0;
      }
    });

    // Reset counters every minute
    setInterval(() => {
      clickCount = 0;
      keyCount = 0;
    }, 60000);
  }

  // Security Monitoring
  setupSecurityMonitoring(): void {
    if (!this.config.enableSecurityMonitoring) return;

    // Monitor console access
    this.monitorConsoleAccess();

    // Monitor developer tools
    this.monitorDevTools();

    logger.info('📊 Security monitoring enabled');
  }

  private monitorConsoleAccess(): void {
    // Detect console access attempts
    const devtools = { open: false, orientation: null };

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200 ||
          window.outerWidth - window.innerWidth > 200) {
        if (!devtools.open) {
          devtools.open = true;
          this.handleSecurityThreat('Developer tools opened', { timestamp: Date.now() });
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  private monitorDevTools(): void {
    // Detect debugging attempts using performance timing
    const start = performance.now();

    // Use a more subtle detection method
    let isDebugging = false;
    try {
      // This will be slower if debugger is open
      const testFunction = new Function('return false;');
      testFunction();
    } catch {
      isDebugging = true;
    }

    const end = performance.now();

    if (end - start > 100 || isDebugging) {
      this.handleSecurityThreat('Debugger detected', {
        delay: end - start,
        timestamp: Date.now()
      });
    }
  }

  private handleSecurityThreat(threat: string, details: any): void {
    logger.warn(`🚨 Security threat detected: ${threat}`, details);

    // Notify user of security issue
    notificationManager.warning(
      'Security Alert',
      `Potential security issue detected: ${threat}`,
      {
        duration: 10000,
        actions: [{
          label: 'Dismiss',
          action: () => {}
        }]
      }
    );

    // Could also send to security monitoring service
    this.reportSecurityIncident(threat, details);
  }

  private reportSecurityIncident(threat: string, details: any): void {
    // In a real application, this would send to a security monitoring service
    const incident = {
      threat,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    logger.info('📋 Security incident logged:', incident);
  }

  /**
   * Initialize all enhanced security features
   */
  initializeEnhancedSecurity(): void {
    this.setupIntegrityChecks();
    this.setupSecurityHeaders();
    this.setupInputSanitization();
    this.setupSessionSecurity();
    this.setupThreatDetection();
    this.setupSecurityMonitoring();

    logger.info('🔐 Enhanced security features initialized');
  }
}

export const securityService = new SecurityService();
export default securityService;
