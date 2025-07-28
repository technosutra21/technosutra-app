// Performance Monitoring Service for TECHNO SUTRA
// Advanced performance tracking and optimization

// React import for performance monitoring (optional)
let React: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  React = require('react');
} catch {
  // React not available, performance monitoring will be skipped
}
import { safeLogger } from './serviceManager';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'resource' | 'custom' | 'vitals';
  details?: any;
}

interface VitalMetrics {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
}

interface _ResourceMetrics {
  totalResources: number;
  totalSize: number;
  loadTime: number;
  cacheHitRate: number;
  failedResources: string[];
}

export class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private vitals: Partial<VitalMetrics> = {};
  private isMonitoring = false;
  private readonly maxMetrics = 1000;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    // Start monitoring when the page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    try {
      safeLogger.info('📊 Performance monitoring started');
    } catch {
      console.log('📊 Performance monitoring started');
    }

    // Monitor navigation timing
    this.measureNavigationTiming();

    // Monitor resource loading
    this.measureResourceTiming();

    // Monitor Core Web Vitals
    this.measureWebVitals();

    // Monitor custom metrics
    this.setupCustomMetrics();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Setup periodic reporting
    this.setupPeriodicReporting();
  }

  private measureNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics = [
      { name: 'DNS Lookup', value: navigation.domainLookupEnd - navigation.domainLookupStart },
      { name: 'TCP Connection', value: navigation.connectEnd - navigation.connectStart },
      { name: 'Request', value: navigation.responseStart - navigation.requestStart },
      { name: 'Response', value: navigation.responseEnd - navigation.responseStart },
      { name: 'DOM Processing', value: navigation.domComplete - navigation.domLoading },
      { name: 'Load Complete', value: navigation.loadEventEnd - navigation.loadEventStart }
    ];

    metrics.forEach(metric => {
      if (metric.value > 0) {
        this.addMetric({
          name: metric.name,
          value: metric.value,
          timestamp: Date.now(),
          category: 'navigation'
        });
      }
    });
  }

  private measureResourceTiming(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;
    let _totalDuration = 0;
    const failedResources: string[] = [];

    resources.forEach(resource => {
      _totalDuration += resource.duration;
      
      // Estimate size from transfer size
      if (resource.transferSize) {
        totalSize += resource.transferSize;
      }

      // Check for failed resources
      if (resource.duration === 0 || !resource.responseEnd) {
        failedResources.push(resource.name);
      }

      // Track slow resources
      if (resource.duration > 1000) { // > 1 second
        this.addMetric({
          name: 'Slow Resource',
          value: resource.duration,
          timestamp: Date.now(),
          category: 'resource',
          details: {
            url: resource.name,
            type: resource.initiatorType,
            size: resource.transferSize
          }
        });
      }
    });

    // Add summary metrics
    this.addMetric({
      name: 'Total Resources',
      value: resources.length,
      timestamp: Date.now(),
      category: 'resource'
    });

    this.addMetric({
      name: 'Total Resource Size',
      value: totalSize,
      timestamp: Date.now(),
      category: 'resource'
    });

    if (failedResources.length > 0) {
      this.addMetric({
        name: 'Failed Resources',
        value: failedResources.length,
        timestamp: Date.now(),
        category: 'resource',
        details: { resources: failedResources }
      });
    }
  }

  private measureWebVitals(): void {
    // Measure FCP (First Contentful Paint)
    this.measureFCP();

    // Measure LCP (Largest Contentful Paint)
    this.measureLCP();

    // Measure FID (First Input Delay)
    this.measureFID();

    // Measure CLS (Cumulative Layout Shift)
    this.measureCLS();

    // Measure TTFB (Time to First Byte)
    this.measureTTFB();
  }

  private measureFCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.vitals.FCP = fcp.startTime;
        this.addMetric({
          name: 'First Contentful Paint',
          value: fcp.startTime,
          timestamp: Date.now(),
          category: 'vitals'
        });
        observer.disconnect();
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      safeLogger.warn('FCP measurement not supported:', error);
    }
  }

  private measureLCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.vitals.LCP = lastEntry.startTime;
        this.addMetric({
          name: 'Largest Contentful Paint',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          category: 'vitals'
        });
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      safeLogger.warn('LCP measurement not supported:', error);
    }
  }

  private measureFID(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime;
          this.vitals.FID = fid;
          this.addMetric({
            name: 'First Input Delay',
            value: fid,
            timestamp: Date.now(),
            category: 'vitals'
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      safeLogger.warn('FID measurement not supported:', error);
    }
  }

  private measureCLS(): void {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      
      this.vitals.CLS = clsValue;
      this.addMetric({
        name: 'Cumulative Layout Shift',
        value: clsValue,
        timestamp: Date.now(),
        category: 'vitals'
      });
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      safeLogger.warn('CLS measurement not supported:', error);
    }
  }

  private measureTTFB(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.vitals.TTFB = ttfb;
      this.addMetric({
        name: 'Time to First Byte',
        value: ttfb,
        timestamp: Date.now(),
        category: 'vitals'
      });
    }
  }

  private setupCustomMetrics(): void {
    // Monitor React component render times
    this.monitorReactPerformance();

    // Monitor API response times
    this.monitorAPIPerformance();

    // Monitor 3D model loading times
    this.monitor3DModelPerformance();
  }

  private monitorReactPerformance(): void {
    // This would integrate with React DevTools Profiler in development
    if (process.env.NODE_ENV === 'development' && React && typeof React.createElement === 'function') {
      try {
        // Monitor component render times using React Profiler API
        const originalCreateElement = React.createElement;

        // Wrap createElement to measure render times
        React.createElement = function(...args: any[]) {
          const startTime = performance.now();
          const result = originalCreateElement.apply(this, args);
          const endTime = performance.now();

          // Log slow renders (> 16ms for 60fps)
          if (endTime - startTime > 16) {
            safeLogger.warn(`🐌 Slow React render detected: ${endTime - startTime}ms`, {
              component: args[0]?.name || args[0],
              renderTime: endTime - startTime
            });
          }

          return result;
        };

        safeLogger.info('🔍 React performance monitoring enabled');
      } catch (error) {
        safeLogger.warn('⚠️ Failed to initialize React performance monitoring:', error);
      }
    } else {
      safeLogger.info('ℹ️ React performance monitoring skipped (not in development or React not available)');
    }
  }

  private monitorAPIPerformance(): void {
    // Intercept fetch calls to monitor API performance
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.addMetric({
          name: 'API Request',
          value: duration,
          timestamp: Date.now(),
          category: 'custom',
          details: {
            url,
            status: response.status,
            success: response.ok
          }
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.addMetric({
          name: 'API Request Failed',
          value: duration,
          timestamp: Date.now(),
          category: 'custom',
          details: {
            url,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });

        throw error;
      }
    };
  }

  private monitor3DModelPerformance(): void {
    // Monitor model-viewer loading times
    document.addEventListener('load', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'MODEL-VIEWER') {
        const loadTime = performance.now();
        this.addMetric({
          name: '3D Model Load',
          value: loadTime,
          timestamp: Date.now(),
          category: 'custom',
          details: {
            src: target.getAttribute('src')
          }
        });
      }
    }, true);
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.addMetric({
          name: 'Memory Usage',
          value: memory.usedJSHeapSize,
          timestamp: Date.now(),
          category: 'custom',
          details: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          }
        });
      }, 30000); // Every 30 seconds
    }
  }

  private setupPeriodicReporting(): void {
    // Report performance metrics every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000);
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log critical performance issues
    if (this.isCriticalMetric(metric)) {
      safeLogger.warn(`🐌 Performance issue detected: ${metric.name} = ${metric.value}ms`, metric);
    }
  }

  private isCriticalMetric(metric: PerformanceMetric): boolean {
    const thresholds = {
      'First Contentful Paint': 2000,
      'Largest Contentful Paint': 4000,
      'First Input Delay': 100,
      'Cumulative Layout Shift': 0.1,
      'Time to First Byte': 800,
      'API Request': 5000,
      '3D Model Load': 10000
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    return threshold !== undefined && metric.value > threshold;
  }

  generatePerformanceReport(): any {
    const report = {
      timestamp: new Date().toISOString(),
      vitals: this.vitals,
      summary: this.generateSummary(),
      issues: this.identifyIssues(),
      recommendations: this.generateRecommendations()
    };

    safeLogger.info('📊 Performance Report Generated:', report);
    return report;
  }

  private generateSummary(): any {
    const categories = ['navigation', 'resource', 'vitals', 'custom'];
    const summary: any = {};

    categories.forEach(category => {
      const categoryMetrics = this.metrics.filter(m => m.category === category);
      if (categoryMetrics.length > 0) {
        const values = categoryMetrics.map(m => m.value);
        summary[category] = {
          count: categoryMetrics.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return summary;
  }

  private identifyIssues(): string[] {
    const issues: string[] = [];

    // Check Core Web Vitals
    if (this.vitals.FCP && this.vitals.FCP > 2000) {
      issues.push('First Contentful Paint is slow (>2s)');
    }
    if (this.vitals.LCP && this.vitals.LCP > 4000) {
      issues.push('Largest Contentful Paint is slow (>4s)');
    }
    if (this.vitals.FID && this.vitals.FID > 100) {
      issues.push('First Input Delay is high (>100ms)');
    }
    if (this.vitals.CLS && this.vitals.CLS > 0.1) {
      issues.push('Cumulative Layout Shift is high (>0.1)');
    }

    // Check for failed resources
    const failedResources = this.metrics.filter(m => m.name === 'Failed Resources');
    if (failedResources.length > 0) {
      issues.push(`${failedResources.length} resources failed to load`);
    }

    // Check for slow API requests
    const slowAPIs = this.metrics.filter(m => m.name === 'API Request' && m.value > 3000);
    if (slowAPIs.length > 0) {
      issues.push(`${slowAPIs.length} slow API requests detected`);
    }

    return issues;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.vitals.FCP && this.vitals.FCP > 2000) {
      recommendations.push('Optimize critical rendering path and reduce render-blocking resources');
    }
    if (this.vitals.LCP && this.vitals.LCP > 4000) {
      recommendations.push('Optimize largest content element loading (images, videos, text blocks)');
    }
    if (this.vitals.FID && this.vitals.FID > 100) {
      recommendations.push('Reduce JavaScript execution time and break up long tasks');
    }
    if (this.vitals.CLS && this.vitals.CLS > 0.1) {
      recommendations.push('Set size attributes on images and reserve space for dynamic content');
    }

    const slowResources = this.metrics.filter(m => m.name === 'Slow Resource' && m.value > 2000);
    if (slowResources.length > 0) {
      recommendations.push('Optimize slow-loading resources with compression and CDN');
    }

    return recommendations;
  }

  // Public methods
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getVitals(): Partial<VitalMetrics> {
    return { ...this.vitals };
  }

  measureCustom(name: string, startTime: number, endTime?: number): void {
    const value = endTime ? endTime - startTime : performance.now() - startTime;
    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      category: 'custom'
    });
  }

  clearMetrics(): void {
    this.metrics = [];
    safeLogger.info('📊 Performance metrics cleared');
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();
export default performanceMonitoringService;
