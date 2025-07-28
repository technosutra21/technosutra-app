import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Zap,
  Satellite, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSutraData } from '@/hooks/useSutraData';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { logger } from '@/lib/logger';
import { useProgress } from '@/hooks/useProgress';
import { useToast } from '@/hooks/use-toast';

// Types

interface MapStyle {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  url: string;
  cyberpunk: boolean;
  description: string;
}

type MapStyles = Record<string, MapStyle>;

// Constants
const BASE_COORDINATES = {
  lat: -21.9427,
  lng: -46.7167
} as const;


const ZOOM_LEVELS = {
  default: 14,
  waypoint: 16,
  user: 18,
} as const;


// Map styles configuration
const MAP_STYLES: MapStyles = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    icon: Zap,
    url: 'backdrop',
    cyberpunk: true,
    description: 'Shadow base com inversão cyberpunk'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    icon: Satellite,
    url: 'satellite',
    cyberpunk: false,
    description: 'Vista satelital do mundo'
  },
  simple: {
    id: 'simple',
    name: 'Simple',
    icon: Globe,
    url: 'streets-v2',
    cyberpunk: false,
    description: 'Mapa comum e limpo'
  }
};

const Map = () => {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);

  // State management
  const [currentStyle] = useState<keyof typeof MAP_STYLES>('cyberpunk');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Record<string, unknown> | null>(null);

  // Data management

  // Hooks
  const { loading: dataLoading, error: dataError } = useSutraData();
  useProgress();
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    const currentMapContainer = mapContainer.current;
    if (!currentMapContainer) return;

    setIsLoading(true);
    maptilersdk.config.apiKey = 'rg7OAqXjLo7cLdwqlrVt';
    
    try {
      const styleConfig = MAP_STYLES[currentStyle];
      
      // Fix: Use proper MapTiler style URL format
      const getStyleUrl = (styleKey: string) => {
        switch (styleKey) {
          case 'backdrop':
            return 'https://api.maptiler.com/maps/backdrop/style.json';
          case 'satellite':
            return 'https://api.maptiler.com/maps/satellite/style.json';
          case 'streets-v2':
            return 'https://api.maptiler.com/maps/streets-v2/style.json';
          default:
            return 'https://api.maptiler.com/maps/streets-v2/style.json';
        }
      };
      
      map.current = new maptilersdk.Map({
        container: currentMapContainer,
        style: getStyleUrl(styleConfig.url),
        center: [BASE_COORDINATES.lng, BASE_COORDINATES.lat],
        zoom: ZOOM_LEVELS.default,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        antialias: true
      });

      // Add navigation controls
      map.current.addControl(
        new maptilersdk.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true
        }),
        'top-right'
      );

      // Map loaded event
      map.current.on('load', () => {
        logger.info('🗺️ Map loaded successfully with style:', currentStyle);
        setIsLoading(false);
        
        // Apply cyberpunk styling if needed - Fix: Use captured value
        if (styleConfig.cyberpunk && currentMapContainer) {
          setTimeout(() => {
            if (currentMapContainer) {
              currentMapContainer.classList.add('cyberpunk-map');
              logger.info('🎨 Cyberpunk mode applied');
            }
          }, 500);
        } else if (currentMapContainer) {
          currentMapContainer.classList.remove('cyberpunk-map');
        }
      });

      // Error handling
      map.current.on('error', (e: maptilersdk.MapErrorEvent) => {
        logger.error('Map error:', e);
        setIsLoading(false);
        toast({
          title: "Erro no Mapa",
          description: "Problema ao carregar o mapa. Recarregando...",
          variant: "destructive",
        });
      });

    } catch (error) {
      logger.error('Failed to initialize map:', error);
      setIsLoading(false);
      toast({
        title: "Erro de Inicialização",
        description: "Não foi possível inicializar o mapa",
        variant: "destructive",
      });
    }

    return () => {
      // Fix: Use captured value to avoid stale closure
      if (currentMapContainer) {
        currentMapContainer.classList.remove('cyberpunk-map');
      }
      map.current?.remove();
    };
  }, [currentStyle, toast]);

  return (
    <div className="h-screen relative overflow-hidden bg-background">
      {/* Enhanced Loading Screen */}
      <AnimatePresence>
        {(isLoading || dataLoading) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"
              />
              <motion.h2
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl font-bold text-primary text-glow mb-2"
              >
                {dataLoading ? 'Carregando Dados Sagrados...' : 'Inicializando Mapa Cyberpunk...'}
              </motion.h2>
              <motion.p
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-muted-foreground"
              >
                56 pontos de jornada preparando...
              </motion.p>
              {dataError && (
                <p className="text-destructive text-sm mt-4">
                  Erro: {dataError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Simple Test Controls */}
      {!isLoading && !dataLoading && (
        <motion.div className="absolute top-4 left-4 z-40">
          <Card className="amoled-card p-4">
            <h2 className="text-lg font-bold text-primary text-glow mb-2">
              Map Test
            </h2>
            <p className="text-sm text-muted-foreground">
              Map is loaded successfully!
            </p>
            <Button 
              onClick={() => console.log('Map instance:', map.current)}
              className="mt-2"
              size="sm"
            >
              Test Console
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Character Detail Modal */}
      <CharacterDetailModal 
        isOpen={!!selectedWaypoint}
        onClose={() => setSelectedWaypoint(null)}
        character={selectedWaypoint}
      />
    </div>
  );
};

export default Map;
