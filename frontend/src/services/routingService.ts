/**
 * Routing Service for TECHNO SUTRA PWA
 * Uses OpenRouteService (FREE) for navigation and directions
 */

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instruction: string;
  name: string;
  distance: number;
  duration: number;
  type: number;
  way_points: [number, number];
  maneuver?: {
    bearing_after: number;
    bearing_before: number;
    location: [number, number];
    modifier?: string;
    type: string;
  };
}

export interface RouteSegment {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface Route {
  summary: {
    distance: number;
    duration: number;
  };
  segments: RouteSegment[];
  geometry: {
    coordinates: [number, number][];
    type: 'LineString';
  };
  way_points: number[];
  bbox: [number, number, number, number];
}

export interface DirectionsResponse {
  routes: Route[];
  bbox: [number, number, number, number];
  info: {
    attribution: string;
    service: string;
    timestamp: number;
    query: {
      coordinates: [number, number][];
      profile: string;
      format: string;
    };
    engine: {
      version: string;
      build_date: string;
      graph_date: string;
    };
  };
}

export interface RoutingOptions {
  profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'cycling-road' | 'cycling-mountain' | 'cycling-electric' | 'foot-walking' | 'foot-hiking' | 'wheelchair';
  preference?: 'fastest' | 'shortest' | 'recommended';
  units?: 'km' | 'mi' | 'm';
  language?: 'pt' | 'en' | 'es' | 'fr' | 'de';
  geometry?: boolean;
  instructions?: boolean;
  elevation?: boolean;
  extra_info?: string[];
  avoid_features?: ('highways' | 'tollways' | 'ferries' | 'fords' | 'steps')[];
  avoid_borders?: 'all' | 'controlled' | 'none';
  avoid_countries?: number[];
}

class RoutingService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openrouteservice.org';

  constructor() {
    // OpenRouteService oferece 2000 requests/dia grátis
    this.apiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRouteService API key not found. Routing services may not work.');
    }
  }

  /**
   * Get directions between multiple points
   */
  async getDirections(
    coordinates: RouteCoordinate[],
    options: RoutingOptions = {}
  ): Promise<DirectionsResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    if (coordinates.length < 2) {
      throw new Error('At least 2 coordinates are required');
    }

    if (coordinates.length > 50) {
      throw new Error('Maximum 50 waypoints allowed');
    }

    const profile = options.profile || 'driving-car';
    const url = `${this.baseUrl}/v2/directions/${profile}/json`;

    // Convert coordinates to [longitude, latitude] format (ORS expects [lon, lat])
    const coords = coordinates.map(coord => [coord.longitude, coord.latitude]);

    const requestBody: any = {
      coordinates: coords,
      preference: options.preference || 'recommended',
      units: options.units || 'km',
      language: options.language || 'pt',
      geometry: options.geometry !== false,
      instructions: options.instructions !== false,
      elevation: options.elevation || false
    };

    // Add extra_info if specified
    if (options.extra_info && options.extra_info.length > 0) {
      requestBody.extra_info = options.extra_info;
    }

    // Add options object for avoidances
    if (options.avoid_features || options.avoid_borders || options.avoid_countries) {
      requestBody.options = {};

      if (options.avoid_features) {
        requestBody.options.avoid_features = options.avoid_features;
      }

      if (options.avoid_borders) {
        requestBody.options.avoid_borders = options.avoid_borders;
      }

      if (options.avoid_countries) {
        requestBody.options.avoid_countries = options.avoid_countries;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
        throw new Error(`Routing request failed: ${response.status} ${response.statusText} - ${errorMessage}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Routing error:', error);
      throw new Error(`Erro no roteamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Get simple route between two points using GET endpoint (basic)
   */
  async getSimpleRoute(
    start: RouteCoordinate,
    end: RouteCoordinate,
    profile: RoutingOptions['profile'] = 'driving-car'
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const url = `${this.baseUrl}/v2/directions/${profile}?start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}&api_key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/geo+json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
        throw new Error(`Simple routing request failed: ${response.status} ${response.statusText} - ${errorMessage}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Simple routing error:', error);
      throw new Error(`Erro no roteamento simples: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Get route between two points (uses POST endpoint for advanced options)
   */
  async getRoute(
    start: RouteCoordinate,
    end: RouteCoordinate,
    options: RoutingOptions = {}
  ): Promise<Route> {
    // Check if offline
    if (!navigator.onLine) {
      console.log('Offline mode: using simple routing fallback');
      return this.getOfflineRoute(start, end, options);
    }

    try {
      const response = await this.getDirections([start, end], options);

      if (!response.routes || response.routes.length === 0) {
        throw new Error('Nenhuma rota encontrada');
      }

      return response.routes[0];
    } catch (error) {
      console.error('Routing failed, using offline fallback:', error);
      return this.getOfflineRoute(start, end, options);
    }
  }

  /**
   * Get route with waypoints
   */
  async getRouteWithWaypoints(
    start: RouteCoordinate,
    waypoints: RouteCoordinate[],
    end: RouteCoordinate,
    options: RoutingOptions = {}
  ): Promise<Route> {
    const coordinates = [start, ...waypoints, end];
    const response = await this.getDirections(coordinates, options);

    if (!response.routes || response.routes.length === 0) {
      throw new Error('Nenhuma rota encontrada');
    }

    return response.routes[0];
  }

  /**
   * Get multiple route alternatives
   */
  async getAlternativeRoutes(
    start: RouteCoordinate,
    end: RouteCoordinate,
    options: RoutingOptions = {}
  ): Promise<Route[]> {
    // OpenRouteService doesn't support alternatives in the same way as Mapbox
    // We can try different preferences to get alternatives
    const preferences: Array<RoutingOptions['preference']> = ['fastest', 'shortest', 'recommended'];
    const routes: Route[] = [];

    for (const preference of preferences) {
      try {
        const route = await this.getRoute(start, end, {
          ...options,
          preference
        });
        routes.push(route);
      } catch (error) {
        console.warn(`Failed to get ${preference} route:`, error);
      }
    }

    return routes;
  }

  /**
   * Calculate route distance and duration
   */
  async getRouteSummary(
    start: RouteCoordinate,
    end: RouteCoordinate,
    options: RoutingOptions = {}
  ): Promise<{ distance: number; duration: number; }> {
    const route = await this.getRoute(start, end, {
      ...options,
      geometry: false,
      instructions: false
    });

    return {
      distance: route.summary.distance,
      duration: route.summary.duration
    };
  }

  /**
   * Get turn-by-turn navigation instructions
   */
  async getNavigationInstructions(
    start: RouteCoordinate,
    end: RouteCoordinate,
    options: RoutingOptions = {}
  ): Promise<RouteStep[]> {
    const route = await this.getRoute(start, end, {
      ...options,
      instructions: true
    });

    const allSteps: RouteStep[] = [];
    route.segments.forEach(segment => {
      allSteps.push(...segment.steps);
    });

    return allSteps;
  }

  /**
   * Check if coordinates are valid for routing
   */
  isValidCoordinate(coord: RouteCoordinate): boolean {
    return (
      typeof coord.latitude === 'number' &&
      typeof coord.longitude === 'number' &&
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180 &&
      !isNaN(coord.latitude) &&
      !isNaN(coord.longitude)
    );
  }

  /**
   * Calculate straight-line distance between two points (Haversine)
   */
  calculateDistance(start: RouteCoordinate, end: RouteCoordinate): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = start.latitude * Math.PI / 180;
    const φ2 = end.latitude * Math.PI / 180;
    const Δφ = (end.latitude - start.latitude) * Math.PI / 180;
    const Δλ = (end.longitude - start.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate bearing between two points
   */
  calculateBearing(start: RouteCoordinate, end: RouteCoordinate): number {
    const φ1 = start.latitude * Math.PI / 180;
    const φ2 = end.latitude * Math.PI / 180;
    const Δλ = (end.longitude - start.longitude) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360; // Bearing in degrees
  }

  /**
   * Format duration in human readable format
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  /**
   * Format distance in human readable format
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }

  /**
   * Forward geocoding using OpenRouteService
   */
  async geocodeForward(query: string, options: {
    boundary_country?: string[];
    size?: number;
    layers?: string[];
    sources?: string[];
  } = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const params = new URLSearchParams({
      api_key: this.apiKey,
      text: query,
      size: (options.size || 10).toString()
    });

    if (options.boundary_country) {
      params.append('boundary.country', options.boundary_country.join(','));
    }

    if (options.layers) {
      params.append('layers', options.layers.join(','));
    }

    if (options.sources) {
      params.append('sources', options.sources.join(','));
    }

    const url = `${this.baseUrl}/geocode/search?${params}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Forward geocoding error:', error);
      throw new Error(`Erro na geocodificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Reverse geocoding using OpenRouteService
   */
  async geocodeReverse(longitude: number, latitude: number, options: {
    size?: number;
    layers?: string[];
    sources?: string[];
  } = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const params = new URLSearchParams({
      api_key: this.apiKey,
      'point.lon': longitude.toString(),
      'point.lat': latitude.toString(),
      size: (options.size || 1).toString()
    });

    if (options.layers) {
      params.append('layers', options.layers.join(','));
    }

    if (options.sources) {
      params.append('sources', options.sources.join(','));
    }

    const url = `${this.baseUrl}/geocode/reverse?${params}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error(`Erro na geocodificação reversa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Offline fallback for routing
   */
  private getOfflineRoute(
    start: RouteCoordinate,
    end: RouteCoordinate,
    options: RoutingOptions = {}
  ): Route {
    // Calculate simple straight-line route
    const startCoords = Array.isArray(start) ? start : [start.longitude, start.latitude];
    const endCoords = Array.isArray(end) ? end : [end.longitude, end.latitude];

    // Simple straight-line distance calculation (Haversine formula)
    const R = 6371000; // Earth's radius in meters
    const lat1 = startCoords[1] * Math.PI / 180;
    const lat2 = endCoords[1] * Math.PI / 180;
    const deltaLat = (endCoords[1] - startCoords[1]) * Math.PI / 180;
    const deltaLng = (endCoords[0] - startCoords[0]) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate duration based on profile (walking speed ~5km/h, driving ~50km/h)
    const profile = options.profile || 'foot-walking';
    const speedKmh = profile.includes('foot') ? 5 : profile.includes('cycling') ? 20 : 50;
    const duration = (distance / 1000) / speedKmh * 3600; // seconds

    return {
      summary: {
        distance: Math.round(distance),
        duration: Math.round(duration)
      },
      geometry: {
        coordinates: [startCoords, endCoords],
        type: 'LineString'
      },
      segments: [{
        distance: Math.round(distance),
        duration: Math.round(duration),
        steps: [{
          distance: Math.round(distance),
          duration: Math.round(duration),
          type: 11, // straight
          instruction: `Siga em direção ao destino por ${(distance / 1000).toFixed(1)}km`,
          name: 'Rota offline',
          way_points: [0, 1]
        }]
      }],
      way_points: [0, 1],
      legs: []
    };
  }
}

// Export singleton instance
export const routingService = new RoutingService();
export default routingService;
