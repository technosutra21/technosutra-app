// Offline Geolocation Service for PWA
// Provides GPS functionality even when offline using cached positions and estimated locations

import { logger } from '@/lib/logger';
import { GPSPosition } from './enhancedGPS';

interface OfflineLocationData {
  position: GPSPosition;
  timestamp: number;
  source: 'gps' | 'network' | 'estimated' | 'cached';
  confidence: number; // 0-1 scale
}

interface LocationCacheEntry {
  position: GPSPosition;
  timestamp: number;
  accuracy: number;
  source: string;
}

class OfflineGeolocationService {
  private static instance: OfflineGeolocationService;
  private locationCache: LocationCacheEntry[] = [];
  private maxCacheSize = 50;
  private cacheStorageKey = 'technosutra-location-cache';
  private lastEstimatedPosition: GPSPosition | null = null;

  // Águas da Prata reference points for triangulation
  private readonly REFERENCE_POINTS = [
    { lat: -21.9427, lng: -46.7167, name: 'Centro da cidade' },
    { lat: -21.9389, lng: -46.7134, name: 'Parque das Águas' },
    { lat: -21.9445, lng: -46.7189, name: 'Estação Rodoviária' },
    { lat: -21.9412, lng: -46.7145, name: 'Igreja Matriz' },
    { lat: -21.9401, lng: -46.7178, name: 'Mercado Municipal' }
  ];

  static getInstance(): OfflineGeolocationService {
    if (!OfflineGeolocationService.instance) {
      OfflineGeolocationService.instance = new OfflineGeolocationService();
    }
    return OfflineGeolocationService.instance;
  }

  private constructor() {
    this.loadLocationCache();
  }

  // Initialize the service with PWA capabilities
  async initialize(): Promise<void> {
    try {
      // Load cached locations from IndexedDB
      await this.loadLocationCache();
      
      // Pre-cache some estimated positions
      await this.preloadEstimatedPositions();
      
      logger.info('🌍 Offline Geolocation Service initialized');
    } catch (error) {
      logger.error('Failed to initialize offline geolocation service:', error);
    }
  }

  // Get current position with offline fallbacks
  async getCurrentPosition(options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  } = {}): Promise<OfflineLocationData> {
    const startTime = Date.now();
    
    try {
      // Try native geolocation first
      if (navigator.geolocation && navigator.onLine) {
        const position = await this.tryNativeGeolocation(options);
        if (position) {
          await this.cachePosition(position, 'gps', 0.9);
          return {
            position,
            timestamp: Date.now(),
            source: 'gps',
            confidence: 0.9
          };
        }
      }

      // Fallback to network-based location (if available)
      const networkPosition = await this.tryNetworkLocation();
      if (networkPosition) {
        await this.cachePosition(networkPosition, 'network', 0.7);
        return {
          position: networkPosition,
          timestamp: Date.now(),
          source: 'network',
          confidence: 0.7
        };
      }

      // Use cached position with decay
      const cachedPosition = this.getBestCachedPosition();
      if (cachedPosition) {
        const ageMinutes = (Date.now() - cachedPosition.timestamp) / (1000 * 60);
        const confidence = Math.max(0.3, 0.8 - (ageMinutes * 0.01)); // Decay confidence over time
        
        return {
          position: cachedPosition.position,
          timestamp: Date.now(),
          source: 'cached',
          confidence
        };
      }

      // Final fallback to estimated position
      const estimatedPosition = this.getSmartEstimatedPosition();
      return {
        position: estimatedPosition,
        timestamp: Date.now(),
        source: 'estimated',
        confidence: 0.4
      };

    } catch (error) {
      logger.error('Offline geolocation failed:', error);
      
      // Emergency fallback
      const emergencyPosition = this.getEmergencyPosition();
      return {
        position: emergencyPosition,
        timestamp: Date.now(),
        source: 'estimated',
        confidence: 0.2
      };
    }
  }

  // Try native geolocation with promise wrapper
  private async tryNativeGeolocation(options: any): Promise<GPSPosition | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), options.timeout || 10000);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          resolve(this.convertPosition(position));
        },
        () => {
          clearTimeout(timeout);
          resolve(null);
        },
        {
          enableHighAccuracy: options.enableHighAccuracy || false,
          timeout: options.timeout || 10000,
          maximumAge: options.maximumAge || 300000
        }
      );
    });
  }

  // Try network-based location (using IP geolocation)
  private async tryNetworkLocation(): Promise<GPSPosition | null> {
    try {
      if (!navigator.onLine) return null;

      const response = await fetch('https://ipapi.co/json/', { 
        signal: AbortSignal.timeout(5000) 
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          return {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            accuracy: 50000, // IP location is very approximate
            timestamp: Date.now()
          };
        }
      }
    } catch (error) {
      logger.warn('Network location failed:', error);
    }
    return null;
  }

  // Get best cached position based on accuracy and recency
  private getBestCachedPosition(): LocationCacheEntry | null {
    if (this.locationCache.length === 0) return null;

    // Sort by a composite score of accuracy and recency
    const scoredCache = this.locationCache.map(entry => {
      const ageHours = (Date.now() - entry.timestamp) / (1000 * 60 * 60);
      const accuracyScore = 1 / (entry.accuracy + 1); // Better accuracy = higher score
      const recencyScore = Math.max(0, 1 - (ageHours / 24)); // Decay over 24 hours
      const totalScore = (accuracyScore * 0.6) + (recencyScore * 0.4);
      
      return { ...entry, score: totalScore };
    });

    scoredCache.sort((a, b) => b.score - a.score);
    return scoredCache[0];
  }

  // Smart estimated position using multiple heuristics
  private getSmartEstimatedPosition(): GPSPosition {
    // If we have previous estimates, use them with some variation
    if (this.lastEstimatedPosition) {
      // Add small random variation to simulate movement
      const variation = 0.0001; // ~11 meters
      return {
        latitude: this.lastEstimatedPosition.latitude + (Math.random() - 0.5) * variation,
        longitude: this.lastEstimatedPosition.longitude + (Math.random() - 0.5) * variation,
        accuracy: 500,
        timestamp: Date.now()
      };
    }

    // Use a weighted average of reference points
    const weights = [0.3, 0.2, 0.2, 0.15, 0.15];
    let lat = 0, lng = 0;
    
    this.REFERENCE_POINTS.forEach((point, index) => {
      lat += point.lat * weights[index];
      lng += point.lng * weights[index];
    });

    const estimatedPosition = {
      latitude: lat,
      longitude: lng,
      accuracy: 1000,
      timestamp: Date.now()
    };

    this.lastEstimatedPosition = estimatedPosition;
    return estimatedPosition;
  }

  // Emergency fallback position (center of Águas da Prata)
  private getEmergencyPosition(): GPSPosition {
    return {
      latitude: -21.9427,
      longitude: -46.7167,
      accuracy: 2000,
      timestamp: Date.now()
    };
  }

  // Cache a position for offline use
  private async cachePosition(position: GPSPosition, source: string, confidence: number): Promise<void> {
    const cacheEntry: LocationCacheEntry = {
      position,
      timestamp: Date.now(),
      accuracy: position.accuracy,
      source
    };

    this.locationCache.push(cacheEntry);

    // Maintain cache size
    if (this.locationCache.length > this.maxCacheSize) {
      this.locationCache.shift();
    }

    // Save to localStorage for persistence
    try {
      localStorage.setItem(this.cacheStorageKey, JSON.stringify(this.locationCache));
    } catch (error) {
      logger.warn('Failed to save location cache:', error);
    }
  }

  // Load cached positions from storage
  private async loadLocationCache(): Promise<void> {
    try {
      const cached = localStorage.getItem(this.cacheStorageKey);
      if (cached) {
        this.locationCache = JSON.parse(cached);
        
        // Clean old entries (older than 7 days)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.locationCache = this.locationCache.filter(entry => entry.timestamp > weekAgo);
      }
    } catch (error) {
      logger.warn('Failed to load location cache:', error);
      this.locationCache = [];
    }
  }

  // Pre-load some estimated positions for faster offline access
  private async preloadEstimatedPositions(): Promise<void> {
    // Create some variation around the main area
    const basePosition = { lat: -21.9427, lng: -46.7167 };
    const variations = [
      { lat: 0, lng: 0 }, // Center
      { lat: 0.001, lng: 0.001 }, // Northeast
      { lat: -0.001, lng: 0.001 }, // Southeast
      { lat: 0.001, lng: -0.001 }, // Northwest
      { lat: -0.001, lng: -0.001 } // Southwest
    ];

    variations.forEach((variation, index) => {
      const position: GPSPosition = {
        latitude: basePosition.lat + variation.lat,
        longitude: basePosition.lng + variation.lng,
        accuracy: 1000 + (index * 100),
        timestamp: Date.now()
      };

      const cacheEntry: LocationCacheEntry = {
        position,
        timestamp: Date.now(),
        accuracy: position.accuracy,
        source: 'preloaded'
      };

      this.locationCache.push(cacheEntry);
    });
  }

  // Convert native position to our format
  private convertPosition(position: GeolocationPosition): GPSPosition {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: Date.now()
    };
  }

  // Check if location is within expected hiking area
  isInHikingArea(position: GPSPosition): boolean {
    const center = { lat: -21.9427, lng: -46.7167 };
    const distance = this.calculateDistance(position, {
      latitude: center.lat,
      longitude: center.lng,
      accuracy: 0,
      timestamp: Date.now()
    });
    
    return distance <= 10000; // 10km radius
  }

  // Calculate distance between two positions (Haversine formula)
  private calculateDistance(pos1: GPSPosition, pos2: GPSPosition): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = pos1.latitude * Math.PI / 180;
    const lat2Rad = pos2.latitude * Math.PI / 180;
    const deltaLatRad = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const deltaLngRad = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Get location cache status for debugging
  getCacheStatus(): {
    cacheSize: number;
    oldestEntry: number;
    newestEntry: number;
    averageAccuracy: number;
  } {
    if (this.locationCache.length === 0) {
      return {
        cacheSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
        averageAccuracy: 0
      };
    }

    const timestamps = this.locationCache.map(entry => entry.timestamp);
    const accuracies = this.locationCache.map(entry => entry.accuracy);

    return {
      cacheSize: this.locationCache.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
      averageAccuracy: accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
    };
  }
}

export const offlineGeolocationService = OfflineGeolocationService.getInstance();
export type { OfflineLocationData };