import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Eye, Info, Download, Star, Book, MapPin, ArrowUp, BarChart3, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSutraData } from '@/hooks/useSutraData';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { CombinedSutraEntry } from '@/types/sutra';
import { useLanguage } from '@/hooks/useLanguage';
import '../styles/gallery-animations.css';

// Interface for enhanced model data
interface EnhancedModel {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  fullDescription: string;
  teaching: string;
  chapter: number;
  modelUrl: string;
  thumbnailUrl: string;
  tags: string[];
  rarity: string; // Now uses actual occupation/character type
  downloads: number;
  rating: string;
  occupation: string;
  meaning: string;
  location: string;
  chapterSummary: string;
  capUrl: string;
  qrCodeUrl: string;
  isAvailable: boolean;
}

// Model availability detection with caching
const modelCache = new Map<number, boolean>();

const checkModelExists = async (modelId: number): Promise<boolean> => {
  // Check cache first
  if (modelCache.has(modelId)) {
    return modelCache.get(modelId)!;
  }

  try {
    const response = await fetch(`/modelo${modelId}.glb`, {
      method: 'HEAD',
      cache: 'force-cache' // Use browser cache
    });
    const exists = response.ok;
    modelCache.set(modelId, exists); // Cache result
    return exists;
  } catch {
    modelCache.set(modelId, false);
    return false;
  }
};

const Gallery = () => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<CombinedSutraEntry | null>(null);
  const [models, setModels] = useState<EnhancedModel[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<number[]>([]);
  const [statsData, setStatsData] = useState({
    total: 56,
    available: 0,
    completionRate: 0
  });

  // Load CSV data
  const { getCombinedData, loading: dataLoading, error: dataError } = useSutraData();

  // Detect available models
  useEffect(() => {
    const detectModels = async () => {
      console.log('🔍 Detecting available models...');
      const detected: number[] = [];

      // Check models in batches for better performance
      const batchSize = 10;
      for (let i = 1; i <= 56; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, 57); j++) {
          batch.push(
            checkModelExists(j).then(exists => {
              if (exists) {
                detected.push(j);
                console.log(`✅ Model ${j} found`);
              }
              return { id: j, exists };
            })
          );
        }
        await Promise.all(batch);
      }

      detected.sort((a, b) => a - b);
      setAvailableModels(detected);

      // Update stats
      const completionRate = Math.round((detected.length / 56) * 100) || 0;
      setStatsData({
        total: 56,
        available: detected.length || 0,
        completionRate: isNaN(completionRate) ? 0 : completionRate
      });

      console.log(`📊 Total models found: ${detected.length}/56 (${completionRate}%)`);
    };

    detectModels();
  }, []);

  // Generate enhanced models from CSV data
  useEffect(() => {
    if (!dataLoading && !dataError) {
      const sutraData = getCombinedData(language);
      const generatedModels: EnhancedModel[] = sutraData.map((entry) => {
        const isAvailable = availableModels.includes(entry.chapter);

        // Use language-appropriate fields
        const title = language === 'pt' ? entry.nome : entry.name;
        const occupation = language === 'pt' ? entry.ocupacao : entry.occupation;
        const meaning = language === 'pt' ? entry.significado : entry.meaning;
        const location = language === 'pt' ? entry.local : entry.location;
        const description = language === 'pt' ? entry.descPersonagem : entry.characterDesc;
        const teaching = language === 'pt' ? entry.ensinamento : entry.teaching;
        const chapterSummary = language === 'pt' ? entry.resumoCap : entry.chapterSummary;

        return {
          id: entry.chapter,
          title,
          subtitle: `${t('common.chapter')} ${entry.chapter}`,
          description: description || teaching.substring(0, 150) + '...',
          fullDescription: description,
          teaching,
          chapter: entry.chapter,
          modelUrl: `/modelo${entry.chapter}.glb`,
          thumbnailUrl: `https://via.placeholder.com/300x200/000011/00ffff?text=${encodeURIComponent(title.substring(0, 15))}`,
          tags: [
            occupation || (language === 'pt' ? 'Místico' : 'Mystic'),
            language === 'pt' ? 'Budista' : 'Buddhist',
            '3D',
            'AR',
            location ? (language === 'pt' ? 'Localizado' : 'Located') : (language === 'pt' ? 'Espiritual' : 'Spiritual'),
            isAvailable ? (language === 'pt' ? 'Kalyanamitra' : 'Kalyanamitra') : (language === 'pt' ? 'Kalyanamitra' : 'Kalyanamitra')
          ].filter(Boolean),
          rarity: occupation || (language === 'pt' ? 'Místico' : 'Mystic'),
          downloads: Math.floor(Math.random() * 10000) + entry.chapter * 100,
          rating: (4 + Math.random()).toFixed(1),
          occupation,
          meaning,
          location,
          chapterSummary,
          capUrl: entry.capUrl,
          qrCodeUrl: entry.qrCodeUrl,
          isAvailable
        };
      });

      setModels(generatedModels);
    }
  }, [dataLoading, dataError, getCombinedData, availableModels, language, t]);

  // Optimized filtering with useMemo
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = model.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.chapter.toString().includes(searchTerm);

      let matchesFilter = true;
      switch (selectedFilter) {
        case 'available':
          matchesFilter = model.isAvailable;
          break;
        case 'unavailable':
          matchesFilter = !model.isAvailable;
          break;
        case 'bodhisattvas':
          matchesFilter = model.occupation.toLowerCase().includes('bodhisattva');
          break;
        case 'monks':
          matchesFilter = model.occupation.toLowerCase().includes('monk') || model.occupation.toLowerCase().includes('monge');
          break;
        case 'deities':
          matchesFilter = model.occupation.toLowerCase().includes('god') || model.occupation.toLowerCase().includes('deus') ||
                         model.occupation.toLowerCase().includes('deity') || model.occupation.toLowerCase().includes('divindade');
          break;
        case 'teachers':
          matchesFilter = model.occupation.toLowerCase().includes('teacher') || model.occupation.toLowerCase().includes('professor') ||
                         model.occupation.toLowerCase().includes('grammarian') || model.occupation.toLowerCase().includes('gramático');
          break;
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [models, searchTerm, selectedFilter]);

  const getRarityColor = useCallback((rarity: string) => {
    const lowerRarity = rarity.toLowerCase();
    if (lowerRarity.includes('bodhisattva')) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    if (lowerRarity.includes('buddha')) return 'bg-gradient-to-r from-purple-400 to-pink-500';
    if (lowerRarity.includes('god') || lowerRarity.includes('deus') || lowerRarity.includes('deity') || lowerRarity.includes('divindade'))
      return 'bg-gradient-to-r from-indigo-400 to-purple-500';
    if (lowerRarity.includes('monk') || lowerRarity.includes('monge')) return 'bg-gradient-to-r from-green-400 to-teal-500';
    if (lowerRarity.includes('teacher') || lowerRarity.includes('professor') || lowerRarity.includes('grammarian'))
      return 'bg-gradient-to-r from-orange-400 to-red-500';
    return 'bg-gradient-to-r from-blue-400 to-cyan-500';
  }, []);

  const openModelViewer = useCallback((model: EnhancedModel) => {
    // Open AR page with the specific model
    window.open(`/ar?model=${model.chapter}`, '_blank');
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const shareGallery = () => {
    if (navigator.share) {
      navigator.share({
        title: t('gallery.shareTitle'),
        text: t('gallery.shareText'),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] bg-black sacred-pattern overflow-x-hidden relative">
      {/* Enhanced Sacred geometry background with floating elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/50 to-black">
        {/* Main energy orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-yellow-500/4 rounded-full blur-2xl animate-pulse delay-1000"></div>

        {/* Enhanced Buddhist Sacred Symbols */}
        <motion.div
          animate={{
            y: [0, -25, 0],
            rotate: [0, 360],
            opacity: [0.08, 0.2, 0.08]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-20 text-yellow-400/15 text-7xl"
        >
          ☸
        </motion.div>

        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, -360],
            opacity: [0.08, 0.18, 0.08]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-20 right-24 text-orange-400/15 text-6xl"
        >
          ☸
        </motion.div>

        <motion.div
          animate={{
            x: [0, 15, 0],
            y: [0, -15, 0],
            opacity: [0.08, 0.15, 0.08]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 10 }}
          className="absolute top-1/3 right-16 text-red-400/15 text-5xl"
        >
          ☸
        </motion.div>

        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
            opacity: [0.08, 0.2, 0.08]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 15 }}
          className="absolute bottom-1/3 left-16 text-cyan-400/15 text-5xl"
        >
          🕉
        </motion.div>

        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 360],
            opacity: [0.08, 0.15, 0.08]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 8 }}
          className="absolute top-2/3 left-1/3 text-purple-400/15 text-4xl"
        >
          💎
        </motion.div>
      </div>
      {/* Enhanced Header with Statistics */}
      <div className="bg-black/90 border-b border-cyan-500/20 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Navigation Bar */}


          {/* Enhanced Hero Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-3 mb-4">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="text-5xl text-yellow-400"
                >
                  ☸
                </motion.div>
                <motion.h2
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text"
                >
                  {t('gallery.title')}
                </motion.h2>
                <motion.div
                  animate={{
                    rotate: -360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="text-4xl text-red-400"
                >
                  ☸
                </motion.div>
              </div>
            </motion.div>

            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-6 md:mb-8 leading-relaxed px-4"
            >
              {t('gallery.subtitle')}
            </motion.p>

            {/* Sacred divider */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent max-w-md mx-auto mb-8"
            />

            {/* Quick Stats */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-8"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{Number.isInteger(statsData.total) ? statsData.total : 0}</div>
                <div className="text-sm text-muted-foreground">{t('gallery.chapters')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-1">{Number.isInteger(statsData.available) ? statsData.available : 0}</div>
                <div className="text-sm text-muted-foreground">{t('gallery.availableModels')}</div>
              </div>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="max-w-md mx-auto mt-6"
            >
              <Progress value={Number.isFinite(statsData.completionRate) ? statsData.completionRate : 0} className="h-2" />
            </motion.div>
          </div>

          {dataLoading && (
            <div className="text-center text-accent">
              {t('common.loadingSacredData')}
            </div>
          )}
          {dataError && (
            <div className="text-center text-destructive">
              {t('common.error')}: {dataError}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Search and Filters */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 md:mb-8 space-y-4"
        >
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px] md:min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('gallery.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
                {searchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-accent">
                    {filteredModels.length} {t('gallery.results')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: `${t('gallery.all')} (${models.length})` },
                { key: 'available', label: `${t('gallery.availableFilter')} (${models.filter(m => m.isAvailable).length})` },
                { key: 'unavailable', label: t('gallery.comingSoon') },
                { key: 'bodhisattvas', label: t('gallery.bodhisattvas') },
                { key: 'monks', label: t('gallery.monks') },
                { key: 'deities', label: t('gallery.deities') },
                { key: 'teachers', label: t('gallery.teachers') }
              ].map(filter => (
                <Button
                  key={filter.key}
                  variant={selectedFilter === filter.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.key)}
                  className={selectedFilter === filter.key ? 'bg-primary text-primary-foreground' : 'border-border'}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredModels.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 ${!model.isAvailable ? 'opacity-60' : ''} relative cyberpunk-glow card-hover-glow`}>
                {/* Sacred Geometry Background */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-purple-900/50 to-cyan-900/30 overflow-hidden sacred-geometry-bg">
                  {/* Mandala Pattern */}
                  <div className="absolute inset-0 opacity-20 mandala-rotate">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <defs>
                        <pattern id={`mandala-${model.id}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                          <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.7"/>
                          <path d="M50,20 L60,40 L50,50 L40,40 Z" fill="currentColor" opacity="0.2"/>
                          <path d="M80,50 L60,60 L50,50 L60,40 Z" fill="currentColor" opacity="0.2"/>
                          <path d="M50,80 L40,60 L50,50 L60,60 Z" fill="currentColor" opacity="0.2"/>
                          <path d="M20,50 L40,40 L50,50 L40,60 Z" fill="currentColor" opacity="0.2"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#mandala-${model.id})`} className="text-cyan-400"/>
                    </svg>
                  </div>

                  {/* Infinity Symbol */}
                  <div className="absolute top-4 left-4 text-2xl text-cyan-400 infinity-glow">
                    ∞
                  </div>

                  {/* Sacred Geometry Lines */}
                  <div className="absolute inset-0 opacity-30 sacred-pulse">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <path d="M0,100 L200,100 M100,0 L100,200 M50,50 L150,150 M150,50 L50,150"
                            stroke="currentColor" strokeWidth="0.5" className="text-purple-400 energy-flow"/>
                    </svg>
                  </div>

                  {/* Chapter Number - Large Background */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl font-bold text-white/10 group-hover:text-white/20 transition-colors duration-300 sacred-pulse">
                      {model.chapter}
                    </div>
                  </div>

                  {/* Lotus Pattern Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent">
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="text-yellow-400/60 text-lg lotus-float">☸</div>
                    </div>
                  </div>

                  {model.isAvailable ? (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  ) : (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">⏳</div>
                        <div className="text-sm text-white/80">{t('gallery.inDevelopment')}</div>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${
                    model.isAvailable
                      ? 'bg-green-500/80 text-white border-green-400/50 shadow-lg shadow-green-500/25'
                      : 'bg-orange-500/80 text-white border-orange-400/50 shadow-lg shadow-orange-500/25'
                  }`}>
                    {model.isAvailable
                      ? t('gallery.availableBadge')
                      : t('gallery.comingSoonBadge')
                    }
                  </div>

                  {/* Character Type Badge */}
                  <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm border border-white/20 shadow-lg ${getRarityColor(model.rarity)}`}>
                    {model.rarity}
                  </div>

                  {/* Hover Actions */}
                  {model.isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex gap-3">
                        <Button
                          onClick={() => openModelViewer(model)}
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t('gallery.viewAR')}
                        </Button>
                        <Button
                          onClick={() => {
                            // Convert EnhancedModel to CombinedSutraEntry
                            const combinedEntry: CombinedSutraEntry = {
                              id: model.id.toString(),
                              chapter: model.chapter,
                              nome: model.title,
                              name: model.title,
                              ocupacao: model.occupation,
                              occupation: model.occupation,
                              significado: model.meaning,
                              meaning: model.meaning,
                              local: model.location,
                              location: model.location,
                              ensinamento: model.teaching,
                              teaching: model.teaching,
                              descPersonagem: model.description,
                              characterDesc: model.description,
                              resumoCap: model.chapterSummary,
                              chapterSummary: model.chapterSummary,
                              linkModel: model.modelUrl,
                              capUrl: model.capUrl,
                              qrCodeUrl: model.qrCodeUrl,
                            };
                            setSelectedModel(combinedEntry);
                            setDetailModalOpen(true);
                          }}
                          variant="outline"
                          className="border-white/30 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-all duration-300 hover:scale-105"
                          size="sm"
                        >
                          <Info className="w-4 h-4 mr-2" />
                          Info
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 bg-gradient-to-b from-card/95 to-card backdrop-blur-sm relative overflow-hidden">
                  {/* Holographic overlay */}
                  <div className="absolute inset-0 holographic-effect opacity-30"></div>
                  <div className="relative z-10">
                  {/* Title Section */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-foreground leading-tight flex-1 pr-2 sacred-text-glow">{model.title}</h3>
                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30 text-cyan-100 gradient-border">
                        {model.chapter}
                      </Badge>
                    </div>
                    <div className="h-px bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-transparent gradient-border"></div>
                  </div>

                  {/* Character Info Grid */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <Book className="w-4 h-4" />
                        <span className="font-medium">{t('common.occupation')}:</span>
                      </div>
                      <span className="text-foreground">{model.occupation}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 text-purple-400">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{t('common.location')}:</span>
                      </div>
                      <span className="text-foreground truncate">{model.location}</span>
                    </div>

                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-yellow-400 mb-1">
                        <span className="text-lg">☸</span>
                        <span className="font-medium">{t('common.meaning')}:</span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 pl-6">{model.meaning}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {model.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30 text-cyan-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs border-t border-border/50 pt-3">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{model.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Download className="w-3 h-3" />
                      <span>{model.downloads.toLocaleString()}</span>
                    </div>
                  </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Statistics Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <Card className="p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-6">{t('gallery.collectionStats')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">{statsData.available || 0}</div>
                <div className="text-muted-foreground">{t('gallery.availableModelsStats')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">{statsData.total || 0}</div>
                <div className="text-muted-foreground">{t('gallery.totalChapters')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">{statsData.completionRate || 0}%</div>
                <div className="text-muted-foreground">{t('gallery.completeness')}</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <Button
          onClick={scrollToTop}
          size="icon"
          className="rounded-full shadow-lg"
          title={t('gallery.backToTop')}
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => {
            const gridElement = document.querySelector('.grid') as HTMLElement;
            window.scrollTo({ top: gridElement?.offsetTop || 0, behavior: 'smooth' });
          }}
          size="icon"
          variant="outline"
          className="rounded-full shadow-lg"
          title={t('gallery.viewStats')}
        >
          <BarChart3 className="w-4 h-4" />
        </Button>
        <Button
          onClick={shareGallery}
          size="icon"
          variant="outline"
          className="rounded-full shadow-lg"
          title={t('gallery.shareGallery')}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        character={selectedModel}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedModel(null);
        }}
      />
    </div>
  );
};

export default Gallery;