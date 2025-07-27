import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface CustomWaypoint {
  id: string;
  coordinates: [number, number];
  name: string;
  type: 'start' | 'end' | 'waypoint';
  description?: string;
}

export interface CustomRoute {
  id: string;
  name: string;
  description: string;
  waypoints: CustomWaypoint[];
  createdAt: Date;
  isActive: boolean;
}

export const useRouteManager = () => {
  const [routes, setRoutes] = useState<CustomRoute[]>([]);
  const [activeRoute, setActiveRoute] = useState<CustomRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load routes from localStorage on mount
  useEffect(() => {
    try {
      const savedRoutes = localStorage.getItem('technosutra-routes');
      const savedActiveRoute = localStorage.getItem('technosutra-active-route');
      
      if (savedRoutes) {
        const parsedRoutes = JSON.parse(savedRoutes).map((route: any) => ({
          ...route,
          createdAt: new Date(route.createdAt)
        }));
        setRoutes(parsedRoutes);
      }
      
      if (savedActiveRoute) {
        const parsedActiveRoute = JSON.parse(savedActiveRoute);
        setActiveRoute({
          ...parsedActiveRoute,
          createdAt: new Date(parsedActiveRoute.createdAt)
        });
      }
    } catch (error) {
      logger.error('Error loading routes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save routes to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('technosutra-routes', JSON.stringify(routes));
        logger.info(`📱 Saved ${routes.length} routes to localStorage`);
      } catch (error) {
        logger.error('Error saving routes:', error);
      }
    }
  }, [routes, isLoading]);

  // Save active route to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        if (activeRoute) {
          localStorage.setItem('technosutra-active-route', JSON.stringify(activeRoute));
          logger.info(`🎯 Active route set: ${activeRoute.name}`);
        } else {
          localStorage.removeItem('technosutra-active-route');
          logger.info('🎯 Active route cleared');
        }
      } catch (error) {
        logger.error('Error saving active route:', error);
      }
    }
  }, [activeRoute, isLoading]);

  const saveRoute = useCallback((route: Omit<CustomRoute, 'id' | 'createdAt'>) => {
    const newRoute: CustomRoute = {
      ...route,
      id: `route-${Date.now()}`,
      createdAt: new Date()
    };

    setRoutes(prev => [...prev, newRoute]);
    logger.info(`💾 Route saved: ${newRoute.name} with ${newRoute.waypoints.length} waypoints`);
    
    return newRoute;
  }, []);

  const deleteRoute = useCallback((routeId: string) => {
    setRoutes(prev => prev.filter(route => route.id !== routeId));
    
    // Clear active route if it was deleted
    if (activeRoute?.id === routeId) {
      setActiveRoute(null);
    }
    
    logger.info(`🗑️ Route deleted: ${routeId}`);
  }, [activeRoute]);

  const duplicateRoute = useCallback((routeId: string) => {
    const routeToDuplicate = routes.find(route => route.id === routeId);
    if (!routeToDuplicate) return null;

    const duplicatedRoute: CustomRoute = {
      ...routeToDuplicate,
      id: `route-${Date.now()}`,
      name: `${routeToDuplicate.name} (Cópia)`,
      createdAt: new Date(),
      isActive: false
    };

    setRoutes(prev => [...prev, duplicatedRoute]);
    logger.info(`📋 Route duplicated: ${duplicatedRoute.name}`);
    
    return duplicatedRoute;
  }, [routes]);

  const setRouteActive = useCallback((routeId: string | null) => {
    if (routeId === null) {
      setActiveRoute(null);
      return;
    }

    const route = routes.find(r => r.id === routeId);
    if (route) {
      // Mark all routes as inactive first
      setRoutes(prev => prev.map(r => ({ ...r, isActive: false })));
      
      // Set the selected route as active
      const activeRouteWithFlag = { ...route, isActive: true };
      setActiveRoute(activeRouteWithFlag);
      
      // Update the route in the array
      setRoutes(prev => prev.map(r => 
        r.id === routeId ? activeRouteWithFlag : r
      ));
    }
  }, [routes]);

  const updateRoute = useCallback((routeId: string, updates: Partial<CustomRoute>) => {
    setRoutes(prev => prev.map(route => 
      route.id === routeId 
        ? { ...route, ...updates }
        : route
    ));

    // Update active route if it's the one being updated
    if (activeRoute?.id === routeId) {
      setActiveRoute(prev => prev ? { ...prev, ...updates } : null);
    }

    logger.info(`✏️ Route updated: ${routeId}`);
  }, [activeRoute]);

  const exportRoute = useCallback((routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return null;

    const exportData = {
      name: route.name,
      description: route.description,
      waypoints: route.waypoints,
      createdAt: route.createdAt,
      exportedAt: new Date(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    return {
      data: exportData,
      downloadUrl: URL.createObjectURL(dataBlob),
      filename: `technosutra-route-${route.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`
    };
  }, [routes]);

  const importRoute = useCallback((routeData: any) => {
    try {
      // Validate route data structure
      if (!routeData.name || !routeData.waypoints || !Array.isArray(routeData.waypoints)) {
        throw new Error('Invalid route data format');
      }

      const importedRoute: CustomRoute = {
        id: `route-${Date.now()}`,
        name: `${routeData.name} (Importada)`,
        description: routeData.description || '',
        waypoints: routeData.waypoints,
        createdAt: new Date(),
        isActive: false
      };

      setRoutes(prev => [...prev, importedRoute]);
      logger.info(`📥 Route imported: ${importedRoute.name}`);
      
      return importedRoute;
    } catch (error) {
      logger.error('Error importing route:', error);
      throw error;
    }
  }, []);

  return {
    // State
    routes,
    activeRoute,
    isLoading,
    
    // Actions
    saveRoute,
    deleteRoute,
    duplicateRoute,
    setRouteActive,
    updateRoute,
    exportRoute,
    importRoute,
    
    // Computed values
    routeCount: routes.length,
    hasActiveRoute: !!activeRoute,
    totalWaypoints: routes.reduce((sum, route) => sum + route.waypoints.length, 0)
  };
};