import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { ModernMapControls } from '@/components/ModernMapControls';
import { CyberCard } from '@/components/ui/cyber-card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useProgress } from '@/hooks/useProgress';
import { useSutraData } from '@/hooks/useSutraData';
import { logger } from '@/lib/logger';
import { enhancedGPS, type GPSPosition } from '@/services/enhancedGPS';
import { pwaService } from '@/services/pwaService';
import { CombinedSutraEntry } from '@/types/sutra';
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";
import { AnimatePresence, motion } from 'framer-motion';
import {
  Globe, Infinity as InfinityIcon,
  Satellite,
  Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Enhanced Types
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
  isPlaceholder?: boolean; // For missing coordinates
}

interface MapStyle {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  url: string;
  cyberpunk: boolean;
  description: string;
}

interface TrailData {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  duration_hours: number;
  distance_km: number;
  description: string;
  waypoints: number[];
  themes: string[];
  ideal_for: string[];
  benefits: string[];
  elevation_profile: {
    min_elevation: number;
    max_elevation: number;
    elevation_gain: number;
  };
  special_requirements?: string[];
}

interface TrailsData {
  version: string;
  metadata: {
    title: string;
    description: string;
    location: string;
    total_waypoints: number;
    total_trails: number;
    created: string;
    coordinate_system: string;
  };
  trails: TrailData[];
  waypoint_metadata: Record<string, {
    name: string;
    type: string;
    significance: string;
    meditation_time: number;
    special_features: string[];
  }>;
  trail_facilities: {
    rest_points: number[];
    meditation_pavilions: number[];
    water_sources: number[];
    emergency_shelters: number[];
    viewpoints: number[];
  };
}

interface Trail {
  id: string;
  fromWaypoint: string;
  toWaypoint: string;
  coordinates: [number, number][];
  trailData?: TrailData;
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

// Free MapLibre-compatible styles configuration
const MAP_STYLES = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Dark',
    icon: Zap,
    url: 'https://demotiles.maplibre.org/style.json',
    cyberpunk: true,
    description: 'Estilo escuro cyberpunk com MapLibre'
  },
  satellite: {
    id: 'satellite',
    name: 'OpenStreetMap',
    icon: Satellite,
    url: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
    cyberpunk: false,
    description: 'Mapa baseado em OpenStreetMap'
  },
  simple: {
    id: 'simple',
    name: 'Simple Light',
    icon: Globe,
    url: 'https://demotiles.maplibre.org/style.json',
    cyberpunk: false,
    description: 'Estilo claro e simples'
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    icon: Zap,
    url: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
    cyberpunk: false,
    description: 'Modo escuro elegante'
  }
};

const LINE_SOURCE_ID = 'hiking-trails';
const LINE_LAYER_ID = 'hiking-trails-layer';

const MapPage = () => {
  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // State management
  const [currentStyle, setCurrentStyle] = useState<keyof typeof MAP_STYLES>('cyberpunk');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState<CombinedSutraEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [filteredWaypoints, setFilteredWaypoints] = useState<Waypoint[]>([]);
  const [fixedCoordinates, setFixedCoordinates] = useState<Record<string, { lat: number; lng: number }>>({});
  const [trails, setTrails] = useState<Trail[]>([]);
  const [showTrails, setShowTrails] = useState(true);

  // Enhanced GPS state
  const [userPosition, setUserPosition] = useState<GPSPosition | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isGPSActive, setIsGPSActive] = useState(false);
  const [nearbyCharacters, setNearbyCharacters] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [_offlineStatus, _setOfflineStatus] = useState<any>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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
      // Placeholder for trail data integration
      const trailDataResponse = await fetch('/trails.json');
      const trailsData: TrailsData = await trailDataResponse.json();
      setTrails(trailsData.trails.map(trail => {
        return generateTrails(waypoints).map(tr => ({
          ...tr,
          trailData: trail,
        }));
      }).flat());
        const response = await fetch('/waypoint-coordinates.json');
        if (response.ok) {
          const coordinates = await response.json();
          setFixedCoordinates(coordinates);
          logger.info('✅ Loaded waypoint coordinates', { count: Object.keys(coordinates).length });
        }
      } catch (error) {
        logger.error('❌ Error loading waypoint coordinates:', error);
      }
    };

    loadFixedCoordinates();
  }, []);

  useEffect(() => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'ENABLE_TILE_CACHING' });
    }

    return () => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'DISABLE_TILE_CACHING' });
        }
    };
  }, []);

  // Enhanced GPS and offline functionality
  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      // toast removed - only keeping PWA "App Pronto!" notification
    };

    const handleOffline = () => {
      setIsOnline(false);
      // toast removed - only keeping PWA "App Pronto!" notification
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get offline status
    const updateOfflineStatus = async () => {
      const status = await pwaService.getOfflineStatus();
      _setOfflineStatus(status);
    };

    updateOfflineStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop GPS tracking
      enhancedGPS.stopWatching();
      
      // Clear all markers
      markersRef.current.forEach(marker => {
        (marker as any).remove();
      });
      markersRef.current.clear();
      
      // Map cleanup is handled in the map initialization useEffect
    };
  }, []);

  // Enhanced GPS tracking
  const startGPSTracking = useCallback(async () => {
    try {
      setIsGPSActive(true);

      // Start watching position with high accuracy
      enhancedGPS.startWatching({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
        desiredAccuracy: 10,
        onPositionUpdate: (position) => {
          setUserPosition(position);
          setGpsAccuracy(position.accuracy);

          // Update nearby characters
          const nearby = waypoints.filter(waypoint => {
            const distance = enhancedGPS.calculateDistance(
              position,
              {
                latitude: waypoint.coordinates[1],
                longitude: waypoint.coordinates[0],
                accuracy: 0,
                timestamp: Date.now()
              }
            );
            return distance <= 50; // 50 meter range
          }).map(w => w.id);

          setNearbyCharacters(nearby);

          // Center map on user location
          if (map.current) {
            (map.current as any).flyTo({
              center: [position.longitude, position.latitude],
              zoom: ZOOM_LEVELS.user,
              duration: 1000
            });
          }

          logger.info(`📍 GPS updated: ${position.accuracy}m accuracy, ${nearby.length} characters nearby`);
        },
        onError: (error) => {
          logger.error('GPS error:', error);
          setIsGPSActive(false);
          // toast removed - only keeping PWA 'App Pronto!' notification
        },
        onAccuracyImproved: (_accuracy) => {
          // toast removed - only keeping PWA 'App Pronto!' notification
        }
      });

      // toast removed - only keeping PWA 'App Pronto!' notification

    } catch (error) {
      logger.error('Failed to start GPS tracking:', error);
      setIsGPSActive(false);
      toast({
        title: "❌ Erro GPS",
        description: "Falha ao iniciar rastreamento",
        variant: "destructive"
      });
    }
  }, [waypoints, toast]);

  const stopGPSTracking = useCallback(() => {
    enhancedGPS.stopWatching();
    setIsGPSActive(false);
    setUserPosition(null);
    setGpsAccuracy(null);
    setNearbyCharacters([]);

    toast({
      title: "⏹️ GPS Desativado",
      description: "Rastreamento parado"
    });
  }, [toast]);

  const generateWaypoints = useCallback(() => {
    const sutraData = getCombinedData('pt');
    if (sutraData.length === 0 || Object.keys(fixedCoordinates).length === 0) return [];

    const placeholderCoords = { lat: BASE_COORDINATES.lat, lng: BASE_COORDINATES.lng };
    
    // Start with waypoints that have coordinates
    let waypointsWithCoords = sutraData
      .filter((entry) => {
        const hasValidChapter = entry.chapter && !isNaN(Number(entry.chapter));
        const hasCoordinates = hasValidChapter && fixedCoordinates[entry.chapter.toString()];
        return hasCoordinates;
      })
      .map((entry): Waypoint => {
        const fixed = fixedCoordinates[entry.chapter.toString()];
        const coordinates: [number, number] = [fixed.lng, fixed.lat];

        return {
          id: entry.chapter.toString(),
          coordinates,
          chapter: entry.chapter.toString(),
          title: entry.nome,
          subtitle: `Capítulo ${entry.chapter}`,
          description: entry.descPersonagem || entry.ensinamento.substring(0, 200) + '...',
          fullCharacter: entry as unknown as Record<string, unknown>,
          occupation: entry.ocupacao,
          meaning: entry.significado,
          location: entry.local,
          model: entry.linkModel,
          capUrl: entry.capUrl,
          qrCodeUrl: entry.qrCodeUrl
        };
      });

    // Find missing waypoints
    const missingChapters = sutraData
      .filter(entry => {
        const hasValidChapter = entry.chapter && !isNaN(Number(entry.chapter));
        return hasValidChapter && !fixedCoordinates[entry.chapter.toString()];
      })
      .map(entry => entry.chapter);
    
    // Add placeholders for missing coordinates
    if (missingChapters.length > 0) {
      const placeholderWaypoints = missingChapters.map(chapter => ({
        id: chapter.toString(),
        coordinates: [placeholderCoords.lng, placeholderCoords.lat] as [number, number],
        chapter: chapter.toString(),
        title: `Capítulo ${chapter}`,
        subtitle: 'Coordenadas Faltando',
        description: 'Localização temporária - coordenadas GPS não disponíveis',
        fullCharacter: {},
        occupation: 'Desconhecido',
        meaning: 'N/A',
        location: 'Localização temporária',
        model: '',
        capUrl: '',
        qrCodeUrl: '',
        isPlaceholder: true
      }));
      
      waypointsWithCoords = [...waypointsWithCoords, ...placeholderWaypoints];
      
      logger.warn(`Missing coordinates for chapters: ${missingChapters.join(', ')}`);
      // Only show toast if there are many missing coordinates
      if (missingChapters.length > 5) {
        toast({
          title: "⚠️ Algumas Coordenadas Faltando",
          description: `${missingChapters.length} capítulos usando localização temporária`,
          variant: "default"
        });
      }
    }

    logger.info(`✅ Generated ${waypointsWithCoords.length} waypoints (${waypointsWithCoords.filter(w => !w.isPlaceholder).length} with real coordinates)`);
    return waypointsWithCoords;
  }, [getCombinedData, fixedCoordinates, toast]);

  // Create marker element with nearby detection
  const createMarkerElement = useCallback((waypoint: Waypoint, isVisited: boolean, styleConfig: MapStyle) => {
    const el = document.createElement('div');
    const isNearby = nearbyCharacters.includes(waypoint.id);
    const size = isVisited ? MARKER_SIZES.visited : (isNearby ? MARKER_SIZES.visited + 4 : MARKER_SIZES.default);

    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${waypoint.title} - ${waypoint.occupation} - ${waypoint.location}${isVisited ? ' - Visitado' : ''}${isNearby ? ' - PRÓXIMO (50m)' : ''}`);
    el.setAttribute('tabindex', '0');

    const baseClassName = 'waypoint-marker';
    const visitedClassName = isVisited ? 'waypoint-visited' : '';
    const nearbyClassName = isNearby ? 'waypoint-nearby' : '';
    el.className = [baseClassName, visitedClassName, nearbyClassName].filter(Boolean).join(' ');

    // Enhanced styling for nearby characters
    const getMarkerStyle = () => {
      if (isVisited) {
        return 'linear-gradient(135deg, #00ff00, #88ff00)';
      } else if (isNearby) {
        return 'linear-gradient(135deg, #ffff00, #ff8800)'; // Bright yellow/orange for nearby
      } else if (styleConfig.cyberpunk) {
        return 'linear-gradient(135deg, #ff00ff, #00ffff)';
      } else {
        return 'linear-gradient(135deg, #00aaff, #ff6600)';
      }
    };

    const getGlowColor = () => {
      if (isVisited) return '#00ff00';
      if (isNearby) return '#ffff00';
      return styleConfig.cyberpunk ? '#ff00ff' : '#00aaff';
    };

    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${getMarkerStyle()};
      border: 3px solid ${isNearby ? '#ffff00' : '#ffffff'};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: bold;
      font-size: ${isVisited ? '14px' : (isNearby ? '16px' : '12px')};
      box-shadow: 0 0 ${isNearby ? '40px' : (isVisited ? '30px' : '25px')} ${getGlowColor()};
      position: relative;
      z-index: ${isNearby ? '300' : (isVisited ? '200' : '100')};
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
      ${isNearby ? 'animation: pulse-nearby 2s infinite;' : ''}
    `;

    el.textContent = isVisited ? '✓' : waypoint.chapter;
    el.title = `${waypoint.title}\n${waypoint.occupation}\n📍 ${waypoint.location}${isVisited ? '\n✅ Visitado' : ''}${isNearby ? '\n🎯 PRÓXIMO - CLIQUE PARA ABRIR!' : ''}`;

    // Add pulsing animation for nearby characters
    if (isNearby && !document.getElementById('nearby-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'nearby-pulse-style';
      style.textContent = `
        @keyframes pulse-nearby {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    return el;
  }, [nearbyCharacters]);

  // Create user location marker
  const createUserLocationMarker = useCallback(() => {
    if (!userPosition || !map.current) return;

    // Remove existing user marker
    const existingMarker = markersRef.current.get('user-location');
    if (existingMarker) {
      (existingMarker as any).remove();
      markersRef.current.delete('user-location');
    }

    const el = document.createElement('div');
    el.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #00ff00;
      border: 3px solid #ffffff;
      box-shadow: 0 0 20px #00ff00;
      animation: pulse-user 2s infinite;
      z-index: 1000;
    `;

    // Add user pulse animation
    if (!document.getElementById('user-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'user-pulse-style';
      style.textContent = `
        @keyframes pulse-user {
          0% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    const marker = new maplibregl.Marker({element: el, anchor: 'center'})
      .setLngLat([userPosition.longitude, userPosition.latitude])
      .addTo(map.current!);

    markersRef.current.set('user-location', marker);
  }, [userPosition]);

  const generateTrails = (waypointsData: Waypoint[]): Trail[] => {
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
  };

  // Add waypoints to map
  const addWaypointsToMap = useCallback((waypointsToAdd: Waypoint[]) => {
    if (!map.current || waypointsToAdd.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => (marker as any).remove());
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
        setSelectedWaypoint(waypoint.fullCharacter as unknown as CombinedSutraEntry);
        e.stopPropagation();
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
      el.addEventListener('click', handleClick);

      const marker = new maplibregl.Marker({element: el, anchor: 'center'})
        .setLngLat(waypoint.coordinates)
        .addTo(map.current!);

      markersRef.current.set(waypoint.chapter, marker);
    });
  }, [progressVisitedWaypoints, currentStyle, createMarkerElement]);

  // Enhanced "Where Am I" functionality
  const handleWhereAmI = useCallback(async () => {
    setIsGettingLocation(true);
    const _startTime = performance.now();

    try {
      // Use enhanced GPS service for high-accuracy location
      const whereAmIResult = await enhancedGPS.getWhereAmI();

      setUserPosition(whereAmIResult.position);
      setGpsAccuracy(whereAmIResult.position.accuracy);
      setNearbyCharacters(whereAmIResult.nearbyCharacters.map(String));

      // Center map on user location with appropriate zoom
      if (map.current) {
        (map.current as any).flyTo({
          center: [whereAmIResult.position.longitude, whereAmIResult.position.latitude],
          zoom: ZOOM_LEVELS.user,
          duration: 2000
        });
      }

      // Show detailed location info
      toast({
        title: "📍 Sua Localização",
        description: `${whereAmIResult.location}\nPrecisão: ${whereAmIResult.accuracy} (${whereAmIResult.position.accuracy.toFixed(0)}m)${
          whereAmIResult.nearbyCharacters.length > 0
            ? `\n🎭 ${whereAmIResult.nearbyCharacters.length} personagem(ns) próximo(s)`
            : ''
        }`,
        duration: 5000,
      });

      // Track performance
      const _endTime = performance.now();
      // Assuming performanceMonitoringService is defined elsewhere or removed
      // performanceMonitoringService.measureCustom('Where Am I', startTime, endTime);

      logger.info('Where Am I completed:', whereAmIResult);

    } catch (error) {
      logger.error('Where Am I failed:', error);

      toast({
        title: "❌ Erro de Localização",
        description: "Não foi possível obter sua localização. Verifique as permissões do GPS.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGettingLocation(false);
    }
  }, [toast]);

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
  }, [dataLoading, dataError, fixedCoordinates, getCombinedData, generateWaypoints]);

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
    const geojsonData: GeoJSON.FeatureCollection = {
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
    const sourceExists = (map.current as any).getSource(LINE_SOURCE_ID);

    if (sourceExists) {
      // Update the existing source
      ((map.current as any).getSource(LINE_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      // Add a new source and layer
      (map.current as any).addSource(LINE_SOURCE_ID, {
        type: 'geojson',
        data: geojsonData
      });

      // Add the neon line layer
      (map.current as any).addLayer({
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
      (map.current as any).addLayer({
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
    setShowTrails(prev => {
      const newValue = !prev;
      
      if (map.current) {
        const visibility = newValue ? 'visible' : 'none';
        (map.current as any).setLayoutProperty(LINE_LAYER_ID, 'visibility', visibility);
        (map.current as any).setLayoutProperty(`${LINE_LAYER_ID}-glow`, 'visibility', visibility);

        toast({
          title: visibility === 'visible' ? "Trilhas Ativadas" : "Trilhas Desativadas",
          description: visibility === 'visible' ?
            "Agora você pode ver o caminho entre pontos" :
            "Caminhos entre pontos estão ocultos"
        });
      }
      
      return newValue;
    });
  }, [toast]);

  // Update trail lines when trails or visibility changes
  useEffect(() => {
    if (map.current && !isLoading && trails.length > 0) {
      (map.current as any).once('style.load', () => {
        updateTrailLines();
      });

      if ((map.current as any).isStyleLoaded()) {
        updateTrailLines();
      }
    }
  }, [trails, showTrails, isLoading, updateTrailLines]);

  // Initialize map
  useEffect(() => {
    const currentMapContainer = mapContainer.current;
    if (!currentMapContainer) {
      console.warn('Map container not available');
      return;
    }

    // Prevent multiple initializations
    if (map.current) {
      console.log('Map already initialized');
      return;
    }

    console.log('🗺️ Starting map initialization...');
    setIsLoading(true);
    
    // No API key needed for free MapLibre styles
    console.log('🗺️ Using free MapLibre-compatible map styles');
    

    try {
      const styleConfig = MAP_STYLES[currentStyle];

      // Use the direct style URL from the configuration
      const styleUrl = styleConfig.url;

      map.current = new maplibregl.Map({
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
        new maplibregl.NavigationControl({
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
        const minimalError = {
          type: e.type,
          message: e.error?.message,
          stack: e.error?.stack,
        };
        logger.error('Map error:', minimalError);
        console.error('Map error:', e);
        setIsLoading(false);
        
        // Don't show error toast for network issues, just log them
        if (!e.error?.message?.includes('fetch') && !e.error?.message?.includes('Failed to fetch')) {
          toast({
            title: t('map.error'),
            description: t('map.errorDesc'),
            variant: "destructive",
          });
        }
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

  // Update markers function
  const updateMarkers = useCallback(() => {
    if (!map.current || !waypoints.length) return;

    const newMarkers = new Map<string, maplibregl.Marker>();

    waypoints.forEach(waypoint => {
      const existingMarker = markersRef.current.get(waypoint.id);
      if (existingMarker) {
        // Update existing marker
        const el = createMarkerElement(waypoint, progressVisitedWaypoints.has(Number(waypoint.id)), MAP_STYLES[currentStyle]);
        existingMarker.getElement().replaceWith(el);
        newMarkers.set(waypoint.id, existingMarker);
        markersRef.current.delete(waypoint.id);
      } else {
        // Add new marker
        const el = createMarkerElement(waypoint, progressVisitedWaypoints.has(Number(waypoint.id)), MAP_STYLES[currentStyle]);
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(waypoint.coordinates)
          .addTo(map.current!);
        
        marker.getElement().addEventListener('click', (e) => {
          console.log('Waypoint clicked:', waypoint.title, 'Full character:', waypoint.fullCharacter);
          setSelectedWaypoint(waypoint.fullCharacter as unknown as CombinedSutraEntry);
          e.stopPropagation();
        });
        
        newMarkers.set(waypoint.id, marker);
      }
    });

    // Remove old markers
    markersRef.current.forEach(marker => (marker as any).remove());
    markersRef.current = newMarkers;
  }, [waypoints, progressVisitedWaypoints, currentStyle, createMarkerElement]);

  // Update user location marker when position changes
  useEffect(() => {
    createUserLocationMarker();
  }, [createUserLocationMarker]);

  // Update markers when nearby characters change
  useEffect(() => {
    if (waypoints.length > 0) {
      updateMarkers();
    }
  }, [nearbyCharacters, waypoints, updateMarkers]);

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

      {/* Enhanced Floating Controls */}
      {!isLoading && !dataLoading && (
        <>
          <ModernMapControls
            currentStyle={currentStyle}
            mapStyles={MAP_STYLES}
            onStyleChange={(style) => setCurrentStyle(style as keyof typeof MAP_STYLES)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchResults={filteredWaypoints.length}
            totalWaypoints={waypoints.length}
            isTrackingUser={isGPSActive}
            onStartTracking={startGPSTracking}
            onStopTracking={stopGPSTracking}
            onWhereAmI={handleWhereAmI}
            isGettingLocation={isGettingLocation}
            gpsAccuracy={gpsAccuracy}
            nearbyCharacters={nearbyCharacters}
            visitedCount={visitedCount}
            totalProgress={totalProgress}
            showTrails={showTrails}
            onToggleTrails={toggleTrailsVisibility}
            isOnline={isOnline}
          />
        </>
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
