// Analytics Service for TECHNO SUTRA
// Privacy-compliant user behavior and performance analytics

import { logger } from '@/lib/logger';

interface AnalyticsEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  event: string;
  category: 'user_action' | 'performance' | 'error' | 'feature_usage' | 'navigation';
  properties: Record<string, any>;
  context: {
    page: string;
    userAgent: string;
    viewport: { width: number; height: number };
    isOnline: boolean;
    isStandalone: boolean;
  };
}

interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  interactions: number;
  charactersDiscovered: number;
  routesCreated: number;
  arViewsUsed: number;
  errors: number;
  deviceInfo: {
    platform: string;
    isMobile: boolean;
    supportsWebGL: boolean;
    supportsGeolocation: boolean;
  };
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  networkSpeed?: string;
  cacheHitRate: number;
}

interface FeatureUsage {
  feature: string;
  usageCount: number;
  lastUsed: number;
  averageSessionTime: number;
  userSatisfaction?: number;
}

interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  active: boolean;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  startDate: number;
  endDate?: number;
  active: boolean;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private currentSession: UserSession | null = null;
  private sessionId: string;
  private userId?: string;
  private isEnabled = true;
  private maxEvents = 1000;
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private abTests: ABTest[] = [];
  private userVariants: Map<string, string> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize analytics service
   */
  private initialize(): void {
    // Check user consent for analytics
    this.checkUserConsent();
    
    if (!this.isEnabled) {
      logger.info('📊 Analytics disabled by user preference');
      return;
    }

    this.startSession();
    this.setupEventListeners();
    this.setupPerformanceTracking();
    this.loadABTests();
    this.startFlushTimer();

    logger.info('📊 Analytics service initialized');
  }

  /**
   * Check user consent for analytics
   */
  private checkUserConsent(): void {
    const consent = localStorage.getItem('technosutra-analytics-consent');
    this.isEnabled = consent === 'true';
    
    // If no consent recorded, assume consent for essential analytics
    if (consent === null) {
      this.isEnabled = true;
      localStorage.setItem('technosutra-analytics-consent', 'true');
    }
  }

  /**
   * Start user session
   */
  private startSession(): void {
    this.currentSession = {
      id: this.sessionId,
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      charactersDiscovered: 0,
      routesCreated: 0,
      arViewsUsed: 0,
      errors: 0,
      deviceInfo: {
        platform: navigator.platform,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        supportsWebGL: this.checkWebGLSupport(),
        supportsGeolocation: 'geolocation' in navigator,
      },
    };

    this.trackEvent('session_start', 'user_action', {
      isNewUser: !localStorage.getItem('technosutra-user-id'),
      deviceInfo: this.currentSession.deviceInfo,
    });
  }

  /**
   * Setup event listeners for automatic tracking
   */
  private setupEventListeners(): void {
    // Page navigation
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });

    // User interactions
    document.addEventListener('click', (event) => {
      this.trackInteraction('click', event.target as HTMLElement);
    });

    // Session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', 'user_action');
      } else {
        this.trackEvent('page_visible', 'user_action');
      }
    });

    // Online/offline status
    window.addEventListener('online', () => {
      this.trackEvent('connection_restored', 'user_action');
    });

    window.addEventListener('offline', () => {
      this.trackEvent('connection_lost', 'user_action');
    });
  }

  /**
   * Setup performance tracking
   */
  private setupPerformanceTracking(): void {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackEvent('page_performance', 'performance', {
            loadTime: navigation.loadEventEnd - navigation.navigationStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            firstByte: navigation.responseStart - navigation.navigationStart,
          });
        }
      }, 0);
    });

    // Track resource loading
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            
            // Track slow resources
            if (resource.duration > 1000) {
              this.trackEvent('slow_resource', 'performance', {
                name: resource.name,
                duration: resource.duration,
                size: resource.transferSize,
                type: this.getResourceType(resource.name),
              });
            }
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        logger.warn('Performance observer not supported:', error);
      }
    }
  }

  /**
   * Track custom event
   */
  trackEvent(
    event: string, 
    category: AnalyticsEvent['category'], 
    properties: Record<string, any> = {}
  ): void {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      event,
      category,
      properties,
      context: {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        isOnline: navigator.onLine,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      },
    };

    this.events.push(analyticsEvent);

    // Update session stats
    if (this.currentSession) {
      switch (category) {
        case 'user_action':
          this.currentSession.interactions++;
          break;
        case 'error':
          this.currentSession.errors++;
          break;
      }
    }

    // Limit events in memory
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    logger.debug(`📊 Event tracked: ${event}`, properties);
  }

  /**
   * Track page view
   */
  trackPageView(path: string): void {
    if (this.currentSession) {
      this.currentSession.pageViews++;
    }

    this.trackEvent('page_view', 'navigation', {
      path,
      referrer: document.referrer,
    });
  }

  /**
   * Track user interaction
   */
  private trackInteraction(type: string, element: HTMLElement): void {
    const elementInfo = {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      text: element.textContent?.slice(0, 50),
    };

    this.trackEvent(`interaction_${type}`, 'user_action', elementInfo);

    // Track specific feature usage
    if (element.className.includes('character-marker')) {
      this.trackFeatureUsage('character_discovery');
      if (this.currentSession) {
        this.currentSession.charactersDiscovered++;
      }
    } else if (element.className.includes('ar-button')) {
      this.trackFeatureUsage('ar_mode');
      if (this.currentSession) {
        this.currentSession.arViewsUsed++;
      }
    } else if (element.className.includes('route-creator')) {
      this.trackFeatureUsage('route_creation');
      if (this.currentSession) {
        this.currentSession.routesCreated++;
      }
    }
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, properties: Record<string, any> = {}): void {
    this.trackEvent('feature_used', 'feature_usage', {
      feature,
      ...properties,
    });

    // Update feature usage stats
    const usageKey = `technosutra-feature-${feature}`;
    const usage = JSON.parse(localStorage.getItem(usageKey) || '{"count": 0, "lastUsed": 0}');
    usage.count++;
    usage.lastUsed = Date.now();
    localStorage.setItem(usageKey, JSON.stringify(usage));
  }

  /**
   * Track error
   */
  trackError(error: Error, context: Record<string, any> = {}): void {
    this.trackEvent('error_occurred', 'error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent('performance_metric', 'performance', {
      metric,
      value,
      unit,
    });
  }

  /**
   * Load A/B tests configuration
   */
  private loadABTests(): void {
    // In a real implementation, this would load from a remote config
    this.abTests = [
      {
        id: 'onboarding_flow',
        name: 'Onboarding Flow Test',
        description: 'Test different onboarding flows',
        variants: [
          { id: 'control', name: 'Original Flow', weight: 50, active: true },
          { id: 'simplified', name: 'Simplified Flow', weight: 50, active: true },
        ],
        startDate: Date.now(),
        active: true,
      },
      {
        id: 'character_display',
        name: 'Character Display Test',
        description: 'Test different character display styles',
        variants: [
          { id: 'grid', name: 'Grid Layout', weight: 33, active: true },
          { id: 'list', name: 'List Layout', weight: 33, active: true },
          { id: 'card', name: 'Card Layout', weight: 34, active: true },
        ],
        startDate: Date.now(),
        active: true,
      },
    ];
  }

  /**
   * Get A/B test variant for user
   */
  getABTestVariant(testId: string): string | null {
    const test = this.abTests.find(t => t.id === testId && t.active);
    if (!test) return null;

    // Check if user already has a variant
    const existingVariant = this.userVariants.get(testId);
    if (existingVariant) return existingVariant;

    // Assign variant based on user ID hash
    const userId = this.getUserId();
    const hash = this.hashString(userId + testId);
    const random = (hash % 100) + 1;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      if (!variant.active) continue;
      
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        this.userVariants.set(testId, variant.id);
        
        // Track variant assignment
        this.trackEvent('ab_test_assigned', 'user_action', {
          testId,
          variant: variant.id,
        });
        
        return variant.id;
      }
    }

    return null;
  }

  /**
   * Track A/B test conversion
   */
  trackABTestConversion(testId: string, conversionType: string): void {
    const variant = this.getABTestVariant(testId);
    if (variant) {
      this.trackEvent('ab_test_conversion', 'user_action', {
        testId,
        variant,
        conversionType,
      });
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    session: UserSession | null;
    eventCount: number;
    topEvents: Array<{ event: string; count: number }>;
    featureUsage: FeatureUsage[];
    abTests: ABTest[];
  } {
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    const featureUsage = this.getFeatureUsageStats();

    return {
      session: this.currentSession,
      eventCount: this.events.length,
      topEvents,
      featureUsage,
      abTests: this.abTests,
    };
  }

  /**
   * Get feature usage statistics
   */
  private getFeatureUsageStats(): FeatureUsage[] {
    const features = ['character_discovery', 'ar_mode', 'route_creation', 'map_interaction'];
    
    return features.map(feature => {
      const usageKey = `technosutra-feature-${feature}`;
      const usage = JSON.parse(localStorage.getItem(usageKey) || '{"count": 0, "lastUsed": 0}');
      
      return {
        feature,
        usageCount: usage.count,
        lastUsed: usage.lastUsed,
        averageSessionTime: 0, // Would calculate from events
        userSatisfaction: undefined,
      };
    });
  }

  /**
   * End current session
   */
  private endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

      this.trackEvent('session_end', 'user_action', {
        duration: this.currentSession.duration,
        pageViews: this.currentSession.pageViews,
        interactions: this.currentSession.interactions,
        charactersDiscovered: this.currentSession.charactersDiscovered,
        routesCreated: this.currentSession.routesCreated,
        arViewsUsed: this.currentSession.arViewsUsed,
        errors: this.currentSession.errors,
      });

      // Store session data
      const sessions = JSON.parse(localStorage.getItem('technosutra-sessions') || '[]');
      sessions.push(this.currentSession);
      localStorage.setItem('technosutra-sessions', JSON.stringify(sessions.slice(-50)));
    }

    this.flushEvents();
  }

  /**
   * Flush events to storage/server
   */
  private flushEvents(): void {
    if (this.events.length === 0) return;

    // Store events locally
    const storedEvents = JSON.parse(localStorage.getItem('technosutra-analytics') || '[]');
    storedEvents.push(...this.events);
    localStorage.setItem('technosutra-analytics', JSON.stringify(storedEvents.slice(-1000)));

    // In a real implementation, send to analytics server
    logger.info(`📊 Flushed ${this.events.length} analytics events`);
    
    this.events = [];
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    setInterval(() => {
      if (this.events.length >= this.batchSize) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  /**
   * Utility methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string {
    if (!this.userId) {
      this.userId = localStorage.getItem('technosutra-user-id') || this.generateUserId();
      localStorage.setItem('technosutra-user-id', this.userId);
    }
    return this.userId;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.glb')) return '3d-model';
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    return 'other';
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('technosutra-analytics-consent', enabled.toString());
    
    if (enabled) {
      this.trackEvent('analytics_enabled', 'user_action');
    } else {
      this.trackEvent('analytics_disabled', 'user_action');
      this.events = []; // Clear events
    }
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.events = [];
    this.currentSession = null;
    this.userVariants.clear();
    
    localStorage.removeItem('technosutra-analytics');
    localStorage.removeItem('technosutra-sessions');
    localStorage.removeItem('technosutra-user-id');
    
    // Clear feature usage data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('technosutra-feature-')) {
        localStorage.removeItem(key);
      }
    });

    logger.info('📊 Analytics data cleared');
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
