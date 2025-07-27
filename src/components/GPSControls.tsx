import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Navigation, 
  Target, 
  MapPin, 
  Signal, 
  SignalHigh, 
  SignalLow, 
  SignalMedium,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Waypoint {
  id: number;
  title: string;
  distance: number;
}

interface GPSControlsProps {
  isTrackingUser: boolean;
  userLocation: [number, number] | null;
  userAccuracy: number | null;
  nearbyWaypoints: Waypoint[];
  visitedCount: number;
  totalProgress: number;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onCenterOnUser: () => void;
  onMarkVisited?: (waypointId: number) => void;
}

const GPSControls: React.FC<GPSControlsProps> = ({
  isTrackingUser,
  userLocation,
  userAccuracy,
  nearbyWaypoints,
  visitedCount,
  totalProgress,
  onStartTracking,
  onStopTracking,
  onCenterOnUser,
  onMarkVisited
}) => {
  const getAccuracyIcon = (accuracy: number | null) => {
    if (!accuracy) return <Signal className="w-4 h-4" />;
    if (accuracy <= 10) return <SignalHigh className="w-4 h-4 text-green-400" />;
    if (accuracy <= 30) return <SignalMedium className="w-4 h-4 text-yellow-400" />;
    return <SignalLow className="w-4 h-4 text-red-400" />;
  };

  const getAccuracyText = (accuracy: number | null) => {
    if (!accuracy) return "Sem GPS";
    return `±${Math.round(accuracy)}m`;
  };

  return (
    <div className="absolute bottom-20 right-4 space-y-3 z-10">
      {/* GPS Status Card */}
      <AnimatePresence>
        {isTrackingUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="min-w-[200px]"
          >
            <Card className="cyberpunk-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAccuracyIcon(userAccuracy)}
                  <span className="text-xs font-medium">GPS Status</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getAccuracyText(userAccuracy)}
                </Badge>
              </div>
              
              {userLocation && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Lat: {userLocation[1].toFixed(5)}</div>
                  <div>Lng: {userLocation[0].toFixed(5)}</div>
                </div>
              )}

              {/* Progress Info */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso:</span>
                  <span className="font-medium text-primary">
                    {visitedCount}/56 ({totalProgress.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>

              {/* Nearby Waypoints */}
              {nearbyWaypoints.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3 h-3 text-accent" />
                    <span className="text-xs font-medium">Pontos Próximos:</span>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {nearbyWaypoints.slice(0, 3).map((waypoint) => (
                      <div key={waypoint.id} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1 mr-2">
                          {waypoint.title}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            {Math.round(waypoint.distance)}m
                          </span>
                          {waypoint.distance <= 50 && onMarkVisited && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1 text-green-400 hover:text-green-300"
                              onClick={() => onMarkVisited(waypoint.id)}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Buttons */}
      <div className="space-y-2">
        <Button
          onClick={isTrackingUser ? onStopTracking : onStartTracking}
          variant={isTrackingUser ? "destructive" : "default"}
          size="sm"
          className={`w-full gap-2 ${
            isTrackingUser 
              ? 'animate-pulse bg-destructive hover:bg-destructive/90' 
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          <Navigation className="w-4 h-4" />
          {isTrackingUser ? 'Parar GPS' : 'Iniciar GPS'}
        </Button>
        
        {userLocation && (
          <Button 
            onClick={onCenterOnUser} 
            variant="outline" 
            size="sm"
            className="w-full gap-2 hover:bg-accent/20 border-accent/50"
          >
            <Target className="w-4 h-4" />
            Minha Localização
          </Button>
        )}
      </div>

      {/* Achievement Notification */}
      <AnimatePresence>
        {visitedCount > 0 && visitedCount % 10 === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute -top-16 right-0"
          >
            <Card className="cyberpunk-card p-3 bg-gradient-to-r from-accent/20 to-primary/20 border-accent">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent animate-pulse" />
                <span className="text-sm font-medium">
                  {visitedCount === 10 && "Explorador Desbloqueado!"}
                  {visitedCount === 28 && "Meio Caminho Alcançado!"}
                  {visitedCount === 56 && "Jornada Completa!"}
                </span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GPSControls;