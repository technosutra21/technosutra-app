// PWA Initialization Service for TECHNO SUTRA
// Automatic setup of complete offline functionality

import { logger } from '@/lib/logger';
import { offlineStorage } from './offlineStorage';
import { offlineTestingService } from './offlineTestingService';
// import { pwaService } from './pwaService'; // Not used currently
import { performanceMonitoringService } from './performanceMonitoringService';
import { notificationManager } from '@/components/EnhancedNotificationSystem';

interface InitializationStep {
  id: string;
  name: string;
  description: string;
  execute: () => Promise<void>;
  critical: boolean;
  estimatedTime: number;
}

interface InitializationProgress {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  overallProgress: number;
  isComplete: boolean;
  errors: Array<{ step: string; error: string }>;
}

class PWAInitializationService {
  private steps: InitializationStep[] = [];
  private progress: InitializationProgress = {
    currentStep: '',
    completedSteps: [],
    totalSteps: 0,
    overallProgress: 0,
    isComplete: false,
    errors: []
  };
  private listeners: Array<(progress: InitializationProgress) => void> = [];
  private isInitializing = false;

  constructor() {
    this.setupInitializationSteps();
  }

  private setupInitializationSteps(): void {
    this.steps = [
      {
        id: 'performance-monitoring',
        name: 'Performance Monitoring',
        description: 'Inicializando monitoramento de performance',
        execute: this.initializePerformanceMonitoring.bind(this),
        critical: false,
        estimatedTime: 500
      },
      {
        id: 'offline-storage',
        name: 'Offline Storage',
        description: 'Configurando armazenamento offline',
        execute: this.initializeOfflineStorage.bind(this),
        critical: true,
        estimatedTime: 1000
      },
      {
        id: 'pwa-features',
        name: 'PWA Features',
        description: 'Ativando recursos PWA',
        execute: this.initializePWAFeatures.bind(this),
        critical: true,
        estimatedTime: 800
      },
      {
        id: 'csv-data',
        name: 'CSV Data',
        description: 'Carregando dados de personagens e capítulos',
        execute: this.cacheCSVData.bind(this),
        critical: true,
        estimatedTime: 2000
      },
      {
        id: '3d-models',
        name: '3D Models',
        description: 'Preparando modelos 3D para uso offline',
        execute: this.cache3DModels.bind(this),
        critical: false,
        estimatedTime: 10000
      },
      {
        id: 'map-tiles',
        name: 'Map Tiles',
        description: 'Baixando mapas de Águas da Prata',
        execute: this.cacheMapTiles.bind(this),
        critical: false,
        estimatedTime: 8000
      },
      {
        id: 'offline-validation',
        name: 'Offline Validation',
        description: 'Validando funcionalidade offline',
        execute: this.validateOfflineFunctionality.bind(this),
        critical: true,
        estimatedTime: 1500
      }
    ];

    this.progress.totalSteps = this.steps.length;
  }

  subscribe(listener: (progress: InitializationProgress) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyProgress(): void {
    this.listeners.forEach(listener => listener({ ...this.progress }));
  }

  async initialize(options: {
    skipNonCritical?: boolean;
    showNotifications?: boolean;
  } = {}): Promise<void> {
    if (this.isInitializing) {
      logger.warn('PWA initialization already in progress');
      return;
    }

    this.isInitializing = true;
    const startTime = Date.now();

    try {
      logger.info('🚀 Starting PWA initialization...');

      if (options.showNotifications) {
        notificationManager.info(
          'Inicializando App',
          'Preparando funcionalidade offline completa...',
          { persistent: true }
        );
      }

      const stepsToExecute = options.skipNonCritical 
        ? this.steps.filter(step => step.critical)
        : this.steps;

      for (let i = 0; i < stepsToExecute.length; i++) {
        const step = stepsToExecute[i];
        
        this.progress.currentStep = step.id;
        this.notifyProgress();

        try {
          logger.info(`📋 Executing step: ${step.name}`);
          
          const stepStartTime = Date.now();
          await step.execute();
          const stepDuration = Date.now() - stepStartTime;

          this.progress.completedSteps.push(step.id);
          this.progress.overallProgress = (this.progress.completedSteps.length / stepsToExecute.length) * 100;
          
          logger.info(`✅ Step completed: ${step.name} (${stepDuration}ms)`);

          if (options.showNotifications && step.critical) {
            notificationManager.success(
              step.name,
              `${step.description} - Concluído`,
              { duration: 2000 }
            );
          }

        } catch (_error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          this.progress.errors.push({
            step: step.id,
            error: errorMessage
          });

          logger.error(`❌ Step failed: ${step.name}`, error);

          if (options.showNotifications) {
            notificationManager.error(
              `Erro: ${step.name}`,
              errorMessage,
              { 
                actions: step.critical ? [{
                  label: 'Tentar Novamente',
                  action: () => this.retryStep(step.id)
                }] : undefined
              }
            );
          }

          // Stop if critical step fails
          if (step.critical) {
            throw new Error(`Critical step failed: ${step.name} - ${errorMessage}`);
          }
        }

        this.notifyProgress();
      }

      this.progress.isComplete = true;
      this.progress.currentStep = '';
      
      const totalDuration = Date.now() - startTime;
      
      logger.info(`✅ PWA initialization completed successfully (${totalDuration}ms)`);

      if (options.showNotifications) {
        notificationManager.success(
          'App Pronto!',
          `Funcionalidade offline completa ativada (${(totalDuration / 1000).toFixed(1)}s)`,
          { 
            duration: 5000,
            actions: [{
              label: 'Ver Detalhes',
              action: () => this.showInitializationReport()
            }]
          }
        );
      }

    } catch (error) {
      logger.error('❌ PWA initialization failed:', error);
      
      if (options.showNotifications) {
        notificationManager.error(
          'Falha na Inicialização',
          'Alguns recursos offline podem não funcionar corretamente',
          {
            actions: [{
              label: 'Tentar Novamente',
              action: () => this.initialize(options)
            }]
          }
        );
      }

      throw error;
    } finally {
      this.isInitializing = false;
      this.notifyProgress();
    }
  }

  private async retryStep(stepId: string): Promise<void> {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return;

    try {
      await step.execute();
      
      // Remove from errors if successful
      this.progress.errors = this.progress.errors.filter(e => e.step !== stepId);
      
      if (!this.progress.completedSteps.includes(stepId)) {
        this.progress.completedSteps.push(stepId);
        this.progress.overallProgress = (this.progress.completedSteps.length / this.steps.length) * 100;
      }

      notificationManager.success(
        'Recuperação Bem-sucedida',
        `${step.name} foi executado com sucesso`
      );

    } catch (error) {
      notificationManager.error(
        'Falha na Recuperação',
        `${step.name} ainda apresenta problemas`
      );
    }

    this.notifyProgress();
  }

  private showInitializationReport(): void {
    const report = {
      completedSteps: this.progress.completedSteps.length,
      totalSteps: this.progress.totalSteps,
      errors: this.progress.errors.length,
      successRate: (this.progress.completedSteps.length / this.progress.totalSteps) * 100
    };

    notificationManager.info(
      'Relatório de Inicialização',
      `${report.completedSteps}/${report.totalSteps} passos concluídos (${report.successRate.toFixed(0)}%)`,
      {
        metadata: {
          performanceScore: report.successRate
        }
      }
    );
  }

  // Individual initialization steps
  private async initializePerformanceMonitoring(): Promise<void> {
    performanceMonitoringService.startMonitoring();
  }

  private async initializeOfflineStorage(): Promise<void> {
    // Initialize IndexedDB and test basic operations
    await offlineStorage.put('appSettings', {
      key: 'initialization-test',
      data: 'test-data',
      timestamp: Date.now()
    });

    const testData = await offlineStorage.get('appSettings', 'initialization-test');
    if (!testData) {
      throw new Error('Offline storage test failed');
    }

    await offlineStorage.delete('appSettings', 'initialization-test');
  }

  private async initializePWAFeatures(): Promise<void> {
    // Ensure PWA service is ready
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        throw new Error('Service worker not ready');
      }
    }
  }

  private async cacheCSVData(): Promise<void> {
    await offlineStorage.cacheAllCSVData();
  }

  private async cache3DModels(): Promise<void> {
    // Only cache a subset of models initially to avoid long loading times
    const priorityModels = [1, 2, 3, 4, 5]; // First 5 models
    
    for (const modelId of priorityModels) {
      try {
        const response = await fetch(`/modelo${modelId}.glb`);
        if (response.ok) {
          const blob = await response.blob();
          await offlineStorage.cacheModel(modelId, blob, {
            url: `/modelo${modelId}.glb`,
            name: `Modelo ${modelId}`
          });
        }
      } catch (error) {
        logger.warn(`Failed to cache model ${modelId}:`, error);
      }
    }
  }

  private async cacheMapTiles(): Promise<void> {
    // Cache essential map tiles for the Águas da Prata region
    await offlineStorage.cacheRegionMapTiles();
  }

  private async validateOfflineFunctionality(): Promise<void> {
    const report = await offlineTestingService.runOfflineValidation();
    
    if (report.overall === 'fail') {
      throw new Error(`Offline validation failed: ${report.results.filter(r => r.status === 'fail').length} critical issues`);
    }
  }

  // Public methods
  getProgress(): InitializationProgress {
    return { ...this.progress };
  }

  isReady(): boolean {
    return this.progress.isComplete && this.progress.errors.length === 0;
  }

  async quickStart(): Promise<void> {
    return this.initialize({ 
      skipNonCritical: true, 
      showNotifications: true 
    });
  }

  async fullInitialization(): Promise<void> {
    return this.initialize({ 
      skipNonCritical: false, 
      showNotifications: true 
    });
  }
}

export const pwaInitializationService = new PWAInitializationService();
export default pwaInitializationService;
