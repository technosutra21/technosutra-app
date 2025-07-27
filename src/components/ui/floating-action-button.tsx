import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  badge?: string | number;
  'aria-label'?: string;
}

const getPositionClasses = (position: FloatingActionButtonProps['position']) => {
  switch (position) {
    case 'bottom-right':
      return 'fixed bottom-6 right-6';
    case 'bottom-left':
      return 'fixed bottom-6 left-6';
    case 'top-right':
      return 'fixed top-6 right-6';
    case 'top-left':
      return 'fixed top-6 left-6';
    case 'center':
      return 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    default:
      return '';
  }
};

const getSizeClasses = (size: FloatingActionButtonProps['size']) => {
  switch (size) {
    case 'sm':
      return 'h-12 w-12';
    case 'lg':
      return 'h-16 w-16';
    default:
      return 'h-14 w-14';
  }
};

const getVariantClasses = (variant: FloatingActionButtonProps['variant']) => {
  switch (variant) {
    case 'secondary':
      return 'bg-secondary/90 hover:bg-secondary text-secondary-foreground';
    case 'accent':
      return 'bg-accent/90 hover:bg-accent text-accent-foreground';
    case 'destructive':
      return 'bg-destructive/90 hover:bg-destructive text-destructive-foreground';
    default:
      return 'gradient-neon text-black font-bold';
  }
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  position,
  className,
  disabled = false,
  loading = false,
  tooltip,
  badge,
  'aria-label': ariaLabel,
  ...props
}) => {
  const sizeClasses = getSizeClasses(size);
  const variantClasses = getVariantClasses(variant);
  const positionClasses = getPositionClasses(position);

  return (
    <motion.div
      className={cn(
        "group relative",
        positionClasses,
        "z-50"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
    >
      <Button
        variant="default"
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "rounded-full cyberpunk-focus shadow-xl",
          "transition-all duration-200 backdrop-blur-sm",
          "hover:shadow-2xl active:shadow-lg",
          sizeClasses,
          variantClasses,
          className
        )}
        aria-label={ariaLabel || tooltip}
        {...props}
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          />
        ) : (
          children
        )}
      </Button>

      {/* Badge */}
      {badge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute -top-2 -right-2 min-w-[1.25rem] h-5",
            "bg-destructive text-destructive-foreground",
            "rounded-full text-xs font-bold",
            "flex items-center justify-center px-1",
            "border-2 border-background",
            "shadow-lg"
          )}
        >
          {badge}
        </motion.div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className={cn(
          "absolute opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200 pointer-events-none",
          "bottom-full mb-2 left-1/2 -translate-x-1/2",
          "px-2 py-1 bg-popover text-popover-foreground text-xs",
          "rounded border border-border whitespace-nowrap",
          "amoled-card z-50"
        )}>
          {tooltip}
        </div>
      )}

      {/* Ripple Effect */}
      <div className={cn(
        "absolute inset-0 rounded-full",
        "bg-current opacity-0 group-active:opacity-20",
        "transition-opacity duration-150",
        "pointer-events-none"
      )} />
    </motion.div>
  );
};

export default FloatingActionButton;
