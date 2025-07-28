import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { logger } from '@/lib/logger';

import StepNavigation from './StepNavigation';
import RouteTypeSelector from './RouteTypeSelector';
import RoutePointsBuilder from './RoutePointsBuilder';
import RouteCustomizer from './RouteCustomizer';
import RoutePreview from './RoutePreview';
import InteractiveMapCanvas from './InteractiveMapCanvas';

export interface RouteWaypoint {
  id: string;
  coordinates: [number, number];
  name: string;
  type: 'start' | 'end' | 'waypoint';
  description?: string;
}

export interface RouteData {
  id?: string;
  name: string;
  description: string;
  type: 'spiritual' | 'urban' | 'natural';
  waypoints: RouteWaypoint[];
  distance: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPublic: boolean;
  created?: Date;
}

const getSteps = (t: (key: string) => string) => [
  { id: 'type', title: t('routeCreator.steps.type.title'), description: t('routeCreator.steps.type.description') },
  { id: 'points', title: t('routeCreator.steps.points.title'), description: t('routeCreator.steps.points.description') },
  { id: 'customize', title: t('routeCreator.steps.customize.title'), description: t('routeCreator.steps.customize.description') },
  { id: 'preview', title: t('routeCreator.steps.preview.title'), description: t('routeCreator.steps.preview.description') }
];

interface RouteCreatorWizardProps {
  onRouteTypeChange?: (type: 'spiritual' | 'urban' | 'nature') => void;
  currentRouteType?: 'spiritual' | 'urban' | 'nature';
}

const RouteCreatorWizard: React.FC<RouteCreatorWizardProps> = ({
  onRouteTypeChange,
  currentRouteType = 'spiritual'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [routeData, setRouteData] = useState<RouteData>({
    name: '',
    description: '',
    type: currentRouteType,
    waypoints: [],
    distance: 0,
    estimatedTime: 0,
    difficulty: 'easy',
    tags: [],
    isPublic: false
  });
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const STEPS = getSteps(t);

  const currentStepData = STEPS[currentStep];
  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  const updateRouteData = (updates: Partial<RouteData>) => {
    setRouteData(prev => {
      const newData = { ...prev, ...updates };

      // Notify parent of route type changes
      if (updates.type && onRouteTypeChange) {
        onRouteTypeChange(updates.type as 'spiritual' | 'urban' | 'nature');
      }

      // Auto-calculate distance when waypoints change
      if (updates.waypoints) {
        const distance = calculateRouteDistance(updates.waypoints);
        newData.distance = distance;
      }
      
      return newData;
    });
  };

  // Calculate distance using Haversine formula
  const calculateRouteDistance = (waypoints: RouteWaypoint[]) => {
    if (waypoints.length < 2) return 0;
    
    // Sort waypoints properly: start -> waypoints -> end
    const sortedWaypoints = [
      ...waypoints.filter(w => w.type === 'start'),
      ...waypoints.filter(w => w.type === 'waypoint'),
      ...waypoints.filter(w => w.type === 'end')
    ];
    
    let totalDistance = 0;
    for (let i = 1; i < sortedWaypoints.length; i++) {
      const [lon1, lat1] = sortedWaypoints[i - 1].coordinates;
      const [lon2, lat2] = sortedWaypoints[i].coordinates;
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    
    return totalDistance;
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Type selection
        return true; // Type is always valid as we have a default
      case 1: // Points
        return routeData.waypoints.length >= 2; // Need at least start and end
      case 2: // Customize
        return routeData.name.trim().length > 0; // Need a name
      case 3: // Preview
        return true; // Always can proceed from preview
      default:
        return false;
    }
  };

  const handleSaveRoute = async () => {
    setIsCreating(true);
    try {
      const finalRoute = {
        ...routeData,
        id: `route-${Date.now()}`,
        created: new Date()
      };

      // Save to localStorage
      const savedRoutes = JSON.parse(localStorage.getItem('technosutra-routes') || '[]');
      savedRoutes.push(finalRoute);
      localStorage.setItem('technosutra-routes', JSON.stringify(savedRoutes));

      logger.info('Route saved successfully:', finalRoute);
      
      toast({
        title: "Rota Criada com Sucesso!",
        description: `${finalRoute.name} foi salva e está pronta para uso.`,
      });

      // Reset wizard
      setTimeout(() => {
        setCurrentStep(0);
        setRouteData({
          name: '',
          description: '',
          type: 'spiritual',
          waypoints: [],
          distance: 0,
          estimatedTime: 0,
          difficulty: 'easy',
          tags: [],
          isPublic: false
        });
        setIsCreating(false);
      }, 2000);

    } catch (error) {
      logger.error('Error saving route:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a rota. Tente novamente.",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <RouteTypeSelector
            selectedType={routeData.type}
            onTypeSelect={(type) => updateRouteData({ type })}
          />
        );
      case 1:
        return (
          <RoutePointsBuilder
            waypoints={routeData.waypoints}
            onWaypointsChange={(waypoints) => updateRouteData({ waypoints })}
            routeType={routeData.type}
          />
        );
      case 2:
        return (
          <RouteCustomizer
            routeData={routeData}
            onUpdate={updateRouteData}
          />
        );
      case 3:
        return (
          <RoutePreview
            routeData={routeData}
            onSave={handleSaveRoute}
            isCreating={isCreating}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mobile: Full screen wizard */}
      <div className="lg:hidden min-h-screen bg-background">
        {/* Header with Progress */}
        <div className="bg-card border-b border-border p-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-accent">
                  {t('routeCreator.title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentStepData.description}
                </p>
              </div>
              <Badge className="bg-primary text-primary-foreground font-bold px-4 py-2 self-start sm:self-auto">
                {t('routeCreator.step')} {currentStep + 1} {t('routeCreator.of')} {STEPS.length}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{t('routeCreator.progress')}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Navigation - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:block">
            <StepNavigation
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
              completedSteps={currentStep}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area - Responsive Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
        {/* Step Content Panel - Full width on mobile, sidebar on desktop */}
        <div className="w-full lg:w-96 lg:min-w-96 bg-card border-b lg:border-b-0 lg:border-r border-border">
          <div className="p-4 lg:p-6 lg:h-full lg:overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {currentStepData.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.description}
                  </p>
                </div>

                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons - Responsive */}
          <div className="p-4 lg:p-6 border-t border-border bg-card/50 sticky bottom-0 lg:static">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex-1 order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('routeCreator.previous')}
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex-1 bg-primary text-primary-foreground font-bold order-1 sm:order-2"
                >
                  {t('routeCreator.next')}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSaveRoute}
                  disabled={!canProceed() || isCreating}
                  className="flex-1 bg-primary text-primary-foreground font-bold order-1 sm:order-2"
                >
                  {isCreating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                      />
                      {t('routeCreator.creating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('routeCreator.createRoute')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Map Panel - Full width on mobile, right panel on desktop */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
          <InteractiveMapCanvas
            waypoints={routeData.waypoints}
            onWaypointsChange={(waypoints) => updateRouteData({ waypoints })}
            routeType={routeData.type}
            isInteractive={currentStep === 1}
          />
        </div>
      </div>

      {/* Mobile Step Navigation - Shown only on mobile */}
      <div className="lg:hidden bg-card border-t border-border p-4 sticky bottom-0">
        <div className="flex justify-center">
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
                title={step.title}
              />
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Desktop: Overlay wizard on top of map */}
      <div className="hidden lg:block">
        <div className="fixed top-20 left-6 w-96 max-h-[calc(100vh-120px)] bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl z-30 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-accent">
                {t('routeCreator.title')}
              </h1>
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                {currentStep + 1}/{STEPS.length}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{t('routeCreator.progress')}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5" />
            </div>

            {/* Step Navigation */}
            <StepNavigation
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
              completedSteps={currentStep}
            />
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(100vh-300px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {currentStepData.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.description}
                  </p>
                </div>

                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="p-4 border-t border-border bg-card/50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex-1"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('routeCreator.previous')}
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex-1 bg-primary text-primary-foreground font-bold"
                  size="sm"
                >
                  {t('routeCreator.next')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSaveRoute}
                  disabled={!canProceed() || isCreating}
                  className="flex-1 bg-primary text-primary-foreground font-bold"
                  size="sm"
                >
                  {isCreating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full mr-1"
                      />
                      {t('routeCreator.creating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      {t('routeCreator.createRoute')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteCreatorWizard;
