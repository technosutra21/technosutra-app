/**
 * Advanced Geolocation Service for TECHNO SUTRA PWA
 * Provides high-precision GPS tracking with fallback mechanisms
 */

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export type GeolocationCallback = (position: GeolocationPosition) => void;
export type GeolocationErrorCallback = (error: GeolocationError) => void;

class GeolocationService {
  private watchId: number | null = null;
  private lastKnownPosition: GeolocationPosition | null = null;
  private isTracking = false;
  private callbacks: Set<GeolocationCallback> = new Set();
  private errorCallbacks: Set<GeolocationErrorCallback> = new Set();

  /**
   * Check if geolocation is supported by the browser
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check current permission status
   */
  async checkPermission(): Promise<PermissionState> {
    if (!('permissions' in navigator)) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.warn('Permission API not supported:', error);
      return 'prompt';
    }
  }

  /**
   * Request geolocation permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Geolocation not supported');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          const geoError = this.mapGeolocationError(error);
          reject(geoError);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(options: GeolocationOptions = {}): Promise<GeolocationPosition> {
    if (!this.isSupported()) {
      throw new Error('Geolocation not supported');
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 15000,
      maximumAge: options.maximumAge ?? 30000
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoPosition = this.mapPosition(position);
          this.lastKnownPosition = geoPosition;
          resolve(geoPosition);
        },
        (error) => {
          const geoError = this.mapGeolocationError(error);
          reject(geoError);
        },
        defaultOptions
      );
    });
  }

  /**
   * Start watching position changes
   */
  startTracking(options: GeolocationOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('Geolocation not supported'));
    }

    if (this.isTracking) {
      return Promise.resolve();
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 30000,
      maximumAge: options.maximumAge ?? 5000
    };

    return new Promise((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const geoPosition = this.mapPosition(position);
          this.lastKnownPosition = geoPosition;
          this.notifyCallbacks(geoPosition);
          
          if (!this.isTracking) {
            this.isTracking = true;
            resolve();
          }
        },
        (error) => {
          const geoError = this.mapGeolocationError(error);
          this.notifyErrorCallbacks(geoError);
          
          if (!this.isTracking) {
            reject(geoError);
          }
        },
        defaultOptions
      );
    });
  }

  /**
   * Stop watching position changes
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
  }

  /**
   * Subscribe to position updates
   */
  subscribe(callback: GeolocationCallback): () => void {
    this.callbacks.add(callback);
    
    // If we have a last known position, call immediately
    if (this.lastKnownPosition) {
      callback(this.lastKnownPosition);
    }

    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Subscribe to error updates
   */
  subscribeToErrors(callback: GeolocationErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Get last known position
   */
  getLastKnownPosition(): GeolocationPosition | null {
    return this.lastKnownPosition;
  }

  /**
   * Check if currently tracking
   */
  getIsTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Calculate distance between two positions (Haversine formula)
   */
  calculateDistance(pos1: GeolocationPosition, pos2: GeolocationPosition): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.latitude * Math.PI / 180;
    const φ2 = pos2.latitude * Math.PI / 180;
    const Δφ = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const Δλ = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate bearing between two positions
   */
  calculateBearing(pos1: GeolocationPosition, pos2: GeolocationPosition): number {
    const φ1 = pos1.latitude * Math.PI / 180;
    const φ2 = pos2.latitude * Math.PI / 180;
    const Δλ = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360; // Bearing in degrees
  }

  private mapPosition(position: GeolocationPosition): GeolocationPosition {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
      timestamp: position.timestamp
    };
  }

  private mapGeolocationError(error: GeolocationPositionError): GeolocationError {
    let type: GeolocationError['type'];
    let message: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        type = 'PERMISSION_DENIED';
        message = 'Permissão de localização negada pelo usuário';
        break;
      case error.POSITION_UNAVAILABLE:
        type = 'POSITION_UNAVAILABLE';
        message = 'Posição indisponível - verifique sua conexão GPS/internet';
        break;
      case error.TIMEOUT:
        type = 'TIMEOUT';
        message = 'Timeout ao obter localização - tente novamente';
        break;
      default:
        type = 'NOT_SUPPORTED';
        message = 'Erro desconhecido de geolocalização';
    }

    return {
      code: error.code,
      message,
      type
    };
  }

  private notifyCallbacks(position: GeolocationPosition): void {
    this.callbacks.forEach(callback => {
      try {
        callback(position);
      } catch (error) {
        console.error('Error in geolocation callback:', error);
      }
    });
  }

  private notifyErrorCallbacks(error: GeolocationError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in geolocation error callback:', err);
      }
    });
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();
export default geolocationService;
