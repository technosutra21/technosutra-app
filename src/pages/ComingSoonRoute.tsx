import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Route, 
  Zap, 
  Compass, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  Construction,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';

const ComingSoonRoute = () => {
  const navigate = useNavigate();
  const { t: _t } = useLanguage();

  const features = [
    {
      icon: Route,
      title: 'Criação Intuitiva de Rotas',
      description: 'Interface drag-and-drop para criar rotas personalizadas',
      color: 'text-cyan-400'
    },
    {
      icon: MapPin,
      title: 'Waypoints Inteligentes',
      description: 'Conecte automaticamente os pontos de interesse budistas',
      color: 'text-purple-400'
    },
    {
      icon: Compass,
      title: 'Navegação Avançada',
      description: 'GPS turn-by-turn com realidade aumentada',
      color: 'text-yellow-400'
    },
    {
      icon: Sparkles,
      title: 'Experiências Imersivas',
      description: 'Integração com modelos 3D e conteúdo AR interativo',
      color: 'text-red-400'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/50 to-black" />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, -100, null],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Sacred geometry patterns */}
        <motion.div
          className="absolute top-20 left-20 text-cyan-400/10 text-8xl"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          ☸
        </motion.div>

        <motion.div
          className="absolute bottom-20 right-20 text-purple-400/10 text-6xl"
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          🕉
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 left-6"
        >
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="bg-black/50 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Icon Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.3, 
              type: "spring", 
              stiffness: 200, 
              damping: 10 
            }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center"
              >
                <Construction className="w-16 h-16 text-white" />
              </motion.div>

              {/* Orbiting elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Route className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-6 h-6 text-cyan-400" />
                <MapPin className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-6 h-6 text-purple-400" />
                <Compass className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 w-6 h-6 text-yellow-400" />
                <Zap className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 w-6 h-6 text-red-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <Badge 
              variant="outline" 
              className="bg-orange-500/20 border-orange-500/50 text-orange-300 px-4 py-2 text-lg"
            >
              <Construction className="w-4 h-4 mr-2" />
              Em Desenvolvimento
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent"
          >
            Criador de Rotas
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed"
          >
            A experiência definitiva de criação de trilhas budistas está chegando
          </motion.p>

          {/* ETA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-12"
          >
            <Card className="bg-black/50 border-cyan-500/20 backdrop-blur-sm max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 text-cyan-400">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Lançamento Previsto</span>
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  Q2 2025
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  Aguarde por uma experiência revolucionária
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-black/30 border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 h-full">
                  <CardContent className="p-6 text-left">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-slate-800/50 ${feature.color}`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="space-y-4"
          >
            <p className="text-slate-400 text-lg">
              Enquanto isso, explore os 56 capítulos do Sutra Budista
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/gallery')}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-8 py-3 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Explorar Galeria
              </Button>
              
              <Button
                onClick={() => navigate('/map')}
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3 text-lg"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Ver Mapa Interativo
              </Button>
            </div>
          </motion.div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>Status: Desenvolvimento Ativo</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoonRoute;
