import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Infinity as InfinityIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface LoadingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  progress: number;
  completed: boolean;
}

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  steps: LoadingStep[];
  overallProgress: number;
  currentQuote: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Carregando TECHNO SUTRA...",
  showProgress = false,
  steps,
  overallProgress,
  currentQuote,
}) => {
  const currentStepIndex = steps?.findIndex(step => !step.completed) ?? -1;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center sacred-pattern">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Main Loading Icon */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="mb-8 relative"
        >
          <div className="w-20 h-20 mx-auto relative">
            <InfinityIcon className="w-full h-full text-cyan-400" />
            
            {/* Glowing effect */}
            <motion.div
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 w-full h-full text-cyan-400 blur-sm"
            >
              <InfinityIcon className="w-full h-full" />
            </motion.div>
          </div>
          
          {/* Orbiting particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                rotate: 360,
              }}
              transition={{ 
                duration: 4 + i,
                repeat: Infinity, 
                ease: "linear",
                delay: i * 0.5
              }}
              className="absolute inset-0 w-20 h-20"
            >
              <div 
                className="w-2 h-2 bg-purple-400 rounded-full absolute"
                style={{
                  top: '10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Message */}
        <motion.h2
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-bold gradient-text mb-4"
        >
          {message}
        </motion.h2>

        {/* Progress Section */}
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-4"
          >
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Progresso Geral</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress 
                value={overallProgress} 
                className="h-2 bg-slate-800"
              />
            </div>

            {/* Individual Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: index <= currentStepIndex ? 1 : 0.5,
                    x: 0 
                  }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    step.completed 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : index === currentStepIndex
                        ? 'border-cyan-500/30 bg-cyan-500/10'
                        : 'border-slate-700/30 bg-slate-800/30'
                  }`}
                >
                  <motion.div
                    animate={index === currentStepIndex ? { 
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ 
                      duration: 2, 
                      repeat: index === currentStepIndex ? Infinity : 0 
                    }}
                    className={`${
                      step.completed 
                        ? 'text-green-400' 
                        : index === currentStepIndex
                          ? 'text-cyan-400'
                          : 'text-slate-500'
                    }`}
                  >
                    {step.icon}
                  </motion.div>
                  
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${
                      step.completed 
                        ? 'text-green-300' 
                        : index === currentStepIndex
                          ? 'text-cyan-300'
                          : 'text-slate-400'
                    }`}>
                      {step.label}
                    </div>
                    
                    {index === currentStepIndex && !step.completed && (
                      <div className="mt-1">
                        <Progress 
                          value={step.progress} 
                          className="h-1 bg-slate-700"
                        />
                      </div>
                    )}
                  </div>
                  
                  {step.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Zen Quote */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuote}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-slate-400 italic text-sm leading-relaxed">
              "{currentQuote}"
            </p>
            <div className="mt-2 text-xs text-cyan-400">
              — Sabedoria Budista Digital
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Loading Dots */}
        <motion.div 
          className="flex justify-center gap-1 mt-6"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-cyan-400 rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
