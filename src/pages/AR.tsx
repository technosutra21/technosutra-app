import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CyberButton } from '@/components/ui/cyber-button';
import { CyberCard, CyberCardContent, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card';
import { ArrowLeft, RotateCcw, Play, Pause, AlertCircle, Eye, ChevronUp, ChevronDown, BookOpen, MapPin, Sparkles, ExternalLink } from 'lucide-react';
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
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);

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
        <div className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] bg-black text-white overflow-x-hidden relative sacred-pattern">
            {/* Enhanced Sacred geometry background with dynamic particles */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/50 to-black overflow-hidden">
                {/* Floating sacred geometry particles */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-yellow-500/3 rounded-full blur-2xl animate-pulse delay-1000"></div>

                {/* Sacred symbols floating */}
                <div className="absolute top-20 left-10 text-cyan-400/20 text-4xl animate-float">∞</div>
                <div className="absolute bottom-32 right-16 text-purple-400/20 text-3xl animate-float delay-500">☸</div>
                <div className="absolute top-1/3 right-20 text-yellow-400/20 text-2xl animate-float delay-1000">☸</div>
                <div className="absolute bottom-1/3 left-12 text-pink-400/20 text-3xl animate-float delay-1500">🕉</div>
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 sacred-pattern"
                    >
                        <CyberCard variant="void" glowEffect sacredPattern className="p-12 max-w-md border-2 border-cyan-500/30">
                            <div className="text-center">
                                {/* Enhanced Sacred Loading Mandala */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-24 h-24 mx-auto mb-8 relative"
                                >
                                    {/* Outer ring */}
                                    <div className="absolute inset-0 border-4 border-cyan-500/40 border-t-cyan-400 rounded-full shadow-lg shadow-cyan-500/20"></div>
                                    {/* Middle ring */}
                                    <div className="absolute inset-2 border-3 border-purple-500/40 border-r-purple-400 rounded-full"></div>
                                    {/* Inner ring */}
                                    <div className="absolute inset-4 border-2 border-yellow-500/40 border-b-yellow-400 rounded-full"></div>
                                    {/* Center sacred symbol */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Eye className="w-10 h-10 text-cyan-400 animate-pulse-glow drop-shadow-lg" />
                                        </motion.div>
                                    </div>
                                    {/* Sacred symbols around the mandala */}
                                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-400 text-sm">∞</div>
                                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-purple-400 text-sm">☸</div>
                                    <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 text-cyan-400 text-sm">☸</div>
                                    <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-pink-400 text-sm">🕉</div>
                                </motion.div>

                                <div className="text-4xl font-bold gradient-text mb-4">TECHNO SUTRA AR</div>
                                <div className="text-lg mb-8 text-slate-400">
                                    {language === 'en' ? 'Preparing immersive experience...' : 'Preparando experiência imersiva...'}
                                </div>

                                {/* Enhanced Progress Bar with Sacred Geometry */}
                                <div className="w-72 mb-6">
                                    <div className="relative">
                                        {/* Main progress bar */}
                                        <div className="w-full bg-slate-800/50 rounded-full h-3 mb-3 border border-cyan-500/20 shadow-inner">
                                            <motion.div
                                                className="bg-gradient-to-r from-cyan-500 via-purple-500 to-yellow-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/30"
                                                style={{ width: `${loadingProgress}%` }}
                                                animate={{
                                                    boxShadow: [
                                                        "0 0 10px rgba(6, 182, 212, 0.3)",
                                                        "0 0 20px rgba(6, 182, 212, 0.5)",
                                                        "0 0 10px rgba(6, 182, 212, 0.3)"
                                                    ]
                                                }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        {/* Progress percentage with sacred styling */}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-cyan-400 font-medium">Carregando Sabedoria...</span>
                                            <motion.span
                                                className="text-yellow-400 font-bold"
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                {Math.round(loadingProgress)}%
                                            </motion.span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center space-x-2 text-2xl">
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>∞</motion.span>
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>☸</motion.span>
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>☸</motion.span>
                                </div>
                            </div>
                        </CyberCard>
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
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 sacred-pattern"
                    >
                        <CyberCard variant="void" className="p-12 max-w-md border-red-500/40 bg-red-900/10" glowEffect>
                            <div className="text-center text-white">
                                {/* Animated error icon */}
                                <motion.div
                                    animate={{
                                        rotate: [0, -10, 10, -10, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-8xl mb-6"
                                >
                                    🤖
                                </motion.div>

                                {/* Glowing 404 */}
                                <motion.div
                                    className="text-6xl font-bold mb-4 text-red-400"
                                    animate={{
                                        textShadow: [
                                            "0 0 10px rgba(248, 113, 113, 0.5)",
                                            "0 0 20px rgba(248, 113, 113, 0.8)",
                                            "0 0 10px rgba(248, 113, 113, 0.5)"
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    404
                                </motion.div>

                                <div className="text-2xl font-semibold mb-8 gradient-text">{t('ar.modelNotFound')}</div>
                                <div className="text-lg text-slate-400 max-w-md leading-relaxed">
                                    {t('ar.modelNotFoundDesc')}
                                </div>

                                {/* Sacred error symbols */}
                                <div className="flex justify-center space-x-4 mt-6 text-2xl opacity-50">
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>⚠</motion.span>
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}>🔮</motion.span>
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}>⚡</motion.span>
                                </div>
                            </div>
                        </CyberCard>
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
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-40 sacred-pattern"
                    >
                        <CyberCard variant="sacred" glowEffect sacredPattern className="p-10 max-w-lg border-2 border-yellow-500/40">
                            <div className="text-center text-white">
                                {/* Animated camera icon */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="text-7xl mb-8"
                                >
                                    📷
                                </motion.div>

                                <motion.div
                                    className="text-2xl font-bold mb-6 gradient-text"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {language === 'en' ? 'Camera Access Required' : 'Acesso à Câmera Necessário'}
                                </motion.div>

                                <motion.div
                                    className="text-lg text-slate-300 mb-8 max-w-md leading-relaxed"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {language === 'en'
                                        ? 'For a complete AR experience, we need to access your camera. This allows you to see the real world as a background for 3D models.'
                                        : 'Para uma experiência AR completa, precisamos acessar sua câmera. Isso permite ver o mundo real como fundo para os modelos 3D.'
                                    }
                                </motion.div>

                                {/* Enhanced permission button */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <CyberButton
                                        onClick={requestCameraPermission}
                                        variant="sacred"
                                        glowEffect
                                        className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/30"
                                    >
                                        <span className="mr-2">🔓</span>
                                        {t('ar.allowCamera')}
                                    </CyberButton>
                                </motion.div>

                                {/* Sacred permission symbols */}
                                <div className="flex justify-center space-x-3 mt-6 text-xl">
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} className="text-yellow-400">🔮</motion.span>
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="text-cyan-400">👁</motion.span>
                                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} className="text-purple-400">✨</motion.span>
                                </div>
                            </div>
                        </CyberCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enhanced Status Message */}
            <AnimatePresence>
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.9 }}
                        className="fixed top-4 left-4 right-4 z-30"
                    >
                        <CyberCard variant="void" className="p-4 text-center border-cyan-500/40 bg-black/90 backdrop-blur-xl" glowEffect>
                            <div className="flex items-center justify-center gap-3">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="text-cyan-400"
                                >
                                    ⚡
                                </motion.div>
                                <span className="text-cyan-100 font-medium">{statusMessage}</span>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="text-yellow-400"
                                >
                                    ✨
                                </motion.div>
                            </div>
                        </CyberCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enhanced Animated Header */}
            <motion.div
                className="absolute top-0 left-0 right-0 z-30 p-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center justify-between">
                    {/* Enhanced back button */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <CyberButton
                            onClick={() => navigate('/gallery')}
                            variant="outline"
                            size="sm"
                            className="bg-black/90 border-cyan-500/40 text-cyan-100 backdrop-blur-xl hover:border-cyan-400 transition-all duration-300"
                            glowEffect
                        >
                            <motion.div
                                animate={{ x: [-2, 0, -2] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                            </motion.div>
                            {t('gallery.title')}
                        </CyberButton>
                    </motion.div>

                    {/* Enhanced character info header */}
                    {characterData && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <CyberCard variant="void" className="px-6 py-3 border-cyan-500/40 bg-black/90 backdrop-blur-xl border-2" glowEffect sacredPattern>
                                <div className="text-center">
                                    <div className="text-lg font-bold gradient-text flex items-center gap-2">
                                        <motion.div
                                            animate={{ rotate: [0, 360] }}
                                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Sparkles className="w-5 h-5 text-yellow-400" />
                                        </motion.div>
                                        <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                                            {characterData.nome}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                        <span>{t('common.chapter')} {modelId}</span>
                                        <motion.span
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="text-cyan-400"
                                        >
                                            •
                                        </motion.span>
                                        <span className="text-purple-400">AR Mode</span>
                                    </div>
                                </div>
                            </CyberCard>
                        </motion.div>
                    )}

                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </motion.div>

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
                    {/* Hidden default AR button - we'll create our own */}
                    <button slot="ar-button" style={{ display: 'none' }}></button>

                    {/* Progress Bar */}
                    <div
                        slot="progress-bar"
                        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-48 h-2 bg-slate-800 rounded-full overflow-hidden"
                    >
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>

                    {/* AR Prompt */}
                    <div
                        slot="ar-prompt"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    >
                        <CyberCard variant="void" glowEffect className="p-6 text-center">
                            <div className="text-4xl mb-3">📱</div>
                            <div className="text-lg font-medium text-cyan-100">
                                {language === 'en'
                                    ? 'Move the device to find a surface'
                                    : 'Mova o dispositivo para encontrar uma superfície'
                                }
                            </div>
                        </CyberCard>
                    </div>
                </model-viewer>
            )}

            {/* Enhanced AR Button with Particle Effects */}
            {modelExists && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8, type: "spring", bounce: 0.3 }}
                    className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-40"
                >
                    {/* Particle effects around button */}
                    <div className="absolute inset-0 -m-8">
                        <motion.div
                            animate={{
                                rotate: 360,
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute top-0 left-0 w-4 h-4 bg-yellow-400/30 rounded-full blur-sm"
                        />
                        <motion.div
                            animate={{
                                rotate: -360,
                                scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            className="absolute top-2 right-0 w-3 h-3 bg-cyan-400/40 rounded-full blur-sm"
                        />
                        <motion.div
                            animate={{
                                rotate: 360,
                                scale: [1, 1.15, 1]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute bottom-0 left-2 w-2 h-2 bg-purple-400/50 rounded-full blur-sm"
                        />
                    </div>

                    {/* Enhanced AR Button */}
                    <motion.div
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0 0 40px rgba(234, 179, 8, 0.6)"
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <CyberButton
                            onClick={() => {
                                const modelViewer = modelViewerRef.current;
                                if (modelViewer && 'activateAR' in modelViewer) {
                                    (modelViewer as any).activateAR();
                                }
                            }}
                            variant="sacred"
                            size="lg"
                            glowEffect
                            className="ar-button-glow px-10 py-5 text-xl font-bold bg-gradient-to-r from-yellow-600/90 to-orange-600/90 backdrop-blur-xl border-3 border-yellow-400/60 hover:border-yellow-300 shadow-2xl shadow-yellow-500/40 relative overflow-hidden"
                            disabled={!modelExists || isLoading}
                        >
                            {/* Button inner glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            <motion.span
                                className="text-3xl mr-4"
                                animate={{
                                    rotateY: [0, 360],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                📱
                            </motion.span>
                            <span className="relative z-10 bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                                {language === 'en' ? 'View in AR' : 'Ver em AR'}
                            </span>
                        </CyberButton>
                    </motion.div>
                </motion.div>
            )}

            {/* Enhanced Camera Controls with Advanced Animations */}
            {modelExists && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, x: 30, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 1.5, duration: 0.8, type: "spring" }}
                    className="absolute top-20 right-4 md:top-1/2 md:transform md:-translate-y-1/2 flex flex-col gap-4 z-30"
                >
                    {/* Reset Camera Button */}
                    <motion.div
                        whileHover={{
                            scale: 1.1,
                            rotate: 5
                        }}
                        whileTap={{
                            scale: 0.9,
                            rotate: -5
                        }}
                    >
                        <CyberButton
                            onClick={() => {
                                resetCamera();
                                // Haptic feedback simulation
                                if (navigator.vibrate) {
                                    navigator.vibrate(50);
                                }
                            }}
                            variant="outline"
                            size="icon"
                            glowEffect
                            className="camera-control-glow w-16 h-16 rounded-full bg-black/95 border-2 border-cyan-500/50 text-cyan-100 backdrop-blur-xl hover:border-cyan-300 hover:bg-cyan-500/10 transition-all duration-300 shadow-lg shadow-cyan-500/30 relative overflow-hidden"
                            title={language === 'en' ? 'Reset camera' : 'Resetar câmera'}
                        >
                            {/* Button pulse effect */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-cyan-400/20 rounded-full"
                            />
                            <motion.div
                                whileHover={{ rotate: 180 }}
                                transition={{ duration: 0.3 }}
                            >
                                <RotateCcw className="w-7 h-7 relative z-10" />
                            </motion.div>
                        </CyberButton>
                    </motion.div>

                    {/* Rotation Toggle Button */}
                    <motion.div
                        whileHover={{
                            scale: 1.1,
                            rotate: -5
                        }}
                        whileTap={{
                            scale: 0.9,
                            rotate: 5
                        }}
                    >
                        <CyberButton
                            onClick={() => {
                                toggleRotation();
                                // Haptic feedback simulation
                                if (navigator.vibrate) {
                                    navigator.vibrate(isRotating ? [30, 30, 30] : 100);
                                }
                            }}
                            variant={isRotating ? "cyber" : "outline"}
                            size="icon"
                            glowEffect
                            className={`camera-control-glow w-16 h-16 rounded-full bg-black/95 border-2 backdrop-blur-xl transition-all duration-300 shadow-lg relative overflow-hidden ${
                                isRotating
                                    ? 'border-purple-400/70 text-purple-100 hover:border-purple-300 hover:bg-purple-500/20 shadow-purple-500/40'
                                    : 'border-purple-500/50 text-purple-100 hover:border-purple-400 hover:bg-purple-500/10 shadow-purple-500/30'
                            }`}
                            title={isRotating
                                ? (language === 'en' ? 'Pause rotation' : 'Pausar rotação')
                                : (language === 'en' ? 'Start rotation' : 'Iniciar rotação')
                            }
                        >
                            {/* Dynamic pulse effect based on rotation state */}
                            <motion.div
                                animate={{
                                    scale: isRotating ? [1, 1.3, 1] : [1, 1.1, 1],
                                    opacity: isRotating ? [0.3, 0.7, 0.3] : [0.5, 0.8, 0.5]
                                }}
                                transition={{ duration: isRotating ? 1 : 2, repeat: Infinity }}
                                className={`absolute inset-0 rounded-full ${isRotating ? 'bg-purple-400/30' : 'bg-purple-400/20'}`}
                            />
                            <motion.div
                                animate={isRotating ? { rotate: 360 } : {}}
                                transition={isRotating ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
                                className="relative z-10"
                            >
                                {isRotating ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                            </motion.div>
                        </CyberButton>
                    </motion.div>

                    {/* Control Panel Label */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="text-center"
                    >
                        <div className="text-xs text-slate-400 font-medium bg-black/60 px-2 py-1 rounded backdrop-blur-sm border border-slate-600/30">
                            {language === 'en' ? 'Controls' : 'Controles'}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Enhanced Collapsible Character Information Panel */}
            {characterData && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="absolute bottom-4 left-4 right-4 z-20"
                >
                    <CyberCard variant="void" glowEffect sacredPattern className="border-cyan-500/30 bg-black/95 backdrop-blur-xl">
                        {/* Header - Always visible */}
                        <CyberCardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    <div>
                                        <CyberCardTitle className="text-lg gradient-text">{characterData.nome}</CyberCardTitle>
                                        <div className="text-sm text-slate-400 flex items-center gap-2">
                                            <span>{t('common.chapter')} {modelId}</span>
                                            <span className="text-cyan-400">•</span>
                                            <span>{characterData.ocupacao}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <CyberButton
                                        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                                        variant="outline"
                                        size="sm"
                                        className="bg-transparent border-cyan-500/30 text-cyan-100 hover:bg-cyan-500/10"
                                    >
                                        {isInfoExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                    </CyberButton>

                                    <CyberButton
                                        onClick={() => navigate(`/gallery`)}
                                        variant="outline"
                                        size="sm"
                                        className="bg-transparent border-cyan-500/30 text-cyan-100 hover:bg-cyan-500/10"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </CyberButton>
                                </div>
                            </div>
                        </CyberCardHeader>

                        {/* Expandable Content */}
                        <AnimatePresence>
                            {isInfoExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <CyberCardContent className="pt-0">
                                        <div className="space-y-4">
                                            {/* Location and Meaning */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-purple-400" />
                                                        <span className="text-purple-400 font-medium">{t('common.location')}:</span>
                                                    </div>
                                                    <p className="text-slate-300 text-sm pl-6">{characterData.local}</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                                        <span className="text-yellow-400 font-medium">{t('common.meaning')}:</span>
                                                    </div>
                                                    <p className="text-slate-300 text-sm pl-6">{characterData.significado}</p>
                                                </div>
                                            </div>

                                            {/* Teaching */}
                                            {characterData.ensinamento && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-cyan-400 font-medium">{language === 'en' ? 'Teaching' : 'Ensinamento'}:</span>
                                                    </div>
                                                    <p className="text-slate-300 text-sm pl-6 leading-relaxed">{characterData.ensinamento}</p>
                                                </div>
                                            )}

                                            {/* Character Description */}
                                            {characterData.descPersonagem && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Eye className="w-4 h-4 text-green-400" />
                                                        <span className="text-green-400 font-medium">{language === 'en' ? 'Description' : 'Descrição'}:</span>
                                                    </div>
                                                    <p className="text-slate-300 text-sm pl-6 leading-relaxed">{characterData.descPersonagem}</p>
                                                </div>
                                            )}

                                            {/* Chapter Summary */}
                                            {characterData.resumoCap && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-orange-400" />
                                                        <span className="text-orange-400 font-medium">{language === 'en' ? 'Chapter Summary' : 'Resumo do Capítulo'}:</span>
                                                    </div>
                                                    <p className="text-slate-300 text-sm pl-6 leading-relaxed">{characterData.resumoCap}</p>
                                                </div>
                                            )}

                                            {/* External Links */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {characterData.capUrl && (
                                                    <CyberButton
                                                        onClick={() => window.open(characterData.capUrl, '_blank')}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs"
                                                    >
                                                        <BookOpen className="w-3 h-3 mr-1" />
                                                        {language === 'en' ? 'Read Chapter' : 'Ler Capítulo'}
                                                    </CyberButton>
                                                )}

                                                {characterData.qrCodeUrl && (
                                                    <CyberButton
                                                        onClick={() => window.open(characterData.qrCodeUrl, '_blank')}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs"
                                                    >
                                                        <span className="mr-1">📱</span>
                                                        QR Code
                                                    </CyberButton>
                                                )}
                                            </div>
                                        </div>
                                    </CyberCardContent>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CyberCard>
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
