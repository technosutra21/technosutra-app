import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const ModelViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelViewerRef = useRef<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const modelUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'Modelo 3D';

  useEffect(() => {
    if (!modelUrl) {
      setError('URL do modelo não fornecida');
      setIsLoading(false);
      return;
    }

    // Load model-viewer dynamically
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    document.head.appendChild(script);

    script.onload = () => {
      setIsLoading(false);
    };

    script.onerror = () => {
      setError('Erro ao carregar o visualizador 3D');
      setIsLoading(false);
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [modelUrl]);

  const handleDownload = () => {
    if (modelUrl) {
      const link = document.createElement('a');
      link.href = modelUrl;
      link.download = `technosutra_${title.replace(/\s+/g, '_')}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetCamera = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.resetTurntableRotation();
      modelViewerRef.current.jumpCameraToGoal();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="cyberpunk-card p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-destructive mb-4">Erro</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/map')} className="gradient-neon text-black font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Mapa
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm" 
              onClick={() => navigate('/map')}
              className="neon-glow"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-primary text-glow">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetCamera}
              className="purple-glow"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-neon"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loading Screen */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-background flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
            />
            <motion.h2
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl font-bold text-primary text-glow"
            >
              Carregando Modelo 3D...
            </motion.h2>
          </div>
        </motion.div>
      )}

      {/* 3D Model Viewer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-20 h-screen"
      >
        <model-viewer
          ref={modelViewerRef}
          src={modelUrl}
          alt={title}
          auto-rotate
          camera-controls
          environment-image="https://modelviewer.dev/shared-assets/environments/moon_1k.hdr"
          style={{
            width: '100%',
            height: 'calc(100vh - 80px)',
            background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)'
          }}
          loading="eager"
          reveal="auto"
          tone-mapping="aces"
          shadow-intensity="1"
          shadow-softness="0.5"
          interaction-prompt="none"
        >
          <div className="progress-bar hide" slot="progress-bar">
            <div className="update-bar"></div>
          </div>
        </model-viewer>
      </motion.div>

      {/* Controls Overlay */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 left-4 right-4 z-30"
      >
        <Card className="cyberpunk-card p-4 mx-auto max-w-2xl">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              <strong className="text-primary">Controles:</strong> Arraste para rotacionar • Scroll para zoom • Clique duplo para focar
            </p>
            <p className="text-xs">
              Modelo 3D do {title} - Parte da jornada sagrada TECHNO SUTRA
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ModelViewer;