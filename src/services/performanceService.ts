// Performance Monitoring Service for TECHNO SUTRA
// Tracks Web Vitals, user interactions, and app performance

import { logger } from '@/lib/logger';

interface _PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

interface _UserInteraction {
  type: 'click' | 'scroll' | 'navigation' | 'ar_view' | 'model_load' | 'gps_update';
  element?: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface _AppPerformance {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
  batteryLevel?: number;
  connectionType?: string;
}

class PerformanceService {
  private metrics: _PerformanceMetric[] = [];
  private interactions: _UserInteraction[] = [];
  private performanceObserver?: PerformanceObserver;
  private isMonitoring = false;

  constructor() {
    this.initializeWebVitals();
    this.initializePerformanceObserver();
    this.initializeUserInteractionTracking();
  }

  /**
   * Initialize Web Vitals monitoring (simplified without external dependencies)
   */
  private initializeWebVitals(): void {
    // Use Performance Observer for basic metrics
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              this.recordMetric({
                name: entry.name.toUpperCase().replace('-', ''),
                value: entry.startTime,
                rating: entry.startTime < 1000 ? 'good' : entry.startTime < 2500 ? 'needs-improvement' : 'poor',
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
              });
            }
          }
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } catch (_error) {
        logger.warn('Performance Observer not supported for Web Vitals');
      }
    }
  }

  /**
   * Initialize Performance Observer for detailed metrics
   */
  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      try {
        this.performanceObserver.observe({
          entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint']
        });
      } catch (_error) {
        logger.error('Failed to initialize PerformanceObserver:', _error);
      }
    }
  }

  /**
   * Handle performance entries
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.handleNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.handleResourceEntry(entry as PerformanceResourceTiming);
        break;
      case 'paint':
        this.handlePaintEntry(entry);
        break;
      case 'largest-contentful-paint':
        this.handleLCPEntry(entry);
        break;
    }
  }

  /**
   * Handle navigation timing
   */
  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    const loadTime = entry.loadEventEnd - entry.navigationStart;
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart;
    const firstByte = entry.responseStart - entry.navigationStart;

    logger.info('Navigation Performance:', {
      loadTime,
      domContentLoaded,
      firstByte,
      url: entry.name
    });
  }

  /**
   * Handle resource timing
   */
  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    // Track slow loading resources
    const loadTime = entry.responseEnd - entry.startTime;

    if (loadTime > 1000) { // Resources taking more than 1 second
      logger.warn('Slow resource detected:', {
        name: entry.name,
        loadTime,
        size: entry.transferSize,
        type: this.getResourceType(entry.name)
      });
    }

    // Track 3D model loading specifically
    if (entry.name.includes('.glb')) {
      this.recordInteraction({
        type: 'model_load',
        timestamp: Date.now(),
        duration: loadTime,
        metadata: {
          modelUrl: entry.name,
          size: entry.transferSize,
          cached: entry.transferSize === 0
        }
      });
    }
  }

  /**
   * Handle paint entries
   */
  private handlePaintEntry(entry: PerformanceEntry): void {
    logger.info(`${entry.name}: ${entry.startTime}ms`);
  }

  /**
   * Handle LCP entries
   */
  private handleLCPEntry(entry: PerformanceEntry): void {
    logger.info(`LCP: ${entry.startTime}ms`);
  }

  /**
   * Initialize user interaction tracking
   */
  private initializeUserInteractionTracking(): void {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.recordInteraction({
        type: 'click',
        element: this.getElementSelector(target),
        timestamp: Date.now()
      });
    });

    // Track scroll performance
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.recordInteraction({
          type: 'scroll',
          timestamp: Date.now(),
          metadata: {
            scrollY: window.scrollY,
            scrollHeight: document.documentElement.scrollHeight
          }
        });
      }, 100);
    });

    // Track route changes
    window.addEventListener('popstate', () => {
      this.recordInteraction({
        type: 'navigation',
        timestamp: Date.now(),
        metadata: {
          url: window.location.href
        }
      });
    });
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: _PerformanceMetric): void {
    this.metrics.push(metric);

    // Log poor performance
    if (metric.rating === 'poor') {
      logger.warn(`Poor ${metric.name} performance:`, metric);
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Record user interaction
   */
  private recordInteraction(interaction: _UserInteraction): void {
    this.interactions.push(interaction);

    // Keep only last 200 interactions
    if (this.interactions.length > 200) {
      this.interactions = this.interactions.slice(-200);
    }
  }

  /**
   * Track AR view performance
   */
  trackARView(modelId: string, loadTime: number): void {
    this.recordInteraction({
      type: 'ar_view',
      timestamp: Date.now(),
      duration: loadTime,
      metadata: {
        modelId,
        loadTime
      }
    });

    logger.info(`AR view performance for model ${modelId}: ${loadTime}ms`);
  }

  /**
   * Track GPS update performance
   */
  trackGPSUpdate(accuracy: number, timestamp: number): void {
    this.recordInteraction({
      type: 'gps_update',
      timestamp: Date.now(),
      metadata: {
        accuracy,
        gpsTimestamp: timestamp
      }
    });
  }

  /**
   * Get current app performance
   */
  async getAppPerformance(): Promise<_AppPerformance> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    const performance_data: _AppPerformance = {
      loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
      renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      interactionTime: this.getAverageInteractionTime(),
    };

    // Add memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      performance_data.memoryUsage = memory.usedJSHeapSize;
    }

    // Add battery info if available
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        performance_data.batteryLevel = battery.level;
      } catch (_error) {
        // Battery API not available
      }
    }

    // Add connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      performance_data.connectionType = connection.effectiveType;
    }

    return performance_data;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    metrics: _PerformanceMetric[];
    interactions: _UserInteraction[];
    summary: {
      averageLoadTime: number;
      poorMetricsCount: number;
      totalInteractions: number;
    };
  } {
    const averageLoadTime = this.metrics
      .filter(m => m.name === 'LCP')
      .reduce((sum, m) => sum + m.value, 0) / Math.max(1, this.metrics.filter(m => m.name === 'LCP').length);

    const poorMetricsCount = this.metrics.filter(m => m.rating === 'poor').length;

    return {
      metrics: this.metrics,
      interactions: this.interactions,
      summary: {
        averageLoadTime,
        poorMetricsCount,
        totalInteractions: this.interactions.length
      }
    };
  }

  /**
   * Helper methods
   */
  private getResourceType(url: string): string {
    if (url.includes('.glb')) return '3d-model';
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    return 'other';
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private getAverageInteractionTime(): number {
    const interactionsWithDuration = this.interactions.filter(i => i.duration);
    if (interactionsWithDuration.length === 0) return 0;

    return interactionsWithDuration.reduce((sum, i) => sum + (i.duration || 0), 0) / interactionsWithDuration.length;
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    this.isMonitoring = true;
    logger.info('Performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    logger.info('Performance monitoring stopped');
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.metrics = [];
    this.interactions = [];
    logger.info('Performance data cleared');
  }
}

export const performanceService = new PerformanceService();
export default performanceService;
