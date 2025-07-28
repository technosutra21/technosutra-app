import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { Badge } from '@/components/ui/badge';
import { CyberButton } from '@/components/ui/cyber-button';
import { CyberCard, CyberCardContent, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useSutraData } from '@/hooks/useSutraData';
import { logger } from '@/lib/logger';

import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Compass,
  Flower2,
  Infinity as InfinityIcon,
  MapPin,
  Mountain,
  Navigation,
  Save,
  TreePine,
  Users,
  Waves
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Trail types focused on Buddhist/spiritual hiking
const TRAIL_TYPES = {
  meditation: {
    id: 'meditation',
    name: 'Trilha de Meditação',
    icon: Flower2,
    color: 'from-purple-500 to-pink-500',
    description: 'Caminho contemplativo para prática meditativa',
    mapStyle: 'backdrop'
  },
  pilgrimage: {
    id: 'pilgrimage',
    name: 'Peregrinação Sagrada',
    icon: Mountain,
    color: 'from-cyan-500 to-blue-500',
    description: 'Jornada espiritual através de locais sagrados',
    mapStyle: 'outdoor-v2'
  },
  mindfulness: {
    id: 'mindfulness',
    name: 'Atenção Plena',
    icon: TreePine,
    color: 'from-green-500 to-emerald-500',
    description: 'Trilha para conexão com a natureza',
    mapStyle: 'satellite'
  },
  zen: {
    id: 'zen',
    name: 'Caminho Zen',
    icon: Waves,
    color: 'from-indigo-500 to-purple-500',
    description: 'Simplicidade e harmonia no caminhar',
    mapStyle: 'streets-v2'
  }
} as const;

type TrailType = keyof typeof TRAIL_TYPES;

interface TrailPoint {
  id: string;
  coordinates: [number, number];
  name: string;
  type: 'start' | 'meditation' | 'sacred' | 'rest' | 'end';
  description?: string;
}

interface CharacterPoint {
  id: string;
  coordinates: [number, number];
  character: any; // CombinedSutraEntry
  distanceFromUser?: number;
  isInRange?: boolean;
}

interface Trail {
  id?: string;
  name: string;
  description: string;
  type: TrailType;
  points: TrailPoint[];
  characters: CharacterPoint[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  created?: Date;
}

const RouteCreator = () => {
  const [currentStep, setCurrentStep] = useState<'type' | 'build'>('type');
  const [selectedTrailType, setSelectedTrailType] = useState<TrailType | null>(null);
  const [trail, setTrail] = useState<Trail>({
    name: '',
    description: '',
    type: 'meditation',
    points: [],
    characters: [],
    difficulty: 'easy',
    estimatedTime: 60
  });
  const [isCreating, setIsCreating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<Map<string, maptilersdk.Marker>>(new Map());
  const characterMarkersRef = useRef<Map<string, maptilersdk.Marker>>(new Map());
  const watchIdRef = useRef<number | null>(null);

  const { toast } = useToast();
  const { t: _t } = useLanguage();
  const { getCombinedData, loading: dataLoading } = useSutraData();

  // Base coordinates (Águas da Prata, SP)
  const BASE_COORDINATES = {
    lat: -21.9427,
    lng: -46.7167
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((coord1: [number, number], coord2: [number, number]): number => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }, []);

  // Distribute 56 characters along the trail route
  const distributeCharactersAlongTrail = useCallback((trailPoints: TrailPoint[]): CharacterPoint[] => {
    if (trailPoints.length < 2 || dataLoading) return [];

    const characters = getCombinedData('pt');
    if (characters.length === 0) return [];

    // Create a path from all trail points
    const pathCoordinates: [number, number][] = trailPoints.map(point => point.coordinates);

    // Calculate total path length
    let totalDistance = 0;
    for (let i = 1; i < pathCoordinates.length; i++) {
      totalDistance += calculateDistance(pathCoordinates[i - 1], pathCoordinates[i]);
    }

    // Distribute characters evenly along the path
    const characterPoints: CharacterPoint[] = [];
    const segmentLength = totalDistance / Math.min(characters.length, 56);

    let currentDistance = 0;
    let characterIndex = 0;

    for (let i = 1; i < pathCoordinates.length && characterIndex < Math.min(characters.length, 56); i++) {
      const segmentStart = pathCoordinates[i - 1];
      const segmentEnd = pathCoordinates[i];
      const segmentDist = calculateDistance(segmentStart, segmentEnd);

      // Place characters along this segment
      while (currentDistance + segmentLength <= currentDistance + segmentDist && characterIndex < Math.min(characters.length, 56)) {
        const ratio = (currentDistance + segmentLength - currentDistance) / segmentDist;
        const characterCoord: [number, number] = [
          segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * ratio,
          segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * ratio
        ];

        characterPoints.push({
          id: `char-${characters[characterIndex].chapter}`,
          coordinates: characterCoord,
          character: characters[characterIndex],
          distanceFromUser: userLocation ? calculateDistance(userLocation, characterCoord) : Infinity,
          isInRange: false
        });

        characterIndex++;
        currentDistance += segmentLength;
      }

      currentDistance += segmentDist;
    }

    logger.info(`Distributed ${characterPoints.length} characters along trail`);
    return characterPoints;
  }, [calculateDistance, getCombinedData, dataLoading, userLocation]);

  // Update character distances when user location changes
  const updateCharacterDistances = useCallback(() => {
    if (!userLocation) return;

    setTrail(prev => ({
      ...prev,
      characters: prev.characters.map(char => {
        const distance = calculateDistance(userLocation, char.coordinates);
        return {
          ...char,
          distanceFromUser: distance,
          isInRange: distance <= 50 // 50 meters range
        };
      })
    }));
  }, [userLocation, calculateDistance]);

  // Start GPS tracking
  const startLocationTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Não Suportado",
        description: "Seu navegador não suporta geolocalização",
        variant: "destructive"
      });
      return;
    }

    setIsTrackingLocation(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    const success = (position: GeolocationPosition) => {
      const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
      setUserLocation(coords);

      // Update map center to user location
      if (map.current) {
        map.current.flyTo({
          center: coords,
          zoom: 16,
          duration: 1000
        });
      }
    };

    const error = (err: GeolocationPositionError) => {
      logger.error('GPS error:', err);
      toast({
        title: "Erro GPS",
        description: "Não foi possível obter sua localização",
        variant: "destructive"
      });
      setIsTrackingLocation(false);
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(success, error, options);

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(success, error, options);

    toast({
      title: "GPS Ativado",
      description: "Rastreando sua localização para detectar personagens próximos"
    });
  }, [toast]);

  // Stop GPS tracking
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTrackingLocation(false);
    setUserLocation(null);

    toast({
      title: "GPS Desativado",
      description: "Rastreamento de localização parado"
    });
  }, [toast]);

  // Initialize map when trail type is selected
  const initializeMap = useCallback((trailType: TrailType) => {
    if (!mapContainer.current) return;

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    const styleConfig = TRAIL_TYPES[trailType];
    const getStyleUrl = (styleType: string) => {
      switch (styleType) {
        case 'backdrop':
          return 'https://api.maptiler.com/maps/backdrop/style.json';
        case 'outdoor-v2':
          return 'https://api.maptiler.com/maps/outdoor-v2/style.json';
        case 'satellite':
          return 'https://api.maptiler.com/maps/satellite/style.json';
        case 'streets-v2':
          return 'https://api.maptiler.com/maps/streets-v2/style.json';
        default:
          return 'https://api.maptiler.com/maps/outdoor-v2/style.json';
      }
    };

    try {
      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: getStyleUrl(styleConfig.mapStyle),
        center: [BASE_COORDINATES.lng, BASE_COORDINATES.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        antialias: true
      });

      map.current.on('load', () => {
        logger.info(`🗺️ Trail map loaded for ${trailType}`);
      });

      // Add click handler for adding trail points
      map.current.on('click', (e) => {
        if (currentStep === 'build') {
          addTrailPoint(e.lngLat.toArray() as [number, number]);
        }
      });

    } catch (error) {
      logger.error('Failed to initialize trail map:', error);
    }
  }, [currentStep]);

  // Add a trail point
  const addTrailPoint = useCallback((coordinates: [number, number]) => {
    const pointId = `point-${Date.now()}`;
    const pointCount = trail.points.length;

    let pointType: TrailPoint['type'] = 'meditation';
    if (pointCount === 0) pointType = 'start';
    else if (pointCount % 3 === 0) pointType = 'rest';
    else if (pointCount % 5 === 0) pointType = 'sacred';

    const newPoint: TrailPoint = {
      id: pointId,
      coordinates,
      name: `Ponto ${pointCount + 1}`,
      type: pointType,
      description: ''
    };

    const updatedPoints = [...trail.points, newPoint];

    // Redistribute characters along the new trail
    const redistributedCharacters = distributeCharactersAlongTrail(updatedPoints);

    setTrail(prev => ({
      ...prev,
      points: updatedPoints,
      characters: redistributedCharacters
    }));

    // Add marker to map
    if (map.current) {
      const el = createTrailMarkerElement(newPoint);
      const marker = new maptilersdk.Marker(el)
        .setLngLat(coordinates)
        .addTo(map.current);

      markersRef.current.set(pointId, marker);
    }

    toast({
      title: "Ponto Adicionado",
      description: `${newPoint.name} foi adicionado à trilha`
    });
  }, [trail.points, toast, distributeCharactersAlongTrail]);

  // Create marker element for trail points
  const createTrailMarkerElement = useCallback((point: TrailPoint) => {
    const el = document.createElement('div');
    el.className = 'trail-point-marker';

    const getPointColor = (type: TrailPoint['type']) => {
      switch (type) {
        case 'start': return '#00ff00';
        case 'end': return '#ff0000';
        case 'sacred': return '#ff00ff';
        case 'meditation': return '#00ffff';
        case 'rest': return '#ffff00';
        default: return '#ffffff';
      }
    };

    const getPointIcon = (type: TrailPoint['type']) => {
      switch (type) {
        case 'start': return '🚀';
        case 'end': return '🏁';
        case 'sacred': return '🕉️';
        case 'meditation': return '🧘';
        case 'rest': return '🛑';
        default: return '📍';
      }
    };

    el.style.cssText = `
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${getPointColor(point.type)};
      border: 2px solid #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 0 20px ${getPointColor(point.type)};
      transition: all 0.3s ease;
      z-index: 100;
    `;

    el.textContent = getPointIcon(point.type);
    el.title = `${point.name} - ${point.type}`;

    return el;
  }, []);

  // Create marker element for characters
  const createCharacterMarkerElement = useCallback((characterPoint: CharacterPoint) => {
    const el = document.createElement('div');
    el.className = 'character-marker';

    const isInRange = characterPoint.isInRange;
    const character = characterPoint.character;

    el.style.cssText = `
      width: ${isInRange ? '40px' : '28px'};
      height: ${isInRange ? '40px' : '28px'};
      border-radius: 50%;
      background: ${isInRange ?
        'linear-gradient(135deg, #ff00ff, #00ffff)' :
        'linear-gradient(135deg, #666666, #999999)'
      };
      border: 2px solid ${isInRange ? '#ffffff' : '#cccccc'};
      cursor: ${isInRange ? 'pointer' : 'default'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isInRange ? '18px' : '14px'};
      box-shadow: 0 0 ${isInRange ? '25px' : '10px'} ${isInRange ? '#ff00ff' : '#666666'};
      transition: all 0.3s ease;
      opacity: ${isInRange ? '1' : '0.6'};
      z-index: ${isInRange ? '200' : '50'};
    `;

    el.textContent = character.chapter.toString();
    el.title = `${character.nome} - Capítulo ${character.chapter}${isInRange ? ' - CLIQUE PARA ABRIR' : ` - ${Math.round(characterPoint.distanceFromUser || 0)}m`}`;

    // Add click handler only if in range
    if (isInRange) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedCharacter(character);
        toast({
          title: "Personagem Encontrado!",
          description: `${character.nome} - ${character.ocupacao}`
        });
      });

      // Add hover effects for in-range characters
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.boxShadow = '0 0 35px #ff00ff';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 0 25px #ff00ff';
      });
    }

    return el;
  }, [toast]);

  // Update character markers on map
  const updateCharacterMarkers = useCallback(() => {
    if (!map.current) return;

    // Clear existing character markers
    characterMarkersRef.current.forEach(marker => marker.remove());
    characterMarkersRef.current.clear();

    // Add updated character markers
    trail.characters.forEach(characterPoint => {
      const el = createCharacterMarkerElement(characterPoint);
      const marker = new maptilersdk.Marker(el)
        .setLngLat(characterPoint.coordinates)
        .addTo(map.current!);

      characterMarkersRef.current.set(characterPoint.id, marker);
    });
  }, [trail.characters, createCharacterMarkerElement]);

  // Add user location marker
  const updateUserLocationMarker = useCallback(() => {
    if (!map.current || !userLocation) return;

    // Remove existing user marker
    const existingUserMarker = characterMarkersRef.current.get('user-location');
    if (existingUserMarker) {
      existingUserMarker.remove();
      characterMarkersRef.current.delete('user-location');
    }

    // Create user location marker
    const el = document.createElement('div');
    el.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #00ff00;
      border: 3px solid #ffffff;
      box-shadow: 0 0 20px #00ff00;
      animation: pulse 2s infinite;
    `;

    const marker = new maptilersdk.Marker(el)
      .setLngLat(userLocation)
      .addTo(map.current);

    characterMarkersRef.current.set('user-location', marker);
  }, [userLocation]);

  // Handle trail type selection
  const handleTrailTypeSelect = (trailType: TrailType) => {
    setSelectedTrailType(trailType);
    setTrail(prev => ({ ...prev, type: trailType }));
    setCurrentStep('build');

    // Initialize map with selected trail type
    setTimeout(() => {
      initializeMap(trailType);
    }, 100);
  };

  // Save trail
  const handleSaveTrail = async () => {
    if (!trail.name.trim()) {
      toast({
        title: "Nome Obrigatório",
        description: "Por favor, dê um nome à sua trilha",
        variant: "destructive"
      });
      return;
    }

    if (trail.points.length < 2) {
      toast({
        title: "Pontos Insuficientes",
        description: "Uma trilha precisa de pelo menos 2 pontos",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Mark last point as end
      const finalTrail = {
        ...trail,
        id: `trail-${Date.now()}`,
        created: new Date(),
        points: trail.points.map((point, index) => ({
          ...point,
          type: index === trail.points.length - 1 ? 'end' as const : point.type
        }))
      };

      // Save to localStorage
      const savedTrails = JSON.parse(localStorage.getItem('technosutra-trails') || '[]');
      savedTrails.push(finalTrail);
      localStorage.setItem('technosutra-trails', JSON.stringify(savedTrails));

      logger.info('Trail saved successfully:', finalTrail);

      toast({
        title: "Trilha Criada!",
        description: `${finalTrail.name} foi salva com sucesso`,
      });

      // Reset after delay
      setTimeout(() => {
        setCurrentStep('type');
        setSelectedTrailType(null);
        setTrail({
          name: '',
          description: '',
          type: 'meditation',
          points: [],
          characters: [],
          difficulty: 'easy',
          estimatedTime: 60
        });
        setIsCreating(false);

        // Clear map
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current.clear();
        characterMarkersRef.current.forEach(marker => marker.remove());
        characterMarkersRef.current.clear();
        if (map.current) {
          map.current.remove();
          map.current = null;
        }

        // Stop GPS tracking
        if (isTrackingLocation) {
          stopLocationTracking();
        }
      }, 2000);

    } catch (error) {
      logger.error('Error saving trail:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a trilha",
        variant: "destructive"
      });
      setIsCreating(false);
    }
  };

  // Update character distances when user location changes
  useEffect(() => {
    updateCharacterDistances();
  }, [updateCharacterDistances]);

  // Update character markers when characters change
  useEffect(() => {
    updateCharacterMarkers();
  }, [updateCharacterMarkers]);

  // Update user location marker when location changes
  useEffect(() => {
    updateUserLocationMarker();
  }, [updateUserLocationMarker]);

  // Cleanup GPS tracking on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black sacred-pattern">
      {/* Sacred background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
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
          ☸
        </motion.div>
        <motion.div
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-24 right-20 text-purple-400/20 text-5xl"
        >
          🕉️
        </motion.div>
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="border-b border-cyan-500/20 bg-black/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-3">
                  <InfinityIcon className="w-8 h-8 text-cyan-400" />
                  Criador de Trilhas Sagradas
                </h1>
                <p className="text-slate-400 mt-2">
                  {currentStep === 'type'
                    ? 'Escolha o tipo de jornada espiritual'
                    : 'Clique no mapa para adicionar pontos à trilha'
                  }
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2">
                {currentStep === 'type' ? 'Passo 1/2' : 'Passo 2/2'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {currentStep === 'type' && (
              <motion.div
                key="type-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                <CyberCard variant="void" glowEffect className="p-8">
                  <CyberCardHeader className="text-center mb-8">
                    <CyberCardTitle className="text-2xl mb-4">
                      Escolha Seu Caminho Espiritual
                    </CyberCardTitle>
                    <p className="text-slate-400">
                      Cada tipo de trilha oferece uma experiência única de conexão espiritual
                    </p>
                  </CyberCardHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(TRAIL_TYPES).map(([key, trailType]) => {
                      const Icon = trailType.icon;
                      return (
                        <motion.div
                          key={key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <CyberButton
                            variant="outline"
                            onClick={() => handleTrailTypeSelect(key as TrailType)}
                            className="w-full h-auto p-6 text-left"
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg bg-gradient-to-br ${trailType.color} text-white`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-2">{trailType.name}</h3>
                                <p className="text-slate-400 text-sm">{trailType.description}</p>
                              </div>
                            </div>
                          </CyberButton>
                        </motion.div>
                      );
                    })}
                  </div>
                </CyberCard>
              </motion.div>
            )}

            {currentStep === 'build' && selectedTrailType && (
              <motion.div
                key="trail-builder"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]"
              >
                {/* Trail Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                  <CyberCard variant="void" glowEffect>
                    <CyberCardHeader>
                      <CyberCardTitle className="flex items-center gap-2">
                        {React.createElement(TRAIL_TYPES[selectedTrailType].icon, { className: "w-5 h-5" })}
                        {TRAIL_TYPES[selectedTrailType].name}
                      </CyberCardTitle>
                    </CyberCardHeader>
                    <CyberCardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nome da Trilha</label>
                        <Input
                          value={trail.name}
                          onChange={(e) => setTrail(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Caminho da Iluminação"
                          className="bg-black/50 border-cyan-500/30"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Descrição</label>
                        <Textarea
                          value={trail.description}
                          onChange={(e) => setTrail(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva a experiência espiritual desta trilha..."
                          className="bg-black/50 border-cyan-500/30 min-h-[80px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Dificuldade</label>
                          <Select
                            value={trail.difficulty}
                            onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                              setTrail(prev => ({ ...prev, difficulty: value }))
                            }
                          >
                            <SelectTrigger className="bg-black/50 border-cyan-500/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Fácil</SelectItem>
                              <SelectItem value="medium">Médio</SelectItem>
                              <SelectItem value="hard">Difícil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Tempo (min)</label>
                          <Input
                            type="number"
                            value={trail.estimatedTime}
                            onChange={(e) => setTrail(prev => ({
                              ...prev,
                              estimatedTime: parseInt(e.target.value) || 60
                            }))}
                            className="bg-black/50 border-cyan-500/30"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-cyan-500/20 space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Pontos da Trilha</span>
                            <Badge variant="outline">{trail.points.length}</Badge>
                          </div>
                          <div className="space-y-2 max-h-24 overflow-y-auto">
                            {trail.points.map((point, index) => (
                              <div key={point.id} className="flex items-center gap-2 text-sm">
                                <span className="text-cyan-400">{index + 1}.</span>
                                <span>{point.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {point.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Personagens Distribuídos
                            </span>
                            <Badge variant="outline">{trail.characters.length}/56</Badge>
                          </div>
                          <div className="text-xs text-slate-400 mb-2">
                            {trail.characters.filter(c => c.isInRange).length} personagens ao alcance (50m)
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {trail.characters.slice(0, 5).map((char, _index) => (
                              <div key={char.id} className="flex items-center gap-2 text-xs">
                                <span className={`w-2 h-2 rounded-full ${char.isInRange ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                                <span>{char.character.nome}</span>
                                <span className="text-slate-500">
                                  {char.distanceFromUser ? `${Math.round(char.distanceFromUser)}m` : ''}
                                </span>
                              </div>
                            ))}
                            {trail.characters.length > 5 && (
                              <div className="text-xs text-slate-500">
                                +{trail.characters.length - 5} mais personagens...
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <CyberButton
                            variant={isTrackingLocation ? "destructive" : "cyber"}
                            onClick={isTrackingLocation ? stopLocationTracking : startLocationTracking}
                            className="w-full"
                            size="sm"
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            {isTrackingLocation ? 'Parar GPS' : 'Ativar GPS'}
                          </CyberButton>
                          {userLocation && (
                            <div className="text-xs text-slate-400 mt-1 text-center">
                              GPS ativo - detectando personagens próximos
                            </div>
                          )}
                        </div>
                      </div>
                    </CyberCardContent>
                  </CyberCard>

                  <div className="flex gap-3">
                    <CyberButton
                      variant="outline"
                      onClick={() => setCurrentStep('type')}
                      className="flex-1"
                    >
                      <Compass className="w-4 h-4 mr-2" />
                      Voltar
                    </CyberButton>
                    <CyberButton
                      variant="sacred"
                      onClick={handleSaveTrail}
                      disabled={!trail.name.trim() || trail.points.length < 2 || isCreating}
                      glowEffect
                      className="flex-1"
                    >
                      {isCreating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Trilha
                        </>
                      )}
                    </CyberButton>
                  </div>
                </div>

                {/* Interactive Map */}
                <div className="lg:col-span-2">
                  <CyberCard variant="void" className="h-full">
                    <CyberCardHeader>
                      <CyberCardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Mapa Interativo
                      </CyberCardTitle>
                      <p className="text-sm text-slate-400">
                        Clique no mapa para adicionar pontos à sua trilha sagrada
                        {trail.characters.length > 0 && (
                          <span className="block mt-1 text-cyan-400">
                            {trail.characters.length} personagens distribuídos automaticamente
                          </span>
                        )}
                      </p>
                    </CyberCardHeader>
                    <CyberCardContent className="p-0 h-[calc(100%-80px)]">
                      <div
                        ref={mapContainer}
                        className="w-full h-full rounded-b-lg overflow-hidden"
                        style={{ minHeight: '400px' }}
                      />
                    </CyberCardContent>
                  </CyberCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        isOpen={!!selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        character={selectedCharacter}
      />

      {/* Add CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 255, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default RouteCreator;
