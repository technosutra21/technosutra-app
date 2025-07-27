import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: number;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStep,
  onStepClick,
  completedSteps
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => {
        const isCompleted = index < completedSteps;
        const isCurrent = index === currentStep;
        const isClickable = index <= completedSteps;

        return (
          <div key={step.id} className="flex items-center">
            <motion.div
              className={`flex items-center gap-3 cursor-pointer ${
                isClickable ? 'hover:scale-105' : 'cursor-not-allowed opacity-50'
              }`}
              onClick={() => isClickable && onStepClick(index)}
              whileHover={isClickable ? { scale: 1.02 } : {}}
              whileTap={isClickable ? { scale: 0.98 } : {}}
            >
              <div className="relative">
                {/* Step Circle */}
                <motion.div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'border-accent bg-accent text-black font-bold'
                      : isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-muted-foreground bg-background text-muted-foreground'
                  }`}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    boxShadow: isCurrent ? '0 0 20px rgba(0, 255, 255, 0.6)' : '0 0 0px transparent'
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </motion.div>

                {/* Pulse effect for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-accent"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </div>

              {/* Step Label */}
              <div className="hidden sm:block">
                <div className={`text-sm font-medium ${
                  isCurrent ? 'text-accent' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </div>
              </div>
            </motion.div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <motion.div
                  className={`h-0.5 transition-all duration-500 ${
                    index < completedSteps ? 'bg-green-500' : 'bg-muted-foreground/30'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.2 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepNavigation;
