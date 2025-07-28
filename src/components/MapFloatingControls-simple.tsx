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
        className="fixed top-20 left-4 z-40"
      >
        <Button
          onClick={() => setShowControls(true)}
          className="rounded-full w-10 h-10 bg-black border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-400 hover:text-cyan-300 shadow-2xl"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      {/* Main Controls */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-20 left-4 z-40 w-80"
      >
        <Card className="p-3 bg-black border border-cyan-500/20 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-cyan-400">
              Controles
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(false)}
              className="h-8 w-8 p-0 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 mb-3 bg-black border border-cyan-500/20">
              <TabsTrigger value="gps" className="text-sm py-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 text-gray-400">
                <LocateFixed className="w-4 h-4 mr-2" />
                GPS
              </TabsTrigger>
              <TabsTrigger value="style" className="text-sm py-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 text-gray-400">
                <Map className="w-4 h-4 mr-2" />
                Estilo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gps" className="mt-0 space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={isTrackingUser ? onStopTracking : onStartTracking}
                  variant={isTrackingUser ? "destructive" : "default"}
                  size="sm"
                  className={`flex-1 text-sm py-2 ${
                    isTrackingUser 
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  <LocateFixed className="w-4 h-4 mr-2" />
                  {isTrackingUser ? 'Parar' : 'GPS'}
                </Button>

                <Button
                  onClick={onToggleTrails}
                  variant="outline"
                  size="sm"
                  className={`flex-1 text-sm py-2 ${
                    showTrails 
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                      : 'bg-black hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  <Route className="w-4 h-4 mr-2" />
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
                  className="w-full text-sm py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30 disabled:opacity-50"
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  {isGettingLocation ? 'Localizando...' : 'Onde Estou?'}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="style" className="mt-0">
              <div className="space-y-2">
                {Object.entries(mapStyles).map(([key, style]) => {
                  const IconComponent = style.icon;
                  const isActive = currentStyle === key;

                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => onStyleChange(key)}
                      className={`w-full justify-start text-left h-auto p-3 text-sm ${
                        isActive ?
                          'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold' :
                          'bg-black hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-300 border-cyan-500/20'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-3" />
                      <span className="font-medium">{style.name}</span>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>

      {/* Progress Stats - Bottom Left */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 left-4 z-40"
      >
        <Card className="px-4 py-2 bg-black border border-cyan-500/20 shadow-2xl">
          <div className="flex items-center gap-4 text-sm">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center cursor-pointer"
            >
              <div className="text-cyan-400 font-bold text-lg">
                {searchResults}
              </div>
              <div className="text-gray-500 text-xs">Visíveis</div>
            </motion.div>
            
            <div className="w-px h-6 bg-cyan-500/20" />
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center cursor-pointer"
            >
              <div className="text-cyan-400 font-bold text-lg">
                {visitedCount}
              </div>
              <div className="text-gray-500 text-xs">Visitados</div>
            </motion.div>
            
            <div className="w-px h-6 bg-cyan-500/20" />
            
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center cursor-pointer"
            >
              <div className="text-cyan-400 font-bold text-lg">
                {totalProgress.toFixed(0)}%
              </div>
              <div className="text-gray-500 text-xs">Completo</div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

export default MapFloatingControls;
