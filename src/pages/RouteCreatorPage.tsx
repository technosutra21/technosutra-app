import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouteCreator } from '@/hooks/useRouteCreator';
import { RouteTypeSelector } from '@/components/RouteCreator/RouteTypeSelector';
import { RouteBuilder } from '@/components/RouteCreator/RouteBuilder';
import { RouteCreatorMap } from '@/components/RouteCreator/RouteCreatorMap';

const RouteCreatorPage = () => {
  const {
    currentStep,
    selectedTrailType,
    trail,
    isCreating,
    mapContainer,
    selectTrailType,
    removeTrailPoint,
    updateTrailDetails,
    saveTrail,
    setCurrentStep,
  } = useRouteCreator();

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex overflow-hidden">
      <div className="w-full md:w-1/3 lg:w-1/4 h-full bg-slate-800/30 backdrop-blur-sm z-10 shadow-2xl">
        <AnimatePresence mode="wait">
          {currentStep === 'type' ? (
            <RouteTypeSelector
              key="type-selector"
              onSelect={selectTrailType}
              selectedType={selectedTrailType}
            />
          ) : (
            <RouteBuilder
              key="route-builder"
              trail={trail}
              onUpdate={updateTrailDetails}
              onRemovePoint={removeTrailPoint}
              onSave={saveTrail}
              onBack={() => setCurrentStep('type')}
              isSaving={isCreating}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="flex-grow h-full">
        <RouteCreatorMap mapContainer={mapContainer} />
      </div>
    </div>
  );
};

export default RouteCreatorPage; 