import React, { useRef, useEffect, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { logger } from '@/lib/logger';

// Map styles configuration
const MAP_STYLES = {
  spiritual: {
    name: 'Espiritual',
    url: 'backdrop',
    description: 'Estilo místico e sereno'
  },
  urban: {
    name: 'Urbano',
    url: 'streets-v2',
    description: 'Estilo moderno urbano'
  },
  nature: {
    name: 'Natureza',
    url: 'outdoor-v2',
    description: 'Estilo natural e orgânico'
  }
};

// Base coordinates (Águas da Prata, SP)
const BASE_COORDINATES = {
  lat: -21.9427,
  lng: -46.7167
};

interface WorkingMapCanvasProps {
  routeType: 'spiritual' | 'urban' | 'nature';
  onMapReady?: (map: maptilersdk.Map) => void;
  className?: string;
}

export const WorkingMapCanvas: React.FC<WorkingMapCanvasProps> = ({
  routeType,
  onMapReady,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    const currentMapContainer = mapContainer.current;
    if (!currentMapContainer) return;

    setIsLoading(true);
    maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    try {
      const styleConfig = MAP_STYLES[routeType] || MAP_STYLES.spiritual;
      
      // Get style URL with fallback
      const getStyleUrl = (styleType: string) => {
        switch (styleType) {
          case 'backdrop':
            return 'https://api.maptiler.com/maps/backdrop/style.json';
          case 'streets-v2':
            return 'https://api.maptiler.com/maps/streets-v2/style.json';
          case 'outdoor-v2':
            return 'https://api.maptiler.com/maps/outdoor-v2/style.json';
          default:
            return 'https://api.maptiler.com/maps/streets-v2/style.json';
        }
      };
      
      const styleUrl = getStyleUrl(styleConfig.url);
      
      map.current = new maptilersdk.Map({
        container: currentMapContainer,
        style: styleUrl,
        center: [BASE_COORDINATES.lng, BASE_COORDINATES.lat],
        zoom: 12,
        pitch: 45,
        bearing: 0,
        antialias: true,
        maxZoom: 18,
        minZoom: 8
      });

      map.current.on('load', () => {
        setIsLoading(false);
        logger.info(`🗺️ Interactive map loaded with style: ${routeType}`);
        
        if (onMapReady && map.current) {
          onMapReady(map.current);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [routeType, onMapReady]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
};
