import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Eye,
  EyeOff,
  RotateCcw,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CyberCard, CyberCardContent } from '@/components/ui/cyber-card';
import { offlineStorage } from '@/services/offlineStorage';
import { performanceMonitoringService } from '@/services/performanceMonitoringService';
import { logger } from '@/lib/logger';

interface OptimizedModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
  className?: string;
  autoRotate?: boolean;
  cameraControls?: boolean;
  environmentImage?: string;
  exposure?: number;
  shadowIntensity?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  enableOfflineCache?: boolean;
  showPerformanceMetrics?: boolean;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
  loadTime: number;
  isFromCache: boolean;
}

interface PerformanceMetrics {
  loadTime: number;
  fileSize: number;
  renderTime: number;
  memoryUsage: number;
  isOptimized: boolean;
}

export const OptimizedModelViewer: React.FC<OptimizedModelViewerProps> = memo(({
  src,
  alt = '3D Model',
  poster,
  className = '',
  autoRotate = true,
  cameraControls = true,
  environmentImage,
  exposure = 1,
  shadowIntensity = 1,
  onLoad,
  onError,
  onProgress,
  enableOfflineCache = true,
  showPerformanceMetrics = false
}) => {
  const modelViewerRef = useRef<any>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    error: null,
    loadTime: 0,
    isFromCache: false
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    fileSize: 0,
    renderTime: 0,
    memoryUsage: 0,
    isOptimized: false
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVisible, setIsVisible] = useState(true);
  const loadStartTime = useRef(Date.now());

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

  // Load model with offline caching support
  const loadModel = useCallback(async () => {
    if (!src) return;

    loadStartTime.current = Date.now();
    setLoadingState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));

    try {
      let modelUrl = src;
      let isFromCache = false;

      // Try to load from cache first if offline caching is enabled
      if (enableOfflineCache) {
        try {
          const cachedModel = await offlineStorage.getCachedModel(src);
          if (cachedModel && cachedModel.blob) {
            modelUrl = URL.createObjectURL(cachedModel.blob);
            isFromCache = true;
            logger.info(`📦 Loading model from cache: ${src}`);
          }
        } catch (cacheError) {
          logger.warn('Failed to load from cache, using network:', cacheError);
        }
      }

      // Update model-viewer src
      if (modelViewerRef.current) {
        modelViewerRef.current.src = modelUrl;
      }

      setLoadingState(prev => ({ ...prev, isFromCache }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLoadingState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      logger.error('Model loading failed:', error);
    }
  }, [src, enableOfflineCache, onError]);

  // Cache model for offline use
  const cacheModel = useCallback(async () => {
    if (!src || !enableOfflineCache) return;

    try {
      const response = await fetch(src);
      if (response.ok) {
        const blob = await response.blob();
        await offlineStorage.cacheModel(src, blob, {
          url: src,
          name: alt,
          size: blob.size,
          cached: new Date().toISOString()
        });
        
        logger.info(`💾 Model cached for offline use: ${src}`);
      }
    } catch (error) {
      logger.warn('Failed to cache model:', error);
    }
  }, [src, alt, enableOfflineCache]);

  // Handle model load events
  const handleModelLoad = useCallback(() => {
    const loadTime = Date.now() - loadStartTime.current;
    
    setLoadingState(prev => ({ 
      ...prev, 
      isLoading: false, 
      loadTime,
      progress: 100 
    }));

    // Update performance metrics
    setPerformanceMetrics(prev => ({
      ...prev,
      loadTime,
      isOptimized: loadTime < 3000 // Consider optimized if loads in under 3s
    }));

    // Track performance
    performanceMonitoringService.measureCustom('3D Model Load', loadStartTime.current);

    // Cache model if not from cache and online
    if (!loadingState.isFromCache && isOnline) {
      cacheModel();
    }

    onLoad?.();
    logger.info(`✅ Model loaded successfully: ${src} (${loadTime}ms)`);
  }, [src, onLoad, cacheModel, loadingState.isFromCache, isOnline]);

  const handleModelError = useCallback((_event: any) => {
    const error = new Error(`Failed to load 3D model: ${src}`);
    setLoadingState(prev => ({ 
      ...prev, 
      isLoading: false, 
      error: error.message 
    }));
    
    onError?.(error);
    logger.error('Model loading error:', error);
  }, [src, onError]);

  const handleProgress = useCallback((event: any) => {
    const progress = (event.detail?.totalProgress || 0) * 100;
    setLoadingState(prev => ({ ...prev, progress }));
    onProgress?.(progress);
  }, [onProgress]);

  // Initialize model loading
  useEffect(() => {
    loadModel();
  }, [loadModel]);

  // Setup model-viewer event listeners
  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    modelViewer.addEventListener('load', handleModelLoad);
    modelViewer.addEventListener('error', handleModelError);
    modelViewer.addEventListener('progress', handleProgress);

    return () => {
      modelViewer.removeEventListener('load', handleModelLoad);
      modelViewer.removeEventListener('error', handleModelError);
      modelViewer.removeEventListener('progress', handleProgress);
    };
  }, [handleModelLoad, handleModelError, handleProgress]);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const resetCamera = () => modelViewerRef.current?.resetTurntableRotation?.();

  return (
    <div className={`relative ${className}`}>
      {/* Model Viewer */}
      <div className={`relative ${isVisible ? '' : 'opacity-0'}`}>
        <model-viewer
          ref={modelViewerRef}
          alt={alt}
          poster={poster}
          auto-rotate={autoRotate}
          camera-controls={cameraControls}
          environment-image={environmentImage}
          exposure={exposure}
          shadow-intensity={shadowIntensity}
          className="w-full h-full"
          style={{ 
            minHeight: '300px',
            background: 'transparent'
          }}
        />

        {/* Loading Overlay */}
        <AnimatePresence>
          {loadingState.isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <CyberCard className="p-6 max-w-sm">
                <CyberCardContent className="space-y-4">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-cyan-400">
                      Carregando Modelo 3D
                    </h3>
                    <p className="text-sm text-gray-400">
                      {loadingState.isFromCache ? 'Cache offline' : 'Baixando da rede'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progresso</span>
                      <span>{Math.round(loadingState.progress)}%</span>
                    </div>
                    <Progress value={loadingState.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs">
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-gray-400">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                    {loadingState.isFromCache && (
                      <>
                        <Database className="w-3 h-3 text-blue-400" />
                        <span className="text-blue-400">Cache</span>
                      </>
                    )}
                  </div>
                </CyberCardContent>
              </CyberCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        <AnimatePresence>
          {loadingState.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-900/20 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <CyberCard className="p-6 max-w-sm border-red-500/30">
                <CyberCardContent className="text-center space-y-4">
                  <div className="text-red-400">
                    <h3 className="text-lg font-semibold">Erro ao Carregar</h3>
                    <p className="text-sm mt-2">{loadingState.error}</p>
                  </div>
                  <Button
                    onClick={loadModel}
                    variant="outline"
                    size="sm"
                    className="text-cyan-400 border-cyan-500/30"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </CyberCardContent>
              </CyberCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          onClick={toggleVisibility}
          variant="outline"
          size="sm"
          className="bg-black/50 border-cyan-500/30 text-cyan-400"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        
        <Button
          onClick={resetCamera}
          variant="outline"
          size="sm"
          className="bg-black/50 border-cyan-500/30 text-cyan-400"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Performance Metrics */}
      {showPerformanceMetrics && !loadingState.isLoading && (
        <div className="absolute bottom-2 left-2">
          <Badge className="bg-black/50 text-xs">
            {performanceMetrics.loadTime}ms
            {performanceMetrics.isOptimized && ' ⚡'}
          </Badge>
        </div>
      )}

      {/* Cache Status */}
      {enableOfflineCache && loadingState.isFromCache && (
        <div className="absolute bottom-2 right-2">
          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
            <Database className="w-3 h-3 mr-1" />
            Cache
          </Badge>
        </div>
      )}
    </div>
  );
});

OptimizedModelViewer.displayName = 'OptimizedModelViewer';
