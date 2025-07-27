import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  LocateFixed, Eye, EyeOff, Route
} from 'lucide-react';

interface MapStyle {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  url: string;
  cyberpunk: boolean;
  description: string;
}

interface MapFloatingControlsProps {
  // Map Controls
  currentStyle: string;
  mapStyles: Record<string, MapStyle>;
  onStyleChange: (style: string) => void;
  
  // Search
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchResults: number;
  totalWaypoints: number;
  
  // GPS (simplified)
  isTrackingUser: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  
  // Progress
  visitedCount: number;
  totalProgress: number;
  
  // Trail lines
  showTrails?: boolean;
  onToggleTrails?: () => void;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  currentStyle,
  mapStyles,
  onStyleChange,
  searchResults,
  isTrackingUser,
  onStartTracking,
  onStopTracking,
  visitedCount,
  totalProgress,
  showTrails = true,
  onToggleTrails = () => {}
}) => {
  const [showControls, setShowControls] = useState(true);

  if (!showControls) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 left-4 z-40"
      >
        <Button
          onClick={() => setShowControls(true)}
          className="rounded-full w-12 h-12 shadow-2xl gradient-neon text-black"
        >
          <Eye className="w-5 h-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      {/* Main Controls */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-4 z-40"
      >
        <Card className="amoled-card p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary text-glow">
              Controles
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(false)}
              className="h-8 w-8 p-0"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {/* GPS Control */}
            <div className="flex gap-2">
              <Button
                onClick={isTrackingUser ? onStopTracking : onStartTracking}
                variant={isTrackingUser ? "destructive" : "default"}
                size="sm"
                className="flex-1"
              >
                <LocateFixed className="w-4 h-4 mr-2" />
                {isTrackingUser ? 'Parar GPS' : 'Ativar GPS'}
              </Button>
              
              {/* Trail Toggle Button */}
              <Button
                onClick={onToggleTrails}
                variant={showTrails ? "default" : "outline"}
                size="sm"
                className={`flex-1 ${
                  showTrails ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                }`}
              >
                <Route className="w-4 h-4 mr-2" />
                {showTrails ? 'Ocultar Trilhas' : 'Mostrar Trilhas'}
              </Button>
            </div>

            {/* Map Styles */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Estilo do Mapa</p>
              <div className="grid grid-cols-1 gap-1">
                {Object.entries(mapStyles).map(([key, style]) => {
                  const IconComponent = style.icon;
                  const isActive = currentStyle === key;
                  
                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStyleChange(key)}
                      className={`justify-start text-left h-auto p-2 ${
                        isActive ? 
                          (style.cyberpunk ? 'gradient-neon text-black font-bold' : 'bg-primary text-primary-foreground') : 
                          'hover:bg-muted/20'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      <div>
                        <div className="font-medium text-xs">{style.name}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Progress Stats - Bottom Center */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40"
      >
        <Card className="amoled-card px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center cursor-pointer"
            >
              <div className="text-primary text-glow font-bold">
                {searchResults}
              </div>
              <div className="text-muted-foreground text-xs">Visíveis</div>
            </motion.div>
            
            <div className="w-px h-6 bg-border" />
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center cursor-pointer"
            >
              <div className="text-accent text-glow font-bold">
                {visitedCount}
              </div>
              <div className="text-muted-foreground text-xs">Visitados</div>
            </motion.div>
            
            <div className="w-px h-6 bg-border" />
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center cursor-pointer"
            >
              <div className="text-cyan-400 text-glow font-bold">
                {totalProgress.toFixed(0)}%
              </div>
              <div className="text-muted-foreground text-xs">Completo</div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

export default MapFloatingControls;
