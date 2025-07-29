import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Search,
  LocateFixed,
  Target,
  Route,
  Map,
  Loader2,
  Activity,
  X,
  ChevronUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface MapStyle {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  url: string;
  cyberpunk: boolean;
  description: string;
}

interface ModernMapControlsProps {
  // Map Controls
  currentStyle: string;
  mapStyles: Record<string, MapStyle>;
  onStyleChange: (style: string) => void;
  
  // Search
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchResults: number;
  totalWaypoints: number;
  
  // GPS
  isTrackingUser: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onWhereAmI?: () => void;
  isGettingLocation?: boolean;
  gpsAccuracy?: number | null;
  nearbyCharacters: string[];
  
  // Progress
  visitedCount: number;
  totalProgress: number;
  
  // Trail lines
  showTrails?: boolean;
  onToggleTrails?: () => void;
  
  // Status
  isOnline?: boolean;
}

const FAB_ITEMS = [
  { id: 'gps', icon: LocateFixed, label: 'GPS' },
  { id: 'style', icon: Map, label: 'Estilo' },
  { id: 'trails', icon: Route, label: 'Trilhas' },
  { id: 'locate', icon: Target, label: 'Localizar' }
];

export const ModernMapControls: React.FC<ModernMapControlsProps> = ({
  currentStyle,
  mapStyles,
  onStyleChange,
  searchTerm,
  onSearchChange,
  searchResults,
  totalWaypoints,
  isTrackingUser,
  onStartTracking,
  onStopTracking,
  onWhereAmI,
  isGettingLocation = false,
  gpsAccuracy,
  nearbyCharacters,
  visitedCount,
  totalProgress,
  showTrails = false,
  onToggleTrails,
  isOnline = true
}) => {
  const { t } = useLanguage();
  const [fabOpen, setFabOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const handleFabAction = (action: string) => {
    setFabOpen(false);
    
    switch (action) {
      case 'gps':
        if (isTrackingUser) {
          onStopTracking();
        } else {
          onStartTracking();
        }
        break;
      case 'style':
        setActiveModal('style');
        break;
      case 'trails':
        onToggleTrails?.();
        break;
      case 'locate':
        onWhereAmI?.();
        break;
    }
  };

  const _currentStyleConfig = mapStyles[currentStyle];

  return (
    <>
      {/* Bottom Stats Sheet */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: statsOpen ? 0 : 70 }}
        className="fixed bottom-0 left-0 right-0 z-40"
      >
        <Card className="mx-4 mb-4 bg-black/90 border-cyan-500/30 backdrop-blur-xl">
          <CardContent className="p-4">
            {/* Sheet Handle */}
            <motion.div
              className="flex justify-center mb-2 cursor-pointer"
              onClick={() => setStatsOpen(!statsOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: statsOpen ? 180 : 0 }}
                className="p-2 rounded-full bg-cyan-500/20 text-cyan-400"
              >
                <ChevronUp className="w-4 h-4" />
              </motion.div>
            </motion.div>

            {/* Quick Stats Row */}
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-cyan-500/20 border-cyan-500/50 text-cyan-100">
                  {visitedCount}/{totalWaypoints}
                </Badge>
                <div className="text-slate-300">
                  {Math.round(totalProgress)}% {t('common.complete')}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* GPS Status */}
                {isTrackingUser && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-1 text-green-400"
                  >
                    <Activity className="w-3 h-3" />
                    <span className="text-xs">
                      {gpsAccuracy ? `${Math.round(gpsAccuracy)}m` : 'GPS'}
                    </span>
                  </motion.div>
                )}

                {/* Network Status */}
                <div className={`flex items-center gap-1 ${isOnline ? 'text-green-400' : 'text-orange-400'}`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={totalProgress} className="h-2 mb-3" />

            {/* Expanded Stats */}
            <AnimatePresence>
              {statsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3"
                >
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder={t('map.searchWaypoints')}
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10 bg-slate-900/50 border-slate-600/50 text-slate-100"
                    />
                    {searchTerm && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-cyan-400">
                        {searchResults} / {totalWaypoints}
                      </div>
                    )}
                  </div>

                  {/* Nearby Characters */}
                  {nearbyCharacters.length > 0 && (
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-yellow-400 font-bold text-sm"
                      >
                        🎯 {nearbyCharacters.length} {t('map.nearbyCharacters')}
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAB Speed Dial */}
      <div className="fixed bottom-24 right-6 z-50">
        {/* Action Buttons */}
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex flex-col gap-3 mb-4"
            >
              {FAB_ITEMS.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    onClick={() => handleFabAction(item.id)}
                    size="icon"
                    className={`
                      rounded-full w-12 h-12 shadow-lg backdrop-blur-sm transition-all duration-300
                      ${item.id === 'gps' && isTrackingUser 
                        ? 'bg-green-500/90 hover:bg-green-400/90 text-white' 
                        : item.id === 'trails' && showTrails
                        ? 'bg-purple-500/90 hover:bg-purple-400/90 text-white'
                        : 'bg-black/70 hover:bg-black/90 text-cyan-400 border border-cyan-500/30'
                      }
                    `}
                    title={item.label}
                  >
                    {item.id === 'locate' && isGettingLocation ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <item.icon className="w-5 h-5" />
                    )}
                  </Button>
                  
                  {/* Label */}
                  <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={() => setFabOpen(!fabOpen)}
            size="icon"
            className="rounded-full w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-xl border-0"
          >
            <motion.div
              animate={{ rotate: fabOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {fabOpen ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Style Selection Modal */}
      <Dialog open={activeModal === 'style'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="bg-black/95 border-cyan-500/30 text-white max-w-md">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-cyan-400">{t('map.selectMapStyle')}</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(mapStyles).map(([key, style]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => {
                      onStyleChange(key);
                      setActiveModal(null);
                    }}
                    variant={currentStyle === key ? "default" : "outline"}
                    className={`
                      w-full h-20 flex flex-col gap-2 transition-all duration-300
                      ${currentStyle === key 
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0' 
                        : 'bg-slate-900/50 border-slate-600/50 hover:border-cyan-500/50 text-slate-300'
                      }
                    `}
                  >
                    <style.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{style.name}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModernMapControls;
