import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./hooks/LanguageContext";
import { useLanguage } from "./hooks/useLanguage";
import { logger } from "./lib/logger";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const MapPage = lazy(() => import("./pages/Map"));
const Gallery = lazy(() => import("./pages/Gallery"));
const RouteCreator = lazy(() => import("./pages/RouteCreator"));
const ModelViewer = lazy(() => import("./pages/ModelViewer"));
const AR = lazy(() => import("./pages/AR"));
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
const LoadingScreen = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto cyberpunk-glow"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-primary text-glow">Techno Sutra</h2>
          <p className="text-muted-foreground animate-pulse">{t('common.preparingExperience')}</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  logger.info('🚀 Techno Sutra App initialized');

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <div className="dark">
                <Navigation />
                <Suspense fallback={<LoadingScreen />}>
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
    </ErrorBoundary>
  );
};

export default App;
