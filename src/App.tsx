import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import EnhancedErrorBoundary from "./components/EnhancedErrorBoundary";
import { EnhancedNotificationSystem } from "./components/EnhancedNotificationSystem";
import { pwaInitializationService } from "./services/pwaInitializationService";
import { advancedOptimizationService } from "./services/advancedOptimizationService";
import { criticalPerformanceOptimizer } from "./services/criticalPerformanceOptimizer";
import LoadingScreen from "./components/LoadingScreen";
import Navigation from "./components/Navigation";
import { LanguageProvider } from "./providers/LanguageProvider";
import { useLanguage } from "./hooks/useLanguage";
import { logger } from "./lib/logger";
import { analyticsService } from "./services/analyticsService";
import { appInitializationService } from "./services/appInitializationService";
import "./styles/advanced-design-system.css";
import "./styles/responsive-enhancements.css";
import "./styles/performance-optimized-design.css";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const MapPage = lazy(() => import("./pages/Map"));
const Gallery = lazy(() => import("./pages/Gallery"));
const RouteCreator = lazy(() => import("./pages/RouteCreatorPage"));
const ModelViewer = lazy(() => import("./pages/ModelViewer"));
const AR = lazy(() => import("./pages/ARPage"));
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

// Enhanced Loading component for Suspense fallback
const SuspenseLoadingScreen = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto cyberpunk-glow"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-primary text-glow">TECHNO SUTRA</h2>
          <p className="text-muted-foreground animate-pulse">{t('common.preparingExperience')}</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Starting...');
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('🚀 Starting TECHNO SUTRA App initialization...');

        // Track initialization progress
        const progressInterval = setInterval(() => {
          const progress = appInitializationService.getInitializationProgress();
          setInitializationProgress(progress.overall);
          setCurrentStep(progress.currentStep);
        }, 100);

        // Initialize the app
        const result = await appInitializationService.initialize();

        // Initialize PWA functionality in background
        if (result.success) {
          setTimeout(async () => {
            try {
              await pwaInitializationService.quickStart();

              // Full initialization after quick start
              setTimeout(() => {
                pwaInitializationService.fullInitialization().catch(error => {
                  console.warn('Background PWA initialization failed:', error);
                });
              }, 3000);

              // Initialize critical performance optimizations immediately
              criticalPerformanceOptimizer.forceOptimization();

              // Initialize advanced optimizations
              setTimeout(() => {
                // Initialize the service by accessing it
                void advancedOptimizationService;
                console.log('🚀 Advanced optimization service initialized');
              }, 1000);

            } catch (error) {
              console.error('PWA initialization failed:', error);
            }
          }, 1000);
        }

        clearInterval(progressInterval);

        if (result.success) {
          setIsInitialized(true);
          logger.info('✅ TECHNO SUTRA App fully initialized');

          // Track successful initialization
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

        // Track initialization failure
        analyticsService.trackError(error as Error, {
          context: 'app_initialization',
          critical: true,
        });
      }
    };

    initializeApp();
  }, []);

  // Show loading screen during initialization
  if (!isInitialized) {
    if (initializationError) {
      return (
        <EnhancedErrorBoundary>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-6">
              <h1 className="text-2xl font-bold text-red-400 mb-4">
                Falha na Inicialização
              </h1>
              <p className="text-slate-400 mb-6">
                {initializationError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </EnhancedErrorBoundary>
      );
    }

    return (
      <LoadingScreen
        message="Inicializando TECHNO SUTRA..."
        showProgress={true}
        steps={[
          {
            id: 'core',
            label: currentStep,
            icon: <div className="w-4 h-4 bg-cyan-400 rounded-full" />,
            progress: initializationProgress,
            completed: initializationProgress >= 100,
          },
        ]}
      />
    );
  }

  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <div className="dark">
                <Navigation />
                <Suspense fallback={<SuspenseLoadingScreen />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/route-creator" element={<RouteCreator />} />
                    <Route path="/model-viewer" element={<ModelViewer />} />
                    <Route path="/ar" element={<AR />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>

      {/* Enhanced Notification System */}
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
