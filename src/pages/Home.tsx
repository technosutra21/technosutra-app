import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Route, Sparkles, Eye, Navigation, Zap, Book, Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSutraData } from '@/hooks/useSutraData';
import { useProgress } from '@/hooks/useProgress';
import { useLanguage } from '@/hooks/useLanguage';

const Home = () => {
  const { getCombinedData, loading: dataLoading } = useSutraData();
  const { t, language } = useLanguage();
  const {
    visitedCount,
    totalProgress,
    achievements,
    isComplete
  } = useProgress();
  const [randomCharacters, setRandomCharacters] = useState<{ nome: string; chapter: string; ocupacao: string; significado: string }[]>([]);

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
      color: 'text-primary',
      gradient: 'gradient-neon'
    },
    {
      icon: Users,
      title: t('home.gallery3d'),
      description: t('home.gallery3dDesc'),
      link: '/gallery',
      color: 'text-accent',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      icon: Route,
      title: t('home.createRoute'),
      description: t('home.createRouteDesc'),
      link: '/route-creator',
      color: 'text-yellow-400',
      gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500'
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-primary text-glow mb-4">
              {t('home.title')}
            </h1>
            <div className="h-1 w-32 gradient-neon mx-auto mb-6 rounded-full"></div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('home.subtitle')}
            </p>
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button
              asChild
              className="gradient-neon text-black font-bold text-lg px-8 py-3 neon-glow"
            >
              <Link to="/map">
                <Navigation className="w-5 h-5 mr-2" />
                {t('home.startJourney')}
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-neon text-lg px-8 py-3"
            >
              <Link to="/gallery">
                <Eye className="w-5 h-5 mr-2" />
                {t('home.exploreGallery')}
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="cyberpunk-card p-8 h-full group cursor-pointer">
                  <Link to={feature.link} className="block h-full">
                    <div className="text-center">
                      <div className={`inline-flex p-4 rounded-full ${feature.gradient} mb-6 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-black" />
                      </div>
                      
                      <h3 className={`text-2xl font-bold mb-4 ${feature.color} text-glow`}>
                        {feature.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                      
                      <div className="mt-6">
                        <Button
                          variant="ghost"
                          className={`${feature.color} hover:bg-current/10`}
                        >
                          {t('home.explore')} →
                        </Button>
                      </div>
                    </div>
                  </Link>
                </Card>
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
          <Card className="cyberpunk-card p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-primary text-glow mb-8">
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
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center mb-16"
        >
          <Card className="cyberpunk-card p-12 max-w-2xl mx-auto">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-primary text-glow mb-4">
              {t('home.readyToStart')}
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              {t('home.readyToStartDesc')}
            </p>
            <Button
              asChild
              className="gradient-neon text-black font-bold text-xl px-12 py-4 neon-glow"
            >
              <Link to="/map">
                {t('home.startPilgrimage')}
              </Link>
            </Button>
          </Card>
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
                  <Card className="cyberpunk-card p-6 h-full group cursor-pointer">
                    <Link to="/gallery" className="block h-full">
                      <div className="text-center mb-4">
                        <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 mb-4 group-hover:scale-110 transition-transform">
                          <Book className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-primary text-glow mb-2">
                          {character.nome}
                        </h3>
                        <p className="text-sm text-accent mb-2">
                          {t('common.chapter')} {character.chapter} • {character.ocupacao}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          📍 {character.local}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs">
                          <span className="text-yellow-400 font-bold">{t('common.meaning')}:</span>
                          <p className="text-muted-foreground line-clamp-2">
                            {character.significado}
                          </p>
                        </div>

                        <div className="text-xs">
                          <span className="text-cyan-400 font-bold">{t('common.teaching')}:</span>
                          <p className="text-muted-foreground line-clamp-3">
                            {character.ensinamento.substring(0, 120)}...
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-primary hover:bg-primary/10"
                        >
                          {t('home.exploreCharacter')} →
                        </Button>
                      </div>
                    </Link>
                  </Card>
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
          <Card className="cyberpunk-card p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-primary text-glow mb-6">
              {t('home.advancedTechnology')}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <h3 className="font-bold text-accent mb-2">{t('home.cyberpunkMode')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('home.cyberpunkModeDesc')}
                </p>
              </div>

              <div className="text-center">
                <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-bold text-accent mb-2">{t('home.models3dTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('home.models3dDesc')}
                </p>
              </div>

              <div className="text-center">
                <MapPin className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-bold text-accent mb-2">{t('home.interactiveEditing')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('home.interactiveEditingDesc')}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;