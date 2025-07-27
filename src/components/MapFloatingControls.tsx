import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SpeedDial } from '@/components/ui/speed-dial';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { 
  Search, LocateFixed, Target, Eye, EyeOff, Maximize,
  Settings, Navigation, Menu
} from 'lucide-react';

interface MapStyle {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
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
  
  // GPS
  isTrackingUser: boolean;
  userLocation: [number, number] | null;
  userAccuracy: number | null;
  nearbyWaypoints: number;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onCenterOnUser: () => void;
  
  // UI State
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  
  // Progress
  visitedCount: number;
  totalProgress: number;
  
  // Mobile-specific
  isMobile?: boolean;
  onOpenBottomSheet?: () => void;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  currentStyle,
  mapStyles,
  onStyleChange,
  searchTerm,
  onSearchChange,
  searchResults,
  totalWaypoints,
  isTrackingUser,
  userLocation,
  userAccuracy,
  nearbyWaypoints,
  onStartTracking,
  onStopTracking,
  onCenterOnUser,
  isFullscreen,
  onToggleFullscreen,
  visitedCount,
  totalProgress,
  isMobile = false,
  onOpenBottomSheet
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showMapStyles, setShowMapStyles] = useState(false);

  // Speed Dial Actions for Mobile
  const mobileActions = [
    {
      icon: Search,
      label: 'Buscar',
      onClick: () => setShowSearch(!showSearch)
    },
    {
      icon: isTrackingUser ? Target : LocateFixed,
      label: isTrackingUser ? 'Centrar GPS' : 'Ativar GPS',
      onClick: isTrackingUser ? onCenterOnUser : onStartTracking
    },
    {
      icon: Settings,
      label: 'Configurações',
      onClick: () => setShowMapStyles(!showMapStyles)
    },
    {
      icon: Menu,
      label: 'Menu Completo',
      onClick: onOpenBottomSheet || (() => {})
    }
  ];

  // Desktop Actions
  const desktopActions = [
    {
      icon: Search,
      label: 'Buscar',
      onClick: () => setShowSearch(!showSearch)
    },
    {
      icon: isTrackingUser ? Target : LocateFixed,
      label: isTrackingUser ? 'Centrar GPS' : 'Ativar GPS',
      onClick: isTrackingUser ? onCenterOnUser : onStartTracking
    },
    {
      icon: Settings,
      label: 'Estilos do Mapa',
      onClick: () => setShowMapStyles(!showMapStyles)
    }
  ];

  const actions = isMobile ? mobileActions : desktopActions;

  if (!showControls) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 left-4 z-40"
      >
        <FloatingActionButton
          onClick={() => setShowControls(true)}
          tooltip="Mostrar Controles"
          aria-label="Mostrar controles do mapa"
        >
          <Eye className="w-5 h-5" />
        </FloatingActionButton>
      </motion.div>
    );
  }

  return (
    <>
      {/* Main Speed Dial - Primary Control */}
      <div className="fixed top-4 left-4 z-50">
        <SpeedDial
          actions={actions}
          direction="down"
          tooltipSide="right"
          buttonClassName="shadow-2xl"
        >
          <motion.div
            animate={{ rotate: showSearch || showMapStyles ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Navigation className="w-6 h-6" />
          </motion.div>
        </SpeedDial>
      </div>

      {/* Hide Controls Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-4 right-4 z-40"
      >
        <FloatingActionButton
          onClick={() => setShowControls(false)}
          variant="secondary"
          size="sm"
          tooltip="Ocultar Controles"
          aria-label="Ocultar controles do mapa"
        >
          <EyeOff className="w-4 h-4" />
        </FloatingActionButton>
      </motion.div>

      {/* Fullscreen Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-16 right-4 z-40"
      >
        <FloatingActionButton
          onClick={onToggleFullscreen}
          variant="accent"
          size="sm"
          tooltip={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
        >
          <Maximize className="w-4 h-4" />
        </FloatingActionButton>
      </motion.div>

      {/* GPS Stop Button - Only when tracking */}
      <AnimatePresence>
        {isTrackingUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed top-28 right-4 z-40"
          >
            <FloatingActionButton
              onClick={onStopTracking}
              variant="destructive"
              size="sm"
              tooltip="Parar GPS"
              badge="GPS"
              aria-label="Parar rastreamento GPS"
            >
              <Target className="w-4 h-4" />
            </FloatingActionButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Panel */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-20 left-4 w-80 z-40"
          >
            <Card className="amoled-card p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-primary text-glow">
                    Buscar Waypoints
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSearch(false)}
                    className="h-6 w-6 p-0"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar personagem, capítulo, local..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 cyberpunk-input"
                  />
                </div>
                
                {searchTerm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-muted-foreground"
                  >
                    {searchResults === 0 ? (
                      <span className="text-destructive">Nenhum resultado encontrado</span>
                    ) : (
                      <span>{searchResults} de {totalWaypoints} pontos encontrados</span>
                    )}
                  </motion.div>
                )}
                
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearchChange('')}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Limpar busca
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Styles Panel */}
      <AnimatePresence>
        {showMapStyles && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed top-20 left-4 w-80 z-40"
          >
            <Card className="amoled-card p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-primary text-glow">
                    Estilo do Mapa
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMapStyles(false)}
                    className="h-6 w-6 p-0"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(mapStyles).map(([key, style]) => {
                    const IconComponent = style.icon;
                    const isActive = currentStyle === key;
                    
                    return (
                      <Button
                        key={key}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => onStyleChange(key)}
                        className={`justify-start text-left h-auto p-3 ${
                          isActive ? 
                            (style.cyberpunk ? 'gradient-neon text-black font-bold' : 'bg-primary text-primary-foreground') : 
                            'hover:bg-muted/20'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mr-3" />
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs opacity-80">{style.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Status Card */}
      <AnimatePresence>
        {userLocation && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 z-40"
          >
            <Card className="amoled-card p-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full animate-ping"></div>
                </div>
                <div className="text-xs">
                  <div className="text-primary font-bold">GPS ATIVO</div>
                  <div className="text-muted-foreground">
                    {userAccuracy ? `±${Math.round(userAccuracy)}m` : 'Localizando...'}
                  </div>
                  {nearbyWaypoints > 0 && (
                    <div className="text-accent">
                      {nearbyWaypoints} próximo{nearbyWaypoints !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
