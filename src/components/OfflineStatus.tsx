// Offline Status Component for TECHNO SUTRA
// Shows offline status and available functionality with comprehensive testing

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Info,
  TestTube,
  Download,
  Loader2,
  XCircle
} from 'lucide-react';
import { CyberCard, CyberCardContent } from '@/components/ui/cyber-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { offlineStorage } from '@/services/offlineStorage';
import { offlineTestingService } from '@/services/offlineTestingService';
import { pwaService } from '@/services/pwaService';

interface OfflineStatusProps {
  showDetails?: boolean;
  className?: string;
}

interface OfflineCapabilities {
  models: number;
  characters: number;
  arAssets: number;
  mapTiles: boolean;
  routes: number;
}

interface TestResults {
  overall: 'pass' | 'fail' | 'warning';
  results: Array<{
    feature: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }>;
  recommendations: string[];
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({
  showDetails = false,
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [capabilities, setCapabilities] = useState<OfflineCapabilities>({
    models: 0,
    characters: 0,
    arAssets: 0,
    mapTiles: false,
    routes: 0
  });
  const [isFullyOfflineReady, setIsFullyOfflineReady] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [_isInstallable, _setIsInstallable] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const checkOfflineCapabilities = async () => {
      try {
        const [models, characters, routes, arAssets] = await Promise.all([
          offlineStorage.getAllCachedModels(),
          offlineStorage.getCachedCharacters(),
          offlineStorage.getRoutes(),
          offlineStorage.getAllARAssets()
        ]);

        const newCapabilities = {
          models: models.length,
          characters: characters.length,
          arAssets: arAssets.length,
          mapTiles: true, // Assume map tiles are cached by service worker
          routes: routes.length
        };

        setCapabilities(newCapabilities);
        
        // Check if fully offline ready
        const fullyReady = await offlineStorage.isCompletelyOfflineReady();
        setIsFullyOfflineReady(fullyReady);
      } catch (error) {
        console.error('Error checking offline capabilities:', error);
      }
    };

    // Initial check
    checkOfflineCapabilities();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check capabilities periodically
    const interval = setInterval(checkOfflineCapabilities, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await offlineTestingService.runOfflineValidation();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to run offline tests:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleInitializeOffline = async () => {
    setIsInitializing(true);
    try {
      await offlineTestingService.initializeOfflineFunctionality();
      const results = await offlineTestingService.runOfflineValidation();
      setTestResults(results);
      await checkOfflineCapabilities();
    } catch (error) {
      console.error('Failed to initialize offline functionality:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleInstallPWA = async () => {
    try {
      await pwaService.showInstallPrompt();
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (isOnline) return 'text-green-400';
    if (isFullyOfflineReady) return 'text-cyan-400';
    return 'text-orange-400';
  };

  const getStatusIcon = () => {
    if (isOnline) return <Wifi className="w-4 h-4" />;
    if (isFullyOfflineReady) return <WifiOff className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (isFullyOfflineReady) return 'Offline Ready';
    return 'Limited Offline';
  };

  const getCapabilityStatus = (current: number, required: number) => {
    if (current >= required) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <AlertCircle className="w-4 h-4 text-orange-400" />;
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 ${className}`}
      >
        <motion.div
          animate={{ 
            scale: isOnline ? [1, 1.1, 1] : [1, 0.9, 1],
            opacity: isOnline ? 1 : [1, 0.7, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={getStatusColor()}
        >
          {getStatusIcon()}
        </motion.div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {!isOnline && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-cyan-400 rounded-full"
          />
        )}
      </motion.div>
    );
  }

  // Detailed status panel
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <CyberCard variant="void" className="border-cyan-500/20">
          <CyberCardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    rotate: isOnline ? 0 : [0, 360],
                    scale: isOnline ? 1 : [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: isOnline ? 0 : 2, 
                    repeat: isOnline ? 0 : Infinity 
                  }}
                  className={getStatusColor()}
                >
                  {getStatusIcon()}
                </motion.div>
                <div>
                  <h3 className={`font-bold ${getStatusColor()}`}>
                    {getStatusText()}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isOnline 
                      ? 'Todas as funcionalidades disponíveis'
                      : isFullyOfflineReady 
                        ? 'Funcionalidade completa offline'
                        : 'Funcionalidade limitada offline'
                    }
                  </p>
                </div>
              </div>
              
              <Badge 
                variant={isFullyOfflineReady ? "default" : "secondary"}
                className={isFullyOfflineReady ? "bg-green-500/20 text-green-400" : ""}
              >
                {isFullyOfflineReady ? 'Completo' : 'Parcial'}
              </Badge>
            </div>

            {!isOnline && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-slate-300 mb-2">
                  Recursos Offline Disponíveis:
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Modelos 3D</span>
                    <div className="flex items-center gap-2">
                      {getCapabilityStatus(capabilities.models, 56)}
                      <span className="text-slate-400">
                        {capabilities.models}/56
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Personagens</span>
                    <div className="flex items-center gap-2">
                      {getCapabilityStatus(capabilities.characters, 1)}
                      <span className="text-slate-400">
                        {capabilities.characters > 0 ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>AR Assets</span>
                    <div className="flex items-center gap-2">
                      {getCapabilityStatus(capabilities.arAssets, 4)}
                      <span className="text-slate-400">
                        {capabilities.arAssets}/4
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Mapas</span>
                    <div className="flex items-center gap-2">
                      {capabilities.mapTiles ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                      )}
                      <span className="text-slate-400">
                        {capabilities.mapTiles ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Rotas Salvas</span>
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-400">
                        {capabilities.routes}
                      </span>
                    </div>
                  </div>
                </div>

                {!isFullyOfflineReady && (
                  <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-xs">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-orange-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-orange-200">
                          Funcionalidade Limitada
                        </div>
                        <div className="text-orange-300 mt-1">
                          Alguns recursos podem não funcionar offline.
                          Conecte-se à internet para baixar todos os dados.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Testing and Initialization Controls */}
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRunTests}
                      disabled={isRunningTests}
                      className="flex-1 text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                    >
                      {isRunningTests ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      Test Offline
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleInitializeOffline}
                      disabled={isInitializing}
                      className="flex-1 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                    >
                      {isInitializing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Cache All
                    </Button>
                  </div>

                  {_isInstallable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleInstallPWA}
                      className="w-full text-green-400 border-green-500/30 hover:bg-green-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install as App
                    </Button>
                  )}
                </div>

                {/* Test Results */}
                {testResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Test Results</h4>
                      <Badge className={`${
                        testResults.overall === 'pass' ? 'bg-green-500/20 text-green-400' :
                        testResults.overall === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {testResults.overall.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {testResults.results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {getTestStatusIcon(result.status)}
                            <span>{result.feature}</span>
                          </div>
                          <span className="text-gray-400 text-right max-w-[120px] truncate">
                            {result.message}
                          </span>
                        </div>
                      ))}
                    </div>

                    {testResults.recommendations.length > 0 && (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                        <h5 className="text-xs font-medium text-blue-400 mb-1">Recommendations:</h5>
                        <ul className="text-xs text-blue-300 space-y-1">
                          {testResults.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </CyberCardContent>
        </CyberCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineStatus;
