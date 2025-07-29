// TECHNO SUTRA Optimized Service Worker
// Fixed QuotaExceededError issues with conservative caching strategy

const swLog = (message, data = null) => {
  console.log(`🧘 TECHNO SUTRA SW: ${message}`, data || '');
};

const swError = (message, error = null) => {
  console.error(`❌ TECHNO SUTRA SW ERROR: ${message}`, error || '');
};

// Simplified cache names
const CACHE_NAME = 'technosutra-essential-v1';
const STATIC_CACHE = 'technosutra-static-v1';

// Only cache essential files to prevent quota exceeded
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/404.html'
];

// Maximum cache sizes to prevent quota exceeded
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB total
const MAX_STATIC_FILES = 50; // Maximum number of static files
const MAX_DYNAMIC_FILES = 20; // Maximum number of dynamic files

// Cache size tracking
let currentCacheSize = 0;

// Check if we can cache more items
async function canCache(size = 0) {
  try {
    const estimate = await navigator.storage.estimate();
    const available = estimate.quota - estimate.usage;
    const wouldExceed = (currentCacheSize + size) > MAX_CACHE_SIZE;
    const hasSpace = available > (size + 10 * 1024 * 1024); // Keep 10MB buffer
    
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
      name !== CACHE_NAME && 
      name !== STATIC_CACHE &&
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

// Limit cache size by removing oldest entries
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
      const toDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(
        toDelete.map(key => {
          swLog(`Removing from cache: ${key.url}`);
          return cache.delete(key);
        })
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

// Fetch event - conservative caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for certain types to prevent quota exceeded
  const shouldSkipCache = 
    request.method !== 'GET' ||
    url.pathname.includes('.glb') ||
    url.pathname.includes('.gltf') ||
    url.pathname.includes('.bin') ||
    url.pathname.includes('models/') ||
    url.pathname.includes('tiles/') ||
    url.search.includes('token') ||
    request.headers.get('range'); // Skip range requests

  if (shouldSkipCache) {
    return; // Let browser handle normally
  }
  
  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Fetch from network
        const networkResponse = await fetch(request);
        
        // Only cache successful responses that are small enough
        if (networkResponse.ok && networkResponse.status === 200) {
          const contentLength = networkResponse.headers.get('content-length');
          const size = contentLength ? parseInt(contentLength) : 0;
          
          // Only cache small files (< 1MB) to prevent quota exceeded
          if (size < 1024 * 1024 && await canCache(size)) {
            try {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(request, networkResponse.clone());
              
              // Limit cache size periodically
              await limitCacheSize(CACHE_NAME, MAX_DYNAMIC_FILES);
              
              swLog(`Cached response: ${url.pathname}`);
            } catch (error) {
              if (error.name === 'QuotaExceededError') {
                swError('Quota exceeded, skipping cache', error);
                await cleanOldCaches();
              } else {
                swError('Cache put failed', error);
              }
            }
          }
        }
        
        return networkResponse;
      } catch (error) {
        swError('Fetch failed', error);
        
        // Return cached version if available
        const cachedResponse = await caches.match(request);
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
      
    case 'CLEAR_CACHE':
      (async () => {
        try {
          await cleanOldCaches();
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
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
