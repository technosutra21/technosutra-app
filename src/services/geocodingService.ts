/**
 * Geocoding Service for TECHNO SUTRA PWA
 * Uses MapTiler SDK (FREE) for forward and reverse geocoding
 */

export interface GeocodingResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    address?: string;
    category?: string;
    maki?: string;
    landmark?: boolean;
    wikidata?: string;
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface ReverseGeocodingResult {
  place_name: string;
  center: [number, number];
  address: {
    street_number?: string;
    street_name?: string;
    neighborhood?: string;
    locality?: string;
    place?: string;
    district?: string;
    postcode?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
  place_type: string[];
}

export interface GeocodingOptions {
  limit?: number;
  proximity?: [number, number]; // [longitude, latitude]
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  country?: string | string[];
  types?: string[];
  language?: string;
  fuzzyMatch?: boolean;
}

class GeocodingService {
  private apiKey: string;
  private baseUrl: string = 'https://api.maptiler.com/geocoding';

  constructor() {
    // MapTiler oferece 100,000 requests/mês grátis
    this.apiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('MapTiler API key not found. Geocoding services may not work.');
    }
  }

  /**
   * Forward geocoding - convert address/place name to coordinates
   */
  async forward(query: string, options: GeocodingOptions = {}): Promise<GeocodingResult[]> {
    if (!this.apiKey) {
      console.warn('MapTiler API key not configured, using offline fallback');
      return this.getOfflineFallback(query);
    }

    if (!query.trim()) {
      return [];
    }

    // Check if offline
    if (!navigator.onLine) {
      console.log('Offline mode: using cached geocoding data');
      return this.getOfflineFallback(query);
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: query.trim(),
        limit: (options.limit || 5).toString(),
        language: options.language || 'pt',
        fuzzyMatch: options.fuzzyMatch !== false ? 'true' : 'false'
      });

      // Add proximity if provided
      if (options.proximity) {
        params.append('proximity', `${options.proximity[0]},${options.proximity[1]}`);
      }

      // Add bbox if provided
      if (options.bbox) {
        params.append('bbox', options.bbox.join(','));
      }

      // Add country filter if provided
      if (options.country) {
        const countries = Array.isArray(options.country) ? options.country : [options.country];
        params.append('country', countries.join(','));
      }

      // Add types filter if provided
      if (options.types && options.types.length > 0) {
        params.append('types', options.types.join(','));
      }

      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return data.features?.map((feature: any) => this.mapForwardResult(feature)) || [];
    } catch (error) {
      console.error('Forward geocoding error:', error);
      // Fallback to offline data if network fails
      console.log('Network geocoding failed, using offline fallback');
      return this.getOfflineFallback(query);
    }
  }

  /**
   * Reverse geocoding - convert coordinates to address
   */
  async reverse(longitude: number, latitude: number, options: Partial<GeocodingOptions> = {}): Promise<ReverseGeocodingResult | null> {
    if (!this.apiKey) {
      throw new Error('MapTiler API key not configured');
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        language: options.language || 'pt'
      });

      const url = `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?${params}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Reverse geocoding request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        return null;
      }

      return this.mapReverseResult(data.features[0]);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Provide offline fallback for reverse geocoding
      return this.getOfflineReverseResult(latitude, longitude);
    }
  }

  /**
   * Search for places near a specific location
   */
  async searchNearby(
    longitude: number,
    latitude: number,
    query: string,
    radius: number = 1000,
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult[]> {
    const searchOptions: GeocodingOptions = {
      ...options,
      proximity: [longitude, latitude],
      limit: options.limit || 10
    };

    // Create a bounding box around the point
    const kmPerDegree = 111.32; // Approximate km per degree at equator
    const deltaLat = (radius / 1000) / kmPerDegree;
    const deltaLng = (radius / 1000) / (kmPerDegree * Math.cos(latitude * Math.PI / 180));

    searchOptions.bbox = [
      longitude - deltaLng,
      latitude - deltaLat,
      longitude + deltaLng,
      latitude + deltaLat
    ];

    return this.forward(query, searchOptions);
  }

  /**
   * Get address components from coordinates
   */
  async getAddressComponents(longitude: number, latitude: number): Promise<{
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    formattedAddress?: string;
  }> {
    const result = await this.reverse(longitude, latitude);

    if (!result) {
      return {};
    }

    return {
      street: result.address.street_name,
      neighborhood: result.address.neighborhood,
      city: result.address.locality || result.address.place,
      state: result.address.region,
      country: result.address.country,
      postalCode: result.address.postcode,
      formattedAddress: result.place_name
    };
  }

  /**
   * Validate coordinates
   */
  isValidCoordinates(longitude: number, latitude: number): boolean {
    return (
      typeof longitude === 'number' &&
      typeof latitude === 'number' &&
      longitude >= -180 &&
      longitude <= 180 &&
      latitude >= -90 &&
      latitude <= 90 &&
      !isNaN(longitude) &&
      !isNaN(latitude)
    );
  }

  private mapForwardResult(feature: any): GeocodingResult {
    return {
      id: feature.id || '',
      place_name: feature.place_name || feature.text || '',
      center: feature.center || [0, 0],
      place_type: feature.place_type || [],
      relevance: feature.relevance || 0,
      properties: {
        accuracy: feature.properties?.accuracy,
        address: feature.properties?.address,
        category: feature.properties?.category,
        maki: feature.properties?.maki,
        landmark: feature.properties?.landmark,
        wikidata: feature.properties?.wikidata
      },
      context: feature.context?.map((ctx: any) => ({
        id: ctx.id,
        text: ctx.text,
        short_code: ctx.short_code
      })),
      bbox: feature.bbox
    };
  }

  private mapReverseResult(feature: any): ReverseGeocodingResult {
    const address: ReverseGeocodingResult['address'] = {};

    // Extract address components from context
    if (feature.context) {
      feature.context.forEach((ctx: any) => {
        const id = ctx.id.toLowerCase();
        if (id.includes('postcode')) {
          address.postcode = ctx.text;
        } else if (id.includes('place') || id.includes('locality')) {
          address.locality = ctx.text;
        } else if (id.includes('district')) {
          address.district = ctx.text;
        } else if (id.includes('region')) {
          address.region = ctx.text;
        } else if (id.includes('country')) {
          address.country = ctx.text;
          address.country_code = ctx.short_code;
        }
      });
    }

    // Extract street information from properties
    if (feature.properties) {
      if (feature.properties.address) {
        const addressParts = feature.properties.address.split(' ');
        if (addressParts.length > 0 && /^\d+/.test(addressParts[0])) {
          address.street_number = addressParts[0];
          address.street_name = addressParts.slice(1).join(' ');
        } else {
          address.street_name = feature.properties.address;
        }
      }
    }

    return {
      place_name: feature.place_name || feature.text || '',
      center: feature.center || [0, 0],
      address,
      place_type: feature.place_type || []
    };
  }

  /**
   * Offline fallback for forward geocoding
   */
  private getOfflineFallback(query: string): GeocodingResult[] {
    const lowerQuery = query.toLowerCase();

    // Predefined locations for Águas da Prata region
    const offlineLocations = [
      {
        id: 'aguas-da-prata',
        place_name: 'Águas da Prata, SP',
        center: [-46.7167, -21.9333] as [number, number],
        relevance: lowerQuery.includes('águas') || lowerQuery.includes('prata') ? 1.0 : 0.5,
        place_type: ['place']
      },
      {
        id: 'centro-aguas-da-prata',
        place_name: 'Centro de Águas da Prata',
        center: [-46.7167, -21.9333] as [number, number],
        relevance: lowerQuery.includes('centro') ? 1.0 : 0.3,
        place_type: ['poi']
      },
      {
        id: 'trilha-budista',
        place_name: 'Trilha Budista',
        center: [-46.7200, -21.9300] as [number, number],
        relevance: lowerQuery.includes('trilha') || lowerQuery.includes('budista') ? 1.0 : 0.2,
        place_type: ['poi']
      }
    ];

    return offlineLocations
      .filter(loc => loc.relevance > 0.1)
      .sort((a, b) => b.relevance - a.relevance)
      .map(loc => ({
        id: loc.id,
        place_name: loc.place_name,
        center: loc.center,
        relevance: loc.relevance,
        place_type: loc.place_type,
        properties: {},
        context: []
      }));
  }

  /**
   * Offline fallback for reverse geocoding
   */
  private getOfflineReverseResult(latitude: number, longitude: number): ReverseGeocodingResult | null {
    // Check if coordinates are within Águas da Prata region
    const aguasLatRange = [-21.95, -21.91];
    const aguasLngRange = [-46.73, -46.70];

    if (latitude >= aguasLatRange[0] && latitude <= aguasLatRange[1] &&
      longitude >= aguasLngRange[0] && longitude <= aguasLngRange[1]) {
      return {
        place_name: 'Águas da Prata, SP',
        center: [longitude, latitude],
        address: {
          locality: 'Águas da Prata',
          region: 'São Paulo',
          country: 'Brasil',
          country_code: 'BR'
        },
        place_type: ['place']
      };
    }

    // Generic fallback for other locations
    return {
      place_name: 'Localização Desconhecida',
      center: [longitude, latitude],
      address: {
        locality: 'Desconhecido',
        region: 'Desconhecido',
        country: 'Brasil',
        country_code: 'BR'
      },
      place_type: ['place']
    };
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();
export default geocodingService;
