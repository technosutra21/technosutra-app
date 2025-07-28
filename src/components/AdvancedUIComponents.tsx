import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import {
  Loader2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ===== ADVANCED BUTTON COMPONENT =====
interface AdvancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyber' | 'buddha' | 'void' | 'glass' | 'hologram';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glowEffect?: boolean;
  pulseEffect?: boolean;
  children: React.ReactNode;
}

export const AdvancedButton: React.FC<AdvancedButtonProps> = ({
  variant = 'cyber',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  glowEffect = false,
  pulseEffect = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [_isPressed, setIsPressed] = useState(false);

  const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  const variantClasses = {
    cyber: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border border-cyan-400 hover:from-cyan-400 hover:to-blue-400 focus:ring-cyan-500 shadow-lg hover:shadow-cyan-500/25",
    buddha: "bg-gradient-to-r from-yellow-500 to-orange-500 text-black border border-yellow-400 hover:from-yellow-400 hover:to-orange-400 focus:ring-yellow-500 shadow-lg hover:shadow-yellow-500/25",
    void: "bg-gradient-to-r from-gray-900 to-black text-white border border-gray-700 hover:from-gray-800 hover:to-gray-900 focus:ring-gray-500 shadow-lg hover:shadow-gray-500/25",
    glass: "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 focus:ring-white/50 shadow-lg",
    hologram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-purple-400 hover:from-purple-400 hover:to-pink-400 focus:ring-purple-500 shadow-lg hover:shadow-purple-500/25"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-base rounded-lg",
    lg: "px-6 py-3 text-lg rounded-xl",
    xl: "px-8 py-4 text-xl rounded-2xl"
  };

  return (
    <motion.button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        glowEffect && "animate-cyber-pulse",
        pulseEffect && "animate-pulse",
        className
      )}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98, y: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTapStart={() => setIsPressed(true)}
      onTapEnd={() => setIsPressed(false)}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Background Effects */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {/* Content */}
      <span className="relative flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText || 'Loading...'}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </span>

      {/* Glow Effect */}
      {glowEffect && (
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0"
          animate={isHovered ? { opacity: 0.3 } : { opacity: 0 }}
          style={{
            background: variant === 'cyber' ? 'radial-gradient(circle, cyan 0%, transparent 70%)' :
                       variant === 'buddha' ? 'radial-gradient(circle, gold 0%, transparent 70%)' :
                       'radial-gradient(circle, white 0%, transparent 70%)',
            filter: 'blur(10px)'
          }}
        />
      )}
    </motion.button>
  );
};

// ===== ADVANCED CARD COMPONENT =====
interface AdvancedCardProps {
  variant?: 'cyber' | 'buddha' | 'glass' | 'void';
  hover3D?: boolean;
  glowOnHover?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AdvancedCard: React.FC<AdvancedCardProps> = ({
  variant = 'glass',
  hover3D = true,
  glowOnHover = true,
  children,
  className
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    
    setMousePosition({ x, y });
  }, []);

  const variantClasses = {
    cyber: "bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10",
    buddha: "bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 shadow-lg shadow-yellow-500/10",
    glass: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl",
    void: "bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-700/50 shadow-2xl"
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative rounded-2xl p-6 overflow-hidden",
        variantClasses[variant],
        className
      )}
      style={hover3D ? {
        transform: `perspective(1000px) rotateX(${mousePosition.y * 10}deg) rotateY(${mousePosition.x * 10}deg)`
      } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      whileHover={hover3D ? { scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Glow Effect */}
      {glowOnHover && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0"
          animate={isHovered ? { opacity: 0.1 } : { opacity: 0 }}
          style={{
            background: `radial-gradient(circle at ${(mousePosition.x + 1) * 50}% ${(mousePosition.y + 1) * 50}%, 
              ${variant === 'cyber' ? 'cyan' : variant === 'buddha' ? 'gold' : 'white'} 0%, transparent 50%)`
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Animated Border */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `conic-gradient(from ${mousePosition.x * 360}deg, transparent, 
            ${variant === 'cyber' ? 'cyan' : variant === 'buddha' ? 'gold' : 'white'}, transparent)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          padding: '1px'
        }}
        animate={isHovered ? { opacity: 0.3 } : { opacity: 0 }}
      />
    </motion.div>
  );
};

// ===== ADVANCED LOADING SPINNER =====
interface AdvancedSpinnerProps {
  variant?: 'cyber' | 'buddha' | 'matrix' | 'sacred';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}

export const AdvancedSpinner: React.FC<AdvancedSpinnerProps> = ({
  variant = 'cyber',
  size = 'md',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const spinnerVariants = {
    cyber: (
      <motion.div
        className={cn("border-2 border-cyan-500/30 border-t-cyan-500 rounded-full", sizeClasses[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
    ),
    buddha: (
      <motion.div className="relative">
        <motion.div
          className={cn("border-2 border-yellow-500/30 border-t-yellow-500 rounded-full", sizeClasses[size])}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className={cn("absolute inset-2 border border-orange-500/50 border-r-orange-500 rounded-full")}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </motion.div>
    ),
    matrix: (
      <div className={cn("grid grid-cols-3 gap-1", sizeClasses[size])}>
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 h-1 bg-green-500 rounded-full"
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.1
            }}
          />
        ))}
      </div>
    ),
    sacred: (
      <motion.div className="relative">
        <motion.div
          className={cn("border-2 border-purple-500/30 rounded-full", sizeClasses[size])}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <Circle className="w-4 h-4 text-purple-500" />
        </motion.div>
      </motion.div>
    )
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {spinnerVariants[variant]}
      {text && (
        <motion.p
          className="text-sm text-gray-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// ===== ADVANCED PROGRESS BAR =====
interface AdvancedProgressProps {
  value: number;
  max?: number;
  variant?: 'cyber' | 'buddha' | 'rainbow';
  showPercentage?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AdvancedProgress: React.FC<AdvancedProgressProps> = ({
  value,
  max = 100,
  variant = 'cyber',
  showPercentage = true,
  animated = true,
  size = 'md'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const _springValue = useSpring(percentage, { stiffness: 100, damping: 30 });

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    cyber: 'from-cyan-500 to-blue-500',
    buddha: 'from-yellow-500 to-orange-500',
    rainbow: 'from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500'
  };

  return (
    <div className="w-full space-y-2">
      {showPercentage && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <motion.span
            className="text-white font-medium"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            key={Math.floor(percentage)}
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
      )}
      
      <div className={cn("w-full bg-gray-800 rounded-full overflow-hidden", sizeClasses[size])}>
        <motion.div
          className={cn("h-full bg-gradient-to-r rounded-full relative", variantClasses[variant])}
          style={{ width: `${percentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {animated && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// ===== ADVANCED TOOLTIP =====
interface AdvancedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'cyber' | 'buddha' | 'glass';
}

export const AdvancedTooltip: React.FC<AdvancedTooltipProps> = ({
  content,
  children,
  position = 'top',
  variant = 'glass'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const variantClasses = {
    cyber: 'bg-cyan-900/90 border-cyan-500/50 text-cyan-100',
    buddha: 'bg-yellow-900/90 border-yellow-500/50 text-yellow-100',
    glass: 'bg-black/80 backdrop-blur-md border-white/20 text-white'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              "absolute z-50 px-3 py-2 text-sm rounded-lg border shadow-lg whitespace-nowrap",
              positionClasses[position],
              variantClasses[variant]
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {content}
            
            {/* Arrow */}
            <div
              className={cn(
                "absolute w-2 h-2 transform rotate-45 border",
                variantClasses[variant],
                position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0',
                position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0',
                position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0',
                position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
