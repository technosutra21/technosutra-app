import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface BottomSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  snapPoints?: number[]; // Percentages of screen height
  defaultSnap?: number; // Index of default snap point
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showHandle?: boolean;
  showCloseButton?: boolean;
  backdrop?: boolean;
  preventClose?: boolean;
  onSnapChange?: (snapIndex: number) => void;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  isOpen,
  onClose,
  title,
  description,
  snapPoints = [20, 50, 90],
  defaultSnap = 1,
  className,
  headerClassName,
  contentClassName,
  showHandle = true,
  showCloseButton = true,
  backdrop = true,
  preventClose = false,
  onSnapChange,
  maxHeight = '90vh'
}) => {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnap);

  // Reset snap point when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentSnapIndex(defaultSnap);
    }
  }, [isOpen, defaultSnap]);

  const currentSnapHeight = snapPoints[currentSnapIndex];


  const handleDragEnd = (_: Event, info: PanInfo) => {
    
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    // Determine new snap point based on velocity and position
    let newSnapIndex = currentSnapIndex;
    
    if (velocity > 500 || offset > 50) {
      // Snap down
      newSnapIndex = Math.max(0, currentSnapIndex - 1);
    } else if (velocity < -500 || offset < -50) {
      // Snap up
      newSnapIndex = Math.min(snapPoints.length - 1, currentSnapIndex + 1);
    }
    
    // Close if dragged to minimum and not prevented
    if (newSnapIndex === 0 && offset > 100 && !preventClose) {
      onClose();
      return;
    }
    
    setCurrentSnapIndex(newSnapIndex);
    onSnapChange?.(newSnapIndex);
  };

  const handleSnapTo = (index: number) => {
    setCurrentSnapIndex(index);
    onSnapChange?.(index);
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const sheetVariants = {
    hidden: {
      y: '100%',
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300
      }
    },
    visible: {
      y: `${100 - currentSnapHeight}%`,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {backdrop && (
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => !preventClose && onClose()}
            />
          )}

          {/* Bottom Sheet */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50",
              "bg-card border-t border-border",
              "rounded-t-3xl shadow-2xl",
              "amoled-card overflow-hidden",
              className
            )}
            style={{ maxHeight }}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center p-2 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || description || showCloseButton) && (
              <div className={cn(
                "flex items-center justify-between p-4 border-b border-border",
                headerClassName
              )}>
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2 className="text-lg font-bold text-foreground text-glow truncate">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Snap Point Controls */}
                  {snapPoints.length > 1 && (
                    <div className="flex flex-col gap-1">
                      {currentSnapIndex < snapPoints.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSnapTo(currentSnapIndex + 1)}
                          className="h-8 w-8 p-0"
                          aria-label="Expandir"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      )}
                      {currentSnapIndex > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSnapTo(currentSnapIndex - 1)}
                          className="h-8 w-8 p-0"
                          aria-label="Recolher"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Close Button */}
                  {showCloseButton && !preventClose && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      aria-label="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className={cn(
              "flex-1 overflow-auto",
              contentClassName
            )}>
              {children}
            </div>

            {/* Snap Point Indicators */}
            {snapPoints.length > 1 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {snapPoints.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleSnapTo(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      currentSnapIndex === index
                        ? "bg-primary scale-125"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    aria-label={`Ir para posição ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
