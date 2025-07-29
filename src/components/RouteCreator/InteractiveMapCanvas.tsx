import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Satellite, 
  Globe, 
  Zap, 
  Eye
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { RouteWaypoint } from './index';
import { RouteType } from './RouteTypeSelector';
import FloatingToolbar from './FloatingToolbar';

interface InteractiveMapCanvasProps {
  waypoints: RouteWaypoint[];
  onWaypointsChange: (waypoints: RouteWaypoint[]) => void;
  routeType: RouteType;
  isInteractive: boolean;
}

// Map styles for different route types
const MAP_STYLES = {
  spiritual: {
    id: 'spiritual',
    name: 'Mystical',
    icon: Zap,
    url: 'backdrop',
    cyberpunk: true,
    description: 'Estilo místico para jornadas espirituais'
  },
  urban: {
    id: 'urban',
    name: 'Streets',
    icon: Globe,
    url: 'streets-v2',
    cyberpunk: false,
    description: 'Mapa urbano para exploração da cidade'
  },
  natural: {
    id: 'natural',
    name: 'Satellite',
    icon: Satellite,
    url: 'satellite',
    cyberpunk: false,
    description: 'Vista satelital para natureza'
  }
};

const InteractiveMapCanvas: React.FC<InteractiveMapCanvasProps> = ({
  waypoints,
  onWaypointsChange,
  routeType,
  isInteractive
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'start' | 'end' | 'waypoint'>('start');
  const [showToolbar, setShowToolbar] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    setIsLoading(true);

    try {
      const styleConfig = MAP_STYLES[routeType] || MAP_STYLES.urban;

      const getStyleUrl = (styleKey: string) => {
        switch (styleKey) {
          case 'backdrop':
            return 'https://demotiles.maplibre.org/style.json';
          case 'satellite':
            return 'https://demotiles.maplibre.org/style.json';
          case 'streets-v2':
            return 'https://demotiles.maplibre.org/style.json';
          default:
            return 'https://demotiles.maplibre.org/style.json';
        }
      };

      const styleUrl = getStyleUrl(styleConfig.url);


      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [-46.7167, -21.9427], // Águas da Prata, SP
        zoom: 10,
        attributionControl: false,
        antialias: true
      });

      map.current.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true
        }), 
        'top-right'
      );

      map.current.on('load', () => {
        logger.info('🗺️ Interactive map loaded with style:', routeType);
        setIsLoading(false);
        
        // Apply cyberpunk styling if needed
        if (styleConfig.cyberpunk && mapContainer.current) {
          setTimeout(() => {
            mapContainer.current!.classList.add('cyberpunk-map');
          }, 500);
        } else if (mapContainer.current) {
          mapContainer.current.classList.remove('cyberpunk-map');
        }
      });

      map.current.on('error', (e) => {
        logger.error('Interactive map error:', e);
        setIsLoading(false);
      });

    } catch (error) {
      logger.error('Failed to initialize interactive map:', error);
      setIsLoading(false);
    }

    if (mapContainer.current) {
      const mapRef = mapContainer.current;
      return () => {
        mapRef.classList.remove('cyberpunk-map');
      };
    }
  }, [routeType]);

  // Helper function to get waypoint names
  const getWaypointName = React.useCallback((type: RouteWaypoint['type']) => {
    switch (type) {
      case 'start': return 'Start Point';
      case 'end': return 'Final Destination';
      default: return `Stop ${waypoints.filter(w => w.type === 'waypoint').length + 1}`;
    }
  }, [waypoints]);

  // Handle map clicks for adding waypoints
  useEffect(() => {
    if (!map.current || !isInteractive) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      const newWaypoint: RouteWaypoint = {
        id: `waypoint-${Date.now()}`,
        coordinates,
        name: getWaypointName(selectedTool),
        type: selectedTool,
        description: ''
      };

      // Remove existing start/end if adding new one
      let updatedWaypoints = waypoints;
      if (selectedTool === 'start' || selectedTool === 'end') {
        updatedWaypoints = waypoints.filter(w => w.type !== selectedTool);
      }

      const finalWaypoints = [...updatedWaypoints, newWaypoint];
      onWaypointsChange(finalWaypoints);
      
      // Auto-advance tool selection
      if (selectedTool === 'start') {
        setSelectedTool('end');
      } else if (selectedTool === 'end') {
        setSelectedTool('waypoint');
      }

      toast({
        title: "Ponto Adicionado",
        description: `${getWaypointName(selectedTool)} criado com sucesso`,
      });
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [isInteractive, selectedTool, waypoints, onWaypointsChange, toast, getWaypointName]);

  // Update map visualization when waypoints change
  const updateMapVisualization = useCallback(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    waypoints.forEach((waypoint, index) => {
      const el = document.createElement('div');
      el.className = 'custom-waypoint-marker';
      
      const color = waypoint.type === 'start' ? '#00ff00' : 
                   waypoint.type === 'end' ? '#ff0040' : '#00ffff';
      
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #ffffff;
        cursor: pointer;
        box-shadow: 0 0 20px ${color};
        position: relative;
        z-index: 1000;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        font-weight: bold;
        font-size: 14px;
      `;

      // Add emoji based on type with enhanced styling
      const iconContent = waypoint.type === 'start' ? '🚀' : 
                         waypoint.type === 'end' ? '🎯' : (index + 1).toString();
      el.textContent = iconContent;
      
      // Add cyberpunk glow animation
      el.style.animation = `waypointPulse 2s ease-in-out infinite`;
      
      // Enhanced hover effects with cyberpunk theme
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = `0 0 40px ${color}, 0 0 60px ${color}`;
        el.style.animation = 'none';
        el.style.filter = 'brightness(1.3) saturate(1.5)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = `0 0 20px ${color}`;
        el.style.animation = `waypointPulse 2s ease-in-out infinite`;
        el.style.filter = 'brightness(1) saturate(1)';
      });
      
      // Click event for waypoint interaction
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        // Add click ripple effect
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: ${color};
          opacity: 0.6;
          transform: translate(-50%, -50%);
          animation: clickRipple 0.6s ease-out;
          pointer-events: none;
          z-index: 1001;
        `;
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });

      // Label
      const label = document.createElement('div');
      label.textContent = waypoint.name;
      label.style.cssText = `
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        border: 1px solid ${color};
        box-shadow: 0 0 15px ${color};
        font-weight: bold;
      `;
      el.appendChild(label);

      const marker = new maplibregl.Marker(el)
        .setLngLat(waypoint.coordinates)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Draw route line
    if (waypoints.length >= 2) {
      // Remove existing route layer
      if (map.current.getLayer('route-line')) {
        map.current.removeLayer('route-line');
        map.current.removeSource('route-line');
      }

      // Sort waypoints: start, waypoints, end
      const sortedWaypoints = [
        ...waypoints.filter(w => w.type === 'start'),
        ...waypoints.filter(w => w.type === 'waypoint'),
        ...waypoints.filter(w => w.type === 'end')
      ];

      if (sortedWaypoints.length >= 2) {
        map.current.addSource('route-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: sortedWaypoints.map(w => w.coordinates)
            }
          }
        });

        const styleConfig = MAP_STYLES[routeType];
        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': styleConfig.cyberpunk ? '#ff00ff' : '#00aaff',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      }
    }
  }, [waypoints, routeType]);

  useEffect(() => {
    updateMapVisualization();
  }, [updateMapVisualization]);

  // Fit map to waypoints
  const fitToWaypoints = () => {
    if (!map.current || waypoints.length === 0) return;

    if (waypoints.length === 1) {
      map.current.flyTo({
        center: waypoints[0].coordinates,
        zoom: 14,
        duration: 2000
      });
    } else {
      const bounds = new maplibregl.LngLatBounds();
      waypoints.forEach(w => bounds.extend(w.coordinates));
      map.current.fitBounds(bounds, { 
        padding: 50,
        duration: 2000
      });
    }
  };



  return (
    <div className="relative h-full">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"
              />
              <h3 className="text-lg font-bold text-accent text-glow">
                {t('routeCreator.map.loading')}
              </h3>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Floating Toolbar */}
      <AnimatePresence>
        {showToolbar && (
          <FloatingToolbar
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            isInteractive={isInteractive}
            waypointCount={waypoints.length}
            onFitToWaypoints={fitToWaypoints}
            onToggleToolbar={() => setShowToolbar(false)}
          />
        )}
      </AnimatePresence>

      {/* Show Toolbar Button */}
      {!showToolbar && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 left-4 z-30"
        >
          <Button
            onClick={() => setShowToolbar(true)}
            className="gradient-neon text-black font-bold"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            {t('routeCreator.map.tools')}
          </Button>
        </motion.div>
      )}

      {/* Instructions */}
      {isInteractive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30"
        >
          <Card className="amoled-card px-6 py-3">
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-4 h-4 rounded-full ${
                selectedTool === 'start' ? 'bg-green-500' :
                selectedTool === 'end' ? 'bg-red-500' : 'bg-cyan-500'
              }`} />
              <span className="text-primary font-medium">
                {selectedTool === 'start' ? `${t('common.click')} ${t('routeCreator.map.start')}` :
                 selectedTool === 'end' ? `${t('common.click')} ${t('routeCreator.map.destination')}` :
                 `${t('common.click')} ${t('routeCreator.map.waypoint')}`}
              </span>
              <Badge variant="outline" className="ml-2">
                {waypoints.length} {t('routeCreator.typeSelector.points').toLowerCase()}
              </Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Route Type Badge */}
      <div className="absolute top-4 right-4 z-30">
        <Badge className="gradient-neon text-black font-bold px-4 py-2">
          {routeType === 'spiritual' ? '✨ Espiritual' :
           routeType === 'urban' ? '🏙️ Urbana' : '🌿 Natural'}
        </Badge>
      </div>
    </div>
  );
};

export default InteractiveMapCanvas;
