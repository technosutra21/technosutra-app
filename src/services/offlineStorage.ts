// TECHNO SUTRA Offline Storage Service
// Advanced IndexedDB management for Buddhist trail hiking app

interface DBConfig {
  name: string;
  version: number;
  stores: {
    [key: string]: {
      keyPath: string;
      indexes?: { name: string; keyPath: string; unique?: boolean }[];
    };
  };
}

const DB_CONFIG: DBConfig = {
  name: 'TechnoSutraDB',
  version: 1,
  stores: {
    models: {
      keyPath: 'id',
      indexes: [
        { name: 'chapter', keyPath: 'chapter', unique: false },
        { name: 'cached', keyPath: 'cached', unique: false }
      ]
    },
    routes: {
      keyPath: 'id',
      indexes: [
        { name: 'created', keyPath: 'created', unique: false },
        { name: 'type', keyPath: 'type', unique: false }
      ]
    },
    characters: {
      keyPath: 'chapter',
      indexes: [
        { name: 'nome', keyPath: 'nome', unique: false },
        { name: 'ocupacao', keyPath: 'ocupacao', unique: false }
      ]
    },
    mapTiles: {
      keyPath: 'url',
      indexes: [
        { name: 'style', keyPath: 'style', unique: false },
        { name: 'cached', keyPath: 'cached', unique: false }
      ]
    },
    userProgress: {
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    gallery: {
      keyPath: 'id',
      indexes: [
        { name: 'type', keyPath: 'type', unique: false },
        { name: 'cached', keyPath: 'cached', unique: false }
      ]
    },
    arAssets: {
      keyPath: 'url',
      indexes: [
        { name: 'cached', keyPath: 'cached', unique: false },
        { name: 'type', keyPath: 'type', unique: false }
      ]
    },
    arSessions: {
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false },
        { name: 'modelId', keyPath: 'modelId', unique: false }
      ]
    }
  }
};

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initPromise = this.initDB();
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 Upgrading IndexedDB schema...');

        // Create object stores
        Object.entries(DB_CONFIG.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: config.keyPath });

            // Create indexes
            config.indexes?.forEach(index => {
              store.createIndex(index.name, index.keyPath, { unique: index.unique || false });
            });

            console.log(`📦 Created store: ${storeName}`);
          }
        });
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.initPromise) {
      this.initPromise = this.initDB();
    }
    return this.initPromise;
  }

  // Generic CRUD operations
  async put(storeName: string, data: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, key: any): Promise<any> {
    const db = await this.getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 3D Models storage
  async cacheModel(modelId: number, blob: Blob, metadata: any = {}): Promise<void> {
    const modelData = {
      id: modelId,
      chapter: modelId,
      blob: blob,
      cached: new Date().toISOString(),
      size: blob.size,
      type: blob.type,
      ...metadata
    };

    await this.put('models', modelData);
    console.log(`🎭 Cached 3D model ${modelId}`);
  }

  async getCachedModel(modelId: number): Promise<Blob | null> {
    const modelData = await this.get('models', modelId);
    return modelData?.blob || null;
  }

  async getAllCachedModels(): Promise<any[]> {
    return this.getAll('models');
  }

  // Character data storage
  async cacheCharacters(characters: any[]): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['characters'], 'readwrite');
    const store = transaction.objectStore('characters');

    const promises = characters.map(character => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put({
          ...character,
          cached: new Date().toISOString()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`👥 Cached ${characters.length} characters`);
  }

  async getCachedCharacters(): Promise<any[]> {
    return this.getAll('characters');
  }

  // Route storage
  async saveRoute(route: any): Promise<void> {
    const routeData = {
      ...route,
      id: route.id || `route-${Date.now()}`,
      created: route.created || new Date().toISOString(),
      cached: new Date().toISOString()
    };

    await this.put('routes', routeData);
    console.log(`🛤️ Saved route: ${routeData.name}`);
  }

  async getRoutes(): Promise<any[]> {
    return this.getAll('routes');
  }

  async deleteRoute(routeId: string): Promise<void> {
    await this.delete('routes', routeId);
    console.log(`🗑️ Deleted route: ${routeId}`);
  }

  // Map tiles storage
  async cacheMapTile(url: string, blob: Blob, style: string): Promise<void> {
    const tileData = {
      url,
      blob,
      style,
      cached: new Date().toISOString(),
      size: blob.size
    };

    await this.put('mapTiles', tileData);
  }

  async getCachedMapTile(url: string): Promise<Blob | null> {
    const tileData = await this.get('mapTiles', url);
    return tileData?.blob || null;
  }

  // User progress storage
  async saveUserProgress(progress: any): Promise<void> {
    const progressData = {
      id: 'user-progress',
      ...progress,
      timestamp: new Date().toISOString()
    };

    await this.put('userProgress', progressData);
    console.log('💾 Saved user progress');
  }

  async getUserProgress(): Promise<any> {
    return this.get('userProgress', 'user-progress');
  }

  // Gallery data storage
  async cacheGalleryData(galleryItems: any[]): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['gallery'], 'readwrite');
    const store = transaction.objectStore('gallery');

    const promises = galleryItems.map(item => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put({
          ...item,
          cached: new Date().toISOString()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`🖼️ Cached ${galleryItems.length} gallery items`);
  }

  async getCachedGalleryData(): Promise<any[]> {
    return this.getAll('gallery');
  }

  // Utility methods
  async getStorageUsage(): Promise<{ [storeName: string]: number }> {
    const usage: { [storeName: string]: number } = {};

    for (const storeName of Object.keys(DB_CONFIG.stores)) {
      const items = await this.getAll(storeName);
      usage[storeName] = items.length;
    }

    return usage;
  }

  async clearAllData(): Promise<void> {
    for (const storeName of Object.keys(DB_CONFIG.stores)) {
      await this.clear(storeName);
    }
    console.log('🧹 Cleared all offline data');
  }

  // Check if app can work offline
  async isOfflineReady(): Promise<boolean> {
    try {
      const [models, characters, routes] = await Promise.all([
        this.getAllCachedModels(),
        this.getCachedCharacters(),
        this.getRoutes()
      ]);

      return models.length > 0 && characters.length > 0;
    } catch (error) {
      console.error('Error checking offline readiness:', error);
      return false;
    }
  }
  // AR Asset Management
  async storeARAsset(url: string, blob: Blob): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['arAssets'], 'readwrite');
    const store = transaction.objectStore('arAssets');

    const arAsset = {
      url,
      blob,
      type: this.getARAssetType(url),
      cached: Date.now(),
      size: blob.size
    };

    await this.promisifyRequest(store.put(arAsset));
    console.log(`🥽 Cached AR asset: ${url}`);
  }

  async getARAsset(url: string): Promise<Blob | null> {
    const db = await this.getDB();
    const transaction = db.transaction(['arAssets'], 'readonly');
    const store = transaction.objectStore('arAssets');

    const result = await this.promisifyRequest(store.get(url));
    return result?.blob || null;
  }

  async getAllARAssets(): Promise<any[]> {
    const db = await this.getDB();
    const transaction = db.transaction(['arAssets'], 'readonly');
    const store = transaction.objectStore('arAssets');

    return this.promisifyRequest(store.getAll());
  }

  async clearARAssets(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['arAssets'], 'readwrite');
    const store = transaction.objectStore('arAssets');

    await this.promisifyRequest(store.clear());
    console.log('🗑️ Cleared all AR assets');
  }

  // AR Session Management
  async storeARSession(sessionData: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['arSessions'], 'readwrite');
    const store = transaction.objectStore('arSessions');

    const session = {
      id: `ar-session-${Date.now()}`,
      timestamp: Date.now(),
      ...sessionData
    };

    await this.promisifyRequest(store.put(session));
  }

  async getARSessions(): Promise<any[]> {
    const db = await this.getDB();
    const transaction = db.transaction(['arSessions'], 'readonly');
    const store = transaction.objectStore('arSessions');

    return this.promisifyRequest(store.getAll());
  }

  private getARAssetType(url: string): string {
    if (url.includes('model-viewer')) return 'model-viewer';
    if (url.includes('webxr-polyfill')) return 'webxr-polyfill';
    if (url.includes('three')) return 'three.js';
    return 'unknown';
  }

  // Enhanced offline readiness check including AR
  async isCompletelyOfflineReady(): Promise<boolean> {
    try {
      const [models, characters, routes, arAssets] = await Promise.all([
        this.getAllCachedModels(),
        this.getCachedCharacters(),
        this.getRoutes(),
        this.getAllARAssets()
      ]);

      return models.length >= 56 &&
        characters.length > 0 &&
        arAssets.length >= 4; // At least 4 critical AR dependencies
    } catch (error) {
      console.error('Error checking complete offline readiness:', error);
      return false;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
export default offlineStorage;
