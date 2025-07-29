// Simple path resolver fallback for TECHNO SUTRA
// Used when the main pathResolver fails

import { logger } from '@/lib/logger';

/**
 * Simple fallback path resolution
 * Uses basic hostname detection without complex logic
 */
export const simpleResolvePath = (path: string): string => {
  try {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Check if we're on GitHub Pages by hostname
    if (typeof window !== 'undefined' && 
        window.location && 
        window.location.hostname.includes('github.io')) {
      return `/technosutra-app/${cleanPath}`;
    }
    
    // Default to root path for custom domain or development
    return `/${cleanPath}`;
  } catch (error) {
    logger.warn('Simple path resolver failed, using original path:', error);
    return path;
  }
};

/**
 * Simple model path resolver
 */
export const simpleResolveModel = (modelId: number | string): string => {
  return simpleResolvePath(`modelo${modelId}.glb`);
};

/**
 * Simple data file resolver
 */
export const simpleResolveDataFile = (filename: string): string => {
  return simpleResolvePath(filename);
};

/**
 * Simple router base resolver
 */
export const simpleGetRouterBase = (): string => {
  try {
    if (typeof window !== 'undefined' && 
        window.location && 
        window.location.hostname.includes('github.io')) {
      return '/technosutra-app/';
    }
    return '/';
  } catch (error) {
    logger.warn('Simple router base resolver failed:', error);
    return '/';
  }
};
