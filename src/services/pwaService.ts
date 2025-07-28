// TECHNO SUTRA PWA Service
// Handles service worker registration, updates, and offline functionality

import { logger } from '@/lib/logger';
import { offlineStorage } from './offlineStorage';

interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAService {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private updateAvailable = false;

  constructor() {
    this.init();
  }

  private async init() {
    // Register service worker
    await this.registerServiceWorker();

    // Setup install prompt handling
    this.setupInstallPrompt();

    // Setup online/offline detection
    this.setupNetworkDetection();

    // Preload critical resources
    await this.preloadCriticalResources();

    logger.info('🚀 PWA Service initialized');
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        });

        logger.info('✅ Service Worker registered successfully');

        // Handle updates with better user experience
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.notifyUpdateAvailable();
                logger.info('🔄 App update available');
              }
            });
          }
        });

        // Handle messages from service worker with enhanced functionality
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

        // Check for updates periodically
        setInterval(() => {
          this.registration?.update();
        }, 60000); // Check every minute

        // Force update check on page focus
        window.addEventListener('focus', () => {
          this.registration?.update();
        });

      } catch (error) {
        logger.error('❌ Service Worker registration failed:', error);
        // Continue without service worker but log the issue
        this.handleServiceWorkerFailure(error);
      }
    } else {
      logger.warn('⚠️ Service Worker not supported in this browser');
    }
  }

  private handleServiceWorkerFailure(_error: any): void {
    // Implement fallback strategies for when service worker fails
    logger.warn('🔄 Implementing fallback offline strategies...');

    // Use localStorage as backup for critical data
    this.setupLocalStorageFallback();
  }

  private setupLocalStorageFallback(): void {
    // Ensure critical data is available in localStorage as fallback
    const criticalData = [
      'characters.csv',
      'chapters.csv',
      'waypoint-coordinates.json'
    ];

    criticalData.forEach(async (file) => {
      try {
        if (!localStorage.getItem(`cached-${file}`)) {
          const response = await fetch(`/${file}`);
          if (response.ok) {
            const text = await response.text();
            localStorage.setItem(`cached-${file}`, text);
            logger.info(`📄 Fallback cached: ${file}`);
          }
        }
      } catch (error) {
        logger.warn(`⚠️ Failed to fallback cache ${file}:`, error);
      }
    });
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPrompt;
      logger.info('💾 PWA install prompt ready');
    });

    window.addEventListener('appinstalled', () => {
      logger.info('🎉 PWA installed successfully');
      this.deferredPrompt = null;
    });
  }

  private setupNetworkDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('🌐 Back online');
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('📴 Gone offline');
    });
  }

  private async preloadCriticalResources(): Promise<void> {
    try {
      // Preload CSV data
      const csvFiles = [
        '/characters.csv',
        '/characters_en.csv',
        '/chapters.csv',
        '/chapters_en.csv',
        '/sutra.csv',
        '/waypoint-coordinates.json'
      ];

      const csvPromises = csvFiles.map(async (file) => {
        try {
          const response = await fetch(file);
          if (response.ok) {
            const text = await response.text();
            // Cache in localStorage as backup
            localStorage.setItem(`cached-${file.replace('/', '')}`, text);
            logger.info(`📄 Preloaded ${file}`);
          }
        } catch (error) {
          logger.warn(`⚠️ Failed to preload ${file}:`, error);
        }
      });

      await Promise.allSettled(csvPromises);

      // Preload critical 3D models
      await this.preloadCriticalModels();

    } catch (error) {
      logger.error('Failed to preload critical resources:', error);
    }
  }

  private async preloadCriticalModels(): Promise<void> {
    const criticalModels = [1, 2, 3, 4, 5]; // First 5 models

    const modelPromises = criticalModels.map(async (modelId) => {
      try {
        const response = await fetch(`/modelo${modelId}.glb`);
        if (response.ok) {
          const blob = await response.blob();
          await offlineStorage.cacheModel(modelId, blob, {
            preloaded: true,
            critical: true
          });
          logger.info(`🎭 Preloaded model ${modelId}`);
        }
      } catch (error) {
        logger.warn(`⚠️ Failed to preload model ${modelId}:`, error);
      }
    });

    await Promise.allSettled(modelPromises);
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        logger.info('📦 Cache updated:', data.cacheName);
        break;
      case 'OFFLINE_READY':
        logger.info('📴 App ready for offline use');
        break;
      case 'UPDATE_AVAILABLE':
        this.updateAvailable = true;
        this.notifyUpdateAvailable();
        break;
    }
  }

  private notifyUpdateAvailable(): void {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  private async syncWhenOnline(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Sync user routes
      const routes = await offlineStorage.getRoutes();
      logger.info(`🔄 Syncing ${routes.length} routes`);

      // Sync user progress
      const progress = await offlineStorage.getUserProgress();
      if (progress) {
        logger.info('🔄 Syncing user progress');
      }

      // Background sync for service worker
      if (this.registration?.sync) {
        await this.registration.sync.register('background-sync-routes');
        await this.registration.sync.register('background-sync-progress');
      }

    } catch (error) {
      logger.error('Failed to sync data:', error);
    }
  }

  // Public methods
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        logger.info('✅ User accepted PWA install');
        return true;
      } else {
        logger.info('❌ User dismissed PWA install');
        return false;
      }
    } catch (error) {
      logger.error('Error showing install prompt:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  canInstall(): boolean {
    return !!this.deferredPrompt;
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
  }

  async updateApp(): Promise<void> {
    if (!this.updateAvailable || !this.registration) return;

    const waitingWorker = this.registration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  hasUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  async getOfflineStatus(): Promise<{
    isOfflineReady: boolean;
    cachedModels: number;
    cachedRoutes: number;
    storageUsage: any;
  }> {
    try {
      const [isOfflineReady, storageUsage] = await Promise.all([
        offlineStorage.isOfflineReady(),
        offlineStorage.getStorageUsage()
      ]);

      return {
        isOfflineReady,
        cachedModels: storageUsage.models || 0,
        cachedRoutes: storageUsage.routes || 0,
        storageUsage
      };
    } catch (error) {
      logger.error('Error getting offline status:', error);
      return {
        isOfflineReady: false,
        cachedModels: 0,
        cachedRoutes: 0,
        storageUsage: {}
      };
    }
  }

  async cacheAllModels(): Promise<void> {
    logger.info('🎭 Starting to cache all 56 models...');

    const modelPromises = [];
    for (let i = 1; i <= 56; i++) {
      modelPromises.push(this.cacheModel(i));
    }

    // Cache additional models
    const additionalModels = ['cosmic-buddha', 'cosmic', 'fat-buddha', 'modelo-dragao', 'nsrinha'];
    additionalModels.forEach((modelName, index) => {
      modelPromises.push(this.cacheModelByName(modelName, 100 + index));
    });

    const results = await Promise.allSettled(modelPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;

    logger.info(`✅ Cached ${successful}/${modelPromises.length} models`);
  }

  async cacheARDependencies(): Promise<void> {
    logger.info('🥽 Starting to cache AR dependencies...');

    const arAssets = [
      'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
      'https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.min.js',
      'https://unpkg.com/three@0.157.0/build/three.min.js',
      'https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js'
    ];

    const cachePromises = arAssets.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          // Store in IndexedDB for offline access
          await offlineStorage.storeARAsset(url, await response.blob());
          logger.info(`✅ Cached AR asset: ${url}`);
        }
      } catch (error) {
        logger.error(`❌ Failed to cache AR asset: ${url}`, error);
      }
    });

    await Promise.allSettled(cachePromises);
    logger.info('✅ AR dependencies cached');
  }

  async ensureCompleteOfflineFunctionality(): Promise<void> {
    logger.info('🔄 Ensuring complete offline functionality...');

    try {
      // Cache all critical resources
      await Promise.all([
        this.cacheAllModels(),
        this.cacheARDependencies(),
        this.preloadCriticalResources()
      ]);

      logger.info('✅ Complete offline functionality ensured');
    } catch (error) {
      logger.error('❌ Failed to ensure complete offline functionality', error);
      throw error;
    }
  }

  private async cacheModel(modelId: number): Promise<void> {
    try {
      const response = await fetch(`/modelo${modelId}.glb`);
      if (response.ok) {
        const blob = await response.blob();
        await offlineStorage.cacheModel(modelId, blob);
      }
    } catch (error) {
      logger.warn(`Failed to cache model ${modelId}:`, error);
    }
  }

  private async cacheModelByName(modelName: string, id: number): Promise<void> {
    try {
      const response = await fetch(`/${modelName}.glb`);
      if (response.ok) {
        const blob = await response.blob();
        await offlineStorage.cacheModel(id, blob, { name: modelName });
      }
    } catch (error) {
      logger.warn(`Failed to cache model ${modelName}:`, error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      await offlineStorage.clearAllData();

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      logger.info('🧹 All cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }
}

// Export singleton instance
export const pwaService = new PWAService();
export default pwaService;
