/**
 * TECHNO SUTRA Service Manager
 * Centralized service initialization to prevent circular dependencies
 */

// Safe logger implementation
const safeLogger = {
  info: (...args: any[]) => {
    try {
      console.log('[TECHNO SUTRA]', ...args);
    } catch (_error) {
      // Silently fail if console is not available
    }
  },
  error: (...args: any[]) => {
    try {
      console.error('[TECHNO SUTRA ERROR]', ...args);
    } catch (_error) {
      // Silently fail if console is not available
    }
  },
  warn: (...args: any[]) => {
    try {
      console.warn('[TECHNO SUTRA WARN]', ...args);
    } catch (_error) {
      // Silently fail if console is not available
    }
  },
  debug: (...args: any[]) => {
    try {
      console.debug('[TECHNO SUTRA DEBUG]', ...args);
    } catch (_error) {
      // Silently fail if console is not available
    }
  }
};

interface ServiceInstance {
  name: string;
  instance: any;
  initialized: boolean;
  dependencies: string[];
}

class ServiceManager {
  private services: Map<string, ServiceInstance> = new Map();
  private isInitializing = false;

  register(name: string, factory: () => any, dependencies: string[] = []): void {
    this.services.set(name, {
      name,
      instance: null,
      initialized: false,
      dependencies
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      safeLogger.info('🔧 Initializing TECHNO SUTRA services...');
      
      // Initialize services in dependency order
      const initOrder = this.getInitializationOrder();
      
      for (const serviceName of initOrder) {
        try {
          await this.initializeService(serviceName);
        } catch (error) {
          safeLogger.error(`❌ Failed to initialize ${serviceName}:`, error);
          // Continue with other services instead of failing completely
        }
      }

      safeLogger.info('✅ Service initialization completed (some services may have failed)');
    } catch (error) {
      safeLogger.error('❌ Service initialization failed:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  private async initializeService(name: string): Promise<void> {
    const service = this.services.get(name);
    if (!service || service.initialized) return;

    try {
      // Initialize dependencies first
      for (const dep of service.dependencies) {
        await this.initializeService(dep);
      }

      // Create service instance
      if (!service.instance) {
        const factory = this.getServiceFactory(name);
        if (factory) {
          service.instance = await factory();
          service.initialized = true;
          safeLogger.info(`✅ ${name} service initialized`);
        }
      }
    } catch (error) {
      safeLogger.error(`❌ Failed to initialize ${name}:`, error);
      // Continue with other services
    }
  }

  private getServiceFactory(name: string): (() => Promise<any>) | null {
    try {
      switch (name) {
        case 'performance':
          return async () => {
            const performanceModule = await import('./performanceMonitoringService');
            return performanceModule.default;
          };
        case 'optimization':
          return async () => {
            const optimizationModule = await import('./advancedOptimizationService');
            return optimizationModule.default;
          };
        case 'security':
          return async () => {
            const securityModule = await import('./securityService');
            return securityModule.default;
          };
        case 'analytics':
          return async () => {
            const analyticsModule = await import('./analyticsService');
            return analyticsModule.default;
          };
        default:
          return null;
      }
    } catch (error) {
      safeLogger.error(`Failed to load service ${name}:`, error);
      return null;
    }
  }

  private getInitializationOrder(): string[] {
    // Simple dependency resolution - initialize in correct order
    return ['performance', 'security', 'analytics', 'optimization'];
  }

  get<T>(name: string): T | null {
    const service = this.services.get(name);
    return service?.instance || null;
  }

  isServiceReady(name: string): boolean {
    const service = this.services.get(name);
    return service?.initialized || false;
  }
}

// Global service manager instance
export const serviceManager = new ServiceManager();

// Export safe logger for use in services
export { safeLogger };

// Initialize all services
export const initializeServices = async (): Promise<void> => {
  // Register services with their dependencies
  serviceManager.register('performance', () => {}, []);
  serviceManager.register('security', () => {}, []);
  serviceManager.register('analytics', () => {}, ['performance']);
  serviceManager.register('optimization', () => {}, ['performance']);

  // Add timeout to prevent infinite initialization
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Service initialization timeout')), 10000);
  });

  try {
    await Promise.race([serviceManager.initialize(), timeoutPromise]);
  } catch (error) {
    safeLogger.error('Service initialization failed or timed out:', error);
    // Don't throw error to prevent app crash
  }
};
