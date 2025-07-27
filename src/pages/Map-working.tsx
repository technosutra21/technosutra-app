import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import {
  Zap,
  Satellite, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSutraData } from '@/hooks/useSutraData';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { MapFloatingControls } from '@/components/MapFloatingControls-simple';
import { logger } from '@/lib/logger';
import { useProgress } from '@/hooks/useProgress';
import { useToast } from '@/hooks/use-toast';

// Types
interface Waypoint {
  id: string;
  coordinates: [number, number];
  chapter: string;
  title: string;
  subtitle: string;
  description: string;
  fullCharacter: Record<string, unknown>;
  occupation: string;
  meaning: string;
  location: string;
  model: string;
  capUrl: string;
  qrCodeUrl: string;
}

interface MapStyle {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  url: string;
  cyberpunk: boolean;
  description: string;
}

// Constants
const BASE_COORDINATES = {
  lat: -21.9427,
  lng: -46.7167
} as const;

const MARKER_SIZES = {
  default: 36,
  visited: 40,
} as const;

const ZOOM_LEVELS = {
  default: 14,
  waypoint: 16,
  user: 18,
} as const;

// Map styles configuration
const MAP_STYLES = {
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
  const markersRef = useRef<Map<string, maptilersdk.Marker>>(new Map());

  // State management
  const [currentStyle, setCurrentStyle] = useState<keyof typeof MAP_STYLES>('cyberpunk');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Record<string, unknown> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [filteredWaypoints, setFilteredWaypoints] = useState<Waypoint[]>([]);
  const [isTrackingUser, setIsTrackingUser] = useState(false);
  const [fixedCoordinates, setFixedCoordinates] = useState<Record<string, { lat: number; lng: number }>>({});

  // Hooks
  const { getCombinedData, loading: dataLoading, error: dataError } = useSutraData();
  const { 
    visitedWaypoints: progressVisitedWaypoints, 
    totalProgress, 
    visitedCount
  } = useProgress();
  const { toast } = useToast();

  // Load fixed coordinates
  useEffect(() => {
    const loadFixedCoordinates = async () => {
      try {
        const response = await fetch('/waypoint-coordinates.json');
        if (response.ok) {
          const coordinates = await response.json();
          setFixedCoordinates(coordinates);
          logger.info('✅ Loaded', Object.keys(coordinates).length, 'waypoint coordinates');
        }
      } catch (error) {
        logger.error('❌ Error loading waypoint coordinates:', error);
      }
    };
    
    loadFixedCoordinates();
  }, []);

  // Generate waypoints from CSV data
  const generateWaypoints = useCallback((): Waypoint[] => {
    const sutraData = getCombinedData('pt');
    if (sutraData.length === 0 || Object.keys(fixedCoordinates).length === 0) return [];

    const waypointsWithCoords = sutraData.slice(0, 56)
      .filter((entry) => fixedCoordinates[entry.chapter])
      .map((entry): Waypoint => {
        const fixed = fixedCoordinates[entry.chapter];
        const coordinates: [number, number] = [fixed.lng, fixed.lat];

        return {
          id: entry.chapter.toString(),
          coordinates,
          chapter: entry.chapter.toString(),
          title: entry.nome,
          subtitle: `Capítulo ${entry.chapter}`,
          description: entry.descPersonagem || entry.ensinamento.substring(0, 200) + '...',
          fullCharacter: entry, // This is the complete character data!
          occupation: entry.ocupacao,
          meaning: entry.significado,
          location: entry.local,
          model: entry.linkModel,
          capUrl: entry.capUrl,
          qrCodeUrl: entry.qrCodeUrl
        };
      });
    
    logger.info(`✅ Generated ${waypointsWithCoords.length} waypoints with coordinates`);
    return waypointsWithCoords;
  }, [fixedCoordinates, getCombinedData]);

  // Create marker element
  const createMarkerElement = useCallback((waypoint: Waypoint, isVisited: boolean, styleConfig: MapStyle) => {
    const el = document.createElement('div');
    const size = isVisited ? MARKER_SIZES.visited : MARKER_SIZES.default;
    
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${waypoint.title} - ${waypoint.occupation} - ${waypoint.location}${isVisited ? ' - Visitado' : ''}`);
    el.setAttribute('tabindex', '0');
    
    const baseClassName = 'waypoint-marker';
    const visitedClassName = isVisited ? 'waypoint-visited' : '';
    el.className = [baseClassName, visitedClassName].filter(Boolean).join(' ');
    
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${isVisited ? 
        'linear-gradient(135deg, #00ff00, #88ff00)' : 
        styleConfig.cyberpunk ? 
          'linear-gradient(135deg, #ff00ff, #00ffff)' : 
          'linear-gradient(135deg, #00aaff, #ff6600)'
      };
      border: 3px solid #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: bold;
      font-size: ${isVisited ? '14px' : '12px'};
      box-shadow: 0 0 ${isVisited ? '30px' : '25px'} ${
        isVisited ? '#00ff00' : 
        styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'
      };
      position: relative;
      z-index: ${isVisited ? '200' : '100'};
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
    `;
    
    el.textContent = isVisited ? '✓' : waypoint.chapter;
    el.title = `${waypoint.title}\n${waypoint.occupation}\n📍 ${waypoint.location}${isVisited ? '\n✅ Visitado' : ''}`;

    return el;
  }, []);

  // Add waypoints to map
  const addWaypointsToMap = useCallback((waypointsToAdd: Waypoint[]) => {
    if (!map.current || waypointsToAdd.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    waypointsToAdd.forEach((waypoint) => {
      const isVisitedPoint = progressVisitedWaypoints.has(waypoint.chapter);
      const styleConfig = MAP_STYLES[currentStyle];
      const el = createMarkerElement(waypoint, isVisitedPoint, styleConfig);

      // Hover effects
      const handleMouseEnter = () => {
        el.style.transform = 'scale(1.3)';
        el.style.zIndex = '1000';
        el.style.boxShadow = `0 0 40px ${isVisitedPoint ? '#00ff00' : styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'}`;
      };
      
      const handleMouseLeave = () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = isVisitedPoint ? '200' : '100';
        el.style.boxShadow = `0 0 ${isVisitedPoint ? '30px' : '25px'} ${isVisitedPoint ? '#00ff00' : styleConfig.cyberpunk ? '#ff00ff' : '#00aaff'}`;
      };

      // Click handler
      const handleClick = (e: Event) => {
        console.log('Waypoint clicked:', waypoint.title, 'Full character:', waypoint.fullCharacter);
        setSelectedWaypoint(waypoint.fullCharacter);
        e.stopPropagation();
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
      el.addEventListener('click', handleClick);

      const marker = new maptilersdk.Marker(el)
        .setLngLat(waypoint.coordinates)
        .addTo(map.current!);

      markersRef.current.set(waypoint.chapter, marker);
    });
  }, [progressVisitedWaypoints, currentStyle, createMarkerElement]);

  // Update waypoints when data loads
  useEffect(() => {
    if (!dataLoading && !dataError && Object.keys(fixedCoordinates).length > 0) {
      const newWaypoints = generateWaypoints();
      setWaypoints(newWaypoints);
      setFilteredWaypoints(newWaypoints);
      logger.info('Waypoints updated:', newWaypoints.length);
    }
  }, [dataLoading, dataError, fixedCoordinates, generateWaypoints]);

  // Filter waypoints based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredWaypoints(waypoints);
    } else {
      const filtered = waypoints.filter(waypoint =>
        waypoint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.chapter.includes(searchTerm) ||
        waypoint.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waypoint.meaning.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWaypoints(filtered);
    }
  }, [searchTerm, waypoints]);

  // Add waypoints to map when ready
  useEffect(() => {
    if (map.current && filteredWaypoints.length > 0 && !isLoading) {
      addWaypointsToMap(filteredWaypoints);
    }
  }, [filteredWaypoints, isLoading, addWaypointsToMap]);

  // Initialize map
  useEffect(() => {
    const currentMapContainer = mapContainer.current;
    if (!currentMapContainer) return;

    setIsLoading(true);
    maptilersdk.config.apiKey = 'rg7OAqXjLo7cLdwqlrVt';
    
    try {
      const styleConfig = MAP_STYLES[currentStyle];
      
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
      map.current.on('error', (e) => {
        logger.error('Map error:', e);
        setIsLoading(false);
        toast({
          title: "Erro no Mapa",
          description: "Problema ao carregar o mapa",
          variant: "destructive",
        });
      });

    } catch (error) {
      logger.error('Failed to initialize map:', error);
      setIsLoading(false);
    }

    return () => {
      // Fix: Use captured value to avoid stale closure
      if (currentMapContainer) {
        currentMapContainer.classList.remove('cyberpunk-map');
      }
      map.current?.remove();
    };
  }, [currentStyle, toast, addWaypointsToMap]);

  // GPS functions
  const startLocationTracking = () => {
    setIsTrackingUser(true);
    toast({
      title: "GPS Ativado",
      description: "Funcionalidade GPS será implementada em breve",
    });
  };

  const stopLocationTracking = () => {
    setIsTrackingUser(false);
    toast({
      title: "GPS Desativado", 
      description: "Rastreamento parado",
    });
  };

  return (
    <div className="h-screen relative overflow-hidden bg-background">
      {/* Loading Screen */}
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

      {/* Floating Controls */}
      {!isLoading && !dataLoading && (
        <MapFloatingControls
          currentStyle={currentStyle}
          mapStyles={MAP_STYLES}
          onStyleChange={(style) => setCurrentStyle(style as keyof typeof MAP_STYLES)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchResults={filteredWaypoints.length}
          totalWaypoints={waypoints.length}
          isTrackingUser={isTrackingUser}
          onStartTracking={startLocationTracking}
          onStopTracking={stopLocationTracking}
          visitedCount={visitedCount}
          totalProgress={totalProgress}
        />
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
