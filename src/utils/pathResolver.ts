// Dynamic Path Resolver for TECHNO SUTRA
// Handles different deployment environments (GitHub Pages vs Custom Domain)

import { logger } from '@/lib/logger';
import { simpleResolvePath, simpleResolveModel, simpleResolveDataFile, simpleGetRouterBase } from './simplePath';

interface DeploymentEnvironment {
  isGitHubPages: boolean;
  isCustomDomain: boolean;
  basePath: string;
  host: string;
}

class PathResolver {
  private environment: DeploymentEnvironment;
  private initialized = false;

  constructor() {
    try {
      this.environment = this.detectEnvironment();
      this.logEnvironment();
    } catch (error) {
      // Fallback to safe defaults if detection fails
      logger.warn('Failed to detect environment, using defaults:', error);
      this.environment = {
        isGitHubPages: false,
        isCustomDomain: false,
        basePath: '/',
        host: 'localhost'
      };
    }
  }

  private detectEnvironment(): DeploymentEnvironment {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.location) {
      return {
        isGitHubPages: false,
        isCustomDomain: false,
        basePath: '/',
        host: 'localhost'
      };
    }

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Check if we're on GitHub Pages
    const isGitHubPages = hostname.includes('github.io');
    
    // Check if we're on custom domain
    const isCustomDomain = hostname === 'technosutra.bhumisparshaschool.org' || 
                          hostname === 'www.technosutra.bhumisparshaschool.org';
    
    let basePath = '/';
    
    if (isGitHubPages) {
      // Extract repo name from pathname for GitHub Pages
      // https://technosutra21.github.io/technosutra-app/ -> /technosutra-app/
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        basePath = `/${pathParts[0]}/`;
      }
    }
    
    return {
      isGitHubPages,
      isCustomDomain,
      basePath,
      host: hostname
    };
  }

  private logEnvironment(): void {
    logger.info('🌐 Environment Detection:', {
      host: this.environment.host,
      isGitHubPages: this.environment.isGitHubPages,
      isCustomDomain: this.environment.isCustomDomain,
      basePath: this.environment.basePath,
      fullURL: window.location.href
    });
  }

  /**
   * Get the current environment info
   */
  getEnvironment(): DeploymentEnvironment {
    return { ...this.environment };
  }

  /**
   * Resolve a file path for the current environment
   */
  resolvePath(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // For custom domain, use root path
    if (this.environment.isCustomDomain) {
      return `/${cleanPath}`;
    }
    
    // For GitHub Pages, prepend base path
    if (this.environment.isGitHubPages) {
      return `${this.environment.basePath}${cleanPath}`;
    }
    
    // Default fallback
    return `/${cleanPath}`;
  }

  /**
   * Resolve multiple paths
   */
  resolvePaths(paths: string[]): string[] {
    return paths.map(path => this.resolvePath(path));
  }

  /**
   * Get the base URL for API calls or absolute URLs
   */
  getBaseUrl(): string {
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    if (this.environment.isCustomDomain) {
      return `${protocol}//${host}`;
    }
    
    if (this.environment.isGitHubPages) {
      return `${protocol}//${host}${this.environment.basePath.slice(0, -1)}`;
    }
    
    return `${protocol}//${host}`;
  }

  /**
   * Resolve asset path (for images, models, etc.)
   */
  resolveAsset(assetPath: string): string {
    return this.resolvePath(assetPath);
  }

  /**
   * Resolve model file path
   */
  resolveModel(modelId: number | string): string {
    return this.resolvePath(`modelo${modelId}.glb`);
  }

  /**
   * Resolve CSV data file path
   */
  resolveDataFile(filename: string): string {
    return this.resolvePath(filename);
  }

  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('local');
  }

  /**
   * Get router base path for React Router
   */
  getRouterBase(): string {
    if (this.environment.isCustomDomain || this.isDevelopment()) {
      return '/';
    }
    
    if (this.environment.isGitHubPages) {
      return this.environment.basePath;
    }
    
    return '/';
  }

  /**
   * Create a full URL from a relative path
   */
  createFullUrl(path: string): string {
    const baseUrl = this.getBaseUrl();
    const resolvedPath = this.resolvePath(path);
    
    // Remove leading slash from resolved path to avoid double slashes
    const cleanResolvedPath = resolvedPath.startsWith('/') ? resolvedPath.slice(1) : resolvedPath;
    
    return `${baseUrl}/${cleanResolvedPath}`;
  }

  /**
   * Update meta tags for current environment
   */
  updateMetaTags(): void {
    const canonicalUrl = this.getBaseUrl();
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // Update Open Graph URL
    const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    if (ogUrl) {
      ogUrl.content = canonicalUrl;
    }

    logger.info('📄 Updated meta tags for environment:', canonicalUrl);
  }
}

// Export singleton instance
export const pathResolver = new PathResolver();

// Helper functions for easy use throughout the app with error handling
export const resolvePath = (path: string): string => {
  try {
    return pathResolver.resolvePath(path);
  } catch (error) {
    console.warn('Failed to resolve path, using simple fallback:', path, error);
    return simpleResolvePath(path);
  }
};

export const resolveAsset = (path: string): string => {
  try {
    return pathResolver.resolveAsset(path);
  } catch (error) {
    console.warn('Failed to resolve asset, using fallback:', path, error);
    return path.startsWith('/') ? path : `/${path}`;
  }
};

export const resolveModel = (modelId: number | string): string => {
  try {
    return pathResolver.resolveModel(modelId);
  } catch (error) {
    console.warn('Failed to resolve model, using simple fallback:', modelId, error);
    return simpleResolveModel(modelId);
  }
};

export const resolveDataFile = (filename: string): string => {
  try {
    return pathResolver.resolveDataFile(filename);
  } catch (error) {
    console.warn('Failed to resolve data file, using simple fallback:', filename, error);
    return simpleResolveDataFile(filename);
  }
};

export const getBaseUrl = (): string => {
  try {
    return pathResolver.getBaseUrl();
  } catch (error) {
    console.warn('Failed to get base URL, using fallback:', error);
    return window?.location?.origin || '';
  }
};

export const getRouterBase = (): string => {
  try {
    return pathResolver.getRouterBase();
  } catch (error) {
    console.warn('Failed to get router base, using simple fallback:', error);
    return simpleGetRouterBase();
  }
};

export default pathResolver;
