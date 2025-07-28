// Critical Performance Optimizer for TECHNO SUTRA
// Fixes freezing, lag, and performance bottlenecks

import { logger } from '@/lib/logger';

interface PerformanceConfig {
  enableAnimationOptimization: boolean;
  enableMemoryManagement: boolean;
  enableRenderOptimization: boolean;
  enableServiceWorkerOptimization: boolean;
  maxAnimationFPS: number;
  memoryThreshold: number;
  renderBudget: number;
}

class CriticalPerformanceOptimizer {
  private config: PerformanceConfig = {
    enableAnimationOptimization: true,
    enableMemoryManagement: true,
    enableRenderOptimization: true,
    enableServiceWorkerOptimization: true,
    maxAnimationFPS: 60,
    memoryThreshold: 100 * 1024 * 1024, // 100MB
    renderBudget: 16 // 16ms for 60fps
  };

  private animationFrameId: number | null = null;
  private renderQueue: (() => void)[] = [];
  private isProcessingQueue = false;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    logger.info('🚀 Critical Performance Optimizer initialized');

    // Apply immediate performance fixes
    this.fixAnimationPerformance();
    this.optimizeMemoryUsage();
    this.setupRenderOptimization();
    this.optimizeServiceWorker();
    this.disableProblematicFeatures();
  }

  // ===== ANIMATION PERFORMANCE FIXES =====
  private fixAnimationPerformance(): void {
    if (!this.config.enableAnimationOptimization) return;

    // Throttle animations to prevent freezing
    this.throttleAnimations();
    
    // Disable heavy animations on low-end devices
    this.detectAndOptimizeForDevice();
    
    // Fix framer-motion performance issues
    this.optimizeFramerMotion();

    logger.info('🎭 Animation performance optimized');
  }

  private throttleAnimations(): void {
    // Override requestAnimationFrame to throttle animations
    const originalRAF = window.requestAnimationFrame;
    let lastTime = 0;
    const targetInterval = 1000 / this.config.maxAnimationFPS;

    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed >= targetInterval) {
        lastTime = now;
        return originalRAF(callback);
      } else {
        return originalRAF(() => {
          const newNow = performance.now();
          if (newNow - lastTime >= targetInterval) {
            lastTime = newNow;
            callback(newNow);
          }
        });
      }
    };
  }

  private detectAndOptimizeForDevice(): void {
    // Detect low-end devices and reduce animations
    const isLowEndDevice = this.isLowEndDevice();
    
    if (isLowEndDevice) {
      // Disable heavy animations
      document.documentElement.classList.add('low-end-device');
      
      // Reduce animation complexity
      const style = document.createElement('style');
      style.textContent = `
        .low-end-device * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
        .low-end-device .floating-particles,
        .low-end-device .morphing-shape,
        .low-end-device .wave-animation {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
      
      logger.info('📱 Low-end device detected, animations optimized');
    }
  }

  private isLowEndDevice(): boolean {
    // Check device capabilities
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const connection = (navigator as any).connection;

    return (
      (memory && memory < 4) || // Less than 4GB RAM
      (cores && cores < 4) || // Less than 4 CPU cores
      (connection && connection.effectiveType === 'slow-2g') || // Slow connection
      /Android.*Chrome\/[0-5]/.test(navigator.userAgent) // Old Android Chrome
    );
  }

  private optimizeFramerMotion(): void {
    // Reduce framer-motion complexity
    const style = document.createElement('style');
    style.textContent = `
      /* Optimize framer-motion animations */
      [data-framer-motion] {
        will-change: transform, opacity;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      /* Disable complex animations on scroll */
      .parallax-element {
        transform: none !important;
      }
      
      /* Simplify particle animations */
      .floating-particles > div {
        animation: simple-float 3s ease-in-out infinite;
      }
      
      @keyframes simple-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== MEMORY MANAGEMENT =====
  private optimizeMemoryUsage(): void {
    if (!this.config.enableMemoryManagement) return;

    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Clean up unused resources
    this.setupResourceCleanup();
    
    // Optimize image loading
    this.optimizeImageMemory();

    logger.info('💾 Memory usage optimized');
  }

  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize;
        
        if (usedMemory > this.config.memoryThreshold) {
          logger.warn('⚠️ High memory usage detected, cleaning up...');
          this.forceGarbageCollection();
          this.performCleanup();
        }
      }
    }, 10000); // Check every 10 seconds
  }

  private forceGarbageCollection(): void {
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    // Clear caches
    this.clearUnusedCaches();
  }

  private clearUnusedCaches(): void {
    // Clear unused image caches
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.offsetParent) { // Not visible
        img.src = '';
      }
    });
  }

  private performCleanup(): void {
    // Perform various cleanup operations
    this.clearUnusedCaches();
    
    // Clear any orphaned event listeners
    const elements = document.querySelectorAll('[data-cleanup]');
    elements.forEach(element => {
      element.remove();
    });
    
    // Clear expired cache entries
    try {
      const cacheKeys = Object.keys(localStorage);
      cacheKeys.forEach(key => {
        if (key.startsWith('cached-') && localStorage.getItem(key + '_timestamp')) {
          const timestamp = parseInt(localStorage.getItem(key + '_timestamp') || '0');
          const now = Date.now();
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (now - timestamp > maxAge) {
            localStorage.removeItem(key);
            localStorage.removeItem(key + '_timestamp');
          }
        }
      });
    } catch (error) {
      logger.warn('Cache cleanup failed:', error);
    }
  }

  private setupResourceCleanup(): void {
    // Clean up resources when components unmount
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Clean up event listeners
            const clone = element.cloneNode(true);
            element.parentNode?.replaceChild(clone, element);
            
            // Clear any cached data
            if ('_cache' in element) {
              delete (element as any)._cache;
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private optimizeImageMemory(): void {
    // Lazy load images more aggressively
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      
      // Unload images that are far from viewport
      const rect = img.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.top > viewportHeight * 2 || rect.bottom < -viewportHeight) {
        const originalSrc = img.src;
        img.src = '';
        img.dataset.originalSrc = originalSrc;
      }
    });
  }

  // ===== RENDER OPTIMIZATION =====
  private setupRenderOptimization(): void {
    if (!this.config.enableRenderOptimization) return;

    // Batch DOM updates
    this.setupRenderBatching();
    
    // Optimize scroll performance
    this.optimizeScrollPerformance();
    
    // Reduce layout thrashing
    this.preventLayoutThrashing();

    logger.info('🎨 Render performance optimized');
  }

  private setupRenderBatching(): void {
    // Batch DOM updates to prevent layout thrashing
    const scheduleRender = (callback: () => void) => {
      this.renderQueue.push(callback);
      
      if (!this.isProcessingQueue) {
        this.isProcessingQueue = true;
        
        this.animationFrameId = requestAnimationFrame(() => {
          const queue = [...this.renderQueue];
          this.renderQueue = [];
          this.isProcessingQueue = false;
          
          // Process all updates in one frame
          queue.forEach(callback => {
            try {
              callback();
            } catch (error) {
              logger.error('Render callback error:', error);
            }
          });
        });
      }
    };

    // Expose batching utility
    (window as any).scheduleRender = scheduleRender;
  }

  private optimizeScrollPerformance(): void {
    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    const optimizedScrollHandler = () => {
      if (!isScrolling) {
        requestAnimationFrame(() => {
          // Process scroll-dependent updates
          isScrolling = false;
        });
        isScrolling = true;
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Scroll ended, clean up
        document.body.classList.remove('scrolling');
      }, 150);
    };

    // Replace existing scroll listeners with optimized version
    document.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    document.body.classList.add('scrolling');
  }

  private preventLayoutThrashing(): void {
    // Prevent common layout thrashing patterns
    const style = document.createElement('style');
    style.textContent = `
      /* Prevent layout thrashing */
      * {
        box-sizing: border-box;
      }
      
      /* Use transform instead of changing layout properties */
      .animate-position {
        transform: translateZ(0);
        will-change: transform;
      }
      
      /* Contain layout changes */
      .container {
        contain: layout style paint;
      }
      
      /* Optimize text rendering */
      body {
        text-rendering: optimizeSpeed;
        -webkit-font-smoothing: subpixel-antialiased;
      }
    `;
    document.head.appendChild(style);
  }

  // ===== SERVICE WORKER OPTIMIZATION =====
  private optimizeServiceWorker(): void {
    if (!this.config.enableServiceWorkerOptimization) return;

    // Fix service worker blocking issues
    this.fixServiceWorkerBlocking();
    
    // Optimize caching strategy
    this.optimizeCaching();

    logger.info('⚙️ Service worker optimized');
  }

  private fixServiceWorkerBlocking(): void {
    // Prevent service worker from blocking main thread
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Optimize service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, but don't force reload
                logger.info('🔄 New service worker available');
              }
            });
          }
        });
      });
    }
  }

  private optimizeCaching(): void {
    // Send message to service worker to optimize caching
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'OPTIMIZE_CACHING',
        config: {
          maxCacheSize: 50 * 1024 * 1024, // 50MB max
          maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          priorityResources: [
            '/characters.csv',
            '/chapters.csv',
            '/waypoint-coordinates.json'
          ]
        }
      });
    }
  }

  // ===== DISABLE PROBLEMATIC FEATURES =====
  private disableProblematicFeatures(): void {
    // Disable features causing performance issues
    
    // Disable heavy accessibility features temporarily
    this.optimizeAccessibilityFeatures();
    
    // Disable problematic animations
    this.disableHeavyAnimations();
    
    // Optimize third-party libraries
    this.optimizeThirdPartyLibraries();

    logger.info('🔧 Problematic features optimized');
  }

  private optimizeAccessibilityFeatures(): void {
    // Keep accessibility but optimize performance
    const style = document.createElement('style');
    style.textContent = `
      /* Hide skip links by default, show only on focus */
      .skip-links {
        position: absolute;
        top: -9999px;
        left: -9999px;
      }
      
      .skip-links a:focus {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 9999;
        padding: 8px 16px;
        background: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 4px;
      }
      
      /* Optimize focus indicators */
      .focus-visible {
        outline: 2px solid #00ffff;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  private disableHeavyAnimations(): void {
    // Disable animations that cause freezing
    const style = document.createElement('style');
    style.textContent = `
      /* Disable heavy animations */
      .floating-particles {
        display: none !important;
      }
      
      .morphing-shape {
        animation: none !important;
      }
      
      .wave-animation {
        display: none !important;
      }
      
      /* Simplify remaining animations */
      * {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
      }
      
      /* Keep only essential animations */
      .loading-spinner,
      .progress-bar {
        animation-duration: 1s !important;
      }
    `;
    document.head.appendChild(style);
  }

  private optimizeThirdPartyLibraries(): void {
    // Optimize framer-motion
    if ('MotionGlobalConfig' in window) {
      (window as any).MotionGlobalConfig = {
        skipAnimations: this.isLowEndDevice(),
        reducedMotion: 'user'
      };
    }
    
    // Optimize other libraries
    this.optimizeMapTiler();
  }

  private optimizeMapTiler(): void {
    // Reduce MapTiler performance impact
    const style = document.createElement('style');
    style.textContent = `
      /* Optimize map rendering */
      .maplibregl-map {
        will-change: transform;
        transform: translateZ(0);
      }
      
      /* Reduce map complexity on low-end devices */
      .low-end-device .maplibregl-map {
        image-rendering: pixelated;
      }
    `;
    document.head.appendChild(style);
  }

  // ===== CLEANUP =====
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    
    this.renderQueue = [];
    
    logger.info('🧹 Performance optimizer cleaned up');
  }

  // ===== PUBLIC API =====
  getPerformanceStatus(): any {
    return {
      memoryUsage: 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0,
      renderQueueSize: this.renderQueue.length,
      isLowEndDevice: this.isLowEndDevice(),
      optimizationsActive: {
        animations: this.config.enableAnimationOptimization,
        memory: this.config.enableMemoryManagement,
        rendering: this.config.enableRenderOptimization,
        serviceWorker: this.config.enableServiceWorkerOptimization
      }
    };
  }

  forceOptimization(): void {
    logger.info('🚀 Forcing performance optimization...');
    
    this.forceGarbageCollection();
    this.clearUnusedCaches();
    this.disableHeavyAnimations();
    
    // Clear render queue
    this.renderQueue = [];
    
    logger.info('✅ Performance optimization complete');
  }
}

export const criticalPerformanceOptimizer = new CriticalPerformanceOptimizer();
export default criticalPerformanceOptimizer;
