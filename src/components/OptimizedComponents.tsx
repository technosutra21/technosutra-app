import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// ===== OPTIMIZED LOADING COMPONENT =====
interface OptimizedLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OptimizedLoading = memo<OptimizedLoadingProps>(({ 
  text = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = useMemo(() => ({
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }), []);

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`loading-spinner ${sizeClasses[size]}`} />
      {text && <span className="ml-2 text-sm text-gray-400">{text}</span>}
    </div>
  );
});

OptimizedLoading.displayName = 'OptimizedLoading';

// ===== OPTIMIZED CARD COMPONENT =====
interface OptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const OptimizedCard = memo<OptimizedCardProps>(({ 
  children, 
  className = '', 
  hover = false,
  onClick 
}) => {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const cardClasses = useMemo(() => 
    `clean-borders rounded-lg p-4 ${hover ? 'cursor-pointer' : ''} ${className}`.trim(),
    [className, hover]
  );

  if (onClick) {
    return (
      <motion.div
        className={cardClasses}
        onClick={handleClick}
        whileHover={hover ? { y: -2 } : undefined}
        whileTap={hover ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

// ===== OPTIMIZED BUTTON COMPONENT =====
interface OptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const OptimizedButton = memo<OptimizedButtonProps>(({ 
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const buttonClasses = useMemo(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'cyber-button',
      secondary: 'border border-gray-600 bg-gray-800 text-white hover:bg-gray-700',
      ghost: 'text-cyan-400 hover:bg-cyan-400/10'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
  }, [variant, size, className]);

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...(rest as any)}
    >
      {loading ? (
        <>
          <OptimizedLoading size="sm" text="" />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';

// ===== OPTIMIZED GRID COMPONENT =====
interface OptimizedGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export const OptimizedGrid = memo<OptimizedGridProps>(({
  children,
  columns: _columns = 3,
  gap = 4,
  className = ''
}) => {
  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`,
    gap: `${gap * 0.25}rem`
  }), [gap]);

  return (
    <div 
      className={`w-full ${className}`}
      style={gridStyle}
    >
      {children}
    </div>
  );
});

OptimizedGrid.displayName = 'OptimizedGrid';

// ===== OPTIMIZED IMAGE COMPONENT =====
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  lazy?: boolean;
}

export const OptimizedImage = memo<OptimizedImageProps>(({ 
  src, 
  alt, 
  fallback = '/placeholder.png',
  lazy = true,
  className = '',
  ...props 
}) => {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    if (fallback && imageSrc !== fallback) {
      setImageSrc(fallback);
      setHasError(false);
    }
  }, [fallback, imageSrc]);

  const imageClasses = useMemo(() => 
    `transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`.trim(),
    [isLoading, className]
  );

  return (
    <div className="relative">
      <img
        src={imageSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        className={imageClasses}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded">
          <OptimizedLoading size="sm" text="" />
        </div>
      )}
      {hasError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded text-gray-400 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// ===== LAZY LOADED COMPONENTS =====
export const LazyModelViewer = lazy(() => 
  import('./OptimizedModelViewer').then(module => ({ default: module.OptimizedModelViewer }))
);

export const LazyARExperience = lazy(() => 
  import('./EnhancedARExperience').then(module => ({ default: module.EnhancedARExperience }))
);

export const LazyGalleryGrid = lazy(() => 
  import('../pages/Gallery').then(module => ({ default: module.default }))
);

// ===== OPTIMIZED SUSPENSE WRAPPER =====
interface OptimizedSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const OptimizedSuspense = memo<OptimizedSuspenseProps>(({ 
  children, 
  fallback = <OptimizedLoading text="Loading component..." /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
});

OptimizedSuspense.displayName = 'OptimizedSuspense';

// ===== PERFORMANCE MONITORING WRAPPER =====
interface PerformanceWrapperProps {
  children: React.ReactNode;
  name: string;
}

export const PerformanceWrapper = memo<PerformanceWrapperProps>(({ children, name }) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // Slower than 60fps
        console.warn(`🐌 Slow render detected in ${name}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [name]);

  return <>{children}</>;
});

PerformanceWrapper.displayName = 'PerformanceWrapper';

// ===== OPTIMIZED ANIMATION WRAPPER =====
interface OptimizedAnimationProps {
  children: React.ReactNode;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
  delay?: number;
}

export const OptimizedAnimation = memo<OptimizedAnimationProps>(({ 
  children, 
  animation = 'fade',
  duration = 0.3,
  delay = 0 
}) => {
  const animationVariants = useMemo(() => {
    switch (animation) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      case 'slide':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 }
        };
      case 'none':
      default:
        return {};
    }
  }, [animation]);

  if (animation === 'none') {
    return <>{children}</>;
  }

  return (
    <motion.div
      variants={animationVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
});

OptimizedAnimation.displayName = 'OptimizedAnimation';

// ===== VIRTUAL LIST COMPONENT =====
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function OptimizedVirtualList<T>({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  className = '' 
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;

  return (
    <div 
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// All components are already exported above
