// Enhanced GPS Service for TECHNO SUTRA
// High-accuracy GPS positioning with MapTiler integration and offline support

import { logger } from '@/lib/logger';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GPSOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  desiredAccuracy?: number;
  trackMovement?: boolean;
}

export interface GPSWatchOptions extends GPSOptions {
  onPositionUpdate: (position: GPSPosition) => void;
  onError: (error: GeolocationPositionError) => void;
  onAccuracyImproved?: (accuracy: number) => void;
}

class EnhancedGPSService {
  private watchId: number | null = null;
  private currentPosition: GPSPosition | null = null;
  private isTracking = false;
  private lastKnownPosition: GPSPosition | null = null;
  private accuracyHistory: number[] = [];
  private positionHistory: GPSPosition[] = [];
  private maxHistorySize = 10;

  // Águas da Prata, SP coordinates for reference
  private readonly BASE_LOCATION = {
    latitude: -21.9427,
    longitude: -46.7167
  };

  constructor() {
    this.loadLastKnownPosition();
  }

  private loadLastKnownPosition(): void {
    try {
      const saved = localStorage.getItem('technosutra-last-position');
      if (saved) {
        this.lastKnownPosition = JSON.parse(saved);
        logger.info('📍 Loaded last known position');
      }
    } catch (error) {
      logger.warn('Failed to load last known position:', error);
    }
  }

  private saveLastKnownPosition(position: GPSPosition): void {
    try {
      localStorage.setItem('technosutra-last-position', JSON.stringify(position));
      this.lastKnownPosition = position;
    } catch (error) {
      logger.warn('Failed to save position:', error);
    }
  }

  private updateAccuracyHistory(accuracy: number): void {
    this.accuracyHistory.push(accuracy);
    if (this.accuracyHistory.length > this.maxHistorySize) {
      this.accuracyHistory.shift();
    }
  }

  private updatePositionHistory(position: GPSPosition): void {
    this.positionHistory.push(position);
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift();
    }
  }

  private getAverageAccuracy(): number {
    if (this.accuracyHistory.length === 0) return Infinity;
    return this.accuracyHistory.reduce((sum, acc) => sum + acc, 0) / this.accuracyHistory.length;
  }

  private isPositionValid(position: GeolocationPosition): boolean {
    const coords = position.coords;
    
    // Check if coordinates are reasonable for Brazil
    if (coords.latitude < -35 || coords.latitude > 5 ||
        coords.longitude < -75 || coords.longitude > -30) {
      return false;
    }

    // Check accuracy threshold
    if (coords.accuracy > 100) { // More than 100m accuracy is not useful
      return false;
    }

    return true;
  }

  private convertToGPSPosition(position: GeolocationPosition): GPSPosition {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp
    };
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(pos1: GPSPosition, pos2: GPSPosition): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get current position with high accuracy
  async getCurrentPosition(options: GPSOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 30000,
    desiredAccuracy: 10
  }): Promise<GPSPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const geoOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge
      };

      let bestPosition: GPSPosition | null = null;
      let attempts = 0;
      const maxAttempts = 3;

      const tryGetPosition = () => {
        attempts++;
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!this.isPositionValid(position)) {
              if (attempts < maxAttempts) {
                setTimeout(tryGetPosition, 1000);
                return;
              } else {
                reject(new Error('Could not get valid position'));
                return;
              }
            }

            const gpsPosition = this.convertToGPSPosition(position);
            
            // If we have a desired accuracy, keep trying until we reach it
            if (options.desiredAccuracy && gpsPosition.accuracy > options.desiredAccuracy) {
              if (!bestPosition || gpsPosition.accuracy < bestPosition.accuracy) {
                bestPosition = gpsPosition;
              }
              
              if (attempts < maxAttempts) {
                setTimeout(tryGetPosition, 2000);
                return;
              }
            }

            const finalPosition = bestPosition || gpsPosition;
            this.currentPosition = finalPosition;
            this.saveLastKnownPosition(finalPosition);
            this.updateAccuracyHistory(finalPosition.accuracy);
            this.updatePositionHistory(finalPosition);
            
            logger.info(`📍 GPS position acquired: ${finalPosition.accuracy}m accuracy`);
            resolve(finalPosition);
          },
          (error) => {
            logger.error('GPS error:', error);
            
            // Fallback to last known position if available
            if (this.lastKnownPosition && attempts >= maxAttempts) {
              logger.info('📍 Using last known position as fallback');
              resolve(this.lastKnownPosition);
            } else if (attempts < maxAttempts) {
              setTimeout(tryGetPosition, 2000);
            } else {
              reject(error);
            }
          },
          geoOptions
        );
      };

      tryGetPosition();
    });
  }

  // Start watching position with enhanced accuracy
  startWatching(options: GPSWatchOptions): number | null {
    if (!navigator.geolocation) {
      options.onError(new GeolocationPositionError());
      return null;
    }

    if (this.watchId !== null) {
      this.stopWatching();
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy,
      timeout: options.timeout,
      maximumAge: options.maximumAge
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!this.isPositionValid(position)) {
          return;
        }

        const gpsPosition = this.convertToGPSPosition(position);
        const previousAccuracy = this.currentPosition?.accuracy || Infinity;
        
        this.currentPosition = gpsPosition;
        this.saveLastKnownPosition(gpsPosition);
        this.updateAccuracyHistory(gpsPosition.accuracy);
        this.updatePositionHistory(gpsPosition);
        
        // Notify about accuracy improvement
        if (gpsPosition.accuracy < previousAccuracy && options.onAccuracyImproved) {
          options.onAccuracyImproved(gpsPosition.accuracy);
        }
        
        options.onPositionUpdate(gpsPosition);
        
        logger.info(`📍 GPS updated: ${gpsPosition.accuracy}m accuracy`);
      },
      (error) => {
        logger.error('GPS watch error:', error);
        options.onError(error);
      },
      geoOptions
    );

    this.isTracking = true;
    logger.info('🎯 GPS tracking started');
    return this.watchId;
  }

  // Stop watching position
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      logger.info('⏹️ GPS tracking stopped');
    }
  }

  // Check if user is within range of a point
  isWithinRange(targetLat: number, targetLng: number, rangeMeters: number = 50): boolean {
    if (!this.currentPosition) return false;
    
    const distance = this.calculateDistance(
      this.currentPosition,
      { latitude: targetLat, longitude: targetLng, accuracy: 0, timestamp: Date.now() }
    );
    
    return distance <= rangeMeters;
  }

  // Get distance to a point
  getDistanceTo(targetLat: number, targetLng: number): number | null {
    if (!this.currentPosition) return null;
    
    return this.calculateDistance(
      this.currentPosition,
      { latitude: targetLat, longitude: targetLng, accuracy: 0, timestamp: Date.now() }
    );
  }

  // Get current position or last known position
  getCurrentOrLastPosition(): GPSPosition | null {
    return this.currentPosition || this.lastKnownPosition;
  }

  // Get position statistics
  getPositionStats(): {
    currentAccuracy: number | null;
    averageAccuracy: number;
    positionCount: number;
    isTracking: boolean;
    lastUpdate: number | null;
  } {
    return {
      currentAccuracy: this.currentPosition?.accuracy || null,
      averageAccuracy: this.getAverageAccuracy(),
      positionCount: this.positionHistory.length,
      isTracking: this.isTracking,
      lastUpdate: this.currentPosition?.timestamp || null
    };
  }

  // Check if GPS is available and permissions granted
  async checkGPSAvailability(): Promise<{
    available: boolean;
    permission: PermissionState | null;
    error?: string;
  }> {
    if (!navigator.geolocation) {
      return { available: false, permission: null, error: 'Geolocation not supported' };
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return {
        available: true,
        permission: permission.state
      };
    } catch (error) {
      return {
        available: true,
        permission: null,
        error: 'Could not check permissions'
      };
    }
  }

  // Get estimated position based on Águas da Prata if GPS fails
  getEstimatedPosition(): GPSPosition {
    return {
      latitude: this.BASE_LOCATION.latitude,
      longitude: this.BASE_LOCATION.longitude,
      accuracy: 1000, // 1km accuracy for estimated position
      timestamp: Date.now()
    };
  }

  // Cleanup
  destroy(): void {
    this.stopWatching();
    this.currentPosition = null;
    this.accuracyHistory = [];
    this.positionHistory = [];
  }
}

// Export singleton instance
export const enhancedGPS = new EnhancedGPSService();
export default enhancedGPS;
