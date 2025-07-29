// TECHNO SUTRA Optimized Service Worker
// Fixed infinite tile caching loop with proper cache management

const swLog = (message, data = null) => {
  console.log(`🧘 TECHNO SUTRA SW: ${message}`, data || '');
};

const swError = (message, error = null) => {
  console.error(`❌ TECHNO SUTRA SW ERROR: ${message}`, error || '');
};

// Separate cache names for different content types
const STATIC_CACHE = 'technosutra-static-v2';
const DYNAMIC_CACHE = 'technosutra-dynamic-v2';
const TILES_CACHE = 'technosutra-tiles-v2';

// Only cache essential files to prevent quota exceeded
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/404.html'
];

// Maximum cache sizes to prevent quota exceeded
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB total
const MAX_STATIC_FILES = 100; // Maximum number of static files
const MAX_DYNAMIC_FILES = 200; // Maximum number of dynamic files
const MAX_TILE_FILES = 500; // Maximum number of tile files

// Cache size tracking
let currentCacheSize = 0;
let lastCleanupTime = 0;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let tileCachingEnabled = false;

// Check if we can cache more items
async function canCache(size = 0) {
  try {
    const estimate = await navigator.storage.estimate();
    const available = estimate.quota - estimate.usage;
    const wouldExceed = (currentCacheSize + size) > MAX_CACHE_SIZE;
    const hasSpace = available > (size + 20 * 1024 * 1024); // Keep 20MB buffer

    return !wouldExceed && hasSpace;
  } catch (error) {
    swError('Cache size check failed', error);
    return false;
  }
}

// Clean old caches to free up space
async function cleanOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name =>
      name !== STATIC_CACHE &&
      name !== DYNAMIC_CACHE &&
      name !== TILES_CACHE &&
      name.includes('technosutra')
    );

    await Promise.all(
      oldCaches.map(cacheName => {
        swLog(`Cleaning old cache: ${cacheName}`);
        return caches.delete(cacheName);
      })
    );

    if (oldCaches.length > 0) {
      swLog(`Cleaned ${oldCaches.length} old caches`);
    }
  } catch (error) {
    swError('Failed to clean old caches', error);
  }
}

// Smart cache cleanup - only run when needed
async function smartCacheCleanup() {
  const now = Date.now();
  if (now - lastCleanupTime < CLEANUP_INTERVAL) {
    return; // Skip cleanup if done recently
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usagePercent = (estimate.usage / estimate.quota) * 100;

    // Only cleanup if using more than 80% of quota
    if (usagePercent > 80) {
      swLog(`Storage usage at ${usagePercent.toFixed(1)}%, running cleanup`);

      // Clean tiles cache first (oldest entries)
      await limitCacheSize(TILES_CACHE, Math.floor(MAX_TILE_FILES * 0.7));

      // Clean dynamic cache
      await limitCacheSize(DYNAMIC_CACHE, Math.floor(MAX_DYNAMIC_FILES * 0.8));

      lastCleanupTime = now;
      swLog('Smart cleanup completed');
    }
  } catch (error) {
    swError('Smart cleanup failed', error);
  }
}

// Limit cache size by removing oldest entries (LRU)
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
      const toDelete = keys.slice(0, keys.length - maxItems);
      swLog(`Removing ${toDelete.length} old entries from ${cacheName}`);

      await Promise.all(
        toDelete.map(key => cache.delete(key))
      );
    }
  } catch (error) {
    swError(`Failed to limit cache size for ${cacheName}`, error);
  }
}

// Install event - cache only essential files
self.addEventListener('install', event => {
  swLog('Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      try {
        await cleanOldCaches();
        
        const cache = await caches.open(STATIC_CACHE);
        
        // Only cache essential files that are small
        const essentialFiles = ESSENTIAL_ASSETS.filter(asset => {
          // Skip large files that might cause quota exceeded
          return !asset.includes('.glb') && 
                 !asset.includes('.gltf') && 
                 !asset.includes('.bin') &&
                 !asset.includes('models/');
        });
        
        swLog(`Caching ${essentialFiles.length} essential files`);
        
        // Cache files one by one with error handling
        for (const asset of essentialFiles) {
          try {
            if (await canCache()) {
              await cache.add(asset);
              swLog(`Cached: ${asset}`);
            } else {
              swLog(`Skipping cache (quota): ${asset}`);
              break;
            }
          } catch (error) {
            swError(`Failed to cache ${asset}`, error);
            // Continue with other files instead of failing completely
          }
        }
        
        swLog('Essential files cached successfully');
        self.skipWaiting();
      } catch (error) {
        swError('Install failed', error);
        // Don't fail the install, just log the error
      }
    })()
  );
});

// Activate event
self.addEventListener('activate', event => {
  swLog('Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      try {
        await cleanOldCaches();
        await self.clients.claim();
        swLog('Service Worker activated and claimed clients');
      } catch (error) {
        swError('Activation failed', error);
      }
    })()
  );
});

function normalizeTileUrl(url) {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('key');
    return urlObj.toString();
}

// Determine cache type and limits based on request
function getCacheStrategy(url, request) {
  const pathname = url.pathname;

  // Map tiles - use tiles cache (supporting MapLibre and free tile sources)
  if (pathname.includes('/tiles/') || 
      url.hostname.includes('demotiles.maplibre.org') || 
      url.hostname.includes('tiles.stadiamaps.com') ||
      url.hostname.includes('openstreetmap.org') ||
      pathname.includes('.pbf') || pathname.includes('/sprite') || pathname.includes('/style.json')) {
    return {
      cacheName: TILES_CACHE,
      maxSize: 2 * 1024 * 1024, // 2MB per tile
      maxItems: MAX_TILE_FILES,
      shouldCache: tileCachingEnabled
    };
  }

  // Large 3D models - skip caching
  if (pathname.includes('.glb') || pathname.includes('.gltf') || pathname.includes('.bin') || pathname.includes('models/')) {
    return { shouldCache: false };
  }

  // Static assets
  if (ESSENTIAL_ASSETS.includes(pathname) || pathname.includes('.css') || pathname.includes('.js')) {
    return {
      cacheName: STATIC_CACHE,
      maxSize: 5 * 1024 * 1024, // 5MB per file
      maxItems: MAX_STATIC_FILES,
      shouldCache: true
    };
  }

  // Dynamic content
  return {
    cacheName: DYNAMIC_CACHE,
    maxSize: 1 * 1024 * 1024, // 1MB per file
    maxItems: MAX_DYNAMIC_FILES,
    shouldCache: true
  };
}

// Fetch event - smart caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and range requests
  if (request.method !== 'GET' || request.headers.get('range')) {
    return;
  }

  const strategy = getCacheStrategy(url, request);

  // Skip caching if strategy says so
  if (!strategy.shouldCache) {
    return;
  }
    
  const cacheKey = strategy.cacheName === TILES_CACHE ? normalizeTileUrl(request.url) : request;

  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cachedResponse = await caches.match(cacheKey);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network
        const networkResponse = await fetch(request);

        // Only cache successful responses
        if (networkResponse.ok && networkResponse.status === 200) {
          const contentLength = networkResponse.headers.get('content-length');
          const size = contentLength ? parseInt(contentLength) : 0;

          // Check size limits and storage availability
          if (size <= strategy.maxSize && await canCache(size)) {
            try {
              const cache = await caches.open(strategy.cacheName);
              await cache.put(cacheKey, networkResponse.clone());

              swLog(`Cached ${strategy.cacheName}: ${url.pathname} (${(size/1024).toFixed(1)}KB)`);

              // Run smart cleanup occasionally (not after every cache operation)
              if (Math.random() < 0.1) { // 10% chance
                smartCacheCleanup();
              }

            } catch (error) {
              if (error.name === 'QuotaExceededError') {
                swError('Quota exceeded, running emergency cleanup');
                await smartCacheCleanup();
                // Try caching again after cleanup
                try {
                  const cache = await caches.open(strategy.cacheName);
                  await cache.put(cacheKey, networkResponse.clone());
                } catch (retryError) {
                  swError('Cache retry failed', retryError);
                }
              } else {
                swError('Cache put failed', error);
              }
            }
          } else {
            swLog(`Skipping cache (size ${(size/1024).toFixed(1)}KB > ${(strategy.maxSize/1024).toFixed(1)}KB): ${url.pathname}`);
          }
        }

        return networkResponse;
      } catch (error) {
        swError('Fetch failed', error);

        // Return cached version if available
        const cachedResponse = await caches.match(cacheKey);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Return offline page for navigation requests
        if (request.destination === 'document') {
          const offlineResponse = await caches.match('/404.html');
          if (offlineResponse) {
            return offlineResponse;
          }
        }

        throw error;
      }
    })()
  );
});

// Handle messages from the app
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    
    case 'ENABLE_TILE_CACHING':
        swLog('Tile caching enabled');
        tileCachingEnabled = true;
        break;

    case 'DISABLE_TILE_CACHING':
        swLog('Tile caching disabled');
        tileCachingEnabled = false;
        break;
      
    case 'CLEAR_CACHE':
      (async () => {
        try {
          await cleanOldCaches();
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          lastCleanupTime = 0; // Reset cleanup timer
          swLog('All caches cleared');
          event.ports[0]?.postMessage({ success: true });
        } catch (error) {
          swError('Failed to clear caches', error);
          event.ports[0]?.postMessage({ success: false, error: error.message });
        }
      })();
      break;
      
    case 'GET_CACHE_STATUS':
      (async () => {
        try {
          const estimate = await navigator.storage.estimate();
          const cacheNames = await caches.keys();
          
          event.ports[0]?.postMessage({
            usage: estimate.usage,
            quota: estimate.quota,
            caches: cacheNames.length,
            usagePercent: Math.round((estimate.usage / estimate.quota) * 100)
          });
        } catch (error) {
          swError('Failed to get cache status', error);
          event.ports[0]?.postMessage({ error: error.message });
        }
      })();
      break;
  }
});

swLog('Service Worker script loaded');
