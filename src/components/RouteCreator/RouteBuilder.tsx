import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Trail, CharacterPoint } from '@/types/route-creator';
import { useLanguage } from '@/hooks/useLanguage';
import { useSutraData } from '@/hooks/useSutraData';
import { lineString as turfLineString } from '@turf/helpers';
import turfLength from '@turf/length';

interface RouteBuilderProps {
  trail: Trail;
  onUpdate: (details: Partial<Trail>) => void;
  onRemovePoint: (index: number) => void;
  onSave: () => void;
  onBack: () => void;
  isSaving: boolean;
}

export const RouteBuilder: React.FC<RouteBuilderProps> = ({
  trail,
  onUpdate,
  onRemovePoint,
  onSave,
  onBack,
  isSaving,
}) => {
  const { t } = useLanguage();
  const { characters } = useSutraData();

  const trailLength = useMemo(() => {
    if (trail.points.length < 2) return 0;
    const line = turfLineString(trail.points.map(p => p.coordinates));
    return turfLength(line, { units: 'kilometers' });
  }, [trail.points]);

  const handleCharacterSelect = (pointIndex: number, characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const newCharacterPoint: CharacterPoint = {
      id: `char-${pointIndex}-${Date.now()}`,
      pointId: trail.points[pointIndex].id,
      character,
    };
    
    onUpdate({ characters: [...(trail.characters || []), newCharacterPoint] });
  };
  
  const assignedCharacters = useMemo(() => {
    return new Set(trail.characters?.map(cp => cp.character.id));
  }, [trail.characters]);

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="p-4 h-full flex flex-col"
    >
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft />
        </Button>
        <h2 className="text-2xl font-bold text-white">{t('routeCreator.builder.title')}</h2>
      </div>

      <ScrollArea className="flex-grow pr-4">
        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>{t('routeCreator.builder.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder={t('routeCreator.builder.namePlaceholder')}
                value={trail.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Textarea
                placeholder={t('routeCreator.builder.descriptionPlaceholder')}
                value={trail.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={trail.difficulty}
                  onValueChange={(value) => onUpdate({ difficulty: value as 'easy' | 'medium' | 'hard' })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder={t('routeCreator.builder.difficultyPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{t('routeCreator.builder.difficulty.easy')}</SelectItem>
                    <SelectItem value="medium">{t('routeCreator.builder.difficulty.medium')}</SelectItem>
                    <SelectItem value="hard">{t('routeCreator.builder.difficulty.hard')}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder={t('routeCreator.builder.timePlaceholder')}
                  value={trail.estimatedTime}
                  onChange={(e) => onUpdate({ estimatedTime: parseInt(e.target.value, 10) })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>{t('routeCreator.builder.points')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                <span>{t('routeCreator.builder.totalPoints')}: {trail.points.length}</span>
                <span>{t('routeCreator.builder.totalLength')}: {trailLength.toFixed(2)} km</span>
              </div>
              <AnimatePresence>
                {trail.points.map((point, index) => (
                  <motion.div
                    key={point.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="text-cyan-400" />
                      <div>
                        <p className="font-semibold text-white">{point.name}</p>
                        <Select onValueChange={(charId) => handleCharacterSelect(index, charId)}>
                          <SelectTrigger className="text-xs h-7 mt-1 bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder={t('routeCreator.builder.assignCharacter')} />
                          </SelectTrigger>
                          <SelectContent>
                            {characters
                              .filter(c => !assignedCharacters.has(c.id))
                              .map(char => (
                                <SelectItem key={char.id} value={char.id}>
                                  {char.name.pt}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemovePoint(index)}>
                      <Trash2 className="text-red-500" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <Button onClick={onSave} disabled={isSaving || trail.points.length < 2} className="w-full">
          {isSaving ? t('routeCreator.builder.saving') : t('routeCreator.builder.save')}
          <Save className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}; 