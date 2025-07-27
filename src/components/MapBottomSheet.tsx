import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, LocateFixed, Target, Zap, 
  Navigation, MapPin, Star, SortAsc
} from 'lucide-react';

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

interface MapBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Waypoints
  waypoints: Waypoint[];
  visitedWaypoints: Set<string>;
  nearbyWaypoints: Waypoint[];
  onWaypointSelect: (waypoint: Record<string, unknown>) => void;
  onFlyToWaypoint: (waypoint: Waypoint) => void;
  
  // Search
  searchTerm: string;
  onSearchChange: (term: string) => void;
  
  // Map Controls
  currentStyle: string;
  mapStyles: Record<string, MapStyle>;
  onStyleChange: (style: string) => void;
  
  // GPS
  isTrackingUser: boolean;
  userLocation: [number, number] | null;
  userAccuracy: number | null;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onCenterOnUser: () => void;
  
  // Progress
  visitedCount: number;
  totalProgress: number;
}

export const MapBottomSheet: React.FC<MapBottomSheetProps> = ({
  isOpen,
  onClose,
  waypoints,
  visitedWaypoints,
  nearbyWaypoints,
  onWaypointSelect,
  onFlyToWaypoint,
  searchTerm,
  onSearchChange,
  currentStyle,
  mapStyles,
  onStyleChange,
  isTrackingUser,
  userLocation,
  userAccuracy,
  onStartTracking,
  onStopTracking,
  onCenterOnUser,
  visitedCount,
  totalProgress
}) => {
  const [sortBy, setSortBy] = useState<'chapter' | 'name' | 'location' | 'distance'>('chapter');
  const [filterBy, setFilterBy] = useState<'all' | 'visited' | 'unvisited' | 'nearby'>('all');

  // Filter and sort waypoints
  const filteredAndSortedWaypoints = useMemo(() => {
    let filtered = waypoints;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(waypoint =>
        waypoint.title.toLowerCase().includes(searchLower) ||
        waypoint.chapter.toString().includes(searchTerm) ||
        waypoint.occupation.toLowerCase().includes(searchLower) ||
        waypoint.location.toLowerCase().includes(searchLower) ||
        waypoint.meaning.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'visited':
        filtered = filtered.filter(w => visitedWaypoints.has(w.chapter));
        break;
      case 'unvisited':
        filtered = filtered.filter(w => !visitedWaypoints.has(w.chapter));
        break;
      case 'nearby':
        filtered = nearbyWaypoints;
        break;
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'chapter':
          return parseInt(a.chapter) - parseInt(b.chapter);
        case 'name':
          return a.title.localeCompare(b.title);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'distance':
          {
            if (!userLocation) return 0;
            const distA = calculateDistance(userLocation[0], userLocation[1], a.coordinates[1], a.coordinates[0]);
            const distB = calculateDistance(userLocation[0], userLocation[1], b.coordinates[1], b.coordinates[0]);
            return distA - distB;
          }
        default:
          return 0;
      }
    });
  }, [waypoints, searchTerm, filterBy, sortBy, visitedWaypoints, nearbyWaypoints, userLocation]);

  // Calculate distance (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const getDistanceText = (waypoint: Waypoint): string => {
    if (!userLocation) return '';
    const distance = calculateDistance(userLocation[0], userLocation[1], waypoint.coordinates[1], waypoint.coordinates[0]);
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Techno Sutra Map"
      description="Controles e waypoints da jornada sagrada"
      snapPoints={[30, 60, 85]}
      defaultSnap={1}
    >
      <div className="p-4">
        <Tabs defaultValue="waypoints" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="waypoints" className="text-xs">
              <MapPin className="w-4 h-4 mr-1" />
              Pontos
            </TabsTrigger>
            <TabsTrigger value="gps" className="text-xs">
              <Navigation className="w-4 h-4 mr-1" />
              GPS
            </TabsTrigger>
            <TabsTrigger value="styles" className="text-xs">
              <Zap className="w-4 h-4 mr-1" />
              Estilos
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs">
              <Star className="w-4 h-4 mr-1" />
              Progresso
            </TabsTrigger>
          </TabsList>

          {/* Waypoints Tab */}
          <TabsContent value="waypoints" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar waypoints..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 cyberpunk-input"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={filterBy === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('all')}
                className="whitespace-nowrap"
              >
                Todos ({waypoints.length})
              </Button>
              <Button
                variant={filterBy === 'unvisited' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('unvisited')}
                className="whitespace-nowrap"
              >
                Não Visitados ({waypoints.length - visitedCount})
              </Button>
              <Button
                variant={filterBy === 'visited' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('visited')}
                className="whitespace-nowrap"
              >
                Visitados ({visitedCount})
              </Button>
              <Button
                variant={filterBy === 'nearby' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('nearby')}
                className="whitespace-nowrap"
                disabled={!userLocation}
              >
                Próximos ({nearbyWaypoints.length})
              </Button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'chapter' | 'name' | 'location' | 'distance')}
                className="bg-input border border-border rounded px-3 py-1 text-sm"
              >
                <option value="chapter">Por Capítulo</option>
                <option value="name">Por Nome</option>
                <option value="location">Por Local</option>
                {userLocation && <option value="distance">Por Distância</option>}
              </select>
            </div>

            {/* Waypoints List */}
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredAndSortedWaypoints.map((waypoint) => {
                  const isVisited = visitedWaypoints.has(waypoint.chapter);
                  const distance = getDistanceText(waypoint);
                  
                  return (
                    <motion.div
                      key={waypoint.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card className={`p-3 cursor-pointer transition-all duration-200 ${
                        isVisited ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/10'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={isVisited ? "default" : "outline"} className="text-xs">
                                Cap. {waypoint.chapter}
                              </Badge>
                              {isVisited && (
                                <Badge variant="secondary" className="text-xs">
                                  ✓ Visitado
                                </Badge>
                              )}
                              {distance && (
                                <Badge variant="outline" className="text-xs">
                                  {distance}
                                </Badge>
                              )}
                            </div>
                            
                            <h4 className="font-semibold text-foreground text-sm mb-1 truncate">
                              {waypoint.title}
                            </h4>
                            
                            <p className="text-xs text-muted-foreground mb-1">
                              {waypoint.occupation}
                            </p>
                            
                            <p className="text-xs text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {waypoint.location}
                            </p>
                          </div>
                          
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onWaypointSelect(waypoint.fullCharacter)}
                              className="h-8 w-8 p-0"
                            >
                              <Search className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onFlyToWaypoint(waypoint)}
                              className="h-8 w-8 p-0"
                            >
                              <Navigation className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* GPS Tab */}
          <TabsContent value="gps" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-primary text-glow">Sistema GPS</h3>
                <Badge variant={isTrackingUser ? "default" : "outline"} className={isTrackingUser ? "tracking-active" : ""}>
                  {isTrackingUser ? 'ATIVO' : 'INATIVO'}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={isTrackingUser ? "destructive" : "default"}
                    size="sm"
                    onClick={isTrackingUser ? onStopTracking : onStartTracking}
                    className="flex-1"
                  >
                    <LocateFixed className="w-3 h-3 mr-2" />
                    {isTrackingUser ? 'Parar' : 'Rastrear'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCenterOnUser}
                    disabled={!userLocation}
                    className="flex-1"
                  >
                    <Target className="w-3 h-3 mr-2" />
                    Centro
                  </Button>
                </div>

                {/* GPS Status */}
                {userLocation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-primary/10 border border-primary/30 rounded text-xs space-y-1"
                  >
                    <div className="text-primary font-bold">📍 Status da Localização</div>
                    <div className="text-muted-foreground">
                      Precisão: {userAccuracy ? `${Math.round(userAccuracy)}m` : 'N/A'}
                    </div>
                    <div className="text-muted-foreground">
                      Próximos: {nearbyWaypoints.length} ponto(s)
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Map Styles Tab */}
          <TabsContent value="styles" className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(mapStyles).map(([key, style]) => {
                const IconComponent = style.icon;
                const isActive = currentStyle === key;
                
                return (
                  <Button
                    key={key}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onStyleChange(key)}
                    className={`justify-start text-left h-auto p-4 ${
                      isActive ? 
                        (style.cyberpunk ? 'gradient-neon text-black font-bold' : 'bg-primary text-primary-foreground') : 
                        'hover:bg-muted/20'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium">{style.name}</div>
                      <div className="text-xs opacity-80">{style.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-bold text-accent mb-4">Progresso da Jornada</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Visitados</span>
                  <span className="text-xl font-bold text-primary text-glow">
                    {visitedCount}/56
                  </span>
                </div>
                
                <div className="w-full bg-muted/20 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-primary to-accent h-3 rounded-full"
                  />
                </div>
                
                <div className="text-center">
                  <span className="text-3xl font-bold text-accent text-glow">
                    {totalProgress.toFixed(1)}%
                  </span>
                  <p className="text-sm text-muted-foreground">Completo</p>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                      {waypoints.length - visitedCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Restantes</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-cyan-400">
                      {nearbyWaypoints.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Próximos</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BottomSheet>
  );
};

export default MapBottomSheet;
