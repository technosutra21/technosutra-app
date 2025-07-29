import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary";
import { EnhancedNotificationSystem } from "./components/EnhancedNotificationSystem";
import LoadingScreen, { LoadingStep } from "./components/LoadingScreen";
import Navigation from "./components/Navigation";
import { logger } from "./lib/logger";
import { LanguageProvider } from "./providers/LanguageProvider";
import { analyticsService } from "./services/analyticsService";
import { appInitializationService } from "./services/appInitializationService";
import { criticalPerformanceOptimizer } from "./services/criticalPerformanceOptimizer";
import { pwaInitializationService } from "./services/pwaInitializationService";
import { initializeServices, serviceManager } from "./services/serviceManager";
import "./styles/advanced-design-system.css";
import "./styles/performance-optimized-design.css";
import "./styles/responsive-enhancements.css";
import { logEnvironmentStatus } from "./utils/env-checker";
import { pathResolver, getRouterBase } from "./utils/pathResolver";
import { initializeDebugUtils, logErrorWithContext } from "./utils/debugUtils";
import "./utils/animationQuickFix"; // Auto-apply animation fixes
import "./utils/cacheManager"; // Cache management utilities

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const MapPage = lazy(() => import("./pages/Map"));
const Gallery = lazy(() => import("./pages/Gallery"));
const ComingSoonRoute = lazy(() => import("./pages/ComingSoonRoute"));
const ModelViewer = lazy(() => import("./pages/ModelViewer"));
const AR = lazy(() => import("./pages/ARPage"));
const Debug = lazy(() => import("./pages/Debug"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure React Query with optimal settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

const zenQuotes = [
  "A jornada de mil milhas começa com um único passo.",
  "O presente é o único momento que realmente possuímos.",
  "A mente é tudo. O que você pensa, você se torna.",
  "A paz vem de dentro. Não a procure fora.",
  "Cada momento é uma nova oportunidade de despertar.",
];

const AppContent = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [_currentStep, setCurrentStep] = useState('Starting...');
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [currentQuote, setCurrentQuote] = useState('');

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote(zenQuotes[Math.floor(Math.random() * zenQuotes.length)]);
    }, 4000);

    const initializeApp = async () => {
      try {
        logger.info('🚀 Starting TECHNO SUTRA App initialization...');
        
        // Initialize debug utilities first
        try {
          initializeDebugUtils();
        } catch (error) {
          logger.warn('Failed to initialize debug utils:', error);
        }
        
        // Initialize path resolver and update meta tags
        try {
          pathResolver.updateMetaTags();
        } catch (error) {
          logger.warn('Failed to update meta tags:', error);
          logErrorWithContext(error as Error, 'Path Resolver Meta Tags');
        }
        
        // Check environment configuration
        logEnvironmentStatus();

        const progressInterval = setInterval(() => {
          const progress = appInitializationService.getInitializationProgress();
          setInitializationProgress(progress.overall);
          setCurrentStep(progress.currentStep);
          setLoadingSteps(progress.steps.map(s => ({
            id: s.id,
            label: s.name,
            progress: s.progress,
            completed: s.status === 'completed',
            icon: <div className="w-4 h-4 bg-cyan-400 rounded-full" />
          })));
        }, 100);

        const result = await appInitializationService.initialize();

        if (result.success) {
          setTimeout(async () => {
            try {
              await pwaInitializationService.quickStart();
              setTimeout(() => {
                pwaInitializationService.fullInitialization().catch(error => {
                  logger.error('Background PWA initialization failed:', error);
                });
              }, 3000);
              criticalPerformanceOptimizer.forceOptimization();
              setTimeout(async () => {
                await initializeServices();
                const optimizationService = serviceManager.get('optimization') as any;
                if (optimizationService && optimizationService.init) {
                  optimizationService.init();
                }
                logger.info('🚀 Advanced optimization service initialized');
              }, 1000);
            } catch (error) {
              logger.error('PWA initialization failed:', error);
            }
          }, 1000);
        }

        clearInterval(progressInterval);

        if (result.success) {
          setIsInitialized(true);
          logger.info('✅ TECHNO SUTRA App fully initialized');
          analyticsService.trackEvent('app_startup_complete', 'user_action', {
            totalTime: result.totalTime,
            failedServices: result.failedServices,
            warnings: result.warnings,
          });
        } else {
          throw new Error(`Initialization failed: ${result.failedServices.join(', ')}`);
        }
      } catch (error) {
        logger.error('❌ App initialization failed:', error);
        setInitializationError((error as Error).message);
        analyticsService.trackError(error as Error, {
          context: 'app_initialization',
          critical: true,
        });
      }
    };

    initializeApp();
    setCurrentQuote(zenQuotes[Math.floor(Math.random() * zenQuotes.length)]);

    return () => {
      clearInterval(quoteInterval);
    };
  }, []);

  if (!isInitialized) {
    if (initializationError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Falha na Inicialização
            </h1>
            <p className="text-slate-400 mb-6">{initializationError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return (
      <LoadingScreen
        message="Inicializando TECHNO SUTRA..."
        showProgress={true}
        steps={loadingSteps}
        overallProgress={initializationProgress}
        currentQuote={currentQuote}
      />
    );
  }

  return (
    <div className="dark">
      <Navigation />
      <Suspense fallback={<LoadingScreen message="Carregando..." steps={[]} overallProgress={0} currentQuote="" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/route-creator" element={<ComingSoonRoute />} />
          <Route path="/model-viewer" element={<ModelViewer />} />
          <Route path="/ar" element={<AR />} />
          <Route path="/debug" element={<Debug />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App = () => {
  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={(() => {
              try {
                return getRouterBase();
              } catch (error) {
                logger.warn('Failed to get router base, using default:', error);
                return '/';
              }
            })()}>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
      <EnhancedNotificationSystem
        position="top-right"
        enableSound={false}
        enableVibration={true}
        maxNotifications={3}
      />
    </EnhancedErrorBoundary>
  );
};

export default App;
