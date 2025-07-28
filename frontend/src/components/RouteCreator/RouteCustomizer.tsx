import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { 
  Edit3, 
  Hash, 
  Globe, 
  Clock, 
  TrendingUp, 
  Users, 
  Star,
  Plus,
  X,
  Palette,
  Settings
} from 'lucide-react';
import { RouteData } from './index';

interface RouteCustomizerProps {
  routeData: RouteData;
  onUpdate: (updates: Partial<RouteData>) => void;
}

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Fácil', color: 'text-green-400', description: 'Adequado para todos' },
  { id: 'medium', label: 'Médio', color: 'text-yellow-400', description: 'Alguma experiência necessária' },
  { id: 'hard', label: 'Difícil', color: 'text-red-400', description: 'Para aventureiros experientes' }
] as const;

const SUGGESTED_TAGS = [
  'Família', 'Aventura', 'Relaxante', 'Cultural', 'Histórico', 
  'Natureza', 'Fotografia', 'Gastronomia', 'Arte', 'Arquitetura',
  'Religioso', 'Meditação', 'Trilha', 'Urbano', 'Romântico'
];

const RouteCustomizer: React.FC<RouteCustomizerProps> = ({
  routeData,
  onUpdate
}) => {
  const [newTag, setNewTag] = useState('');

  const addTag = (tag: string) => {
    if (tag && !routeData.tags.includes(tag)) {
      onUpdate({ tags: [...routeData.tags, tag] });
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    onUpdate({ tags: routeData.tags.filter(tag => tag !== tagToRemove) });
  };

  const calculateEstimatedTime = React.useCallback(() => {
    // Base time calculation on distance and number of waypoints
    const baseTime = routeData.distance * 15; // 15 minutes per km
    const waypointTime = routeData.waypoints.length * 30; // 30 minutes per waypoint
    const difficultyMultiplier = routeData.difficulty === 'easy' ? 1 : 
                                routeData.difficulty === 'medium' ? 1.3 : 1.6;
    
    return Math.round((baseTime + waypointTime) * difficultyMultiplier);
  }, [routeData.distance, routeData.waypoints.length, routeData.difficulty]);

  React.useEffect(() => {
    const estimatedTime = calculateEstimatedTime();
    if (estimatedTime !== routeData.estimatedTime) {
      onUpdate({ estimatedTime });
    }
  }, [routeData.distance, routeData.waypoints.length, routeData.difficulty, calculateEstimatedTime, onUpdate, routeData.estimatedTime]);

  return (
    <div className="space-y-6">
      {/* Route Basic Info */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-accent" />
          Informações Básicas
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="routeName" className="text-foreground font-medium">
              Nome da Rota *
            </Label>
            <Input
              id="routeName"
              value={routeData.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Ex: Jornada pela Águas da Prata Histórica"
              className="cyberpunk-input mt-1"
            />
          </div>

          <div>
            <Label htmlFor="routeDescription" className="text-foreground font-medium">
              Descrição
            </Label>
            <Textarea
              id="routeDescription"
              value={routeData.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Descreva sua rota, o que os viajantes podem esperar, pontos de interesse..."
              className="cyberpunk-input mt-1 min-h-[100px]"
            />
          </div>
        </div>
      </Card>

      {/* Difficulty & Settings */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          Configurações da Rota
        </h3>

        <div className="space-y-4">
          {/* Difficulty */}
          <div>
            <Label className="text-foreground font-medium mb-3 block">
              Nível de Dificuldade
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  variant={routeData.difficulty === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdate({ difficulty: option.id })}
                  className={`p-3 h-auto flex-col ${
                    routeData.difficulty === option.id 
                      ? 'gradient-neon text-black font-bold' 
                      : `${option.color} border-current hover:bg-current/20`
                  }`}
                >
                  <span className="font-bold">{option.label}</span>
                  <span className="text-xs opacity-80">{option.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Public/Private */}
          <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400" />
              <div>
                <Label className="text-foreground font-medium">Rota Pública</Label>
                <p className="text-xs text-muted-foreground">
                  Permitir que outros usuários vejam e usem esta rota
                </p>
              </div>
            </div>
            <Switch
              checked={routeData.isPublic}
              onCheckedChange={(checked) => onUpdate({ isPublic: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Tags */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Hash className="w-4 h-4 text-accent" />
          Tags e Categorias
        </h3>

        {/* Current Tags */}
        {routeData.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {routeData.tags.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Badge className="bg-accent/20 text-accent border-accent flex items-center gap-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(tag)}
                      className="p-0 h-auto ml-1 hover:bg-transparent"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Tag */}
        <div className="mb-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Adicionar tag personalizada..."
              className="cyberpunk-input flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
            />
            <Button
              onClick={() => addTag(newTag)}
              disabled={!newTag.trim() || routeData.tags.includes(newTag)}
              className="neon-glow"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Suggested Tags */}
        <div>
          <Label className="text-foreground font-medium mb-2 block">
            Tags Sugeridas
          </Label>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.filter(tag => !routeData.tags.includes(tag)).map((tag) => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                onClick={() => addTag(tag)}
                className="text-xs border-muted-foreground text-muted-foreground hover:border-accent hover:text-accent"
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Route Summary */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          Resumo da Rota
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary/10 border border-primary/30 rounded">
            <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-lg font-bold text-foreground">
              {Math.floor(routeData.estimatedTime / 60)}h {routeData.estimatedTime % 60}min
            </div>
            <div className="text-xs text-muted-foreground">Tempo Estimado</div>
          </div>

          <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded">
            <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-foreground capitalize">
              {routeData.difficulty === 'easy' ? 'Todos' : 
               routeData.difficulty === 'medium' ? 'Intermediário' : 'Avançado'}
            </div>
            <div className="text-xs text-muted-foreground">Público Alvo</div>
          </div>

          <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded">
            <Settings className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-foreground">
              {routeData.waypoints.length}
            </div>
            <div className="text-xs text-muted-foreground">Pontos de Interesse</div>
          </div>

          <div className="text-center p-3 bg-purple-500/10 border border-purple-500/30 rounded">
            <Palette className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-foreground capitalize">
              {routeData.type === 'spiritual' ? 'Espiritual' :
               routeData.type === 'urban' ? 'Urbana' : 'Natural'}
            </div>
            <div className="text-xs text-muted-foreground">Tipo de Rota</div>
          </div>
        </div>

        {/* Route Stats */}
        <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded text-center">
          <div className="text-sm text-muted-foreground mb-1">Distância Total</div>
          <div className="text-2xl font-bold text-accent">
            {routeData.distance.toFixed(1)} km
          </div>
        </div>
      </Card>

      {/* Validation Status */}
      <Card className="amoled-card p-4">
        <h3 className="font-bold text-foreground mb-3">Status de Validação</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {routeData.name.trim() ? (
              <Badge className="bg-green-500/20 text-green-400">✓ Nome definido</Badge>
            ) : (
              <Badge variant="outline" className="text-red-400 border-red-500">✗ Nome obrigatório</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {routeData.waypoints.length >= 2 ? (
              <Badge className="bg-green-500/20 text-green-400">✓ Pontos suficientes</Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-400 border-yellow-500">
                ⚠ Mínimo 2 pontos
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {routeData.description.trim() ? (
              <Badge className="bg-green-500/20 text-green-400">✓ Descrição adicionada</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-muted-foreground">
                Descrição (opcional)
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RouteCustomizer;
