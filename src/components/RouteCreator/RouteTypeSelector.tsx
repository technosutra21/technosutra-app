import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Flower2, Mountain, TreePine, Waves } from 'lucide-react';
import { TRAIL_TYPES, TrailType } from '@/types/route-creator';
import { useLanguage } from '@/hooks/useLanguage';

interface RouteTypeSelectorProps {
  onSelect: (type: TrailType) => void;
  selectedType: TrailType | null;
}

const ICONS: Record<TrailType, React.ElementType> = {
  meditation: Flower2,
  pilgrimage: Mountain,
  mindfulness: TreePine,
  zen: Waves,
};

export const RouteTypeSelector: React.FC<RouteTypeSelectorProps> = ({ onSelect, selectedType }) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          {t('routeCreator.title')}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-2">
          {t('routeCreator.subtitle')}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Object.values(TRAIL_TYPES).map((typeInfo) => {
          const Icon = ICONS[typeInfo.id as TrailType];
          const isSelected = selectedType === typeInfo.id;

          return (
            <motion.div
              key={typeInfo.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-xl overflow-hidden cursor-pointer shadow-lg border-2 transition-all duration-300 ${
                isSelected ? 'border-cyan-400 shadow-cyan-500/30' : 'border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => onSelect(typeInfo.id as TrailType)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${typeInfo.color} opacity-20 group-hover:opacity-30 transition-opacity`}
              />
              <div className="relative p-6 flex flex-col items-center justify-center h-full bg-slate-900/50 backdrop-blur-sm">
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 text-cyan-400"
                  >
                    <CheckCircle size={24} />
                  </motion.div>
                )}
                <div className={`p-4 rounded-full bg-gradient-to-br ${typeInfo.color} mb-4 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{t(typeInfo.name)}</h3>
                <p className="text-sm text-slate-300 text-center">{t(typeInfo.description)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
