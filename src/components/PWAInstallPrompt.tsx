// PWA Installation Prompt Component
// Handles app installation and offline setup for TECHNO SUTRA

import { Badge } from '@/components/ui/badge';
import { CyberButton } from '@/components/ui/cyber-button';
import { CyberCard, CyberCardContent, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { mapTileCache } from '@/services/mapTileCache';
import { pwaService } from '@/services/pwaService';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Download,
  HardDrive,
  Smartphone,
  WifiOff,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface PWAInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CacheProgress {
  total: number;
  cached: number;
  failed: number;
  percentage: number;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'install' | 'cache' | 'complete'>('install');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState<{ [key: string]: CacheProgress }>({});
  const [offlineStatus, setOfflineStatus] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const checkPWAStatus = async () => {
      setCanInstall(pwaService.canInstall());
      setIsInstalled(pwaService.isInstalled());

      const status = await pwaService.getOfflineStatus();
      setOfflineStatus(status);
    };

    if (isOpen) {
      checkPWAStatus();
    }
  }, [isOpen]);

  const handleInstallApp = async () => {
    setIsInstalling(true);

    try {
      const installed = await pwaService.showInstallPrompt();

      if (installed) {
        setIsInstalled(true);
        setStep('cache');
        toast({
          title: "🎉 App Instalado!",
          description: "TECHNO SUTRA foi adicionado à sua tela inicial"
        });
      } else {
        toast({
          title: "❌ Instalação Cancelada",
          description: "Você pode instalar o app mais tarde",
          variant: "destructive"
        });
      }
    } catch (error) {
      logger.error('Installation failed:', error);
      toast({
        title: "❌ Erro na Instalação",
        description: "Falha ao instalar o aplicativo",
        variant: "destructive"
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCacheOfflineData = async () => {
    setIsCaching(true);

    try {
      toast({
        title: "📦 Preparando Offline",
        description: "Baixando mapas, modelos 3D e recursos AR..."
      });

      // Update progress for AR caching
      setCacheProgress(prev => ({
        ...prev,
        'ar-dependencies': { total: 4, cached: 0, failed: 0, percentage: 0 }
      }));

      // Cache AR dependencies first (critical for AR functionality)
      const arAssets = [
        'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
        'https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.min.js',
        'https://unpkg.com/three@0.157.0/build/three.min.js',
        'https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js'
      ];

      let arCached = 0;
      for (const asset of arAssets) {
        try {
          await fetch(asset);
          arCached++;
          setCacheProgress(prev => ({
            ...prev,
            'ar-dependencies': {
              total: arAssets.length,
              cached: arCached,
              failed: 0,
              percentage: Math.round((arCached / arAssets.length) * 100)
            }
          }));
        } catch (error) {
          logger.error(`Failed to cache AR asset: ${asset}`, error);
        }
      }

      // Cache all 3D models
      await pwaService.cacheAllModels();

      // Cache AR dependencies using PWA service
      await pwaService.cacheARDependencies();

      // Cache map tiles for all styles
      await mapTileCache.cacheAllMapStyles((styleName, progress) => {
        setCacheProgress(prev => ({
          ...prev,
          [styleName]: progress
        }));
      });

      setStep('complete');

      toast({
        title: "✅ Offline Completo!",
        description: "Todos os dados foram baixados para uso offline (incluindo AR)"
      });

    } catch (error) {
      logger.error('Caching failed:', error);
      toast({
        title: "❌ Erro no Cache",
        description: "Falha ao baixar dados offline",
        variant: "destructive"
      });
    } finally {
      setIsCaching(false);
    }
  };

  const handleSkipCache = () => {
    setStep('complete');
    toast({
      title: "⏭️ Cache Ignorado",
      description: "Você pode baixar dados offline mais tarde nas configurações"
    });
  };

  const getTotalProgress = () => {
    const progresses = Object.values(cacheProgress);
    if (progresses.length === 0) return 0;

    const totalPercentage = progresses.reduce((sum, p) => sum + p.percentage, 0);
    return Math.round(totalPercentage / progresses.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md"
          >
            <CyberCard variant="void" glowEffect>
              <CyberCardHeader>
                <div className="flex items-center justify-between">
                  <CyberCardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    {step === 'install' && 'Instalar App'}
                    {step === 'cache' && 'Preparar Offline'}
                    {step === 'complete' && 'Pronto!'}
                  </CyberCardTitle>
                  <CyberButton
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="p-2"
                  >
                    <X className="w-4 h-4" />
                  </CyberButton>
                </div>
              </CyberCardHeader>

              <CyberCardContent className="space-y-6">
                {step === 'install' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center"
                      >
                        <Download className="w-8 h-8 text-white" />
                      </motion.div>

                      <h3 className="text-lg font-bold mb-2">
                        Instalar TECHNO SUTRA
                      </h3>

                      <p className="text-slate-400 text-sm mb-4">
                        Adicione o app à sua tela inicial para acesso rápido e funcionalidade offline completa
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                        <CheckCircle className="w-5 h-5 text-cyan-400" />
                        <div className="text-sm">
                          <div className="font-medium">Acesso Offline</div>
                          <div className="text-slate-400">Funciona sem internet</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                        <div className="text-sm">
                          <div className="font-medium">GPS de Alta Precisão</div>
                          <div className="text-slate-400">Localização precisa para trilhas</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div className="text-sm">
                          <div className="font-medium">56 Modelos 3D</div>
                          <div className="text-slate-400">Todos os personagens disponíveis offline</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {canInstall && !isInstalled ? (
                        <CyberButton
                          variant="sacred"
                          onClick={handleInstallApp}
                          disabled={isInstalling}
                          glowEffect
                          className="flex-1"
                        >
                          {isInstalling ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                              />
                              Instalando...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Instalar App
                            </>
                          )}
                        </CyberButton>
                      ) : (
                        <CyberButton
                          variant="cyber"
                          onClick={() => setStep('cache')}
                          className="flex-1"
                        >
                          {isInstalled ? 'Continuar' : 'Pular Instalação'}
                        </CyberButton>
                      )}
                    </div>
                  </div>
                )}

                {step === 'cache' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center"
                      >
                        <HardDrive className="w-8 h-8 text-white" />
                      </motion.div>

                      <h3 className="text-lg font-bold mb-2">
                        Preparar para Offline
                      </h3>

                      <p className="text-slate-400 text-sm mb-4">
                        Baixe mapas e modelos 3D para usar sem internet
                      </p>
                    </div>

                    {isCaching && (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-cyan-400 mb-1">
                            {getTotalProgress()}%
                          </div>
                          <Progress value={getTotalProgress()} className="mb-2" />
                          <div className="text-xs text-slate-400">
                            Baixando dados para uso offline...
                          </div>
                        </div>

                        <div className="space-y-2">
                          {Object.entries(cacheProgress).map(([style, progress]) => (
                            <div key={style} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{style}</span>
                              <Badge variant="outline">
                                {progress.cached}/{progress.total}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <div className="text-xs text-yellow-200">
                          <div className="font-medium mb-1">Uso de Dados</div>
                          <div>
                            O download completo usa ~50MB de dados móveis.
                            Recomendamos usar Wi-Fi.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CyberButton
                        variant="outline"
                        onClick={handleSkipCache}
                        disabled={isCaching}
                        className="flex-1"
                      >
                        Pular
                      </CyberButton>

                      <CyberButton
                        variant="sacred"
                        onClick={handleCacheOfflineData}
                        disabled={isCaching}
                        glowEffect
                        className="flex-1"
                      >
                        {isCaching ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Baixando...
                          </>
                        ) : (
                          <>
                            <HardDrive className="w-4 h-4 mr-2" />
                            Baixar Tudo
                          </>
                        )}
                      </CyberButton>
                    </div>
                  </div>
                )}

                {step === 'complete' && (
                  <div className="space-y-4 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.6 }}
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>

                    <h3 className="text-lg font-bold mb-2">
                      Tudo Pronto!
                    </h3>

                    <p className="text-slate-400 text-sm mb-4">
                      TECHNO SUTRA está configurado para funcionar completamente offline.
                      Explore as trilhas budistas mesmo sem internet!
                    </p>

                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <WifiOff className="w-4 h-4 text-green-400" />
                        <span>Offline Ready</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-cyan-400" />
                        <span>App Instalado</span>
                      </div>
                    </div>

                    <CyberButton
                      variant="sacred"
                      onClick={onClose}
                      glowEffect
                      className="w-full"
                    >
                      Começar Jornada
                    </CyberButton>
                  </div>
                )}
              </CyberCardContent>
            </CyberCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
