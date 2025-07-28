import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Navigation,
  MapPin,
  Target,
  Crosshair,
  EyeOff,
  Info
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { RouteWaypoint } from './index';

interface FloatingToolbarProps {
  selectedTool: RouteWaypoint['type'];
  onToolChange: (tool: RouteWaypoint['type']) => void;
  isInteractive: boolean;
  waypointCount: number;
  onFitToWaypoints: () => void;
  onToggleToolbar: () => void;
}

const getTools = (t: (key: string) => string) => [
  {
    id: 'start' as const,
    label: t('routeCreator.map.start'),
    icon: Navigation,
    color: 'bg-green-500 text-white',
    description: t('routeCreator.map.startDesc'),
    emoji: '🚀'
  },
  {
    id: 'end' as const,
    label: t('routeCreator.map.destination'),
    icon: Target,
    color: 'bg-red-500 text-white',
    description: t('routeCreator.map.destinationDesc'),
    emoji: '🎯'
  },
  {
    id: 'waypoint' as const,
    label: t('routeCreator.map.waypoint'),
    icon: MapPin,
    color: 'bg-blue-500 text-white',
    description: t('routeCreator.map.waypointDesc'),
    emoji: '📍'
  }
];

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  selectedTool,
  onToolChange,
  isInteractive,
  waypointCount,
  onFitToWaypoints,
  onToggleToolbar
}) => {
  const { t } = useLanguage();
  const TOOLS = getTools(t);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute top-4 left-4 z-30 space-y-3"
    >
      {/* Main Toolbar */}
      <Card className="amoled-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">{t('routeCreator.map.tools')}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleToolbar}
            className="p-1 h-auto text-muted-foreground hover:text-primary"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>

        {/* Tool Selection */}
        <div className="space-y-2">
          {TOOLS.map((tool) => {
            const isSelected = selectedTool === tool.id;
            const IconComponent = tool.icon;

            return (
              <motion.div
                key={tool.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToolChange(tool.id)}
                  disabled={!isInteractive}
                  className={`w-full justify-start h-auto p-3 ${
                    isSelected 
                      ? 'gradient-neon text-black font-bold' 
                      : isInteractive 
                        ? 'hover:bg-muted/20' 
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${isSelected ? 'bg-black/20' : tool.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{tool.emoji} {tool.label}</div>
                      <div className="text-xs opacity-80">{tool.description}</div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Status */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('routeCreator.map.interactiveMode')}:</span>
            <Badge className={isInteractive ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
              {isInteractive ? t('routeCreator.map.active') : t('routeCreator.map.inactive')}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Route Stats */}
      {waypointCount > 0 && (
        <Card className="amoled-card p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-bold text-foreground">{waypointCount} Pontos</div>
              <div className="text-xs text-muted-foreground">na rota atual</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onFitToWaypoints}
              className="p-2 border-accent text-accent hover:bg-accent/20"
            >
              <Crosshair className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {isInteractive && (
        <Card className="amoled-card p-3 border-accent/30">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <div className="font-medium text-accent mb-1">Como usar:</div>
              <div>1. Selecione uma ferramenta</div>
              <div>2. Clique no mapa</div>
              <div>3. Arraste para reordenar</div>
            </div>
          </div>
        </Card>
      )}

      {/* Current Tool Indicator */}
      {isInteractive && (
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Card className="amoled-card p-3 border-2 border-accent">
            <div className="text-center">
              <div className="text-lg mb-1">
                {TOOLS.find(t => t.id === selectedTool)?.emoji}
              </div>
              <div className="text-xs font-bold text-accent">
                {TOOLS.find(t => t.id === selectedTool)?.label.toUpperCase()}
              </div>
              <div className="text-xs text-muted-foreground">
                Selecionado
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FloatingToolbar;
