import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useSutraData } from '@/hooks/useSutraData';
import { CombinedSutraEntry } from '@/types/sutra';
import offlineStorage from '@/services/offlineStorage';
import { useToast } from '@/hooks/use-toast';

type ModelViewerElement = HTMLElement & {
  resetTurntableRotation?: () => void;
  jumpCameraToGoal?: () => void;
  play?: () => void;
  pause?: () => void;
  addEventListener: (event: string, handler: (event: CustomEvent<any>) => void) => void;
  removeEventListener: (event: string, handler: (event: CustomEvent<any>) => void) => void;
  activateAR?: () => void;
};

export const useARManager = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelViewerRef = useRef<ModelViewerElement>(null);

  const [modelId, setModelId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modelExists, setModelExists] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [showError, setShowError] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [cameraPermissionNeeded, setCameraPermissionNeeded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [arAssetsReady, setArAssetsReady] = useState(false);

  const { language, t } = useLanguage();
  const { getCombinedData, loading: dataLoading } = useSutraData();
  const [characterData, setCharacterData] = useState<CombinedSutraEntry | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const modelParam = searchParams.get('model');
    const id = modelParam ? Math.max(1, Math.min(56, parseInt(modelParam))) : 1;
    setModelId(id);
  }, [searchParams]);

  useEffect(() => {
    if (!dataLoading) {
      const sutraData = getCombinedData(language);
      const character = sutraData.find(entry => entry.chapter === modelId);
      setCharacterData(character);
    }
  }, [modelId, dataLoading, getCombinedData, language]);

  const checkOfflineStatus = useCallback(async () => {
    setIsOffline(!navigator.onLine);
    try {
      const arAssets = await offlineStorage.getAllARAssets();
      const isReady = arAssets.length >= 4;
      setArAssetsReady(isReady);

      if (!navigator.onLine && !isReady) {
        setStatusMessage('AR offline não disponível - recursos não baixados');
      }
    } catch (error) {
      console.error('Error checking AR assets:', error);
      setArAssetsReady(false);
    }
  }, []);

  useEffect(() => {
    checkOfflineStatus();
    const handleOnline = () => {
      setIsOffline(false);
      setStatusMessage('');
    };
    const handleOffline = () => {
      setIsOffline(true);
      checkOfflineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkOfflineStatus]);

  useEffect(() => {
    const checkModel = async () => {
      try {
        const cachedModel = await offlineStorage.getCachedModel(modelId);
        if (cachedModel) {
          setModelExists(true);
          return;
        }

        if (navigator.onLine) {
          const response = await fetch(`/modelo${modelId}.glb`, { method: 'HEAD' });
          const exists = response.ok;
          setModelExists(exists);

          if (!exists) {
            setShowError(true);
            setTimeout(() => {
              setShowError(false);
              navigate(`/ar?model=1`);
            }, 3000);
          }
        } else {
          setModelExists(false);
          setShowError(true);
          setStatusMessage(`Modelo ${modelId} não disponível offline`);
        }
      } catch (error) {
        console.error('Error checking model:', error);
        setModelExists(false);
      }
    };

    checkModel();
  }, [modelId, navigate]);

  const showStatus = (message: string, type: 'info' | 'success' | 'error' = 'info', duration = 3000) => {
    toast({
      title: message,
      variant: type === 'error' ? 'destructive' : 'default',
      duration: duration,
    });
  };

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    const handleLoad = () => {
      setIsLoading(false);
      setLoadingProgress(100);
      showStatus('Modelo carregado com sucesso!', 'success');
    };

    const handleProgress = (event: CustomEvent<{ totalProgress: number }>) => {
      setLoadingProgress(event.detail.totalProgress * 100);
    };

    const handleError = (event: CustomEvent<unknown>) => {
      console.error('Model loading error:', event.detail);
      setIsLoading(false);
      showStatus('Erro ao carregar modelo', 'error');
    };

    modelViewer.addEventListener('load', handleLoad);
    modelViewer.addEventListener('progress', handleProgress);
    modelViewer.addEventListener('error', handleError);

    return () => {
      modelViewer.removeEventListener('load', handleLoad);
      modelViewer.removeEventListener('progress', handleProgress);
      modelViewer.removeEventListener('error', handleError);
    };
  }, [modelExists, showStatus]);

  const resetCamera = () => {
    modelViewerRef.current?.resetTurntableRotation?.();
    modelViewerRef.current?.jumpCameraToGoal?.();
    showStatus('Câmera resetada');
  };

  const toggleRotation = () => {
    if (isRotating) {
      modelViewerRef.current?.pause?.();
    } else {
      modelViewerRef.current?.play?.();
    }
    setIsRotating(prev => !prev);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermissionNeeded(false);
      showStatus('Permissão de câmera concedida!', 'success');
    } catch (error) {
      console.error('Camera permission denied:', error);
      showStatus('Permissão de câmera negada', 'error');
    }
  };

  const activateAR = () => {
    modelViewerRef.current?.activateAR?.();
  };

  return {
    modelId,
    isLoading,
    loadingProgress,
    modelExists,
    isRotating,
    isInfoExpanded,
    showError,
    statusMessage,
    cameraPermissionNeeded,
    isOffline,
    arAssetsReady,
    characterData,
    t,
    language,
    modelViewerRef,
    navigate,
    setIsInfoExpanded,
    resetCamera,
    toggleRotation,
    requestCameraPermission,
    activateAR
  };
};
