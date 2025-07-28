import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ModelPreviewProps {
  modelUrl: string;
  chapterNumber: number;
  title: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  isAvailable?: boolean;
}

const PREVIEW_SIZES = {
  small: { width: '120px', height: '120px' },
  medium: { width: '200px', height: '200px' },
  large: { width: '300px', height: '300px' }
};

export const ModelPreview: React.FC<ModelPreviewProps> = ({
  modelUrl,
  chapterNumber,
  title,
  className = '',
  size = 'small',
  isAvailable = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const modelViewerRef = useRef<any>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load model-viewer script if not already loaded
  useEffect(() => {
    const loadModelViewer = async () => {
      if (customElements.get('model-viewer')) {
        setModelViewerLoaded(true);
        return;
      }

      try {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
        script.onload = () => setModelViewerLoaded(true);
        script.onerror = () => {
          logger.error('Failed to load model-viewer script');
          setHasError(true);
        };
        document.head.appendChild(script);
      } catch (error) {
        logger.error('Error loading model-viewer:', error);
        setHasError(true);
      }
    };

    loadModelViewer();
  }, []);

  // Setup model-viewer event listeners
  useEffect(() => {
    if (!modelViewerLoaded || !modelViewerRef.current) return;

    const modelViewer = modelViewerRef.current;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      logger.info(`Model preview loaded: ${title}`);
    };

    const handleError = (event: any) => {
      setIsLoading(false);
      setHasError(true);
      
      // Log different types of errors
      const errorDetail = event.detail || event.error || event.message;
      if (errorDetail && errorDetail.includes('404')) {
        logger.warn(`Model ${chapterNumber} (${title}) is still in development - 404 not found`);
      } else {
        logger.error(`Model preview error for ${title}:`, errorDetail);
      }
    };

    const handleProgress = (event: any) => {
      // Optional: Update loading progress if needed
    };

    modelViewer.addEventListener('load', handleLoad);
    modelViewer.addEventListener('error', handleError);
    modelViewer.addEventListener('progress', handleProgress);

    return () => {
      modelViewer.removeEventListener('load', handleLoad);
      modelViewer.removeEventListener('error', handleError);
      modelViewer.removeEventListener('progress', handleProgress);
    };
  }, [modelViewerLoaded, title]);

  const sizeStyle = PREVIEW_SIZES[size];

  if (!isAvailable) {
    return (
      <div 
        className={`relative flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-600/50 ${className}`}
        style={sizeStyle}
      >
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-2">⏳</div>
          <div className="text-xs">Em Desenvolvimento</div>
        </div>
      </div>
    );
  }

  if (isOffline && !modelViewerLoaded) {
    return (
      <div 
        className={`relative flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-600/50 ${className}`}
        style={sizeStyle}
      >
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-2">📡</div>
          <div className="text-xs">Modo Offline</div>
          <div className="text-xs opacity-75">Cap. {chapterNumber}</div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div 
        className={`relative flex items-center justify-center bg-gradient-to-br from-orange-900/20 to-yellow-900/20 rounded-lg border border-orange-500/30 ${className}`}
        style={sizeStyle}
      >
        <div className="text-center text-orange-400">
          <div className="text-4xl mb-2">🚧</div>
          <div className="text-xs">Em Desenvolvimento</div>
          <div className="text-xs opacity-75">Cap. {chapterNumber}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 to-black border border-cyan-500/20 ${className}`}
      style={sizeStyle}
    >
      {modelViewerLoaded ? (
        <>
          <model-viewer
            ref={modelViewerRef}
            src={modelUrl}
            alt={`3D Model ${title}`}
            auto-rotate
            disable-zoom
            camera-controls={false}
            interaction-prompt="none"
            loading="eager"
            camera-orbit="0deg 75deg 1.5m"
            min-camera-orbit="auto auto auto"
            max-camera-orbit="auto auto auto"
            field-of-view="30deg"
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #000000 100%)',
              '--poster-color': 'transparent'
            }}
          />

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-1" />
                  <div className="text-xs text-cyan-400">Carregando...</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chapter Number Overlay */}
          <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
            <span className="text-xs font-bold text-cyan-400">{chapterNumber}</span>
          </div>

          {/* Holographic Border Effect */}
          <div className="absolute inset-0 rounded-lg border border-cyan-400/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </>
      ) : (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-1" />
            <div className="text-xs text-cyan-400">Inicializando...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelPreview;
