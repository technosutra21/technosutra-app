import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
  Map,
  Palette,
  Zap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface LoadingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'loading' | 'complete' | 'error';
  progress?: number;
  estimatedTime?: number;
}

interface EnhancedLoadingScreenProps {
  isVisible: boolean;
  steps?: LoadingStep[];
  currentStep?: string;
  overallProgress?: number;
  onComplete?: () => void;
  showPerformanceMetrics?: boolean;
  theme?: 'cyberpunk' | 'buddhist' | 'minimal';
}

const defaultSteps: LoadingStep[] = [
  {
    id: 'initialization',
    label: 'Inicializando',
    description: 'Preparando a experiência TECHNO SUTRA',
    icon: <Zap className="w-5 h-5" />,
    status: 'pending',
    estimatedTime: 1000
  },
  {
    id: 'offline-data',
    label: 'Dados Offline',
    description: 'Carregando personagens e capítulos',
    icon: <Database className="w-5 h-5" />,
    status: 'pending',
    estimatedTime: 2000
  },
  {
    id: 'map-tiles',
    label: 'Mapas',
    description: 'Preparando mapas de Águas da Prata',
    icon: <Map className="w-5 h-5" />,
    status: 'pending',
    estimatedTime: 3000
  },
  {
    id: 'assets',
    label: 'Recursos',
    description: 'Carregando modelos 3D e texturas',
    icon: <Palette className="w-5 h-5" />,
    status: 'pending',
    estimatedTime: 4000
  }
];

export const EnhancedLoadingScreen: React.FC<EnhancedLoadingScreenProps> = ({
  isVisible,
  steps = defaultSteps,
  currentStep,
  overallProgress = 0,
  _onComplete,
  showPerformanceMetrics = false,
  theme = 'cyberpunk'
}) => {
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>(steps);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memoryUsage: 0,
    loadSpeed: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setElapsedTime(Date.now() - loadStartTime);
    }, 100);

    return () => clearInterval(timer);
  }, [isVisible, loadStartTime]);

  useEffect(() => {
    if (currentStep) {
      setLoadingSteps(prev => prev.map(step => ({
        ...step,
        status: step.id === currentStep ? 'loading' : 
                step.id < currentStep ? 'complete' : 'pending'
      })));
    }
  }, [currentStep]);

  useEffect(() => {
    if (showPerformanceMetrics) {
      const updateMetrics = () => {
        // Simulate performance metrics (in real app, get from performanceMonitoringService)
        setPerformanceMetrics({
          memoryUsage: Math.random() * 100,
          loadSpeed: Math.random() * 10 + 5,
          cacheHitRate: Math.random() * 100
        });
      };

      const metricsTimer = setInterval(updateMetrics, 1000);
      return () => clearInterval(metricsTimer);
    }
  }, [showPerformanceMetrics]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'buddhist':
        return {
          background: 'bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-red-900/20',
          accent: 'text-amber-400',
          border: 'border-amber-500/30'
        };
      case 'minimal':
        return {
          background: 'bg-gradient-to-br from-gray-900 via-slate-900 to-black',
          accent: 'text-blue-400',
          border: 'border-blue-500/30'
        };
      default: // cyberpunk
        return {
          background: 'bg-gradient-to-br from-black via-purple-900/20 to-cyan-900/20',
          accent: 'text-cyan-400',
          border: 'border-cyan-500/30'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const getStatusIcon = (status: LoadingStep['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-600" />;
    }
  };

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${themeClasses.background}`}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 40% 80%, rgba(119, 255, 198, 0.1) 0%, transparent 50%)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          />
        </div>

        {/* Main Loading Content */}
        <div className="relative z-10 w-full max-w-md mx-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-black/90 backdrop-blur-sm border ${themeClasses.border} rounded-lg p-6 space-y-6`}
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className={`w-12 h-12 mx-auto rounded-full border-2 ${themeClasses.border} flex items-center justify-center`}
              >
                <Loader2 className={`w-6 h-6 ${themeClasses.accent}`} />
              </motion.div>
              
              <h2 className={`text-xl font-bold ${themeClasses.accent}`}>
                TECHNO SUTRA
              </h2>
              
              <p className="text-sm text-gray-400">
                Preparando sua jornada budista cyberpunk
              </p>
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progresso Geral</span>
                <span className={themeClasses.accent}>{Math.round(overallProgress)}%</span>
              </div>
              <Progress 
                value={overallProgress} 
                className="h-2"
              />
            </div>

            {/* Loading Steps */}
            <div className="space-y-3">
              {loadingSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-2 rounded ${
                    step.status === 'loading' ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(step.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {step.label}
                      </span>
                      {step.status === 'loading' && step.progress !== undefined && (
                        <span className="text-xs text-gray-400">
                          {step.progress}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {step.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {step.icon}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span>Tempo: {formatTime(elapsedTime)}</span>
                {showPerformanceMetrics && (
                  <Badge variant="outline" className="text-xs">
                    {performanceMetrics.loadSpeed.toFixed(1)} MB/s
                  </Badge>
                )}
              </div>
            </div>

            {/* Performance Metrics (if enabled) */}
            {showPerformanceMetrics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 pt-2 border-t border-gray-700"
              >
                <div className="text-xs text-gray-400 font-medium">Métricas de Performance</div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-gray-400">Memória</div>
                    <div className={themeClasses.accent}>
                      {performanceMetrics.memoryUsage.toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-gray-400">Velocidade</div>
                    <div className={themeClasses.accent}>
                      {performanceMetrics.loadSpeed.toFixed(1)} MB/s
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-gray-400">Cache</div>
                    <div className={themeClasses.accent}>
                      {performanceMetrics.cacheHitRate.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-center"
            >
              <p className="text-xs text-gray-500">
                💡 Dica: Adicione o app à tela inicial para melhor experiência offline
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
