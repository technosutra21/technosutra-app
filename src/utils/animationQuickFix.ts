// Quick Animation Fix Utility
// Provides immediate controls to fix animation speed issues

/**
 * Immediately disable all performance optimizations that might be affecting animation speed
 */
export function disableAnimationOptimizations(): void {
  console.log('🎭 Disabling animation optimizations...');

  // Remove low-end-device class
  document.documentElement.classList.remove('low-end-device');
  document.body.classList.remove('low-end-device');

  // Remove performance-mode class
  document.documentElement.classList.remove('performance-mode');
  document.body.classList.remove('performance-mode');

  // Set localStorage flag to prevent re-enabling
  try {
    localStorage.setItem('technosutra-disable-performance-opt', 'true');
    localStorage.setItem('technosutra-animation-normal-speed', 'true');
  } catch {
    // localStorage not available
  }

  // Remove any existing performance optimization styles
  const perfStyles = document.querySelectorAll('style[data-perf-opt="true"], style[id*="performance"], style[id*="optimization"]');
  perfStyles.forEach(style => style.remove());

  // Inject CSS to force normal animation speeds
  const quickFixStyle = document.createElement('style');
  quickFixStyle.id = 'technosutra-animation-quick-fix';
  quickFixStyle.setAttribute('data-quick-fix', 'true');
  quickFixStyle.textContent = `
    /* TECHNO SUTRA Animation Quick Fix */
    *, *::before, *::after {
      animation-duration: revert !important;
      transition-duration: revert !important;
      animation-iteration-count: revert !important;
    }
    
    /* Override any performance optimizations */
    .low-end-device *, 
    .performance-mode *,
    [data-performance-optimized] * {
      animation-duration: revert !important;
      transition-duration: revert !important;
      animation-iteration-count: revert !important;
    }
    
    /* Ensure loading animations are visible */
    .loading-spinner,
    .animate-spin {
      animation-duration: 1s !important;
    }
    
    /* Ensure hover transitions work normally */
    button, a, .hover\\:scale-105 {
      transition-duration: 0.3s !important;
    }
    
    /* Ensure framer-motion animations work normally */
    [data-framer-motion] {
      animation-duration: revert !important;
      transition-duration: revert !important;
    }
  `;
  
  document.head.appendChild(quickFixStyle);
  
  console.log('✅ Animation optimizations disabled - animations should now run at normal speed');
}

/**
 * Re-enable performance optimizations
 */
export function enableAnimationOptimizations(): void {
  console.log('🎯 Re-enabling animation optimizations...');

  // Remove localStorage flags
  try {
    localStorage.removeItem('technosutra-disable-performance-opt');
    localStorage.removeItem('technosutra-animation-normal-speed');
  } catch {
    // localStorage not available
  }

  // Remove quick fix styles
  const quickFixStyle = document.getElementById('technosutra-animation-quick-fix');
  if (quickFixStyle) {
    quickFixStyle.remove();
  }

  console.log('✅ Animation optimizations re-enabled');
}

/**
 * Check if animations should run at normal speed
 */
export function shouldUseNormalAnimationSpeed(): boolean {
  try {
    return localStorage.getItem('technosutra-animation-normal-speed') === 'true';
  } catch {
    return false;
  }
}

/**
 * Auto-apply quick fix if user has previously disabled optimizations
 */
export function autoApplyAnimationFix(): void {
  if (shouldUseNormalAnimationSpeed()) {
    console.log('🎭 Auto-applying animation quick fix...');
    disableAnimationOptimizations();
  }
}

// Expose to global scope for easy console access
if (typeof window !== 'undefined') {
  (window as any).fixAnimations = disableAnimationOptimizations;
  (window as any).enableAnimationOptimizations = enableAnimationOptimizations;
  
  // Auto-apply on load
  autoApplyAnimationFix();
}
