import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import {
  Zap,
  Satellite, Globe, Infinity as InfinityIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSutraData } from '@/hooks/useSutraData';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { MapFloatingControls } from '@/components/MapFloatingControls-simple';
import { CyberCard } from '@/components/ui/cyber-card';
import { logger } from '@/lib/logger';
import { useProgress } from '@/hooks/useProgress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

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

interface Trail {
  id: string;
  fromWaypoint: string;
  toWaypoint: string;
  coordinates: [number, number][];
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

const LINE_SOURCE_ID = 'hiking-trails';
const LINE_LAYER_ID = 'hiking-trails-layer';

const MapPage = () => {
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
  const [trails, setTrails] = useState<Trail[]>([]);
  const [showTrails, setShowTrails] = useState(true);

  // Hooks
  const { getCombinedData, loading: dataLoading, error: dataError } = useSutraData();
  const {
    visitedWaypoints: progressVisitedWaypoints,
    totalProgress,
    visitedCount
  } = useProgress();
  const { toast } = useToast();
  const { t, language } = useLanguage();

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

  // Generate trails between waypoints
  const generateTrails = useCallback((waypointsData: Waypoint[]): Trail[] => {
    if (waypointsData.length < 2) return [];
    
    // Sort waypoints by chapter number for proper sequencing
    const sortedWaypoints = [...waypointsData].sort((a, b) => 
      parseInt(a.chapter) - parseInt(b.chapter)
    );
    
    // Create trails connecting sequential waypoints
    const newTrails: Trail[] = [];
    
    for (let i = 0; i < sortedWaypoints.length - 1; i++) {
      const fromWaypoint = sortedWaypoints[i];
      const toWaypoint = sortedWaypoints[i + 1];
      
      newTrails.push({
        id: `trail-${fromWaypoint.chapter}-to-${toWaypoint.chapter}`,
        fromWaypoint: fromWaypoint.chapter,
        toWaypoint: toWaypoint.chapter,
        coordinates: [fromWaypoint.coordinates, toWaypoint.coordinates]
      });
    }
    
    logger.info(`✅ Generated ${newTrails.length} trail connections`);
    return newTrails;
  }, []);

  // Add waypoints to map
  const addWaypointsToMap = useCallback((waypointsToAdd: Waypoint[]) => {
    if (!map.current || waypointsToAdd.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    waypointsToAdd.forEach((waypoint) => {
      const isVisitedPoint = progressVisitedWaypoints.has(Number(waypoint.chapter));
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
      
      // Generate trails when waypoints are updated
      const newTrails = generateTrails(newWaypoints);
      setTrails(newTrails);
      
      logger.info('Waypoints updated:', newWaypoints.length);
    }
  }, [dataLoading, dataError, fixedCoordinates, generateWaypoints, generateTrails]);

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

  // Add or update trail lines on the map
  const updateTrailLines = useCallback(() => {
    if (!map.current || trails.length === 0) return;
    
    // Create a GeoJSON feature collection for the trails
    const geojsonData = {
      type: 'FeatureCollection',
      features: trails.map(trail => ({
        type: 'Feature',
        properties: {
          id: trail.id,
          fromWaypoint: trail.fromWaypoint,
          toWaypoint: trail.toWaypoint
        },
        geometry: {
          type: 'LineString',
          coordinates: trail.coordinates
        }
      }))
    };
    
    // Check if the source already exists
    const sourceExists = map.current.getSource(LINE_SOURCE_ID);
    
    if (sourceExists) {
      // Update the existing source
      (map.current.getSource(LINE_SOURCE_ID) as maptilersdk.GeoJSONSource).setData(geojsonData);
    } else {
      // Add a new source and layer
      map.current.addSource(LINE_SOURCE_ID, {
        type: 'geojson',
        data: geojsonData
      });
      
      // Add the neon line layer
      map.current.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: LINE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showTrails ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#ff0033',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-blur': 3,
          'line-dasharray': [1, 0],
          // Glow effect for neon look
          'line-width-transition': { duration: 300 },
          'line-opacity-transition': { duration: 300 }
        }
      });
      
      // Add a second layer for the glow effect
      map.current.addLayer({
        id: `${LINE_LAYER_ID}-glow`,
        type: 'line',
        source: LINE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': showTrails ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#ff3366',
          'line-width': 8,
          'line-opacity': 0.4,
          'line-blur': 8,
          'line-dasharray': [1, 0],
          'line-width-transition': { duration: 300 },
          'line-opacity-transition': { duration: 300 }
        }
      });
    }
  }, [trails, showTrails]);

  // Toggle trail visibility
  const toggleTrailsVisibility = useCallback(() => {
    setShowTrails(prev => !prev);
    
    if (map.current) {
      const visibility = !showTrails ? 'visible' : 'none';
      map.current.setLayoutProperty(LINE_LAYER_ID, 'visibility', visibility);
      map.current.setLayoutProperty(`${LINE_LAYER_ID}-glow`, 'visibility', visibility);
      
      toast({
        title: visibility === 'visible' ? "Trilhas Ativadas" : "Trilhas Desativadas",
        description: visibility === 'visible' ? 
          "Agora você pode ver o caminho entre pontos" : 
          "Caminhos entre pontos estão ocultos"
      });
    }
  }, [showTrails, toast]);

  // Update trail lines when trails or visibility changes
  useEffect(() => {
    if (map.current && !isLoading && trails.length > 0) {
      map.current.once('style.load', () => {
        updateTrailLines();
      });
      
      if (map.current.isStyleLoaded()) {
        updateTrailLines();
      }
    }
  }, [trails, showTrails, isLoading, updateTrailLines]);

  // Initialize map
  useEffect(() => {
    const currentMapContainer = mapContainer.current;
    if (!currentMapContainer) return;

    setIsLoading(true);
    maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    
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
      
      const styleUrl = getStyleUrl(styleConfig.url);

      
      map.current = new maptilersdk.Map({
        container: currentMapContainer,
        style: styleUrl,
        center: [BASE_COORDINATES.lng, BASE_COORDINATES.lat],
        zoom: ZOOM_LEVELS.default,
        pitch: 0,
        bearing: 0,
        attributionControl: false
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
        console.log('Map loaded successfully!');
        setIsLoading(false);
        
        // Add trail lines when map loads
        if (trails.length > 0) {
          updateTrailLines();
        }
        
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

      // Style error handling
      map.current.on('styleimagemissing', (e) => {
        console.error('Style image missing:', e);
      });

      // Error handling
      map.current.on('error', (e) => {
        logger.error('Map error:', e);
        console.error('Map error:', e);
        setIsLoading(false);
        toast({
          title: t('map.error'),
          description: t('map.errorDesc'),
          variant: "destructive",
        });
      });

    } catch (error) {
      logger.error('Failed to initialize map:', error);
      setIsLoading(false);
    }

    return () => {
      // Fix: Capture current value to avoid stale closure
      if (currentMapContainer) {
        currentMapContainer.classList.remove('cyberpunk-map');
      }
      map.current?.remove();
    };
  }, [currentStyle, toast, trails.length, updateTrailLines, t]);

  // GPS functions
  const startLocationTracking = () => {
    setIsTrackingUser(true);
    toast({
      title: t('map.gpsActivated'),
      description: t('map.gpsComingSoon'),
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
    <div className="fixed inset-0 top-16 md:top-20 bg-black sacred-pattern overflow-hidden">
      {/* Enhanced Particle System Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Energy orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 right-1/3 w-24 h-24 bg-yellow-500/4 rounded-full blur-xl"
        />

        {/* Floating sacred symbols */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-16 text-cyan-400/20 text-4xl"
        >
          ∞
        </motion.div>
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, -360],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-24 right-20 text-purple-400/20 text-5xl"
        >
          ☸
        </motion.div>
        <motion.div
          animate={{
            y: [0, -10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-1/3 right-12 text-yellow-400/20 text-3xl"
        >
          ☸
        </motion.div>
      </div>
      {/* Loading Screen */}
      <AnimatePresence>
        {(isLoading || dataLoading) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center sacred-pattern"
          >
            <CyberCard variant="void" glowEffect sacredPattern className="p-12 max-w-md">
              <div className="text-center">
                {/* Sacred Loading Symbol */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-6 relative"
                >
                  <div className="absolute inset-0 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full"></div>
                  <div className="absolute inset-2 border-2 border-purple-500/30 border-r-purple-400 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <InfinityIcon className="w-8 h-8 text-cyan-400 animate-pulse-glow" />
                  </div>
                </motion.div>

                <motion.h2
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl font-bold gradient-text text-glow mb-2"
                >
                  {dataLoading ? t('common.loadingSacredData') : (language === 'en' ? 'Initializing Cyberpunk Map...' : 'Inicializando Mapa Cyberpunk...')}
                </motion.h2>

                <motion.p
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-slate-400 mb-4"
                >
                  {language === 'en' ? '56 journey points preparing...' : '56 pontos de jornada preparando...'}
                </motion.p>

                <div className="flex justify-center space-x-2 text-2xl">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>∞</motion.span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>☸</motion.span>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>☸</motion.span>
                </div>

                {dataError && (
                  <p className="text-red-400 text-sm mt-4 bg-red-500/10 p-2 rounded border border-red-500/30">
                    {t('common.error')}: {dataError}
                  </p>
                )}
              </div>
            </CyberCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full" 
        style={{ backgroundColor: "#000", minHeight: "100vh" }}
      />

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
          showTrails={showTrails}
          onToggleTrails={toggleTrailsVisibility}
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

export default MapPage;
