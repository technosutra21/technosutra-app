// Map Tile Caching Service for TECHNO SUTRA
// Offline map functionality with MapTiler integration

import { logger } from '@/lib/logger';
import { offlineStorage } from './offlineStorage';

interface TileBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface CacheProgress {
  total: number;
  cached: number;
  failed: number;
  percentage: number;
}

class MapTileCacheService {
  private readonly TILE_SIZE = 256;
  private readonly MAX_ZOOM = 18;
  private readonly MIN_ZOOM = 10;

  // Águas da Prata, SP region bounds (expanded for hiking trails)
  private readonly REGION_BOUNDS: TileBounds = {
    north: -21.8500,  // ~10km north
    south: -22.0500,  // ~10km south  
    east: -46.6000,   // ~10km east
    west: -46.8500    // ~10km west
  };

  private readonly MAP_STYLES = {
    'cyberpunk': 'backdrop',
    'satellite': 'satellite',
    'simple': 'streets-v2',
    'outdoor': 'outdoor-v2'
  };

  constructor() { }

  // Convert lat/lng to tile coordinates
  private latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  }

  // Generate tile URLs for MapTiler
  private getTileUrl(style: string, z: number, x: number, y: number): string {
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    return `https://api.maptiler.com/maps/${style}/${z}/${x}/${y}.png?key=${apiKey}`;
  }

  // Get all tiles for a zoom level within bounds
  private getTilesForZoom(zoom: number): { x: number; y: number; z: number }[] {
    const topLeft = this.latLngToTile(this.REGION_BOUNDS.north, this.REGION_BOUNDS.west, zoom);
    const bottomRight = this.latLngToTile(this.REGION_BOUNDS.south, this.REGION_BOUNDS.east, zoom);

    const tiles: { x: number; y: number; z: number }[] = [];

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles;
  }

  // Cache a single tile
  private async cacheTile(
    style: string,
    tile: { x: number; y: number; z: number }
  ): Promise<boolean> {
    try {
      const url = this.getTileUrl(style, tile.z, tile.x, tile.y);

      // Check if already cached
      const cached = await offlineStorage.getCachedMapTile(url);
      if (cached) {
        return true;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      await offlineStorage.cacheMapTile(url, blob, style);

      return true;
    } catch (error) {
      logger.warn(`Failed to cache tile ${style}/${tile.z}/${tile.x}/${tile.y}:`, error);
      return false;
    }
  }

  // Cache all tiles for a specific style and zoom range
  async cacheMapStyle(
    styleName: keyof typeof this.MAP_STYLES,
    onProgress?: (progress: CacheProgress) => void
  ): Promise<CacheProgress> {
    const style = this.MAP_STYLES[styleName];
    logger.info(`🗺️ Starting to cache ${styleName} map tiles...`);

    // Get all tiles for all zoom levels
    const allTiles: { x: number; y: number; z: number }[] = [];
    for (let zoom = this.MIN_ZOOM; zoom <= this.MAX_ZOOM; zoom++) {
      allTiles.push(...this.getTilesForZoom(zoom));
    }

    const progress: CacheProgress = {
      total: allTiles.length,
      cached: 0,
      failed: 0,
      percentage: 0
    };

    logger.info(`📦 Caching ${progress.total} tiles for ${styleName}`);

    // Cache tiles in batches to avoid overwhelming the browser
    const batchSize = 10;
    for (let i = 0; i < allTiles.length; i += batchSize) {
      const batch = allTiles.slice(i, i + batchSize);

      const batchPromises = batch.map(tile => this.cacheTile(style, tile));
      const results = await Promise.allSettled(batchPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          progress.cached++;
        } else {
          progress.failed++;
        }
      });

      progress.percentage = Math.round((progress.cached + progress.failed) / progress.total * 100);

      if (onProgress) {
        onProgress({ ...progress });
      }

      // Small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info(`✅ Cached ${progress.cached}/${progress.total} tiles for ${styleName} (${progress.failed} failed)`);
    return progress;
  }

  // Cache all map styles
  async cacheAllMapStyles(
    onProgress?: (styleName: string, progress: CacheProgress) => void
  ): Promise<{ [styleName: string]: CacheProgress }> {
    const results: { [styleName: string]: CacheProgress } = {};

    for (const styleName of Object.keys(this.MAP_STYLES) as (keyof typeof this.MAP_STYLES)[]) {
      try {
        const progress = await this.cacheMapStyle(styleName, (p) => {
          if (onProgress) {
            onProgress(styleName, p);
          }
        });
        results[styleName] = progress;
      } catch (error) {
        logger.error(`Failed to cache ${styleName}:`, error);
        results[styleName] = {
          total: 0,
          cached: 0,
          failed: 1,
          percentage: 0
        };
      }
    }

    return results;
  }

  // Get cached tile as blob URL for offline use
  async getCachedTileUrl(style: string, z: number, x: number, y: number): Promise<string | null> {
    try {
      const originalUrl = this.getTileUrl(style, z, x, y);
      const blob = await offlineStorage.getCachedMapTile(originalUrl);

      if (blob) {
        return URL.createObjectURL(blob);
      }

      return null;
    } catch (error) {
      logger.error('Error getting cached tile:', error);
      return null;
    }
  }

  // Check cache status for a map style
  async getCacheStatus(styleName: keyof typeof this.MAP_STYLES): Promise<{
    totalTiles: number;
    cachedTiles: number;
    percentage: number;
    isComplete: boolean;
  }> {
    const style = this.MAP_STYLES[styleName];

    // Get all tiles that should be cached
    const allTiles: { x: number; y: number; z: number }[] = [];
    for (let zoom = this.MIN_ZOOM; zoom <= this.MAX_ZOOM; zoom++) {
      allTiles.push(...this.getTilesForZoom(zoom));
    }

    let cachedCount = 0;

    // Check each tile in batches
    const batchSize = 50;
    for (let i = 0; i < allTiles.length; i += batchSize) {
      const batch = allTiles.slice(i, i + batchSize);

      const checkPromises = batch.map(async (tile) => {
        const url = this.getTileUrl(style, tile.z, tile.x, tile.y);
        const cached = await offlineStorage.getCachedMapTile(url);
        return cached !== null;
      });

      const results = await Promise.all(checkPromises);
      cachedCount += results.filter(Boolean).length;
    }

    const percentage = Math.round((cachedCount / allTiles.length) * 100);

    return {
      totalTiles: allTiles.length,
      cachedTiles: cachedCount,
      percentage,
      isComplete: percentage === 100
    };
  }

  // Get overall cache status for all styles
  async getOverallCacheStatus(): Promise<{
    [styleName: string]: {
      totalTiles: number;
      cachedTiles: number;
      percentage: number;
      isComplete: boolean;
    }
  }> {
    const results: any = {};

    for (const styleName of Object.keys(this.MAP_STYLES) as (keyof typeof this.MAP_STYLES)[]) {
      results[styleName] = await this.getCacheStatus(styleName);
    }

    return results;
  }

  // Clear cached tiles for a specific style
  async clearStyleCache(styleName: keyof typeof this.MAP_STYLES): Promise<void> {
    const _style = this.MAP_STYLES[styleName];
    logger.info(`🧹 Clearing cache for ${styleName}...`);

    // This would require extending the offlineStorage to support clearing by pattern
    // For now, we'll clear all map tiles
    await offlineStorage.clear('mapTiles');

    logger.info(`✅ Cleared cache for ${styleName}`);
  }

  // Estimate cache size
  estimateCacheSize(): {
    totalTiles: number;
    estimatedSizeMB: number;
    zoomLevels: number;
  } {
    let totalTiles = 0;

    for (let zoom = this.MIN_ZOOM; zoom <= this.MAX_ZOOM; zoom++) {
      const tiles = this.getTilesForZoom(zoom);
      totalTiles += tiles.length;
    }

    // Estimate ~20KB per tile on average
    const estimatedSizeMB = Math.round((totalTiles * 20) / 1024);

    return {
      totalTiles,
      estimatedSizeMB,
      zoomLevels: this.MAX_ZOOM - this.MIN_ZOOM + 1
    };
  }

  // Check if region is suitable for offline use
  isRegionCached(lat: number, lng: number, zoom: number): boolean {
    return (
      lat >= this.REGION_BOUNDS.south &&
      lat <= this.REGION_BOUNDS.north &&
      lng >= this.REGION_BOUNDS.west &&
      lng <= this.REGION_BOUNDS.east &&
      zoom >= this.MIN_ZOOM &&
      zoom <= this.MAX_ZOOM
    );
  }
}

// Export singleton instance
export const mapTileCache = new MapTileCacheService();
export default mapTileCache;
