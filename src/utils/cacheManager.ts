// Cache Manager Utility
// Tools to manage browser storage and resolve QuotaExceededError issues

interface StorageInfo {
  usage: number;
  quota: number;
  usagePercent: number;
  available: number;
}

interface CacheStatus {
  cacheNames: string[];
  totalCaches: number;
  storage: StorageInfo;
}

class CacheManager {
  /**
   * Get current storage usage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usagePercent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      const available = quota - usage;

      return {
        usage,
        quota,
        usagePercent,
        available
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        usage: 0,
        quota: 0,
        usagePercent: 0,
        available: 0
      };
    }
  }

  /**
   * Get cache status information
   */
  async getCacheStatus(): Promise<CacheStatus> {
    try {
      const cacheNames = await caches.keys();
      const storage = await this.getStorageInfo();

      return {
        cacheNames,
        totalCaches: cacheNames.length,
        storage
      };
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return {
        cacheNames: [],
        totalCaches: 0,
        storage: await this.getStorageInfo()
      };
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      console.log(`🧹 Clearing ${cacheNames.length} caches...`);

      await Promise.all(
        cacheNames.map(async (cacheName) => {
          try {
            await caches.delete(cacheName);
            console.log(`✅ Cleared cache: ${cacheName}`);
          } catch (error) {
            console.error(`❌ Failed to clear cache ${cacheName}:`, error);
          }
        })
      );

      console.log('✅ All caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear caches:', error);
      throw error;
    }
  }

  /**
   * Clear old/outdated caches only
   */
  async clearOldCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      const currentVersion = 'v1'; // Update this when you want to clear old versions
      
      const oldCaches = cacheNames.filter(name => 
        name.includes('technosutra') && !name.includes(currentVersion)
      );

      console.log(`🧹 Clearing ${oldCaches.length} old caches...`);

      await Promise.all(
        oldCaches.map(async (cacheName) => {
          try {
            await caches.delete(cacheName);
            console.log(`✅ Cleared old cache: ${cacheName}`);
          } catch (error) {
            console.error(`❌ Failed to clear old cache ${cacheName}:`, error);
          }
        })
      );

      console.log('✅ Old caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear old caches:', error);
      throw error;
    }
  }

  /**
   * Clear IndexedDB data
   */
  async clearIndexedDB(): Promise<void> {
    try {
      const databases = await indexedDB.databases();
      console.log(`🧹 Clearing ${databases.length} IndexedDB databases...`);

      await Promise.all(
        databases.map(async (db) => {
          if (db.name) {
            try {
              const deleteRequest = indexedDB.deleteDatabase(db.name);
              await new Promise((resolve, reject) => {
                deleteRequest.onsuccess = () => resolve(undefined);
                deleteRequest.onerror = () => reject(deleteRequest.error);
              });
              console.log(`✅ Cleared IndexedDB: ${db.name}`);
            } catch (error) {
              console.error(`❌ Failed to clear IndexedDB ${db.name}:`, error);
            }
          }
        })
      );

      console.log('✅ IndexedDB cleared successfully');
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Clear localStorage
   */
  async clearLocalStorage(): Promise<void> {
    try {
      const itemCount = localStorage.length;
      localStorage.clear();
      console.log(`✅ Cleared ${itemCount} localStorage items`);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      throw error;
    }
  }

  /**
   * Clear sessionStorage
   */
  async clearSessionStorage(): Promise<void> {
    try {
      const itemCount = sessionStorage.length;
      sessionStorage.clear();
      console.log(`✅ Cleared ${itemCount} sessionStorage items`);
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
      throw error;
    }
  }

  /**
   * Comprehensive cleanup - clears everything
   */
  async fullCleanup(): Promise<void> {
    console.log('🧹 Starting full cleanup...');
    
    try {
      await this.clearAllCaches();
      await this.clearIndexedDB();
      await this.clearLocalStorage();
      await this.clearSessionStorage();
      
      console.log('✅ Full cleanup completed successfully');
      console.log('🔄 Please refresh the page to restart the application');
    } catch (error) {
      console.error('Full cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Safe cleanup - clears only old data
   */
  async safeCleanup(): Promise<void> {
    console.log('🧹 Starting safe cleanup...');
    
    try {
      await this.clearOldCaches();
      
      // Clear specific localStorage items that might be causing issues
      const itemsToRemove = [
        'technosutra-cache-',
        'technosutra-offline-',
        'technosutra-temp-'
      ];
      
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && itemsToRemove.some(prefix => key.startsWith(prefix))) {
          localStorage.removeItem(key);
          console.log(`✅ Removed localStorage item: ${key}`);
        }
      }
      
      console.log('✅ Safe cleanup completed successfully');
    } catch (error) {
      console.error('Safe cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Log current storage status
   */
  async logStorageStatus(): Promise<void> {
    try {
      const status = await this.getCacheStatus();
      
      console.log('📊 Storage Status:');
      console.log(`  Usage: ${(status.storage.usage / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Quota: ${(status.storage.quota / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Usage Percent: ${status.storage.usagePercent}%`);
      console.log(`  Available: ${(status.storage.available / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Caches: ${status.totalCaches}`);
      console.log(`  Cache Names:`, status.cacheNames);
    } catch (error) {
      console.error('Failed to log storage status:', error);
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Expose to global scope for easy console access
if (typeof window !== 'undefined') {
  (window as any).cacheManager = cacheManager;
  (window as any).clearCache = () => cacheManager.fullCleanup();
  (window as any).safeCleanup = () => cacheManager.safeCleanup();
  (window as any).storageStatus = () => cacheManager.logStorageStatus();
}

export default cacheManager;
