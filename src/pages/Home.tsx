import { Badge } from '@/components/ui/badge';
import { CyberButton } from '@/components/ui/cyber-button';
import { CyberCard } from '@/components/ui/cyber-card';
import { useLanguage } from '@/hooks/useLanguage';
import { useProgress } from '@/hooks/useProgress';
import { useSutraData } from '@/hooks/useSutraData';
import { CombinedSutraEntry } from '@/types/sutra';
import { motion } from 'framer-motion';
import { Book, Eye, MapPin, Navigation, Route, Sparkles, Star, Trophy, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { getCombinedData, loading: dataLoading } = useSutraData();
  const { t, language } = useLanguage();
  const {
    visitedCount,
    totalProgress,
    achievements,
    isComplete
  } = useProgress();
  const [randomCharacters, setRandomCharacters] = useState<CombinedSutraEntry[]>([]);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);

  // PWA and offline status
  useEffect(() => {
    const checkPWAStatus = async () => {
      // Check if app can be installed
      setCanInstall(false); // Will be updated by PWA service

      // Show install prompt for first-time users
      const hasSeenPrompt = localStorage.getItem('technosutra-pwa-prompt-seen');
      if (!hasSeenPrompt && !navigator.onLine) {
        setTimeout(() => {
          setShowPWAPrompt(true);
          localStorage.setItem('technosutra-pwa-prompt-seen', 'true');
        }, 3000);
      }
    };

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPWAStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get random characters for showcase
  useEffect(() => {
    if (!dataLoading) {
      const allData = getCombinedData(language);
      if (allData.length > 0) {
        // Get 3 random characters
        const shuffled = [...allData].sort(() => 0.5 - Math.random());
        setRandomCharacters(shuffled.slice(0, 3));
      }
    }
  }, [dataLoading, getCombinedData, language]);
  const features = [
    {
      icon: MapPin,
      title: t('home.originalRoute'),
      description: t('home.originalRouteDesc'),
      link: '/map',
      color: 'text-cyan-400',
      gradient: 'from-cyan-500 to-blue-500',
      variant: 'default' as const
    },
    {
      icon: Users,
      title: t('home.gallery3d'),
      description: t('home.gallery3dDesc'),
      link: '/gallery',
      color: 'text-purple-400',
      gradient: 'from-purple-500 to-pink-500',
      variant: 'neon' as const
    },
    {
      icon: Route,
      title: t('home.createRoute'),
      description: t('home.createRouteDesc'),
      link: '/route-creator',
      color: 'text-yellow-400',
      gradient: 'from-yellow-400 to-orange-500',
      variant: 'sacred' as const
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] bg-black relative overflow-x-hidden">
      {/* Sacred Geometry Background */}
      <div className="absolute inset-0 sacred-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/50 to-black"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl animate-float"></div>

        {/* Floating Buddhist Sacred Symbols */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            rotate: [0, 360],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-16 text-6xl text-yellow-400/20"
        >
          🪷
        </motion.div>

        <motion.div
          animate={{
            y: [0, -25, 0],
            rotate: [0, -360],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-40 right-20 text-4xl text-orange-400/20"
        >
          ☸
        </motion.div>

        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -15, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 10 }}
          className="absolute bottom-32 left-12 text-5xl text-cyan-400/20"
        >
          🕉
        </motion.div>

        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 8 }}
          className="absolute bottom-1/3 right-16 text-3xl text-red-400/20"
        >
          🔱
        </motion.div>

        <motion.div
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 15 }}
          className="absolute top-2/3 left-1/3 text-2xl text-purple-400/20"
        >
          💎
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 md:mb-16"
        >
          <div className="mb-8">
            {/* Sacred Buddha Bubble with Mandala */}
            <motion.div
              className="flex justify-center mb-12"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.3 }}
            >
              <div className="relative">
                {/* Outer Dharma Wheel */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-12 border-2 border-yellow-400/30 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg,
                      rgba(234, 179, 8, 0.1) 0deg,
                      rgba(6, 182, 212, 0.1) 45deg,
                      rgba(139, 92, 246, 0.1) 90deg,
                      rgba(236, 72, 153, 0.1) 135deg,
                      rgba(34, 197, 94, 0.1) 180deg,
                      rgba(239, 68, 68, 0.1) 225deg,
                      rgba(168, 85, 247, 0.1) 270deg,
                      rgba(234, 179, 8, 0.1) 315deg,
                      rgba(234, 179, 8, 0.1) 360deg)`
                  }}
                />

                {/* Middle Vajra Ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-8 border-2 border-purple-400/40 rounded-full"
                />

                {/* Inner Lotus Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border border-cyan-400/50 rounded-full"
                />

                {/* Sacred Buddha Bubble */}
                <motion.div
                  className="w-32 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full relative overflow-hidden shadow-2xl"
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(234, 179, 8, 0.6)",
                      "0 0 50px rgba(251, 146, 60, 0.6)",
                      "0 0 30px rgba(239, 68, 68, 0.6)",
                      "0 0 30px rgba(234, 179, 8, 0.6)"
                    ],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  {/* Inner sacred glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />

                  {/* Buddha silhouette */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="text-6xl filter drop-shadow-lg"
                    >
                      ☸
                    </motion.div>
                  </div>

                  {/* Sacred light rays */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-yellow-300/60 transform -translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-1/2 w-0.5 h-4 bg-yellow-300/60 transform -translate-x-1/2"></div>
                    <div className="absolute left-0 top-1/2 h-0.5 w-4 bg-yellow-300/60 transform -translate-y-1/2"></div>
                    <div className="absolute right-0 top-1/2 h-0.5 w-4 bg-yellow-300/60 transform -translate-y-1/2"></div>
                  </motion.div>
                </motion.div>

                {/* Sacred Buddhist Symbols - Vajra Yogini Elements */}
                <motion.div
                  className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-float shadow-lg shadow-red-500/40"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl" title="Vajra - Diamond Thunderbolt">⚡</span>
                  </div>
                  <div className="absolute inset-0 border-2 border-red-400/50 rounded-full animate-ping opacity-75"></div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -left-4 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-float delay-500 shadow-lg shadow-yellow-500/40"
                  animate={{
                    rotate: [360, 0],
                    y: [0, -10, 0]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl" title="Lotus of Compassion">☸</span>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-float delay-1000 shadow-lg shadow-purple-500/40"
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg" title="Dharma Wheel">☸</span>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 -right-4 w-7 h-7 bg-gradient-to-r from-green-400 to-teal-500 rounded-full animate-float delay-1500 shadow-lg shadow-green-500/40"
                  animate={{
                    rotate: [0, -360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 10, repeat: Infinity }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm" title="Om Mani Padme Hum">🕉</span>
                  </div>
                </motion.div>

                {/* Guru Padmasambhava Symbol */}
                <motion.div
                  className="absolute top-1/2 -right-6 w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-float delay-2000 shadow-lg shadow-blue-500/40"
                  animate={{
                    x: [0, 10, 0],
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 15, repeat: Infinity }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs" title="Guru Padmasambhava - Precious Guru">💎</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold gradient-text mb-4 text-glow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {t('home.title')}
            </motion.h1>

            {/* Sacred Buddhist Divider */}
            <motion.div
              className="flex items-center justify-center gap-4 mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <span className="text-yellow-400 text-xl">☸</span>
              <div className="h-1 w-32 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full animate-pulse-glow"></div>
              <span className="text-cyan-400 text-xl">☸</span>
            </motion.div>

            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-4 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              {t('home.subtitle')}
            </motion.p>

            {/* Sacred Buddhist Mantras */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 1 }}
            >
              <div className="text-sm text-yellow-400 font-medium tracking-wider">
                ☸              </div>

              <motion.div
                className="text-lg text-cyan-300 italic"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                "Gate gate pāragate pārasaṃgate bodhi svāhā"
              </motion.div>

              <div className="text-sm text-slate-400">
                {language === 'en'
                  ? 'Gone, gone, gone beyond, gone completely beyond, awakening, so be it!'
                  : 'Ido, ido, ido além, ido completamente além, despertar, que assim seja!'
                }
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 px-4"
          >
            <CyberButton
              asChild
              variant="cyber"
              size="lg"
              glowEffect
              className="text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
            >
              <Link to="/map" className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                {t('home.startJourney')}
              </Link>
            </CyberButton>

            <CyberButton
              asChild
              variant="outline"
              size="lg"
              className="text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
            >
              <Link to="/gallery" className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {t('home.exploreGallery')}
              </Link>
            </CyberButton>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-16 px-4 md:px-0"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <CyberCard
                  variant={feature.variant}
                  glowEffect
                  sacredPattern
                  className="p-8 h-full group cursor-pointer"
                >
                  <Link to={feature.link} className="block h-full">
                    <div className="text-center">
                      <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform cyber-glow`}>
                        <Icon className="w-8 h-8 text-black" />
                      </div>

                      <h3 className={`text-2xl font-bold mb-4 ${feature.color} text-glow`}>
                        {feature.title}
                      </h3>

                      <p className="text-slate-300 leading-relaxed">
                        {feature.description}
                      </p>

                      <div className="mt-6">
                        <CyberButton
                          variant="ghost"
                          className={`${feature.color} hover:bg-current/10`}
                        >
                          {t('home.explore')} →
                        </CyberButton>
                      </div>
                    </div>
                  </Link>
                </CyberCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mb-16"
        >
          <CyberCard
            variant="void"
            glowEffect
            sacredPattern
            className="p-8 max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold gradient-text text-glow mb-8">
              {t('home.journeyNumbers')}
            </h2>

            {/* Progress Summary */}
            {visitedCount > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border border-primary/30">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-muted-foreground">{t('home.progress')}:</span>
                    <span className="font-bold text-primary">{totalProgress.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    <span className="text-muted-foreground">{t('home.visited')}:</span>
                    <span className="font-bold text-accent">{visitedCount}/56</span>
                  </div>
                  {achievements.length > 0 && (
                    <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                      {achievements.length} {achievements.length > 1 ? t('home.achievements') : t('home.achievement')}
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  number: visitedCount.toString(),
                  label: t('home.visitedPoints'),
                  color: visitedCount > 0 ? 'text-primary' : 'text-muted-foreground'
                },
                {
                  number: '56',
                  label: t('home.models3d'),
                  color: 'text-accent'
                },
                {
                  number: '∞',
                  label: t('home.possibleRoutes'),
                  color: 'text-yellow-400'
                },
                {
                  number: isComplete ? '✓' : '1',
                  label: t('home.spiritualDestination'),
                  color: isComplete ? 'text-green-400' : 'text-muted-foreground'
                }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-4xl md:text-5xl font-bold ${stat.color} text-glow mb-2`}>
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </CyberCard>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center mb-16"
        >
          <CyberCard
            variant="sacred"
            glowEffect
            sacredPattern
            className="p-12 max-w-2xl mx-auto"
          >
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-pulse-glow" />
            <h2 className="text-3xl font-bold gradient-text text-glow mb-4">
              {t('home.readyToStart')}
            </h2>
            <p className="text-slate-300 mb-8 text-lg">
              {t('home.readyToStartDesc')}
            </p>
            <CyberButton
              asChild
              variant="sacred"
              size="lg"
              glowEffect
              className="text-xl px-12 py-4"
            >
              <Link to="/map">
                {t('home.startPilgrimage')}
              </Link>
            </CyberButton>
          </CyberCard>
        </motion.div>

        {/* Featured Characters */}
        {randomCharacters.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-primary text-glow text-center mb-8">
              {t('home.featuredCharacters')}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {randomCharacters.map((character, index) => (
                <motion.div
                  key={character.chapter}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                >
                  <CyberCard
                    variant="neon"
                    glowEffect
                    className="p-6 h-full group cursor-pointer"
                  >
                    <Link to="/gallery" className="block h-full">
                      <div className="text-center mb-4">
                        <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 mb-4 group-hover:scale-110 transition-transform cyber-glow">
                          <Book className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-bold text-cyan-100 text-glow mb-2">
                          {character.nome}
                        </h3>
                        <p className="text-sm text-purple-400 mb-2">
                          {t('common.chapter')} {character.chapter} • {character.ocupacao}
                        </p>
                        <p className="text-xs text-slate-400 mb-3">
                          📍 {character.local}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs">
                          <span className="text-yellow-400 font-bold">{t('common.meaning')}:</span>
                          <p className="text-slate-400 line-clamp-2">
                            {character.significado}
                          </p>
                        </div>

                        <div className="text-xs">
                          <span className="text-cyan-400 font-bold">{t('common.teaching')}:</span>
                          <p className="text-slate-400 line-clamp-3">
                            {character.ensinamento.substring(0, 120)}...
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <CyberButton
                          variant="ghost"
                          size="sm"
                          className="w-full text-cyan-400 hover:bg-cyan-500/10"
                        >
                          {t('home.exploreCharacter')} →
                        </CyberButton>
                      </div>
                    </Link>
                  </CyberCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Technical Features */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="text-center"
        >
          <CyberCard
            variant="void"
            glowEffect
            sacredPattern
            className="p-8 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-bold gradient-text text-glow mb-6">
              {t('home.advancedTechnology')}
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-pulse-glow" />
                <h3 className="font-bold text-cyan-100 mb-2">{t('home.cyberpunkMode')}</h3>
                <p className="text-sm text-slate-400">
                  {t('home.cyberpunkModeDesc')}
                </p>
              </div>

              <div className="text-center">
                <Users className="w-8 h-8 text-purple-400 mx-auto mb-3 animate-pulse-glow" />
                <h3 className="font-bold text-purple-100 mb-2">{t('home.models3dTitle')}</h3>
                <p className="text-sm text-slate-400">
                  {t('home.models3dDesc')}
                </p>
              </div>

              <div className="text-center">
                <MapPin className="w-8 h-8 text-yellow-400 mx-auto mb-3 animate-pulse-glow" />
                <h3 className="font-bold text-yellow-100 mb-2">{t('home.interactiveEditing')}</h3>
                <p className="text-sm text-slate-400">
                  {t('home.interactiveEditingDesc')}
                </p>
              </div>
            </div>
          </CyberCard>
        </motion.div>

        {/* PWA Install Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="text-center"
        >
          <CyberCard
            variant="void"
            glowEffect
            className="p-6 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              {isOnline ? (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold gradient-text mb-4">
              Instalar App para Uso Offline
            </h3>

            <p className="text-slate-400 text-sm mb-6">
              Adicione TECHNO SUTRA à sua tela inicial para acesso completo offline com GPS de alta precisão e todos os 56 modelos 3D
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CyberButton
                variant="sacred"
                onClick={() => setShowPWAPrompt(true)}
                glowEffect
                className="flex items-center gap-2"
              >
                <span className="text-lg">📱</span>
                Instalar App
              </CyberButton>

              <Link to="/map">
                <CyberButton
                  variant="cyber"
                  className="flex items-center gap-2 w-full"
                >
                  <MapPin className="w-4 h-4" />
                  Começar no Navegador
                </CyberButton>
              </Link>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              ✨ Funciona 100% offline • 🎯 GPS de alta precisão • 🎭 56 modelos 3D
            </div>
          </CyberCard>
        </motion.div>
      </div>

      {/* PWA Install Prompt */}
      {/* <PWAInstallPrompt
        isOpen={showPWAPrompt}
        onClose={() => setShowPWAPrompt(false)}
      /> */}
    </div>
  );
};

export default Home;