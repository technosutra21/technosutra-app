/**
 * Unified Geo Service for TECHNO SUTRA PWA
 * Combines MapTiler and OpenRouteService for maximum reliability
 */

import { geocodingService } from './geocodingService';
import { routingService } from './routingService';

export interface UnifiedGeocodingResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  place_type: string[];
  relevance: number;
  source: 'maptiler' | 'openrouteservice';
  properties?: {
    accuracy?: string;
    address?: string;
    category?: string;
    confidence?: number;
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface UnifiedGeocodingOptions {
  limit?: number;
  proximity?: [number, number];
  country?: string | string[];
  language?: string;
  preferredSource?: 'maptiler' | 'openrouteservice' | 'auto';
}

class UnifiedGeoService {
  private mapTilerAvailable: boolean = true;
  private openRouteServiceAvailable: boolean = true;

  constructor() {
    // Check if API keys are available
    this.mapTilerAvailable = !!import.meta.env.VITE_MAPTILER_API_KEY;
    this.openRouteServiceAvailable = !!import.meta.env.VITE_OPENROUTESERVICE_API_KEY;

    if (!this.mapTilerAvailable && !this.openRouteServiceAvailable) {
      console.warn('No geocoding API keys found. Geocoding services will not work.');
    }
  }

  /**
   * Forward geocoding with automatic fallback
   */
  async forward(query: string, options: UnifiedGeocodingOptions = {}): Promise<UnifiedGeocodingResult[]> {
    const preferredSource = options.preferredSource || 'auto';

    // Determine which service to try first
    let primaryService: 'maptiler' | 'openrouteservice';
    let fallbackService: 'maptiler' | 'openrouteservice' | null;

    if (preferredSource === 'maptiler' && this.mapTilerAvailable) {
      primaryService = 'maptiler';
      fallbackService = this.openRouteServiceAvailable ? 'openrouteservice' : null;
    } else if (preferredSource === 'openrouteservice' && this.openRouteServiceAvailable) {
      primaryService = 'openrouteservice';
      fallbackService = this.mapTilerAvailable ? 'maptiler' : null;
    } else {
      // Auto mode - prefer MapTiler for better geocoding quality
      if (this.mapTilerAvailable) {
        primaryService = 'maptiler';
        fallbackService = this.openRouteServiceAvailable ? 'openrouteservice' : null;
      } else if (this.openRouteServiceAvailable) {
        primaryService = 'openrouteservice';
        fallbackService = null;
      } else {
        throw new Error('No geocoding services available');
      }
    }

    // Try primary service
    try {
      const results = await this.forwardWithService(primaryService, query, options);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn(`Primary geocoding service (${primaryService}) failed:`, error);
    }

    // Try fallback service if available
    if (fallbackService) {
      try {
        const results = await this.forwardWithService(fallbackService, query, options);
        return results;
      } catch (error) {
        console.warn(`Fallback geocoding service (${fallbackService}) failed:`, error);
      }
    }

    return [];
  }

  /**
   * Reverse geocoding with automatic fallback
   */
  async reverse(longitude: number, latitude: number, options: Partial<UnifiedGeocodingOptions> = {}): Promise<UnifiedGeocodingResult | null> {
    const preferredSource = options.preferredSource || 'auto';

    // Determine which service to try first
    let primaryService: 'maptiler' | 'openrouteservice';
    let fallbackService: 'maptiler' | 'openrouteservice' | null;

    if (preferredSource === 'maptiler' && this.mapTilerAvailable) {
      primaryService = 'maptiler';
      fallbackService = this.openRouteServiceAvailable ? 'openrouteservice' : null;
    } else if (preferredSource === 'openrouteservice' && this.openRouteServiceAvailable) {
      primaryService = 'openrouteservice';
      fallbackService = this.mapTilerAvailable ? 'maptiler' : null;
    } else {
      // Auto mode - prefer MapTiler for better geocoding quality
      if (this.mapTilerAvailable) {
        primaryService = 'maptiler';
        fallbackService = this.openRouteServiceAvailable ? 'openrouteservice' : null;
      } else if (this.openRouteServiceAvailable) {
        primaryService = 'openrouteservice';
        fallbackService = null;
      } else {
        throw new Error('No geocoding services available');
      }
    }

    // Try primary service
    try {
      const result = await this.reverseWithService(primaryService, longitude, latitude, options);
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn(`Primary reverse geocoding service (${primaryService}) failed:`, error);
    }

    // Try fallback service if available
    if (fallbackService) {
      try {
        const result = await this.reverseWithService(fallbackService, longitude, latitude, options);
        return result;
      } catch (error) {
        console.warn(`Fallback reverse geocoding service (${fallbackService}) failed:`, error);
      }
    }

    return null;
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    maptiler: boolean;
    openrouteservice: boolean;
    hasAnyService: boolean;
  } {
    return {
      maptiler: this.mapTilerAvailable,
      openrouteservice: this.openRouteServiceAvailable,
      hasAnyService: this.mapTilerAvailable || this.openRouteServiceAvailable
    };
  }

  private async forwardWithService(
    service: 'maptiler' | 'openrouteservice',
    query: string,
    options: UnifiedGeocodingOptions
  ): Promise<UnifiedGeocodingResult[]> {
    if (service === 'maptiler') {
      const results = await geocodingService.forward(query, {
        limit: options.limit,
        proximity: options.proximity,
        country: options.country,
        language: options.language
      });

      return results.map(result => ({
        id: result.id,
        place_name: result.place_name,
        center: result.center,
        place_type: result.place_type,
        relevance: result.relevance,
        source: 'maptiler' as const,
        properties: result.properties,
        context: result.context
      }));
    } else {
      const response = await routingService.geocodeForward(query, {
        size: options.limit,
        boundary_country: Array.isArray(options.country) ? options.country : options.country ? [options.country] : undefined
      });

      return response.features?.map((feature: { properties?: { id?: string; gid?: string; label?: string; name?: string; layer?: string; confidence?: number }; geometry?: { coordinates?: [number, number] } }) => ({
        id: feature.properties?.id || feature.properties?.gid || '',
        place_name: feature.properties?.label || feature.properties?.name || '',
        center: feature.geometry?.coordinates || [0, 0],
        place_type: [feature.properties?.layer || 'unknown'],
        relevance: feature.properties?.confidence || 0,
        source: 'openrouteservice' as const,
        properties: {
          accuracy: feature.properties?.accuracy,
          address: feature.properties?.housenumber ? `${feature.properties.housenumber} ${feature.properties.street}` : feature.properties?.street,
          category: feature.properties?.category,
          confidence: feature.properties?.confidence
        },
        context: feature.properties?.region ? [{
          id: 'region',
          text: feature.properties.region
        }] : undefined
      })) || [];
    }
  }

  private async reverseWithService(
    service: 'maptiler' | 'openrouteservice',
    longitude: number,
    latitude: number,
    options: Partial<UnifiedGeocodingOptions>
  ): Promise<UnifiedGeocodingResult | null> {
    if (service === 'maptiler') {
      const result = await geocodingService.reverse(longitude, latitude, {
        language: options.language
      });

      if (!result) return null;

      return {
        id: 'reverse-result',
        place_name: result.place_name,
        center: result.center,
        place_type: result.place_type,
        relevance: 1,
        source: 'maptiler' as const,
        properties: {
          address: `${result.address.street_number || ''} ${result.address.street_name || ''}`.trim()
        },
        context: result.address.region ? [{
          id: 'region',
          text: result.address.region
        }] : undefined
      };
    } else {
      const response = await routingService.geocodeReverse(longitude, latitude, {
        size: 1
      });

      const feature = response.features?.[0];
      if (!feature) return null;

      return {
        id: feature.properties?.id || feature.properties?.gid || '',
        place_name: feature.properties?.label || feature.properties?.name || '',
        center: feature.geometry?.coordinates || [longitude, latitude],
        place_type: [feature.properties?.layer || 'unknown'],
        relevance: feature.properties?.confidence || 0,
        source: 'openrouteservice' as const,
        properties: {
          accuracy: feature.properties?.accuracy,
          address: feature.properties?.housenumber ? `${feature.properties.housenumber} ${feature.properties.street}` : feature.properties?.street,
          confidence: feature.properties?.confidence
        }
      };
    }
  }
}

// Export singleton instance
export const unifiedGeoService = new UnifiedGeoService();
export default unifiedGeoService;
