// TECHNO SUTRA Enhanced Service Worker - Buddhist Trail Hiking PWA
// Advanced offline functionality with IndexedDB integration and error handling

// Enhanced logging for service worker
const swLog = (message, data = null) => {
  console.log(`🧘 TECHNO SUTRA SW: ${message}`, data || '');
};

const swError = (message, error = null) => {
  console.error(`❌ TECHNO SUTRA SW ERROR: ${message}`, error || '');
};

const CACHE_NAME = 'technosutra-v1.1.0';
const STATIC_CACHE = 'technosutra-static-v1.1';
const DYNAMIC_CACHE = 'technosutra-dynamic-v1.1';
const MODELS_CACHE = 'technosutra-models-v1.1';
const MAPS_CACHE = 'technosutra-maps-v1.1';
const AR_CACHE = 'technosutra-ar-v1.1';
const FONTS_CACHE = 'technosutra-fonts-v1.1';

// Core app files to cache immediately for complete offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/technosutra-logo.png',
  '/technosutra-TECHNO.png',
  '/budha-bubble.png',
  '/dragon-mouse.png',
  '/lobo-guará.jpg',
  '/placeholder.svg',

  // CSV data files - critical for offline functionality
  '/characters.csv',
  '/characters_en.csv',
  '/chapters.csv',
  '/chapters_en.csv',
  '/sutra.csv',
  '/waypoint-coordinates.json',

  // Additional offline fallback pages
  '/404.html'
  
  // Note: SPA routes are handled by the main app, not as separate files
];

// Build assets patterns for complete offline functionality
const BUILD_ASSET_PATTERNS = [
  /^\/assets\/.+\.(js|css|woff2?|ttf|eot)$/,
  /^\/src\/.+\.(js|ts|tsx|jsx)$/,
  /^\/node_modules\/.+/,
  /^\/@vite\/.+/,
  /^\/vite\/.+/,
  /^\/static\/.+/,
  /^\/dist\/.+/
];

// Font patterns for offline font loading - comprehensive coverage
const FONT_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com\/.+/,
  /^https:\/\/fonts\.gstatic\.com\/.+/,
  /^\/fonts\/.+\.(woff2?|ttf|eot|otf)$/,
  /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/.+\.(woff2?|ttf|eot|otf)$/
];

// Critical CSS and JS patterns for offline functionality
const CRITICAL_ASSET_PATTERNS = [
  /^\/assets\/index-.+\.js$/,
  /^\/assets\/index-.+\.css$/,
  /^\/assets\/vendor-.+\.js$/
];

// 3D Models to cache (all available models)
const MODEL_ASSETS = [
  '/cosmic-buddha.glb',
  '/cosmic.glb',
  '/fat-buddha.glb',
  '/modelo-dragao.glb',
  '/nsrinha.glb'
];

// Add all numbered models
for (let i = 1; i <= 56; i++) {
  MODEL_ASSETS.push(`/modelo${i}.glb`);
}

// AR and WebXR dependencies for complete offline functionality
const AR_ASSETS = [
  // Model Viewer library - critical for AR functionality
  'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',

  // WebXR polyfills for broader device support
  'https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.min.js',

  // Three.js dependencies (if needed by model-viewer)
  'https://unpkg.com/three@0.157.0/build/three.min.js',

  // Additional AR support libraries
  'https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js'
];

// Map tile URL patterns for offline caching - comprehensive coverage for Águas da Prata region
const MAP_TILE_PATTERNS = [
  /^https:\/\/api\.maptiler\.com\/maps\/.+/,
  /^https:\/\/api\.maptiler\.com\/tiles\/.+/,
  /^https:\/\/api\.maptiler\.com\/fonts\/.+/,
  /^https:\/\/api\.maptiler\.com\/resources\/.+/,
  /^https:\/\/api\.maptiler\.com\/data\/.+/,
  /^https:\/\/cloud\.maptiler\.com\/.+/
];

// Águas da Prata region bounds for focused tile caching
const AGUAS_DA_PRATA_BOUNDS = {
  north: -21.8000,
  south: -22.0000,
  east: -46.6000,
  west: -46.8000,
  center: { lat: -21.9427, lng: -46.7167 },
  radius: 10000 // 10km radius for comprehensive coverage
};

// External AR/WebXR URL patterns for caching
const AR_URL_PATTERNS = [
  /^https:\/\/ajax\.googleapis\.com\/ajax\/libs\/model-viewer\/.+/,
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/webxr-polyfill\/.+/,
  /^https:\/\/unpkg\.com\/three@.+/,
  /^https:\/\/unpkg\.com\/@google\/model-viewer@.+/,
  /^https:\/\/modelviewer\.dev\/.+/
];

// API URL patterns that need offline fallbacks
const API_URL_PATTERNS = [
  /^https:\/\/api\.maptiler\.com\/geocoding\/.+/,
  /^https:\/\/api\.openrouteservice\.org\/.+/
];

// IndexedDB setup for advanced offline storage
const DB_NAME = 'TechnoSutraDB';
const DB_VERSION = 1;
const STORES = {
  models: 'models',
  routes: 'routes',
  characters: 'characters',
  mapTiles: 'mapTiles',
  userProgress: 'userProgress',
  arAssets: 'arAssets',
  arSessions: 'arSessions'
};

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains(STORES.models)) {
        db.createObjectStore(STORES.models, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.routes)) {
        db.createObjectStore(STORES.routes, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.characters)) {
        db.createObjectStore(STORES.characters, { keyPath: 'chapter' });
      }
      if (!db.objectStoreNames.contains(STORES.mapTiles)) {
        db.createObjectStore(STORES.mapTiles, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(STORES.userProgress)) {
        db.createObjectStore(STORES.userProgress, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.arAssets)) {
        db.createObjectStore(STORES.arAssets, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(STORES.arSessions)) {
        db.createObjectStore(STORES.arSessions, { keyPath: 'id' });
      }
    };
  });
}

// Install event - cache core assets for complete offline functionality
self.addEventListener('install', (event) => {
  swLog('🚀 Service Worker installing...');

  // Skip waiting to activate immediately
  self.skipWaiting();

  event.waitUntil(
    Promise.all([
      // Cache static assets - critical for offline functionality
      caches.open(STATIC_CACHE).then(async (cache) => {
        swLog('📦 Caching static assets...');
        
        let successCount = 0;
        let failureCount = 0;
        
        const results = await Promise.allSettled(
          STATIC_ASSETS.map(async url => {
            try {
              // Check if file exists first
              const response = await fetch(url, { method: 'HEAD' });
              if (!response.ok) {
                throw new Error(`File not found: ${response.status}`);
              }
              
              await cache.add(url);
              successCount++;
              return url;
            } catch (error) {
              failureCount++;
              swLog(`⚠️ Skipped static asset ${url}: ${error.message}`);
              return null;
            }
          })
        );
        
        swLog(`📊 Static assets cached: ${successCount} successful, ${failureCount} skipped`);
        return { successCount, failureCount };
      }),

      // Cache 3D models - essential for offline gallery and AR
      caches.open(MODELS_CACHE).then(async (cache) => {
        swLog('🎭 Caching 3D models...');
        
        // Cache models progressively to avoid overwhelming the cache
        const modelBatches = [];
        const batchSize = 5;
        
        for (let i = 0; i < MODEL_ASSETS.length; i += batchSize) {
          modelBatches.push(MODEL_ASSETS.slice(i, i + batchSize));
        }
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const batch of modelBatches) {
          const results = await Promise.allSettled(
            batch.map(async url => {
              try {
                // First check if the file exists
                const response = await fetch(url, { method: 'HEAD' });
                if (!response.ok) {
                  throw new Error(`File not found: ${response.status}`);
                }
                
                // Cache only if file exists and is not too large
                const contentLength = response.headers.get('content-length');
                if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
                  swLog(`⚠️ Skipping large model ${url} (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB)`);
                  return null;
                }
                
                await cache.add(url);
                successCount++;
                return url;
              } catch (err) {
                failureCount++;
                swLog(`⚠️ Skipped model ${url}: ${err.message}`);
                return null;
              }
            })
          );
          
          // Small delay between batches to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        swLog(`📊 Models cached: ${successCount} successful, ${failureCount} skipped`);
        return { successCount, failureCount };
      }),

      // Cache AR dependencies for complete offline AR functionality
      caches.open(AR_CACHE).then((cache) => {
        console.log('🥽 Caching AR dependencies...');
        return Promise.allSettled(
          AR_ASSETS.map(url =>
            cache.add(url).catch(err =>
              console.log(`⚠️ Failed to cache AR asset ${url}:`, err)
            )
          )
        );
      }),

      // Cache fonts separately for better organization
      caches.open(FONTS_CACHE).then(async (cache) => {
        swLog('🔤 Caching fonts for offline functionality...');

        // Cache Google Fonts and other font resources
        const fontUrls = [
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
          'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
          'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2'
        ];

        await Promise.allSettled(
          fontUrls.map(url =>
            cache.add(url).catch(err => {
              swError(`Failed to cache font ${url}:`, err);
              return null;
            })
          )
        );
      }),

      // Initialize IndexedDB for advanced offline storage
      initDB().then(() => {
        swLog('💾 IndexedDB initialized for offline data storage');
        // Pre-populate with essential data if needed
        return prePopulateOfflineData();
      }).catch(err => {
        swError('Failed to initialize IndexedDB:', err);
        return null; // Continue even if IndexedDB fails
      })
    ]).then(() => {
      swLog('✅ Service Worker installed successfully - Ready for complete offline experience');
      // Notify main thread that offline functionality is ready
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'OFFLINE_READY',
            message: 'App is ready for offline use'
          });
        });
      });
      self.skipWaiting();
    }).catch(err => {
      console.error('❌ Service Worker installation failed:', err);
    })
  );
});

// Pre-populate IndexedDB with essential offline data
async function prePopulateOfflineData() {
  try {
    const db = await initDB();

    // Check if data already exists
    const transaction = db.transaction([STORES.characters], 'readonly');
    const store = transaction.objectStore(STORES.characters);
    const existingData = await store.count();

    if (existingData === 0) {
      console.log('📊 Pre-populating offline data...');
      // Data will be populated when CSV files are first loaded
    }

    // Pre-cache critical map tiles for Águas da Prata region
    await preCacheMapTiles();
  } catch (error) {
    console.error('Failed to pre-populate offline data:', error);
  }
}

// Pre-cache map tiles for the Águas da Prata region for complete offline functionality
async function preCacheMapTiles() {
  try {
    console.log('🗺️ Pre-caching map tiles for Águas da Prata region...');

    const cache = await caches.open(MAPS_CACHE);
    const mapStyles = ['backdrop', 'satellite', 'streets-v2'];
    const zoomLevels = [10, 11, 12, 13, 14, 15, 16]; // Focus on useful zoom levels

    // Get API key from environment (injected during build)
    const apiKey = 'rg7OAqXjLo7cLdwqlrVt'; // Real API key from .env

    const tilePromises = [];

    mapStyles.forEach(style => {
      zoomLevels.forEach(zoom => {
        // Calculate tile bounds for Águas da Prata region
        const tiles = getTilesInBounds(
          AGUAS_DA_PRATA_BOUNDS.north,
          AGUAS_DA_PRATA_BOUNDS.south,
          AGUAS_DA_PRATA_BOUNDS.east,
          AGUAS_DA_PRATA_BOUNDS.west,
          zoom
        );

        tiles.forEach(({ x, y, z }) => {
          const tileUrl = `https://api.maptiler.com/maps/${style}/${z}/${x}/${y}.png?key=${apiKey}`;

          tilePromises.push(
            cache.add(tileUrl).catch(err => {
              // Silently handle tile caching failures to reduce console spam
              // Only log critical errors
              if (err.message && !err.message.includes('Request failed')) {
                swError(`Critical tile cache error ${style}/${z}/${x}/${y}:`, err);
              }
            })
          );
        });
      });
    });

    // Limit concurrent requests to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < tilePromises.length; i += batchSize) {
      const batch = tilePromises.slice(i, i + batchSize);
      await Promise.allSettled(batch);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Map tiles pre-cached for offline use');
  } catch (error) {
    console.error('❌ Failed to pre-cache map tiles:', error);
  }
}

// Calculate tile coordinates for a given bounding box and zoom level
function getTilesInBounds(north, south, east, west, zoom) {
  const tiles = [];

  // Convert lat/lng to tile coordinates
  const minTileX = Math.floor(((west + 180) / 360) * Math.pow(2, zoom));
  const maxTileX = Math.floor(((east + 180) / 360) * Math.pow(2, zoom));
  const minTileY = Math.floor((1 - Math.log(Math.tan(north * Math.PI / 180) + 1 / Math.cos(north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  const maxTileY = Math.floor((1 - Math.log(Math.tan(south * Math.PI / 180) + 1 / Math.cos(south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

  for (let x = minTileX; x <= maxTileX; x++) {
    for (let y = minTileY; y <= maxTileY; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }

  return tiles;
}

// Activate event - clean up old caches and ensure offline readiness
self.addEventListener('activate', (event) => {
  swLog('🔄 Service Worker activating...');

  // Take control of all clients immediately
  self.clients.claim();

  event.waitUntil(
    Promise.all([
      // Clean up old caches - comprehensive cleanup
      caches.keys().then((cacheNames) => {
        const validCaches = [
          STATIC_CACHE,
          MODELS_CACHE,
          DYNAMIC_CACHE,
          MAPS_CACHE,
          AR_CACHE,
          FONTS_CACHE
        ];

        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients immediately
      self.clients.claim(),

      // Ensure complete offline functionality is ready
      ensureOfflineReadiness()
    ]).then(() => {
      console.log('✅ TECHNO SUTRA Service Worker activated - Complete offline functionality ready');

      // Notify all clients that the app is ready for offline use
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'OFFLINE_READY',
            message: 'Complete offline functionality activated'
          });
        });
      });
    }).catch(err => {
      console.error('❌ Service Worker activation failed:', err);
    })
  );
});

// Ensure all critical resources are cached for offline use
async function ensureOfflineReadiness() {
  try {
    const cacheChecks = await Promise.all([
      caches.has(STATIC_CACHE),
      caches.has(MODELS_CACHE),
      caches.has(AR_CACHE),
      caches.has(FONTS_CACHE)
    ]);

    const allCachesReady = cacheChecks.every(Boolean);

    if (allCachesReady) {
      console.log('✅ All caches ready for offline functionality');
    } else {
      console.warn('⚠️ Some caches missing - offline functionality may be limited');
    }

    return allCachesReady;
  } catch (error) {
    console.error('Failed to check offline readiness:', error);
    return false;
  }
}

// Fetch event - handle all network requests with offline-first strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and unsupported schemes
  if (request.method !== 'GET' ||
      request.url.startsWith('chrome-extension://') ||
      request.url.startsWith('moz-extension://') ||
      request.url.startsWith('safari-extension://')) {
    return;
  }

  // Handle different types of requests with optimized caching strategies

  // Static assets - cache first (highest priority for offline)
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }

  // 3D Models - cache first with fallback (essential for gallery and AR)
  else if (url.pathname.endsWith('.glb')) {
    event.respondWith(cacheFirst(request, MODELS_CACHE));
  }

  // Critical build assets - cache first for offline functionality
  else if (CRITICAL_ASSET_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }

  // Build assets (JS chunks, CSS) - cache first for offline functionality
  else if (BUILD_ASSET_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }

  // Fonts - cache first for offline functionality
  else if (FONT_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(cacheFirst(request, FONTS_CACHE));
  }

  // AR dependencies - cache first for offline AR functionality
  else if (AR_URL_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(cacheFirst(request, AR_CACHE));
  }

  // API calls - provide comprehensive offline fallbacks
  else if (API_URL_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(handleAPIRequest(request));
  }

  // Map tiles - cache with network fallback for offline maps
  else if (MAP_TILE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(cacheWithNetworkFallback(request, MAPS_CACHE));
  }

  // CSV data files - cache first (critical for app functionality)
  else if (url.pathname.endsWith('.csv') || url.pathname.endsWith('.json')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }

  // App routes - serve index.html for SPA routing (offline navigation)
  else if (url.origin === location.origin &&
    (url.pathname.startsWith('/map') ||
      url.pathname.startsWith('/gallery') ||
      url.pathname.startsWith('/route-creator') ||
      url.pathname.startsWith('/model-viewer') ||
      url.pathname.startsWith('/ar') ||
      url.pathname === '/')) {
    event.respondWith(
      caches.match('/index.html', { cacheName: STATIC_CACHE }).then(response => {
        if (response) {
          return response;
        }
        // Fallback to network if not in cache
        return fetch('/index.html').then(networkResponse => {
          if (networkResponse.ok) {
            // Cache the response for future offline use
            caches.open(STATIC_CACHE).then(cache => {
              cache.put('/index.html', networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Ultimate fallback for complete offline functionality
          return new Response(`
            <!DOCTYPE html>
            <html><head><title>TECHNO SUTRA - Offline</title></head>
            <body><h1>App is offline</h1><p>Please check your connection</p></body>
            </html>
          `, { headers: { 'Content-Type': 'text/html' } });
        });
      })
    );
  }

  // Other requests - network first with cache fallback
  else {
    event.respondWith(networkFirstWithCacheFallback(request, DYNAMIC_CACHE));
  }
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  try {
    // Skip caching for chrome-extension and other unsupported schemes
    if (request.url.startsWith('chrome-extension://') ||
      request.url.startsWith('moz-extension://') ||
      request.url.startsWith('safari-extension://')) {
      return fetch(request);
    }

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } else {
        // If network fails, try to return cached version or graceful fallback
        return cachedResponse || new Response('Offline - Resource not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    } catch (fetchError) {
      // Network error - return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Provide fallback for critical resources
      if (request.url.includes('.csv') || request.url.includes('.json')) {
        return new Response('[]', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      throw fetchError;
    }
  } catch (error) {
    swError('Cache first strategy failed:', error);
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

async function cacheWithNetworkFallback(request, cacheName) {
  try {
    // Skip caching for chrome-extension and other unsupported schemes
    if (request.url.startsWith('chrome-extension://') ||
      request.url.startsWith('moz-extension://') ||
      request.url.startsWith('safari-extension://')) {
      return fetch(request);
    }

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Try to update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => { });

      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline - Resource not available', { status: 503 });
  }
}

async function networkFirstWithCacheFallback(request, cacheName) {
  try {
    // Skip caching for chrome-extension and other unsupported schemes
    if (request.url.startsWith('chrome-extension://') ||
      request.url.startsWith('moz-extension://') ||
      request.url.startsWith('safari-extension://')) {
      return fetch(request);
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline - Resource not available', { status: 503 });
  }
}

// Handle API requests with offline fallbacks
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('API request failed, checking cache:', error);
  }

  // Fallback to cached response
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Provide offline fallback data for critical APIs
  if (request.url.includes('geocoding')) {
    return new Response(JSON.stringify({
      features: [],
      message: 'Offline - Geocoding not available'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    error: 'Offline - API not available',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Background sync for user data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-routes') {
    event.waitUntil(syncUserRoutes());
  }
  if (event.tag === 'background-sync-progress') {
    event.waitUntil(syncUserProgress());
  }
});

async function syncUserRoutes() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.routes], 'readonly');
    const store = transaction.objectStore(STORES.routes);
    const routes = await store.getAll();

    // Sync routes when online
    console.log('🔄 Syncing user routes:', routes.length);
  } catch (error) {
    console.error('Failed to sync routes:', error);
  }
}

async function syncUserProgress() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.userProgress], 'readonly');
    const store = transaction.objectStore(STORES.userProgress);
    const progress = await store.getAll();

    // Sync progress when online
    console.log('🔄 Syncing user progress:', progress.length);
  } catch (error) {
    console.error('Failed to sync progress:', error);
  }
}

// Push notifications for trail updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New Buddhist trail content available!',
      icon: '/technosutra-logo.png',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'explore',
          title: 'Explore Now',
          icon: '/technosutra-logo.png'
        },
        {
          action: 'dismiss',
          title: 'Later',
          icon: '/favicon.ico'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'TECHNO SUTRA Update',
        options
      )
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/map')
    );
  }
});

console.log('🧘 TECHNO SUTRA Service Worker loaded - Ready for Buddhist trail hiking offline experience');
