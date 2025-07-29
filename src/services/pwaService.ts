// TECHNO SUTRA PWA Service
// Handles service worker registration, updates, and offline functionality

import { logger } from '@/lib/logger';
import { offlineStorage } from './offlineStorage';

interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

class PWAService {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private registration: ServiceWorkerRegistrationWithSync | null = null;
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

    logger.info('🚀 PWA Service initialized');
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        }) as ServiceWorkerRegistrationWithSync;

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

      // Background sync for service worker (if supported)
      // Note: Background Sync API is experimental and not widely supported
      try {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          // Background sync feature is available
          logger.info('✅ Background sync is supported');
        }
      } catch (error) {
        logger.warn('Background sync not supported:', error);
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

        // Wait for the new service worker to take control before reloading
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
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
