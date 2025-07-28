import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RotateCcw, Play, Pause, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSutraData } from '@/hooks/useSutraData';
import { CombinedSutraEntry } from '@/types/sutra';
import { useLanguage } from '@/hooks/useLanguage';

const AR = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const modelViewerRef = useRef<HTMLElement & {
        resetTurntableRotation?: () => void;
        jumpCameraToGoal?: () => void;
        play?: () => void;
        pause?: () => void;
        addEventListener: (event: string, handler: (event: CustomEvent) => void) => void;
        removeEventListener: (event: string, handler: (event: CustomEvent) => void) => void;
    }>(null);

    // State management
    const [modelId, setModelId] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [modelExists, setModelExists] = useState(false);
    const [isRotating, setIsRotating] = useState(true);

    const [showError, setShowError] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [cameraPermissionNeeded, setCameraPermissionNeeded] = useState(false);

    // Get character data
    const { language, t } = useLanguage();
    const { getCombinedData, loading: dataLoading } = useSutraData();
    const [characterData, setCharacterData] = useState<CombinedSutraEntry | null>(null);

    // Initialize model ID from URL params
    useEffect(() => {
        const modelParam = searchParams.get('model');
        const id = modelParam ? Math.max(1, Math.min(56, parseInt(modelParam))) : 1;
        setModelId(id);
    }, [searchParams]);

    // Load character data
    useEffect(() => {
        if (!dataLoading) {
            const sutraData = getCombinedData(language);
            const character = sutraData.find(entry => entry.chapter === modelId);
            setCharacterData(character);
        }
    }, [modelId, dataLoading, getCombinedData, language]);

    // Check if model exists
    useEffect(() => {
        const checkModel = async () => {
            try {
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
            } catch (error) {
                console.error('Error checking model:', error);
                setModelExists(false);
            }
        };

        checkModel();
    }, [modelId, navigate]);

    // Model viewer event handlers
    useEffect(() => {
        const modelViewer = modelViewerRef.current;
        if (!modelViewer) return;

        const handleLoad = () => {
            setIsLoading(false);
            setLoadingProgress(100);
            showStatus('Modelo carregado com sucesso!', 'success');
        };

        const handleProgress = (event: CustomEvent<{ totalProgress: number }>) => {
            const progress = event.detail.totalProgress * 100;
            setLoadingProgress(progress);
        };

        const handleError = (event: CustomEvent<unknown>) => {
            console.error('Model loading error:', event.detail);
            setIsLoading(false);
            showStatus('Erro ao carregar modelo', 'error');
        };

        const handleArStatus = () => {
            // Handle AR status changes if needed
        };

        const handleCameraChange = () => {
            // Handle camera changes if needed
        };

        // Add event listeners
        modelViewer.addEventListener('load', handleLoad);
        modelViewer.addEventListener('progress', handleProgress);
        modelViewer.addEventListener('error', handleError);
        modelViewer.addEventListener('ar-status', handleArStatus);
        modelViewer.addEventListener('camera-change', handleCameraChange);

        return () => {
            // Cleanup event listeners
            modelViewer.removeEventListener('load', handleLoad);
            modelViewer.removeEventListener('progress', handleProgress);
            modelViewer.removeEventListener('error', handleError);
            modelViewer.removeEventListener('ar-status', handleArStatus);
            modelViewer.removeEventListener('camera-change', handleCameraChange);
        };
    }, [modelExists]);

    // Utility functions
    const showStatus = (message: string, _type: 'info' | 'success' | 'error' = 'info', duration = 3000) => {
        setStatusMessage(message);
        setTimeout(() => setStatusMessage(''), duration);
    };

    const resetCamera = () => {
        if (modelViewerRef.current) {
            modelViewerRef.current.resetTurntableRotation();
            modelViewerRef.current.jumpCameraToGoal();
            showStatus('Câmera resetada');
        }
    };

    const toggleRotation = () => {
        if (modelViewerRef.current) {
            if (isRotating) {
                modelViewerRef.current.pause();
            } else {
                modelViewerRef.current.play();
            }
            setIsRotating(!isRotating);
        }
    };

    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
            setCameraPermissionNeeded(false);
            showStatus('Permissão de câmera concedida!', 'success');
        } catch (error) {
            console.error('Camera permission denied:', error);
            showStatus('Permissão de câmera negada', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative">
            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gradient-to-br from-primary to-accent flex flex-col items-center justify-center z-50"
                    >
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-4">Techno Sutra AR</div>
                            <div className="text-lg mb-8 opacity-90">Preparando experiência imersiva...</div>
                            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <div className="w-64">
                                <Progress value={loadingProgress} className="h-2" />
                                <div className="text-sm mt-2">{Math.round(loadingProgress)}%</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error 404 Overlay */}
            <AnimatePresence>
                {showError && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center z-50"
                    >
                        <div className="text-center text-white">
                            <div className="text-8xl mb-6">🤖</div>
                            <div className="text-6xl font-bold mb-4">404</div>
                            <div className="text-2xl font-semibold mb-8">{t('ar.modelNotFound')}</div>
                            <div className="text-lg opacity-80 max-w-md">
                                {t('ar.modelNotFoundDesc')}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Camera Permission Overlay */}
            <AnimatePresence>
                {cameraPermissionNeeded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-40"
                    >
                        <div className="text-center text-white p-6">
                            <div className="text-6xl mb-6">📷</div>
                            <div className="text-2xl font-bold mb-4">Acesso à Câmera Necessário</div>
                            <div className="text-lg opacity-80 mb-8 max-w-md leading-relaxed">
                                Para uma experiência AR completa, precisamos acessar sua câmera.
                                Isso permite ver o mundo real como fundo para os modelos 3D.
                            </div>
                            <Button
                                onClick={requestCameraPermission}
                                className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-full text-lg font-semibold"
                            >
                                {t('ar.allowCamera')}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Message */}
            <AnimatePresence>
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 left-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-2xl text-center z-30 backdrop-blur-md"
                    >
                        {statusMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4">
                <div className="flex items-center justify-between">
                    <Button
                        onClick={() => navigate('/gallery')}
                        variant="outline"
                        size="sm"
                        className="bg-black bg-opacity-50 border-white border-opacity-30 text-white backdrop-blur-md"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Galeria
                    </Button>

                    {characterData && (
                        <div className="text-center">
                            <div className="text-lg font-bold">{characterData.nome}</div>
                            <div className="text-sm opacity-80">Capítulo {modelId}</div>
                        </div>
                    )}

                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </div>

            {/* Main Model Viewer */}
            {modelExists && (
                <model-viewer
                    ref={modelViewerRef}
                    src={`/modelo${modelId}.glb`}
                    alt={`Modelo 3D - ${characterData?.nome || `Capítulo ${modelId}`}`}
                    camera-controls
                    touch-action="pan-y"
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    ar-scale="auto"
                    ar-placement="floor"
                    auto-rotate={isRotating}
                    rotation-per-second="30deg"
                    loading="eager"
                    reveal="auto"
                    shadow-intensity="1.2"
                    shadow-softness="0.8"
                    environment-image="neutral"
                    exposure="1.0"
                    camera-target="auto auto auto"
                    field-of-view="30deg"
                    min-camera-orbit="auto 0deg auto"
                    max-camera-orbit="auto 180deg auto"
                    style={{
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'transparent',
                        '--ar-scale': '1.5',
                        '--poster-color': 'transparent',
                        filter: 'contrast(1.1) saturate(1.2) brightness(1.05)'
                    }}
                >
                    {/* Custom AR Button */}
                    <Button
                        slot="ar-button"
                        className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white border-2 border-white border-opacity-30 px-6 py-4 rounded-full text-lg font-semibold backdrop-blur-md hover:bg-opacity-60 transition-all duration-300 flex items-center gap-3"
                        disabled={!modelExists || isLoading}
                    >
                        <span className="text-xl">📱</span>
                        <span>Ver em AR</span>
                    </Button>

                    {/* Progress Bar */}
                    <div
                        slot="progress-bar"
                        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden"
                    >
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>

                    {/* AR Prompt */}
                    <div
                        slot="ar-prompt"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-85 text-white p-6 rounded-2xl text-center backdrop-blur-md"
                    >
                        <div className="text-4xl mb-3">📱</div>
                        <div className="text-lg font-medium">Mova o dispositivo para encontrar uma superfície</div>
                    </div>
                </model-viewer>
            )}

            {/* Model Controls */}
            {modelExists && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex gap-4 z-20"
                >
                    <Button
                        onClick={resetCamera}
                        size="icon"
                        className="w-12 h-12 rounded-full bg-black bg-opacity-80 text-white border border-white border-opacity-30 backdrop-blur-md hover:bg-opacity-60"
                        title="Resetar câmera"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </Button>

                    <Button
                        onClick={toggleRotation}
                        size="icon"
                        className="w-12 h-12 rounded-full bg-black bg-opacity-80 text-white border border-white border-opacity-30 backdrop-blur-md hover:bg-opacity-60"
                        title={isRotating ? 'Pausar rotação' : 'Iniciar rotação'}
                    >
                        {isRotating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                </motion.div>
            )}

            {/* Character Information Panel */}
            {characterData && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="absolute bottom-4 left-4 right-4 z-20"
                >
                    <Card className="bg-black bg-opacity-80 text-white border-white border-opacity-30 backdrop-blur-md p-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold">{characterData.nome}</h3>
                                    <span className="text-sm bg-primary bg-opacity-20 text-primary px-2 py-1 rounded">
                                        Cap. {modelId}
                                    </span>
                                </div>

                                <div className="text-sm opacity-80 mb-2">
                                    <strong>Ocupação:</strong> {characterData.ocupacao}
                                </div>

                                <div className="text-sm opacity-80 mb-2">
                                    <strong>Local:</strong> {characterData.local}
                                </div>

                                <div className="text-sm opacity-80">
                                    <strong>Significado:</strong> {characterData.significado}
                                </div>
                            </div>

                            <Button
                                onClick={() => navigate(`/gallery`)}
                                variant="outline"
                                size="sm"
                                className="bg-transparent border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10"
                            >
                                Ver Detalhes
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Error State */}
            {!modelExists && !isLoading && !showError && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Card className="bg-black bg-opacity-80 text-white border-red-500 border-opacity-50 backdrop-blur-md p-8 text-center max-w-md mx-4">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">{t('ar.modelUnavailable')}</h3>
                        <p className="text-sm opacity-80 mb-6">
                            {t('ar.modelUnavailableDesc').replace('{modelId}', modelId.toString())}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => navigate('/gallery')}
                                variant="outline"
                                className="flex-1 bg-transparent border-white border-opacity-30 text-white"
                            >
                                {t('ar.viewGallery')}
                            </Button>
                            <Button
                                onClick={() => navigate('/ar?model=1')}
                                className="flex-1 bg-primary text-primary-foreground"
                            >
                                Modelo 1
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AR;
