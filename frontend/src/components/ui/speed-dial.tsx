import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface SpeedDialAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

interface SpeedDialProps {
  children?: React.ReactNode;
  actions: SpeedDialAction[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  buttonClassName?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

const getActionPosition = (index: number, direction: SpeedDialProps['direction']) => {
  const distance = (index + 1) * 60;
  
  switch (direction) {
    case 'up':
      return { x: 0, y: -distance };
    case 'down':
      return { x: 0, y: distance };
    case 'left':
      return { x: -distance, y: 0 };
    case 'right':
      return { x: distance, y: 0 };
    default:
      return { x: 0, y: -distance };
  }
};

const getTooltipPosition = (side: SpeedDialProps['tooltipSide']) => {
  switch (side) {
    case 'left':
      return 'right-full mr-2 top-1/2 -translate-y-1/2';
    case 'right':
      return 'left-full ml-2 top-1/2 -translate-y-1/2';
    case 'top':
      return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    case 'bottom':
      return 'top-full mt-2 left-1/2 -translate-x-1/2';
    default:
      return 'right-full mr-2 top-1/2 -translate-y-1/2';
  }
};

export const SpeedDial: React.FC<SpeedDialProps> = ({
  children,
  actions,
  open: controlledOpen,
  onOpenChange,
  direction = 'up',
  className,
  buttonClassName,
  tooltipSide = 'left'
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleToggle = () => {
    const newOpen = !isOpen;
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleActionClick = (action: SpeedDialAction) => {
    action.onClick();
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && actions.map((action, index) => {
          const position = getActionPosition(index, direction);
          const IconComponent = action.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                x: position.x, 
                y: position.y 
              }}
              exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              transition={{ 
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              className="absolute inset-0 group"
            >
              <Button
                variant="default"
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className={cn(
                  "h-12 w-12 rounded-full cyberpunk-focus shadow-lg neon-glow",
                  "bg-primary/90 hover:bg-primary backdrop-blur-sm",
                  "transition-all duration-200",
                  action.className
                )}
                aria-label={action.label}
              >
                <IconComponent className="w-5 h-5" />
              </Button>
              
              {/* Tooltip */}
              <div 
                className={cn(
                  "absolute z-50 opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-200 pointer-events-none",
                  "px-2 py-1 bg-popover text-popover-foreground text-xs",
                  "rounded border border-border whitespace-nowrap",
                  "amoled-card",
                  getTooltipPosition(tooltipSide)
                )}
              >
                {action.label}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Main Button */}
      <Button
        variant="default"
        size="sm"
        onClick={handleToggle}
        className={cn(
          "h-14 w-14 rounded-full cyberpunk-focus relative z-10",
          "gradient-neon hover:scale-105 active:scale-95",
          "transition-all duration-200 shadow-xl",
          "text-black font-bold",
          buttonClassName
        )}
        aria-label={isOpen ? "Fechar menu rápido" : "Abrir menu rápido"}
        aria-expanded={isOpen}
      >
        {children ? (
          children
        ) : (
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.div>
        )}
      </Button>
    </div>
  );
};

export default SpeedDial;
