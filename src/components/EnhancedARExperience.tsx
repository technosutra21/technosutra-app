import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  CameraOff,
  Target,
  Wifi,
  WifiOff,
  Database,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CyberCard, CyberCardContent } from '@/components/ui/cyber-card';
import { offlineStorage } from '@/services/offlineStorage';
import { performanceMonitoringService } from '@/services/performanceMonitoringService';
import { notificationManager } from '@/lib/notification-manager';
import { logger } from '@/lib/logger';

interface ARState {
  isActive: boolean;
  isLoading: boolean;
  hasPermission: boolean;
  error: string | null;
  isCalibrating: boolean;
  trackingQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

interface ARModel {
  id: string;
  src: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  isVisible: boolean;
  isLoaded: boolean;
}

interface EnhancedARExperienceProps {
  characterId?: string;
  modelSrc?: string;
  enableOfflineMode?: boolean;
  showPerformanceMetrics?: boolean;
  onModelLoad?: (modelId: string) => void;
  onARStart?: () => void;
  onARStop?: () => void;
  className?: string;
}

export const EnhancedARExperience: React.FC<EnhancedARExperienceProps> = ({
  characterId,
  modelSrc,
  enableOfflineMode = true,
  showPerformanceMetrics = false,
  onModelLoad,
  onARStart,
  onARStop,
  className = ''
}) => {
  const _arViewerRef = useRef<any>(null);
  const [arState, setARState] = useState<ARState>({
    isActive: false,
    isLoading: false,
    hasPermission: false,
    error: null,
    isCalibrating: false,
    trackingQuality: 'poor'
  });
  const [_models, _setModels] = useState<ARModel[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [_loadProgress, _setLoadProgress] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0
  });

  // Online/offline detection
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

  // Check camera permissions
  const checkCameraPermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately as we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      setARState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera permission denied';
      setARState(prev => ({ ...prev, hasPermission: false, error: errorMessage }));
      return false;
    }
  }, []);

  // Load model with offline support
  const loadModel = useCallback(async (src: string, id: string) => {
    const startTime = performance.now();
    
    try {
      let modelUrl = src;
      let isFromCache = false;

      // Try to load from cache if offline mode is enabled
      if (enableOfflineMode) {
        try {
          const cachedModel = await offlineStorage.getCachedModel(src);
          if (cachedModel && cachedModel.blob) {
            modelUrl = URL.createObjectURL(cachedModel.blob);
            isFromCache = true;
            logger.info(`📦 Loading AR model from cache: ${src}`);
          }
        } catch (cacheError) {
          logger.warn('Failed to load AR model from cache:', cacheError);
        }
      }

      // Create new model
      const newModel: ARModel = {
        id,
        src: modelUrl,
        position: { x: 0, y: 0, z: -1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        isVisible: true,
        isLoaded: false
      };

      _setModels(prev => [...prev.filter(m => m.id !== id), newModel]);

      // Cache model if not from cache and online
      if (!isFromCache && isOnline && enableOfflineMode) {
        try {
          const response = await fetch(src);
          if (response.ok) {
            const blob = await response.blob();
            await offlineStorage.cacheModel(Number(id), blob);
            logger.info(`💾 AR model cached: ${src}`);
          }
        } catch (error) {
          logger.warn('Failed to cache AR model:', error);
        }
      }

      const loadTime = performance.now() - startTime;
      performanceMonitoringService.measureCustom('AR Model Load', startTime);

      // Update model as loaded
      _setModels(prev => prev.map(m => 
        m.id === id ? { ...m, isLoaded: true } : m
      ));

      onModelLoad?.(id);
      
      notificationManager.success(
        'Modelo AR Carregado',
        `Modelo ${id} pronto para visualização (${loadTime.toFixed(0)}ms)`,
        { 
          duration: 3000,
          metadata: { 
            loadTime,
            isOnline,
            cacheStatus: isFromCache ? 'hit' : 'miss'
          }
        }
      );

    } catch (error) {
      logger.error('Failed to load AR model:', error);
      
      notificationManager.error(
        'Erro ao Carregar Modelo AR',
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    }
  }, [enableOfflineMode, isOnline, onModelLoad]);

  // Start AR experience
  const startAR = useCallback(async () => {
    const startTime = performance.now();
    
    setARState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check camera permission
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission required for AR');
      }

      // Initialize AR
      setARState(prev => ({ 
        ...prev, 
        isActive: true, 
        isLoading: false, 
        isCalibrating: true 
      }));

      // Load model if provided
      if (modelSrc && characterId) {
        await loadModel(modelSrc, characterId);
      }

      // Simulate calibration process
      setTimeout(() => {
        setARState(prev => ({ 
          ...prev, 
          isCalibrating: false, 
          trackingQuality: 'good' 
        }));
      }, 2000);

      const initTime = performance.now() - startTime;
      performanceMonitoringService.measureCustom('AR Initialization', startTime);

      onARStart?.();
      
      notificationManager.success(
        'AR Ativado',
        `Experiência de realidade aumentada iniciada (${initTime.toFixed(0)}ms)`,
        { duration: 3000 }
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start AR';
      
      setARState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isActive: false, 
        error: errorMessage 
      }));

      notificationManager.error(
        'Erro AR',
        errorMessage,
        {
          actions: [{
            label: 'Tentar Novamente',
            action: startAR
          }]
        }
      );
    }
  }, [checkCameraPermission, modelSrc, characterId, loadModel, onARStart]);

  // Stop AR experience
  const stopAR = useCallback(() => {
    setARState(prev => ({ 
      ...prev, 
      isActive: false, 
      isCalibrating: false,
      trackingQuality: 'poor'
    }));
    
    _setModels([]);
    onARStop?.();
    
    notificationManager.info(
      'AR Desativado',
      'Experiência de realidade aumentada finalizada'
    );
  }, [onARStop]);

  // Performance monitoring
  useEffect(() => {
    if (!arState.isActive || !showPerformanceMetrics) return;

    const interval = setInterval(() => {
      // Simulate performance metrics (in real app, get from WebXR/AR.js)
      setPerformanceMetrics({
        fps: Math.floor(Math.random() * 20) + 40, // 40-60 FPS
        renderTime: Math.random() * 10 + 5, // 5-15ms
        memoryUsage: Math.random() * 30 + 50 // 50-80%
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [arState.isActive, showPerformanceMetrics]);

  const getTrackingQualityColor = () => {
    switch (arState.trackingQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* AR Viewer Container */}
      <div className="relative w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
        {/* AR Content */}
        {arState.isActive ? (
          <div className="absolute inset-0">
            {/* AR Scene would go here - using model-viewer or AR.js */}
            <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-cyan-900/20 flex items-center justify-center">
              {arState.isCalibrating ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-center"
                >
                  <Target className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <p className="text-cyan-400">Calibrando AR...</p>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 border-2 border-cyan-400 border-dashed rounded-lg flex items-center justify-center mb-4">
                    <span className="text-cyan-400">Modelo AR</span>
                  </div>
                  <p className="text-cyan-400">Mova o dispositivo para visualizar</p>
                </div>
              )}
            </div>

            {/* AR Overlay UI */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              {/* Status Panel */}
              <CyberCard className="p-3 bg-black/80 backdrop-blur-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      arState.trackingQuality === 'excellent' ? 'bg-green-400' :
                      arState.trackingQuality === 'good' ? 'bg-blue-400' :
                      arState.trackingQuality === 'fair' ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`} />
                    <span className={`text-xs ${getTrackingQualityColor()}`}>
                      {arState.trackingQuality.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-gray-400">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  {enableOfflineMode && (
                    <div className="flex items-center gap-2 text-xs">
                      <Database className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-400">Cache Ativo</span>
                    </div>
                  )}
                </div>
              </CyberCard>

              {/* Performance Metrics */}
              {showPerformanceMetrics && (
                <CyberCard className="p-3 bg-black/80 backdrop-blur-sm">
                  <div className="space-y-1 text-xs">
                    <div>FPS: <span className="text-cyan-400">{performanceMetrics.fps}</span></div>
                    <div>Render: <span className="text-cyan-400">{performanceMetrics.renderTime.toFixed(1)}ms</span></div>
                    <div>Memory: <span className="text-cyan-400">{performanceMetrics.memoryUsage.toFixed(0)}%</span></div>
                  </div>
                </CyberCard>
              )}
            </div>

            {/* AR Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-2">
                <Button
                  onClick={stopAR}
                  variant="destructive"
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                >
                  <CameraOff className="w-4 h-4 mr-2" />
                  Parar AR
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* AR Start Screen */
          <div className="absolute inset-0 flex items-center justify-center">
            <CyberCard className="p-8 max-w-sm text-center">
              <CyberCardContent className="space-y-6">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-400 to-purple-400 rounded-lg flex items-center justify-center"
                >
                  <Camera className="w-8 h-8 text-black" />
                </motion.div>

                <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">
                    Experiência AR
                  </h3>
                  <p className="text-sm text-gray-400">
                    Visualize personagens budistas em realidade aumentada
                  </p>
                </div>

                {arState.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    {arState.error}
                  </div>
                )}

                <Button
                  onClick={startAR}
                  disabled={arState.isLoading}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/30"
                >
                  {arState.isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {arState.isLoading ? 'Iniciando...' : 'Iniciar AR'}
                </Button>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Permita acesso à câmera</p>
                  <p>• Aponte para uma superfície plana</p>
                  <p>• Mova o dispositivo lentamente</p>
                </div>
              </CyberCardContent>
            </CyberCard>
          </div>
        )}

        {/* Loading Progress */}
        <AnimatePresence>
          {_loadProgress > 0 && _loadProgress < 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-4 right-4"
            >
              <div className="bg-black/80 backdrop-blur-sm rounded p-3">
                <div className="flex justify-between text-xs mb-2">
                  <span>Carregando modelo AR...</span>
                  <span>{Math.round(_loadProgress)}%</span>
                </div>
                <Progress value={_loadProgress} className="h-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
