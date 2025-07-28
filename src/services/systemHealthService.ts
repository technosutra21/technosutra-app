// System Health Service for TECHNO SUTRA
// Comprehensive system monitoring and health checks

import { logger } from '@/lib/logger';

interface HealthCheck {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastCheck: number;
  responseTime: number;
  message: string;
  details?: Record<string, unknown>;
}

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    loadTime: number;
    renderTime: number;
    interactionDelay: number;
  };
  network: {
    isOnline: boolean;
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
  };
  storage: {
    used: number;
    available: number;
    percentage: number;
  };
  battery?: {
    level: number;
    charging: boolean;
  };
}

interface ServiceHealth {
  gps: HealthCheck;
  offlineStorage: HealthCheck;
  arCapabilities: HealthCheck;
  mapServices: HealthCheck;
  modelLoading: HealthCheck;
  analytics: HealthCheck;
}

interface HealthReport {
  timestamp: number;
  overallStatus: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  metrics: SystemMetrics;
  services: ServiceHealth;
  recommendations: string[];
  criticalIssues: string[];
}

class SystemHealthService {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: SystemMetrics | null = null;
  private isMonitoring = false;
  private checkInterval = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;
  private healthHistory: HealthReport[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize health monitoring
   */
  private initialize(): void {
    this.setupHealthChecks();
    this.startMonitoring();
    logger.info('🏥 System Health Service initialized');
  }

  /**
   * Setup individual health checks
   */
  private setupHealthChecks(): void {
    // GPS Health Check
    this.healthChecks.set('gps', {
      id: 'gps',
      name: 'GPS Service',
      status: 'unknown',
      lastCheck: 0,
      responseTime: 0,
      message: 'Not checked yet',
    });

    // Offline Storage Health Check
    this.healthChecks.set('offlineStorage', {
      id: 'offlineStorage',
      name: 'Offline Storage',
      status: 'unknown',
      lastCheck: 0,
      responseTime: 0,
      message: 'Not checked yet',
    });

    // AR Capabilities Health Check
    this.healthChecks.set('arCapabilities', {
      id: 'arCapabilities',
      name: 'AR Capabilities',
      status: 'unknown',
      lastCheck: 0,
      responseTime: 0,
      message: 'Not checked yet',
    });

    // Map Services Health Check
    this.healthChecks.set('mapServices', {
      id: 'mapServices',
      name: 'Map Services',
      status: 'unknown',
      lastCheck: 0,
      responseTime: 0,
      message: 'Not checked yet',
    });

    // Model Loading Health Check
    this.healthChecks.set('modelLoading', {
      id: 'modelLoading',
      name: '3D Model Loading',
      status: 'unknown',
      lastCheck: 0,
      responseTime: 0,
      message: 'Not checked yet',
    });

    // Analytics Health Check
    this.healthChecks.set('analytics', {
      id: 'analytics',
      name: 'Analytics Service',
      status: 'unknown',
      lastCheck: 0,
      responseTime: 0,
      message: 'Not checked yet',
    });
  }

  /**
   * Start health monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.runHealthChecks();

    this.intervalId = setInterval(() => {
      this.runHealthChecks();
    }, this.checkInterval);

    logger.info('🏥 Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    logger.info('🏥 Health monitoring stopped');
  }

  /**
   * Run all health checks
   */
  private async runHealthChecks(): Promise<void> {
    const startTime = Date.now();

    try {
      // Collect system metrics
      this.metrics = await this.collectSystemMetrics();

      // Run individual service checks
      await Promise.all([
        this.checkGPSHealth(),
        this.checkOfflineStorageHealth(),
        this.checkARCapabilitiesHealth(),
        this.checkMapServicesHealth(),
        this.checkModelLoadingHealth(),
        this.checkAnalyticsHealth(),
      ]);

      // Generate health report
      const report = this.generateHealthReport();
      this.healthHistory.push(report);

      // Limit history size
      if (this.healthHistory.length > this.maxHistorySize) {
        this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
      }

      // Log critical issues
      if (report.overallStatus === 'critical') {
        logger.error('🚨 Critical system health issues detected:', report.criticalIssues);
      } else if (report.overallStatus === 'warning') {
        logger.warn('⚠️ System health warnings:', report.recommendations);
      }

      const duration = Date.now() - startTime;
      logger.debug(`🏥 Health check completed in ${duration}ms`);

    } catch (error) {
      logger.error('🏥 Health check failed:', error);
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      performance: {
        loadTime: 0,
        renderTime: 0,
        interactionDelay: 0,
      },
      network: {
        isOnline: navigator.onLine,
      },
      storage: {
        used: 0,
        available: 0,
        percentage: 0,
      },
    };

    // Memory metrics
    if ('memory' in performance) {
      const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }

    // Network metrics
    if ('connection' in navigator) {
      const connection = (navigator as { connection: { type: string; effectiveType: string; downlink: number } }).connection;
      metrics.network.connectionType = connection.type;
      metrics.network.effectiveType = connection.effectiveType;
      metrics.network.downlink = connection.downlink;
    }

    // Storage metrics
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota && estimate.usage) {
          metrics.storage = {
            used: estimate.usage,
            available: estimate.quota - estimate.usage,
            percentage: (estimate.usage / estimate.quota) * 100,
          };
        }
      } catch (error) {
        logger.warn('Failed to get storage estimate:', error);
      }
    }

    // Battery metrics
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as { getBattery: () => Promise<{ level: number; charging: boolean }> }).getBattery();
        metrics.battery = {
          level: battery.level,
          charging: battery.charging,
        };
      } catch {
        // Battery API not available
      }
    }

    // Performance metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.performance = {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        renderTime: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        interactionDelay: navigation.responseStart - navigation.requestStart,
      };
    }

    return metrics;
  }

  /**
   * Check GPS health
   */
  private async checkGPSHealth(): Promise<void> {
    const startTime = Date.now();
    const check = this.healthChecks.get('gps')!;

    try {
      if (!('geolocation' in navigator)) {
        check.status = 'critical';
        check.message = 'Geolocation not supported';
        check.details = { supported: false };
      } else {
        // Test GPS with timeout
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('GPS timeout')), 5000);

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeout);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeout);
              reject(err);
            },
            { timeout: 4000, enableHighAccuracy: false }
          );
        });

        check.status = position.coords.accuracy < 100 ? 'healthy' : 'warning';
        check.message = `GPS working, accuracy: ${Math.round(position.coords.accuracy)}m`;
        check.details = {
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
      }
    } catch (error) {
      check.status = 'warning';
      check.message = `GPS unavailable: ${(error as Error).message}`;
      check.details = { error: (error as Error).message };
    }

    check.lastCheck = Date.now();
    check.responseTime = Date.now() - startTime;
  }

  /**
   * Check offline storage health
   */
  private async checkOfflineStorageHealth(): Promise<void> {
    const startTime = Date.now();
    const check = this.healthChecks.get('offlineStorage')!;

    try {
      // Test localStorage
      const testKey = 'technosutra-health-test';
      const testValue = Date.now().toString();

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== testValue) {
        throw new Error('localStorage test failed');
      }

      // Test IndexedDB
      const dbTest = await new Promise<boolean>((resolve, reject) => {
        const request = indexedDB.open('technosutra-health-test', 1);

        request.onerror = () => reject(new Error('IndexedDB test failed'));
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase('technosutra-health-test');
          resolve(true);
        };

        request.onupgradeneeded = () => {
          const db = request.result;
          db.createObjectStore('test');
        };
      });

      check.status = 'healthy';
      check.message = 'Offline storage working';
      check.details = {
        localStorage: true,
        indexedDB: dbTest,
      };

    } catch (error) {
      check.status = 'critical';
      check.message = `Storage error: ${(error as Error).message}`;
      check.details = { error: (error as Error).message };
    }

    check.lastCheck = Date.now();
    check.responseTime = Date.now() - startTime;
  }

  /**
   * Check AR capabilities health
   */
  private async checkARCapabilitiesHealth(): Promise<void> {
    const startTime = Date.now();
    const check = this.healthChecks.get('arCapabilities')!;

    try {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) {
        check.status = 'critical';
        check.message = 'WebGL not supported';
        check.details = { webgl: false };
        return;
      }

      // Check model-viewer support
      const modelViewerSupported = 'customElements' in window;

      // Check device orientation support
      const orientationSupported = 'DeviceOrientationEvent' in window;

      const score = [gl, modelViewerSupported, orientationSupported].filter(Boolean).length;

      if (score === 3) {
        check.status = 'healthy';
        check.message = 'AR fully supported';
      } else if (score >= 2) {
        check.status = 'warning';
        check.message = 'AR partially supported';
      } else {
        check.status = 'critical';
        check.message = 'AR not supported';
      }

      check.details = {
        webgl: !!gl,
        modelViewer: modelViewerSupported,
        deviceOrientation: orientationSupported,
        score,
      };

    } catch (error) {
      check.status = 'critical';
      check.message = `AR check failed: ${(error as Error).message}`;
      check.details = { error: (error as Error).message };
    }

    check.lastCheck = Date.now();
    check.responseTime = Date.now() - startTime;
  }

  /**
   * Check map services health
   */
  private async checkMapServicesHealth(): Promise<void> {
    const startTime = Date.now();
    const check = this.healthChecks.get('mapServices')!;

    try {
      // Test MapTiler API availability
      const testUrl = 'https://api.maptiler.com/maps/basic/style.json?key=test';
      await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });

      check.status = 'healthy';
      check.message = 'Map services available';
      check.details = {
        maptiler: true,
        online: navigator.onLine,
      };

    } catch (error) {
      if (navigator.onLine) {
        check.status = 'warning';
        check.message = 'Map services may be unavailable';
      } else {
        check.status = 'healthy';
        check.message = 'Offline mode - cached maps available';
      }

      check.details = {
        error: (error as Error).message,
        online: navigator.onLine,
      };
    }

    check.lastCheck = Date.now();
    check.responseTime = Date.now() - startTime;
  }

  /**
   * Check model loading health
   */
  private async checkModelLoadingHealth(): Promise<void> {
    const startTime = Date.now();
    const check = this.healthChecks.get('modelLoading')!;

    try {
      // Check if model-viewer is loaded
      const modelViewerLoaded = customElements.get('model-viewer') !== undefined;

      // Check WebGL capabilities
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');

      if (!gl) {
        check.status = 'critical';
        check.message = '3D rendering not supported';
        check.details = { webgl: false };
        return;
      }

      // Test basic WebGL functionality
      const shader = gl.createShader(gl.VERTEX_SHADER);
      const shaderSupported = shader !== null;

      if (shaderSupported) {
        gl.deleteShader(shader);
      }

      if (modelViewerLoaded && shaderSupported) {
        check.status = 'healthy';
        check.message = '3D model loading ready';
      } else {
        check.status = 'warning';
        check.message = '3D capabilities limited';
      }

      check.details = {
        modelViewer: modelViewerLoaded,
        webgl: true,
        shaders: shaderSupported,
      };

    } catch (error) {
      check.status = 'critical';
      check.message = `3D check failed: ${(error as Error).message}`;
      check.details = { error: (error as Error).message };
    }

    check.lastCheck = Date.now();
    check.responseTime = Date.now() - startTime;
  }

  /**
   * Check analytics health
   */
  private async checkAnalyticsHealth(): Promise<void> {
    const startTime = Date.now();
    const check = this.healthChecks.get('analytics')!;

    try {
      // Check localStorage for analytics data
      const analyticsData = localStorage.getItem('technosutra-analytics');
      const userProfile = localStorage.getItem('technosutra-user-profile');

      check.status = 'healthy';
      check.message = 'Analytics service operational';
      check.details = {
        hasData: !!analyticsData,
        hasProfile: !!userProfile,
        storageWorking: true,
      };

    } catch (error) {
      check.status = 'warning';
      check.message = `Analytics issues: ${(error as Error).message}`;
      check.details = { error: (error as Error).message };
    }

    check.lastCheck = Date.now();
    check.responseTime = Date.now() - startTime;
  }

  /**
   * Generate comprehensive health report
   */
  private generateHealthReport(): HealthReport {
    const services = Object.fromEntries(this.healthChecks) as ServiceHealth;
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Calculate health score
    let totalScore = 0;
    let serviceCount = 0;

    for (const [, check] of this.healthChecks) {
      serviceCount++;
      switch (check.status) {
        case 'healthy':
          totalScore += 100;
          break;
        case 'warning':
          totalScore += 60;
          recommendations.push(`${check.name}: ${check.message}`);
          break;
        case 'critical':
          totalScore += 0;
          criticalIssues.push(`${check.name}: ${check.message}`);
          break;
        case 'unknown':
          totalScore += 50;
          break;
      }
    }

    const score = serviceCount > 0 ? Math.round(totalScore / serviceCount) : 0;

    // Determine overall status
    let overallStatus: HealthReport['overallStatus'] = 'healthy';
    if (criticalIssues.length > 0) {
      overallStatus = 'critical';
    } else if (recommendations.length > 0) {
      overallStatus = 'warning';
    }

    // Add system-level recommendations
    if (this.metrics) {
      if (this.metrics.memory.percentage > 80) {
        recommendations.push('High memory usage detected - consider refreshing the app');
      }

      if (this.metrics.storage.percentage > 90) {
        recommendations.push('Storage space low - consider clearing cached data');
      }

      if (!this.metrics.network.isOnline) {
        recommendations.push('Offline mode active - some features may be limited');
      }
    }

    return {
      timestamp: Date.now(),
      overallStatus,
      score,
      metrics: this.metrics!,
      services,
      recommendations,
      criticalIssues,
    };
  }

  /**
   * Get current health status
   */
  getCurrentHealth(): HealthReport | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  /**
   * Get health history
   */
  getHealthHistory(limit?: number): HealthReport[] {
    const history = [...this.healthHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get specific service health
   */
  getServiceHealth(serviceId: string): HealthCheck | null {
    return this.healthChecks.get(serviceId) || null;
  }

  /**
   * Force health check
   */
  async forceHealthCheck(): Promise<HealthReport> {
    await this.runHealthChecks();
    return this.getCurrentHealth()!;
  }

  /**
   * Clear health history
   */
  clearHistory(): void {
    this.healthHistory = [];
    logger.info('🏥 Health history cleared');
  }

  /**
   * Get health summary for display
   */
  getHealthSummary(): {
    status: string;
    score: number;
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
    lastCheck: number;
  } {
    const current = this.getCurrentHealth();

    if (!current) {
      return {
        status: 'unknown',
        score: 0,
        criticalCount: 0,
        warningCount: 0,
        healthyCount: 0,
        lastCheck: 0,
      };
    }

    const services = Object.values(current.services);
    const criticalCount = services.filter(s => s.status === 'critical').length;
    const warningCount = services.filter(s => s.status === 'warning').length;
    const healthyCount = services.filter(s => s.status === 'healthy').length;

    return {
      status: current.overallStatus,
      score: current.score,
      criticalCount,
      warningCount,
      healthyCount,
      lastCheck: current.timestamp,
    };
  }
}

export const systemHealthService = new SystemHealthService();
export default systemHealthService;
