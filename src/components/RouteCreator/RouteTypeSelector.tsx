import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Building, 
  TreePine, 
  Sparkles, 
  Heart, 
  MapPin,
  Clock,
  Users
} from 'lucide-react';

export type RouteType = 'spiritual' | 'urban' | 'natural';

interface RouteTypeOption {
  id: RouteType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  benefits: string[];
  examples: string[];
}

const ROUTE_TYPES: RouteTypeOption[] = [
  {
    id: 'spiritual',
    title: 'Jornada Espiritual',
    description: 'Rotas focadas em autoconhecimento, meditação e conexão interior',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    benefits: ['Paz interior', 'Autoconhecimento', 'Conexão espiritual'],
    examples: ['Templos sagrados', 'Pontos de energia', 'Locais de meditação']
  },
  {
    id: 'urban',
    title: 'Exploração Urbana',
    description: 'Descoberta de culturas, arquitetura e vida urbana vibrante',
    icon: Building,
    color: 'from-blue-500 to-cyan-500',
    benefits: ['Cultura diversa', 'Arte urbana', 'Vida noturna'],
    examples: ['Centros históricos', 'Murais de arte', 'Mercados locais']
  },
  {
    id: 'natural',
    title: 'Natureza Selvagem',
    description: 'Imersão na natureza, trilhas e conexão com o mundo natural',
    icon: TreePine,
    color: 'from-green-500 to-emerald-500',
    benefits: ['Ar puro', 'Exercício físico', 'Conexão natural'],
    examples: ['Trilhas na mata', 'Cachoeiras', 'Mirantes naturais']
  }
];

interface RouteTypeSelectorProps {
  selectedType: RouteType;
  onTypeSelect: (type: RouteType) => void;
}

const RouteTypeSelector: React.FC<RouteTypeSelectorProps> = ({
  selectedType,
  onTypeSelect
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Zap className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Que tipo de jornada você quer criar?
        </h3>
        <p className="text-sm text-muted-foreground">
          Escolha o estilo que melhor representa sua experiência ideal
        </p>
      </div>

      <div className="space-y-4">
        {ROUTE_TYPES.map((type, index) => {
          const isSelected = selectedType === type.id;
          const IconComponent = type.icon;

          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'border-accent border-2 bg-accent/10 shadow-lg'
                    : 'border-border hover:border-accent/50 hover:shadow-md'
                }`}
                onClick={() => onTypeSelect(type.id)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      className={`p-3 rounded-lg bg-gradient-to-br ${type.color} flex-shrink-0`}
                      animate={{
                        scale: isSelected ? 1.1 : 1,
                        boxShadow: isSelected ? '0 0 20px rgba(0, 255, 255, 0.3)' : '0 0 0px transparent'
                      }}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold text-lg ${
                          isSelected ? 'text-accent' : 'text-foreground'
                        }`}>
                          {type.title}
                        </h4>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Badge className="gradient-neon text-black font-bold">
                              Selecionado
                            </Badge>
                          </motion.div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm mb-4">
                        {type.description}
                      </p>

                      {/* Benefits */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-foreground">Benefícios:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {type.benefits.map((benefit) => (
                            <Badge key={benefit} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Examples */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-foreground">Exemplos:</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {type.examples.join(' • ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Type Info */}
      {selectedType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="amoled-card p-4 border-accent/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-green-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h5 className="font-bold text-accent text-sm">Tipo Selecionado</h5>
                <p className="text-xs text-muted-foreground">
                  {ROUTE_TYPES.find(t => t.id === selectedType)?.title}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <Card className="amoled-card p-3 text-center">
          <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
          <div className="text-xs text-muted-foreground">Tempo médio</div>
          <div className="text-sm font-bold text-foreground">2-4h</div>
        </Card>
        <Card className="amoled-card p-3 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xs text-muted-foreground">Ideal para</div>
          <div className="text-sm font-bold text-foreground">Todos</div>
        </Card>
        <Card className="amoled-card p-3 text-center">
          <MapPin className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-xs text-muted-foreground">Pontos</div>
          <div className="text-sm font-bold text-foreground">3-8</div>
        </Card>
      </div>
    </div>
  );
};

export default RouteTypeSelector;
