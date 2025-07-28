import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Download, 
  Share2, 
  MapPin, 
  Clock, 
  Route, 
  Star,
  TrendingUp,
  Hash,
  Globe,
  Navigation,
  Target,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { RouteData } from './index';

interface RoutePreviewProps {
  routeData: RouteData;
  onSave: () => void;
  isCreating: boolean;
}

const RoutePreview: React.FC<RoutePreviewProps> = ({
  routeData,
  onSave,
  isCreating
}) => {
  const exportRoute = () => {
    const dataStr = JSON.stringify(routeData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${routeData.name.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const shareRoute = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: routeData.name,
          text: routeData.description,
          url: window.location.href
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(routeData, null, 2));
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  return (
    <div className="space-y-6">
      {/* Route Header */}
      <Card className="amoled-card p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-accent text-glow mb-2">
            {routeData.name || 'Nova Rota'}
          </h2>
          <p className="text-muted-foreground">
            {routeData.description || 'Rota personalizada criada no TECHNO SUTRA Way'}
          </p>
        </motion.div>
      </Card>

      {/* Route Stats Overview */}
      <Card className="amoled-card p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          Visão Geral
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <Route className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-xl font-bold text-foreground">{routeData.distance.toFixed(1)} km</div>
            <div className="text-xs text-muted-foreground">Distância</div>
          </div>

          <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Clock className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-foreground">{formatTime(routeData.estimatedTime)}</div>
            <div className="text-xs text-muted-foreground">Duração</div>
          </div>

          <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <MapPin className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-foreground">{routeData.waypoints.length}</div>
            <div className="text-xs text-muted-foreground">Pontos</div>
          </div>

          <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-foreground capitalize">
              {routeData.difficulty === 'easy' ? 'Fácil' : 
               routeData.difficulty === 'medium' ? 'Médio' : 'Difícil'}
            </div>
            <div className="text-xs text-muted-foreground">Dificuldade</div>
          </div>
        </div>
      </Card>

      {/* Route Type & Visibility */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-3">Configurações</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge className="gradient-neon text-black font-bold px-3 py-1">
              {routeData.type === 'spiritual' ? '✨ Espiritual' :
               routeData.type === 'urban' ? '🏙️ Urbana' : '🌿 Natural'}
            </Badge>
            <Badge variant={routeData.isPublic ? "default" : "outline"} className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {routeData.isPublic ? 'Pública' : 'Privada'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Waypoints List */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Route className="w-4 h-4 text-accent" />
          Pontos da Rota
        </h3>

        <div className="space-y-3">
          {routeData.waypoints
            .sort((a, b) => {
              const order = { start: 0, waypoint: 1, end: 2 };
              return order[a.type] - order[b.type];
            })
            .map((waypoint, index) => {
              const getIcon = (type: string) => {
                switch (type) {
                  case 'start': return { icon: Navigation, color: 'text-green-400', bg: 'bg-green-500/20' };
                  case 'end': return { icon: Target, color: 'text-red-400', bg: 'bg-red-500/20' };
                  default: return { icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-500/20' };
                }
              };

              const { icon: IconComponent, color, bg } = getIcon(waypoint.type);

              return (
                <motion.div
                  key={waypoint.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg"
                >
                  <div className={`p-2 rounded-lg ${bg}`}>
                    <IconComponent className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{waypoint.name}</div>
                    {waypoint.description && (
                      <div className="text-sm text-muted-foreground">{waypoint.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground font-mono">
                      {waypoint.coordinates[1].toFixed(6)}, {waypoint.coordinates[0].toFixed(6)}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${color}`}>
                    {index + 1}°
                  </Badge>
                </motion.div>
              );
            })}
        </div>
      </Card>

      {/* Tags */}
      {routeData.tags.length > 0 && (
        <Card className="amoled-card p-4">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-accent" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {routeData.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-accent border-accent">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Validation Check */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          Verificação Final
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nome da rota</span>
            <span className="text-green-400 font-medium">✓ Definido</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pontos mínimos (2)</span>
            <span className="text-green-400 font-medium">✓ {routeData.waypoints.length} pontos</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tipo selecionado</span>
            <span className="text-green-400 font-medium">✓ {routeData.type}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dificuldade definida</span>
            <span className="text-green-400 font-medium">✓ {routeData.difficulty}</span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-4">Ações</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={onSave}
            disabled={isCreating}
            className="gradient-neon text-black font-bold"
          >
            {isCreating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"
                />
                Criando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Salvar Rota
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={exportRoute}
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>

          <Button
            variant="outline"
            onClick={shareRoute}
            className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </Card>

      {/* Success Message */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Card className="amoled-card p-6 border-accent border-2">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-accent text-glow mb-2">
              Criando sua rota...
            </h3>
            <p className="text-muted-foreground">
              Processando dados e salvando no sistema TECHNO SUTRA Way
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default RoutePreview;
