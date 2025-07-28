import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LocateFixed, EyeOff, Route, Map, Settings, Target, Loader2
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

  // Enhanced GPS
  onWhereAmI?: () => void;
  isGettingLocation?: boolean;
  
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
  onWhereAmI,
  isGettingLocation = false,
  visitedCount,
  totalProgress,
  showTrails = true,
  onToggleTrails = () => {}
}) => {
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState('gps');

  if (!showControls) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-20 left-2 z-40"
      >
        <Button
          onClick={() => setShowControls(true)}
          className="rounded-full w-8 h-8 shadow-xl gradient-neon text-black"
        >
          <Settings className="w-3 h-3" />
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
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-20 left-2 right-2 z-40"
      >
        <Card className="amoled-card p-2 w-full max-w-xs mx-auto backdrop-blur-xl bg-black/95 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-primary text-glow">
              Controles
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8 mb-2">
              <TabsTrigger value="gps" className="text-xs py-1">
                <LocateFixed className="w-3 h-3 mr-1" />
                GPS
              </TabsTrigger>
              <TabsTrigger value="style" className="text-xs py-1">
                <Map className="w-3 h-3 mr-1" />
                Estilo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gps" className="mt-0 space-y-2">
              <div className="flex gap-1">
                <Button
                  onClick={isTrackingUser ? onStopTracking : onStartTracking}
                  variant={isTrackingUser ? "destructive" : "default"}
                  size="sm"
                  className="flex-1 text-xs py-1"
                >
                  <LocateFixed className="w-3 h-3 mr-1" />
                  {isTrackingUser ? 'Parar' : 'GPS'}
                </Button>

                <Button
                  onClick={onToggleTrails}
                  variant={showTrails ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 text-xs py-1 ${
                    showTrails ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                  }`}
                >
                  <Route className="w-3 h-3 mr-1" />
                  {showTrails ? 'Ocultar' : 'Trilhas'}
                </Button>
              </div>

              {/* Enhanced "Where Am I" Button */}
              {onWhereAmI && (
                <Button
                  onClick={onWhereAmI}
                  disabled={isGettingLocation}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Target className="w-3 h-3 mr-1" />
                  )}
                  {isGettingLocation ? 'Localizando...' : 'Onde Estou?'}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="style" className="mt-0">
              <div className="space-y-1">
                {Object.entries(mapStyles).map(([key, style]) => {
                  const IconComponent = style.icon;
                  const isActive = currentStyle === key;

                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onStyleChange(key)}
                      className={`w-full justify-start text-left h-auto p-1 text-xs ${
                        isActive ?
                          (style.cyberpunk ? 'gradient-neon text-black font-bold' : 'bg-primary text-primary-foreground') :
                          'hover:bg-muted/20'
                      }`}
                    >
                      <IconComponent className="w-3 h-3 mr-1" />
                      <span className="font-medium">{style.name}</span>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>

      {/* Progress Stats - Bottom Center */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40"
      >
        <Card className="amoled-card px-3 py-1 backdrop-blur-xl bg-black/95 border border-cyan-500/20">
          <div className="flex items-center gap-3 text-xs">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center cursor-pointer"
            >
              <div className="text-primary text-glow font-bold">
                {searchResults}
              </div>
              <div className="text-muted-foreground text-xs">Visíveis</div>
            </motion.div>
            
            <div className="w-px h-4 bg-border" />
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center cursor-pointer"
            >
              <div className="text-accent text-glow font-bold">
                {visitedCount}
              </div>
              <div className="text-muted-foreground text-xs">Visitados</div>
            </motion.div>
            
            <div className="w-px h-4 bg-border" />
            
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
