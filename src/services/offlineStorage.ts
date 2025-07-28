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
        // Attempt recovery by deleting and recreating the database
        this.recoverDatabase().then(resolve).catch(reject);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');

        // Set up error handling for the database connection
        this.db.onerror = (event) => {
          console.error('IndexedDB error:', event);
        };

        // Handle database version changes
        this.db.onversionchange = () => {
          console.log('🔄 Database version changed, closing connection');
          this.db?.close();
          this.db = null;
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 Upgrading IndexedDB schema...');

        // Create object stores with enhanced configuration
        Object.entries(DB_CONFIG.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: config.keyPath });

            // Create indexes for better query performance
            config.indexes?.forEach(index => {
              try {
                store.createIndex(index.name, index.keyPath, { unique: index.unique || false });
              } catch (error) {
                console.warn(`Failed to create index ${index.name}:`, error);
              }
            });

            console.log(`📦 Created store: ${storeName}`);
          }
        });

        // Add additional stores for enhanced offline functionality
        if (!db.objectStoreNames.contains('appSettings')) {
          const settingsStore = db.createObjectStore('appSettings', { keyPath: 'key' });
          console.log('📦 Created store: appSettings');
        }

        if (!db.objectStoreNames.contains('offlineQueue')) {
          const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('📦 Created store: offlineQueue');
        }
      };

      request.onblocked = () => {
        console.warn('⚠️ IndexedDB upgrade blocked by another connection');
      };
    });
  }

  // Database recovery mechanism
  private async recoverDatabase(): Promise<IDBDatabase> {
    try {
      console.log('🔧 Attempting database recovery...');

      // Delete the corrupted database
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_CONFIG.name);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });

      // Recreate the database
      this.db = null;
      this.initPromise = null;
      return this.initDB();
    } catch (error) {
      console.error('❌ Database recovery failed:', error);
      throw error;
    }
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

  // Cache all available 3D models for complete offline functionality
  async cacheAllModels(): Promise<void> {
    console.log('🎭 Starting to cache all 3D models...');

    const modelUrls = [];

    // Add all numbered models (1-56)
    for (let i = 1; i <= 56; i++) {
      modelUrls.push(`/modelo${i}.glb`);
    }

    // Add special models
    const specialModels = [
      '/cosmic-buddha.glb',
      '/cosmic.glb',
      '/fat-buddha.glb',
      '/modelo-dragao.glb',
      '/nsrinha.glb'
    ];

    modelUrls.push(...specialModels);

    const cachePromises = modelUrls.map(async (url) => {
      try {
        // Extract model ID from URL
        const modelId = this.extractModelIdFromUrl(url);

        // Check if already cached
        const existingModel = await this.getCachedModel(modelId);
        if (existingModel) {
          console.log(`✅ Model already cached: ${url}`);
          return;
        }

        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          await this.cacheModel(modelId, blob, {
            url,
            name: url.split('/').pop()?.replace('.glb', '') || `model-${modelId}`
          });
          console.log(`✅ Cached model: ${url}`);
        } else {
          console.warn(`⚠️ Model not found: ${url}`);
        }
      } catch (error) {
        console.error(`❌ Failed to cache model: ${url}`, error);
      }
    });

    await Promise.allSettled(cachePromises);
    console.log('✅ All available models cached for offline use');
  }

  private extractModelIdFromUrl(url: string): number {
    const match = url.match(/modelo(\d+)\.glb/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Handle special models with unique IDs
    const specialModelIds: { [key: string]: number } = {
      'cosmic-buddha.glb': 1001,
      'cosmic.glb': 1002,
      'fat-buddha.glb': 1003,
      'modelo-dragao.glb': 1004,
      'nsrinha.glb': 1005
    };

    const filename = url.split('/').pop() || '';
    return specialModelIds[filename] || Date.now();
  }

  // Character data storage with enhanced functionality
  async cacheCharacters(characters: any[]): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['characters'], 'readwrite');
    const store = transaction.objectStore('characters');

    const promises = characters.map(character => {
      return new Promise<void>((resolve, reject) => {
        const request = store.put({
          ...character,
          cached: new Date().toISOString(),
          version: '1.1.0'
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`👥 Cached ${characters.length} characters`);
  }

  // Cache all CSV data files for complete offline functionality
  async cacheAllCSVData(): Promise<void> {
    console.log('📄 Starting to cache all CSV data...');

    const csvFiles = [
      'characters.csv',
      'characters_en.csv',
      'chapters.csv',
      'chapters_en.csv',
      'sutra.csv',
      'waypoint-coordinates.json'
    ];

    const cachePromises = csvFiles.map(async (filename) => {
      try {
        const response = await fetch(`/${filename}`);
        if (response.ok) {
          const text = await response.text();

          // Store in IndexedDB
          await this.put('appSettings', {
            key: `csv-${filename}`,
            data: text,
            cached: new Date().toISOString(),
            version: '1.1.0'
          });

          // Also store in localStorage as fallback
          localStorage.setItem(`cached-${filename}`, text);

          console.log(`✅ Cached CSV data: ${filename}`);
        } else {
          console.warn(`⚠️ CSV file not found: ${filename}`);
        }
      } catch (error) {
        console.error(`❌ Failed to cache CSV: ${filename}`, error);
      }
    });

    await Promise.allSettled(cachePromises);
    console.log('✅ All CSV data cached for offline use');
  }

  // Get cached CSV data with fallback to localStorage
  async getCachedCSVData(filename: string): Promise<string | null> {
    try {
      // Try IndexedDB first
      const cached = await this.get('appSettings', `csv-${filename}`);
      if (cached?.data) {
        return cached.data;
      }

      // Fallback to localStorage
      const fallback = localStorage.getItem(`cached-${filename}`);
      if (fallback) {
        console.log(`📄 Using localStorage fallback for: ${filename}`);
        return fallback;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get cached CSV data: ${filename}`, error);
      return localStorage.getItem(`cached-${filename}`) || null;
    }
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

  // Map tiles storage with enhanced functionality for Águas da Prata region
  async cacheMapTile(url: string, blob: Blob, style: string, metadata: any = {}): Promise<void> {
    const tileData = {
      url,
      blob,
      style,
      cached: new Date().toISOString(),
      size: blob.size,
      version: '1.1.0',
      ...metadata
    };

    await this.put('mapTiles', tileData);
    console.log(`🗺️ Cached map tile: ${style} (${blob.size} bytes)`);
  }

  // Cache all map tiles for the Águas da Prata region
  async cacheRegionMapTiles(): Promise<void> {
    console.log('🗺️ Starting to cache map tiles for Águas da Prata region...');

    const mapStyles = [
      { name: 'backdrop', url: 'https://api.maptiler.com/maps/backdrop/style.json' },
      { name: 'satellite', url: 'https://api.maptiler.com/maps/satellite/style.json' },
      { name: 'streets-v2', url: 'https://api.maptiler.com/maps/streets-v2/style.json' }
    ];

    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ MapTiler API key not found - skipping map tile caching');
      return;
    }

    // Define the region bounds for Águas da Prata
    const bounds = {
      north: -21.8000,
      south: -22.0000,
      east: -46.6000,
      west: -46.8000
    };

    const zoomLevels = [10, 11, 12, 13, 14, 15, 16]; // Practical zoom levels for hiking

    const cachePromises = mapStyles.map(async (style) => {
      try {
        console.log(`🗺️ Caching ${style.name} tiles...`);

        for (const zoom of zoomLevels) {
          const tiles = this.getTilesInBounds(bounds, zoom);

          // Limit concurrent requests
          const batchSize = 5;
          for (let i = 0; i < tiles.length; i += batchSize) {
            const batch = tiles.slice(i, i + batchSize);

            await Promise.allSettled(
              batch.map(async ({ x, y, z }) => {
                try {
                  const tileUrl = `https://api.maptiler.com/maps/${style.name}/${z}/${x}/${y}.png?key=${apiKey}`;

                  // Check if already cached
                  const existing = await this.get('mapTiles', tileUrl);
                  if (existing && existing.version === '1.1.0') {
                    return;
                  }

                  const response = await fetch(tileUrl);
                  if (response.ok) {
                    const blob = await response.blob();
                    await this.cacheMapTile(tileUrl, blob, style.name, {
                      x, y, z,
                      bounds,
                      region: 'aguas-da-prata'
                    });
                  }
                } catch (error) {
                  console.warn(`Failed to cache tile ${style.name}/${z}/${x}/${y}:`, error);
                }
              })
            );

            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(`✅ Cached ${style.name} tiles`);
      } catch (error) {
        console.error(`❌ Failed to cache ${style.name} tiles:`, error);
      }
    });

    await Promise.allSettled(cachePromises);
    console.log('✅ All map tiles cached for offline use');
  }

  // Calculate tile coordinates for a given bounding box and zoom level
  private getTilesInBounds(bounds: any, zoom: number): Array<{x: number, y: number, z: number}> {
    const tiles = [];

    // Convert lat/lng to tile coordinates
    const minTileX = Math.floor(((bounds.west + 180) / 360) * Math.pow(2, zoom));
    const maxTileX = Math.floor(((bounds.east + 180) / 360) * Math.pow(2, zoom));
    const minTileY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    const maxTileY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles;
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
      const [models, characters, _routes] = await Promise.all([
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
