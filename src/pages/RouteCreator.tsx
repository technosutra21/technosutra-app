import React, { useState } from 'react';
import RouteCreatorWizard from '@/components/RouteCreator';
import { WorkingMapCanvas } from '@/components/RouteCreator/WorkingMapCanvas';
import { useLanguage } from '@/hooks/useLanguage';

const RouteCreator = () => {
  const { t } = useLanguage();
  const [routeType, setRouteType] = useState<'spiritual' | 'urban' | 'nature'>('spiritual');

  return (
    <div className="relative min-h-screen bg-background">
      {/* Map as base layer - always visible */}
      <div className="absolute inset-0">
        <WorkingMapCanvas
          routeType={routeType}
          className="w-full h-full"
        />
      </div>

      {/* Wizard overlay - responsive */}
      <div className="relative z-10 min-h-screen">
        <div className="lg:absolute lg:inset-0 lg:pointer-events-none">
          <div className="lg:pointer-events-auto">
            <RouteCreatorWizard
              onRouteTypeChange={setRouteType}
              currentRouteType={routeType}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteCreator;
