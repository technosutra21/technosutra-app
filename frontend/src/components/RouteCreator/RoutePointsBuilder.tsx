import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  MapPin, 
  Target, 
  Navigation, 
  Trash2, 
  Search,
  GripVertical,
  Route,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RouteWaypoint } from './index';

interface RoutePointsBuilderProps {
  waypoints: RouteWaypoint[];
  onWaypointsChange: (waypoints: RouteWaypoint[]) => void;
}

const RoutePointsBuilder: React.FC<RoutePointsBuilderProps> = ({
  waypoints,
  onWaypointsChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [expandedPoint, setExpandedPoint] = useState<string | null>(null);

  const getWaypointIcon = (type: RouteWaypoint['type']) => {
    switch (type) {
      case 'start': return { icon: Navigation, color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'end': return { icon: Target, color: 'text-red-400', bg: 'bg-red-500/20' };
      default: return { icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-500/20' };
    }
  };

  const addWaypoint = (type: RouteWaypoint['type'], name: string, coordinates: [number, number]) => {
    // Remove existing start/end if adding new one
    let filteredWaypoints = waypoints;
    if (type === 'start' || type === 'end') {
      filteredWaypoints = waypoints.filter(w => w.type !== type);
    }

    const newWaypoint: RouteWaypoint = {
      id: `waypoint-${Date.now()}`,
      coordinates,
      name: name || getDefaultName(type),
      type,
      description: ''
    };

    const updatedWaypoints = [...filteredWaypoints, newWaypoint];
    onWaypointsChange(updatedWaypoints);
  };

  const removeWaypoint = (id: string) => {
    onWaypointsChange(waypoints.filter(w => w.id !== id));
  };

  const updateWaypoint = (id: string, updates: Partial<RouteWaypoint>) => {
    onWaypointsChange(
      waypoints.map(w => w.id === id ? { ...w, ...updates } : w)
    );
  };

  const getDefaultName = (type: RouteWaypoint['type']) => {
    switch (type) {
      case 'start': return 'Ponto de Partida';
      case 'end': return 'Destino Final';
      default: return `Parada ${waypoints.filter(w => w.type === 'waypoint').length + 1}`;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=rg7OAqXjLo7cLdwqlrVt&limit=5`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        const coordinates: [number, number] = [lng, lat];
        
        // Determine type based on existing waypoints
        let type: RouteWaypoint['type'] = 'waypoint';
        if (!waypoints.some(w => w.type === 'start')) {
          type = 'start';
        } else if (!waypoints.some(w => w.type === 'end')) {
          type = 'end';
        }
        
        addWaypoint(type, feature.place_name || searchQuery, coordinates);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateDistance = React.useCallback(() => {
    if (waypoints.length < 2) return 0;
    
    // Sort waypoints properly: start -> waypoints -> end
    const sortedWaypoints = [
      ...waypoints.filter(w => w.type === 'start'),
      ...waypoints.filter(w => w.type === 'waypoint'),
      ...waypoints.filter(w => w.type === 'end')
    ];
    
    let totalDistance = 0;
    for (let i = 1; i < sortedWaypoints.length; i++) {
      const [lon1, lat1] = sortedWaypoints[i - 1].coordinates;
      const [lon2, lat2] = sortedWaypoints[i].coordinates;
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    
    return totalDistance;
  }, [waypoints]);

  // Update distance in parent component
  React.useEffect(() => {
    calculateDistance();
    onWaypointsChange(waypoints.map(w => w)); // Trigger parent update
  }, [waypoints, calculateDistance, onWaypointsChange]);
  const sortedWaypoints = [
    ...waypoints.filter(w => w.type === 'start'),
    ...waypoints.filter(w => w.type === 'waypoint'),
    ...waypoints.filter(w => w.type === 'end')
  ];

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-accent" />
          Buscar Locais
        </h3>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ex: São Paulo, SP ou Praça da Sé"
            className="cyberpunk-input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="neon-glow"
          >
            {isSearching ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Pesquise e adicione locais à sua rota automaticamente
        </p>
      </Card>

      {/* Quick Add Buttons */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-3">Adicionar Pontos</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addWaypoint('start', '', [-46.7167, -21.9427])}
            disabled={waypoints.some(w => w.type === 'start')}
            className="text-green-400 border-green-500 hover:bg-green-500/20"
          >
            <Navigation className="w-4 h-4 mr-1" />
            Início
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addWaypoint('waypoint', '', [-46.7167, -21.9427])}
            className="text-blue-400 border-blue-500 hover:bg-blue-500/20"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Parada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addWaypoint('end', '', [-46.7167, -21.9427])}
            disabled={waypoints.some(w => w.type === 'end')}
            className="text-red-400 border-red-500 hover:bg-red-500/20"
          >
            <Target className="w-4 h-4 mr-1" />
            Fim
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Clique no mapa após selecionar o tipo de ponto
        </p>
      </Card>

      {/* Waypoints List */}
      {waypoints.length > 0 && (
        <Card className="amoled-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Route className="w-4 h-4 text-accent" />
              Pontos da Rota ({waypoints.length})
            </h3>
            <Badge variant="outline" className="text-accent border-accent">
              {calculateDistance().toFixed(1)} km
            </Badge>
          </div>

          <Reorder.Group
            axis="y"
            values={sortedWaypoints}
            onReorder={onWaypointsChange}
            className="space-y-3"
          >
            <AnimatePresence>
              {sortedWaypoints.map((waypoint, index) => {
                const { icon: IconComponent, color, bg } = getWaypointIcon(waypoint.type);
                const isExpanded = expandedPoint === waypoint.id;

                return (
                  <Reorder.Item
                    key={waypoint.id}
                    value={waypoint}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`border rounded-lg p-4 ${
                        waypoint.type === 'start' ? 'border-green-500/50 bg-green-500/5' :
                        waypoint.type === 'end' ? 'border-red-500/50 bg-red-500/5' :
                        'border-blue-500/50 bg-blue-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        
                        <div className={`p-2 rounded-lg ${bg}`}>
                          <IconComponent className={`w-4 h-4 ${color}`} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Input
                              value={waypoint.name}
                              onChange={(e) => updateWaypoint(waypoint.id, { name: e.target.value })}
                              className="border-none bg-transparent p-0 font-medium text-foreground"
                              placeholder="Nome do ponto..."
                            />
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${color}`}>
                                {index + 1}°
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedPoint(isExpanded ? null : waypoint.id)}
                                className="p-1 h-auto"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeWaypoint(waypoint.id)}
                                className="p-1 h-auto text-destructive hover:text-destructive-foreground hover:bg-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pl-11"
                          >
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-muted-foreground">Descrição</label>
                                <Input
                                  value={waypoint.description || ''}
                                  onChange={(e) => updateWaypoint(waypoint.id, { description: e.target.value })}
                                  placeholder="Adicione uma descrição..."
                                  className="cyberpunk-input mt-1"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Coordenadas:</span>
                                  <div className="text-foreground font-mono">
                                    {waypoint.coordinates[1].toFixed(6)}, {waypoint.coordinates[0].toFixed(6)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Tipo:</span>
                                  <div className={`capitalize ${color}`}>
                                    {waypoint.type === 'start' ? 'Partida' :
                                     waypoint.type === 'end' ? 'Destino' : 'Parada'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        </Card>
      )}

      {/* Route Stats */}
      {waypoints.length >= 2 && (
        <Card className="amoled-card p-4">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Estatísticas da Rota
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{waypoints.length}</div>
              <div className="text-xs text-muted-foreground">Pontos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{calculateDistance().toFixed(1)} km</div>
              <div className="text-xs text-muted-foreground">Distância Total</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Badge className="gradient-neon text-black font-bold">
              Tempo estimado: {Math.ceil(calculateDistance() / 4)} - {Math.ceil(calculateDistance() / 2)} horas
            </Badge>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {waypoints.length === 0 && (
        <Card className="amoled-card p-6 text-center">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-accent text-glow mb-4"
          >
            <MapPin className="w-12 h-12 mx-auto" />
          </motion.div>
          <h3 className="font-bold text-foreground mb-2">Comece sua rota</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use a busca acima ou clique no mapa para adicionar pontos à sua rota
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="text-green-400 border-green-500">
              1. Ponto de partida
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-500">
              2. Paradas (opcional)
            </Badge>
            <Badge variant="outline" className="text-red-400 border-red-500">
              3. Destino final
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RoutePointsBuilder;
