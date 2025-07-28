import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RouteCreatorWizard from '@/components/RouteCreator';
import { WorkingMapCanvas } from '@/components/RouteCreator/WorkingMapCanvas';


const RouteCreator = () => {
  const [routeType, setRouteType] = useState<'spiritual' | 'urban' | 'nature'>('spiritual');

  return (
    <div className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] bg-black sacred-pattern overflow-x-hidden">
      {/* Enhanced Sacred geometry background with dynamic elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900/50 to-black overflow-hidden">
        {/* Animated energy orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 right-1/3 w-32 h-32 bg-yellow-500/4 rounded-full blur-2xl"
        />

        {/* Floating route planning symbols */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-12 text-cyan-400/15 text-3xl"
        >
          🗺️
        </motion.div>
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.1, 0.25, 0.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-20 right-16 text-purple-400/15 text-4xl"
        >
          🧭
        </motion.div>
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-1/3 right-8 text-yellow-400/15 text-2xl"
        >
          ⭐
        </motion.div>
      </div>

      {/* Map as base layer - always visible */}
      <div className="absolute inset-0 z-0">
        <WorkingMapCanvas
          routeType={routeType}
          className="w-full h-full opacity-90"
        />
      </div>

      {/* Wizard overlay - responsive and properly contained */}
      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 py-6 h-screen flex flex-col lg:flex-row">
          <div className="w-full lg:w-auto lg:max-w-md xl:max-w-lg">
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
