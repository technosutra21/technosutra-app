// App Initialization Service for TECHNO SUTRA
// Coordinates startup of all services and manages dependencies

// import { pwaService } from './pwaService'; // TODO: Remove if not needed
import { systemHealthService } from './systemHealthService';
import { logger } from '@/lib/logger';
import performanceService from './performanceService';
import { errorReportingService } from './errorReportingService';
import { accessibilityService } from './accessibilityService';
import { securityService } from './securityService';
import { userExperienceService } from './userExperienceService';
import { analyticsService } from './analyticsService';
import { unifiedGeoService } from './unifiedGeoService';

interface ServiceDefinition {
  id: string;
  name: string;
  service: any;
  dependencies: string[];
  critical: boolean;
  timeout: number;
  initMethod?: string;
}

interface InitializationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: Error;
}

interface InitializationResult {
  success: boolean;
  totalTime: number;
  steps: InitializationStep[];
  failedServices: string[];
  warnings: string[];
}

class AppInitializationService {
  private services: Map<string, ServiceDefinition> = new Map();
  private initializationSteps: InitializationStep[] = [];
  private isInitialized = false;
  private initializationPromise: Promise<InitializationResult> | null = null;

  constructor() {
    this.defineServices();
  }

  /**
   * Define all services and their dependencies
   */
  private defineServices(): void {
    // Core services (no dependencies)
    this.services.set('logger', {
      id: 'logger',
      name: 'Logger Service',
      service: logger,
      dependencies: [],
      critical: true,
      timeout: 1000,
    });

    this.services.set('security', {
      id: 'security',
      name: 'Security Service',
      service: securityService,
      dependencies: ['logger'],
      critical: true,
      timeout: 3000,
    });

    this.services.set('performance', {
      id: 'performance',
      name: 'Performance Monitoring',
      service: performanceService,
      dependencies: ['logger'],
      critical: false,
      timeout: 2000,
      initMethod: 'startMonitoring',
    });

    this.services.set('errorReporting', {
      id: 'errorReporting',
      name: 'Error Reporting',
      service: errorReportingService,
      dependencies: ['logger', 'security'],
      critical: false,
      timeout: 2000,
    });

    this.services.set('accessibility', {
      id: 'accessibility',
      name: 'Accessibility Service',
      service: accessibilityService,
      dependencies: ['logger'],
      critical: false,
      timeout: 2000,
    });

    this.services.set('analytics', {
      id: 'analytics',
      name: 'Analytics Service',
      service: analyticsService,
      dependencies: ['logger', 'security'],
      critical: false,
      timeout: 3000,
    });

    this.services.set('userExperience', {
      id: 'userExperience',
      name: 'User Experience Service',
      service: userExperienceService,
      dependencies: ['logger', 'analytics'],
      critical: false,
      timeout: 2000,
    });

    this.services.set('systemHealth', {
      id: 'systemHealth',
      name: 'System Health Monitor',
      service: systemHealthService,
      dependencies: ['logger', 'performance'],
      critical: false,
      timeout: 3000,
      initMethod: 'startMonitoring',
    });
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<InitializationResult> {
    if (this.isInitialized) {
      return this.getLastInitializationResult();
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(): Promise<InitializationResult> {
    const startTime = Date.now();
    logger.info('🚀 Starting TECHNO SUTRA initialization...');

    try {
      // Create initialization steps
      this.createInitializationSteps();

      // Initialize services in dependency order
      const initOrder = this.calculateInitializationOrder();
      
      for (const serviceId of initOrder) {
        await this.initializeService(serviceId);
      }

      // Defer this until user interaction
      // await this.verifyCriticalServices();

      // Run post-initialization tasks
      await this.runPostInitializationTasks();

      const totalTime = Date.now() - startTime;
      this.isInitialized = true;

      const result: InitializationResult = {
        success: true,
        totalTime,
        steps: [...this.initializationSteps],
        failedServices: this.getFailedServices(),
        warnings: this.getWarnings(),
      };

      logger.info(`✅ TECHNO SUTRA initialized successfully in ${totalTime}ms`);
      return result;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error('❌ TECHNO SUTRA initialization failed:', error);

      return {
        success: false,
        totalTime,
        steps: [...this.initializationSteps],
        failedServices: this.getFailedServices(),
        warnings: this.getWarnings(),
      };
    }
  }

  /**
   * Create initialization steps for progress tracking
   */
  private createInitializationSteps(): void {
    this.initializationSteps = [
      {
        id: 'core-services',
        name: 'Initializing Core Services',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'security-setup',
        name: 'Setting up Security',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'monitoring-services',
        name: 'Starting Monitoring',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'user-services',
        name: 'Initializing User Services',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'health-check',
        name: 'Running Health Checks',
        status: 'pending',
        progress: 0,
      },
      {
        id: 'finalization',
        name: 'Finalizing Setup',
        status: 'pending',
        progress: 0,
      },
    ];
  }

  /**
   * Calculate service initialization order based on dependencies
   */
  private calculateInitializationOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (serviceId: string) => {
      if (visited.has(serviceId)) return;
      if (visiting.has(serviceId)) {
        throw new Error(`Circular dependency detected involving ${serviceId}`);
      }

      visiting.add(serviceId);
      const service = this.services.get(serviceId);
      
      if (service) {
        for (const dep of service.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(serviceId);
      visited.add(serviceId);
      order.push(serviceId);
    };

    for (const serviceId of this.services.keys()) {
      visit(serviceId);
    }

    return order;
  }

  /**
   * Initialize a specific service
   */
  private async initializeService(serviceId: string): Promise<void> {
    const serviceDef = this.services.get(serviceId);
    if (!serviceDef) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const stepId = this.getStepIdForService(serviceId);
    const step = this.initializationSteps.find(s => s.id === stepId);
    
    if (step) {
      step.status = 'running';
      step.startTime = Date.now();
    }

    try {
      logger.info(`🔧 Initializing ${serviceDef.name}...`);

      // Initialize service with timeout
      await Promise.race([
        this.callServiceInitMethod(serviceDef),
        this.createTimeout(serviceDef.timeout, serviceDef.name),
      ]);

      if (step) {
        step.status = 'completed';
        step.progress = 100;
        step.endTime = Date.now();
      }

      logger.info(`✅ ${serviceDef.name} initialized successfully`);

    } catch (error) {
      if (step) {
        step.status = 'failed';
        step.error = error as Error;
        step.endTime = Date.now();
      }

      if (serviceDef.critical) {
        logger.error(`❌ Critical service ${serviceDef.name} failed:`, error);
        throw error;
      } else {
        logger.warn(`⚠️ Non-critical service ${serviceDef.name} failed:`, error);
      }
    }
  }

  /**
   * Call service initialization method
   */
  private async callServiceInitMethod(serviceDef: ServiceDefinition): Promise<void> {
    const { service, initMethod } = serviceDef;

    if (initMethod && typeof service[initMethod] === 'function') {
      await service[initMethod]();
    } else if (typeof service.initialize === 'function') {
      await service.initialize();
    } else if (typeof service.init === 'function') {
      await service.init();
    }
    // If no init method, assume service is already initialized
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number, serviceName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${serviceName} initialization timeout after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Get step ID for service
   */
  private getStepIdForService(serviceId: string): string {
    switch (serviceId) {
      case 'logger':
        return 'core-services';
      case 'security':
        return 'security-setup';
      case 'performance':
      case 'errorReporting':
      case 'systemHealth':
        return 'monitoring-services';
      case 'accessibility':
      case 'analytics':
      case 'userExperience':
        return 'user-services';
      default:
        return 'finalization';
    }
  }

  /**
   * Manually trigger a geolocation request, e.g., on user button click.
   */
  async requestGeolocation(): Promise<void> {
    try {
      if (unifiedGeoService.getServiceStatus().hasAnyService) {
        logger.info('Geolocation service is available.');
        // Here you would typically call a function to get the user's location,
        // which would then be passed to the unifiedGeoService.
      } else {
        logger.warn('No geolocation services available.');
      }
    } catch (error) {
      logger.error('Error during manual geolocation request:', error);
    }
  }

  /**
   * Verify critical services are working
   */
  private async verifyCriticalServices(): Promise<void> {
    const step = this.initializationSteps.find(s => s.id === 'health-check');
    if (step) {
      step.status = 'running';
      step.startTime = Date.now();
    }

    try {
      const criticalServices = Array.from(this.services.values())
        .filter(s => s.critical);

      for (const service of criticalServices) {
        // Basic verification that service exists and is accessible
        if (!service.service) {
          throw new Error(`Critical service ${service.name} is not available`);
        }
      }

      // Run a quick health check
      if (systemHealthService) {
        // Defer this to avoid auto-geolocation request
        // await systemHealthService.forceHealthCheck();
      }

      if (step) {
        step.status = 'completed';
        step.progress = 100;
        step.endTime = Date.now();
      }

    } catch (error) {
      if (step) {
        step.status = 'failed';
        step.error = error as Error;
        step.endTime = Date.now();
      }
      throw error;
    }
  }

  /**
   * Run post-initialization tasks
   */
  private async runPostInitializationTasks(): Promise<void> {
    const step = this.initializationSteps.find(s => s.id === 'finalization');
    if (step) {
      step.status = 'running';
      step.startTime = Date.now();
    }

    try {
      // Track app initialization completion
      if (analyticsService) {
        analyticsService.trackEvent('app_initialized', 'user_action', {
          initializationTime: Date.now(),
          servicesCount: this.services.size,
        });
      }

      // Announce app ready for accessibility
      if (accessibilityService) {
        accessibilityService.announce('TECHNO SUTRA carregado e pronto para uso');
      }

      // Start performance monitoring
      if (performanceService) {
        performanceService.startMonitoring();
      }

      if (step) {
        step.status = 'completed';
        step.progress = 100;
        step.endTime = Date.now();
      }

    } catch (error) {
      if (step) {
        step.status = 'failed';
        step.error = error as Error;
        step.endTime = Date.now();
      }
      // Don't throw here as these are non-critical tasks
      logger.warn('Post-initialization tasks failed:', error);
    }
  }

  /**
   * Get failed services
   */
  private getFailedServices(): string[] {
    return this.initializationSteps
      .filter(step => step.status === 'failed')
      .map(step => step.name);
  }

  /**
   * Get warnings
   */
  private getWarnings(): string[] {
    const warnings: string[] = [];
    
    for (const step of this.initializationSteps) {
      if (step.status === 'failed' && step.error) {
        warnings.push(`${step.name}: ${step.error.message}`);
      }
    }

    return warnings;
  }

  /**
   * Get last initialization result
   */
  private getLastInitializationResult(): InitializationResult {
    return {
      success: this.isInitialized,
      totalTime: 0,
      steps: [...this.initializationSteps],
      failedServices: this.getFailedServices(),
      warnings: this.getWarnings(),
    };
  }

  /**
   * Get initialization progress
   */
  getInitializationProgress(): {
    overall: number;
    currentStep: string;
    steps: InitializationStep[];
  } {
    const completedSteps = this.initializationSteps.filter(s => s.status === 'completed').length;
    const totalSteps = this.initializationSteps.length;
    const overall = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const currentStep = this.initializationSteps.find(s => s.status === 'running')?.name || 
                      this.initializationSteps.find(s => s.status === 'pending')?.name || 
                      'Completed';

    return {
      overall,
      currentStep,
      steps: [...this.initializationSteps],
    };
  }

  /**
   * Check if app is initialized
   */
  isAppInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceId: string): {
    available: boolean;
    initialized: boolean;
    error?: string;
  } {
    const serviceDef = this.services.get(serviceId);
    if (!serviceDef) {
      return { available: false, initialized: false, error: 'Service not found' };
    }

    const step = this.initializationSteps.find(s => 
      this.getStepIdForService(serviceId) === s.id
    );

    return {
      available: !!serviceDef.service,
      initialized: step?.status === 'completed',
      error: step?.error?.message,
    };
  }

  /**
   * Restart failed services
   */
  async restartFailedServices(): Promise<void> {
    const failedSteps = this.initializationSteps.filter(s => s.status === 'failed');
    
    for (const step of failedSteps) {
      step.status = 'pending';
      step.error = undefined;
      step.startTime = undefined;
      step.endTime = undefined;
    }

    // Re-run initialization for failed services
    const initOrder = this.calculateInitializationOrder();
    for (const serviceId of initOrder) {
      const stepId = this.getStepIdForService(serviceId);
      const step = this.initializationSteps.find(s => s.id === stepId);
      
      if (step && step.status === 'pending') {
        await this.initializeService(serviceId);
      }
    }
  }
}

export const appInitializationService = new AppInitializationService();
export default appInitializationService;
