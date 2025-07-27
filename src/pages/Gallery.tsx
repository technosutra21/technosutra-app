import React, { useState, useEffect } from 'react';
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
  rarity: 'common' | 'epic' | 'legendary';
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

// Model availability detection
const checkModelExists = async (modelId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/modelo${modelId}.glb`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

const Gallery = () => {
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
      const completionRate = Math.round((detected.length / 56) * 100);
      setStatsData({
        total: 56,
        available: detected.length,
        completionRate
      });

      console.log(`📊 Total models found: ${detected.length}/56 (${completionRate}%)`);
    };

    detectModels();
  }, []);

  // Generate enhanced models from CSV data
  useEffect(() => {
    if (!dataLoading && !dataError) {
      const sutraData = getCombinedData('pt');
      const generatedModels: EnhancedModel[] = sutraData.map((entry) => {
        const isAvailable = availableModels.includes(entry.chapter);

        return {
          id: entry.chapter,
          title: entry.nome,
          subtitle: `Capítulo ${entry.chapter}`,
          description: entry.descPersonagem || entry.ensinamento.substring(0, 150) + '...',
          fullDescription: entry.descPersonagem,
          teaching: entry.ensinamento,
          chapter: entry.chapter,
          modelUrl: `/modelo${entry.chapter}.glb`,
          thumbnailUrl: `https://via.placeholder.com/300x200/000011/00ffff?text=${encodeURIComponent(entry.nome.substring(0, 15))}`,
          tags: [
            entry.ocupacao || 'Místico',
            'Budista',
            '3D',
            'AR',
            entry.local ? 'Localizado' : 'Espiritual',
            isAvailable ? 'Disponível' : 'Em Breve'
          ].filter(Boolean),
          rarity: entry.chapter % 7 === 0 ? 'legendary' : entry.chapter % 3 === 0 ? 'epic' : 'common',
          downloads: Math.floor(Math.random() * 10000) + entry.chapter * 100,
          rating: (4 + Math.random()).toFixed(1),
          occupation: entry.ocupacao,
          meaning: entry.significado,
          location: entry.local,
          chapterSummary: entry.resumoCap,
          capUrl: entry.capUrl,
          qrCodeUrl: entry.qrCodeUrl,
          isAvailable
        };
      });

      setModels(generatedModels);
    }
  }, [dataLoading, dataError, getCombinedData, availableModels]);

  const filteredModels = models.filter(model => {
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
      case 'legendary':
        matchesFilter = model.rarity === 'legendary';
        break;
      case 'epic':
        matchesFilter = model.rarity === 'epic';
        break;
      case 'common':
        matchesFilter = model.rarity === 'common';
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      default: return 'bg-gradient-to-r from-blue-400 to-cyan-500';
    }
  };

  const openModelViewer = (model: EnhancedModel) => {
    // Open AR page with the specific model
    window.open(`/ar?model=${model.chapter}`, '_blank');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shareGallery = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Techno Sutra AR - Galeria',
        text: 'Explore os 56 capítulos do Avatamsaka Sutra em realidade aumentada',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with Statistics */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-xl">
                🏛️
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Techno Sutra AR</h1>
                <p className="text-sm text-muted-foreground">Galeria Avatamsaka Sutra</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span>📊</span>
                <span className="text-primary font-semibold">{statsData.available}</span>
                <span className="text-muted-foreground">disponíveis</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span className="text-primary font-semibold">{statsData.completionRate}%</span>
                <span className="text-muted-foreground">completo</span>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-8">
            <motion.h2
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-bold text-primary mb-4"
            >
              Galeria dos 56 Capítulos
            </motion.h2>
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6"
            >
              Explore os personagens sagrados através de modelos 3D interativos.
              Uma jornada visual pela sabedoria budista ancestral em realidade aumentada.
            </motion.p>

            {/* Quick Stats */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-8"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{statsData.total}</div>
                <div className="text-sm text-muted-foreground">Capítulos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-1">{statsData.available}</div>
                <div className="text-sm text-muted-foreground">Disponíveis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{statsData.completionRate}%</div>
                <div className="text-sm text-muted-foreground">Progresso</div>
              </div>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="max-w-md mx-auto mt-6"
            >
              <Progress value={statsData.completionRate} className="h-2" />
            </motion.div>
          </div>

          {dataLoading && (
            <div className="text-center text-accent">
              Carregando dados do Sutra...
            </div>
          )}
          {dataError && (
            <div className="text-center text-destructive">
              Erro ao carregar dados: {dataError}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="🔍 Buscar por nome, ocupação, local, significado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
                {searchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-accent">
                    {filteredModels.length} resultados
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: `Todos (${models.length})` },
                { key: 'available', label: `Disponíveis (${models.filter(m => m.isAvailable).length})` },
                { key: 'unavailable', label: 'Em Breve' },
                { key: 'bodhisattvas', label: 'Bodhisattvas' },
                { key: 'legendary', label: 'Lendários' },
                { key: 'epic', label: 'Épicos' }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`overflow-hidden group transition-all duration-300 hover:shadow-lg ${!model.isAvailable ? 'opacity-60' : ''}`}>
                {/* Model Viewer Container */}
                <div className="relative aspect-video bg-card">
                  {model.isAvailable ? (
                    <>
                      <model-viewer
                        src={model.modelUrl}
                        alt={`Modelo 3D - ${model.title}`}
                        auto-rotate
                        camera-controls
                        rotation-per-second="6deg"
                        loading="lazy"
                        reveal="manual"
                        environment-image="neutral"
                        shadow-intensity="0.5"
                        scale="1.0 1.0 1.0"
                        min-camera-orbit="auto auto 1.2m"
                        max-camera-orbit="auto auto 5m"
                        camera-orbit="0deg 70deg 2.5m"
                        field-of-view="45deg"
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'transparent'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <div className="text-4xl mb-2">⏳</div>
                        <div className="text-sm text-muted-foreground">Em desenvolvimento</div>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                    model.isAvailable
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}>
                    {model.isAvailable ? 'DISPONÍVEL' : 'EM BREVE'}
                  </div>

                  {/* Rarity Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold text-black ${getRarityColor(model.rarity)}`}>
                    {model.rarity.toUpperCase()}
                  </div>

                  {/* Hover Actions */}
                  {model.isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openModelViewer(model)}
                          className="bg-primary text-primary-foreground font-bold"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver AR
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
                          className="border-border bg-background/80"
                          size="sm"
                        >
                          <Info className="w-4 h-4 mr-1" />
                          Info
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-foreground flex-1">{model.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      Cap. {model.chapter}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-accent mb-2">
                    <Book className="w-3 h-3" />
                    <span>{model.occupation}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{model.location}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    <strong>Significado:</strong> {model.meaning}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {model.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      {model.rating}
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {model.downloads.toLocaleString()}
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
            <h3 className="text-2xl font-bold text-foreground mb-6">Estatísticas da Coleção</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">{statsData.available}</div>
                <div className="text-muted-foreground">Modelos Disponíveis</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">{statsData.total}</div>
                <div className="text-muted-foreground">Total de Capítulos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">{statsData.completionRate}%</div>
                <div className="text-muted-foreground">Completude</div>
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
          title="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => window.scrollTo({ top: document.querySelector('.grid')?.offsetTop || 0, behavior: 'smooth' })}
          size="icon"
          variant="outline"
          className="rounded-full shadow-lg"
          title="Ver estatísticas"
        >
          <BarChart3 className="w-4 h-4" />
        </Button>
        <Button
          onClick={shareGallery}
          size="icon"
          variant="outline"
          className="rounded-full shadow-lg"
          title="Compartilhar galeria"
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