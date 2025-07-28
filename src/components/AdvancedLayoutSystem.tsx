import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useMediaQuery, useIntersectionObserver } from '@/hooks/useAdvancedPerformance';
import { cn } from '@/lib/utils';

// ===== ADVANCED GRID SYSTEM =====
interface AdvancedGridProps {
  children: React.ReactNode;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  autoFit?: boolean;
  minItemWidth?: number;
  className?: string;
}

export const AdvancedGrid: React.FC<AdvancedGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 4,
  autoFit = false,
  minItemWidth = 250,
  className
}) => {
  const isXs = useMediaQuery('(max-width: 640px)');
  const isSm = useMediaQuery('(min-width: 641px) and (max-width: 768px)');
  const isMd = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isLg = useMediaQuery('(min-width: 1025px) and (max-width: 1280px)');
  const isXl = useMediaQuery('(min-width: 1281px)');

  const getCurrentColumns = () => {
    if (isXs) return columns.xs || 1;
    if (isSm) return columns.sm || 2;
    if (isMd) return columns.md || 3;
    if (isLg) return columns.lg || 4;
    if (isXl) return columns.xl || 5;
    return 3;
  };

  const gridStyle = autoFit
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
        gap: `${gap * 0.25}rem`
      }
    : {
        display: 'grid',
        gridTemplateColumns: `repeat(${getCurrentColumns()}, 1fr)`,
        gap: `${gap * 0.25}rem`
      };

  return (
    <LayoutGroup>
      <motion.div
        className={cn('w-full', className)}
        style={gridStyle}
        layout
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    </LayoutGroup>
  );
};

// ===== MASONRY LAYOUT =====
interface MasonryProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export const MasonryLayout: React.FC<MasonryProps> = ({
  children,
  columns = 3,
  gap = 16,
  className
}) => {
  const [_columnHeights, setColumnHeights] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setColumnHeights(new Array(columns).fill(0));
  }, [columns]);

  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return;

      const newHeights = new Array(columns).fill(0);
      
      itemRefs.current.forEach((item, _index) => {
        if (!item) return;

        const shortestColumnIndex = newHeights.indexOf(Math.min(...newHeights));
        const x = shortestColumnIndex * (100 / columns);
        const y = newHeights[shortestColumnIndex];

        item.style.position = 'absolute';
        item.style.left = `${x}%`;
        item.style.top = `${y}px`;
        item.style.width = `calc(${100 / columns}% - ${gap * (columns - 1) / columns}px)`;

        newHeights[shortestColumnIndex] += item.offsetHeight + gap;
      });

      setColumnHeights(newHeights);
      
      if (containerRef.current) {
        containerRef.current.style.height = `${Math.max(...newHeights)}px`;
      }
    };

    const resizeObserver = new ResizeObserver(updateLayout);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateLayout();

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, columns, gap]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
      style={{ position: 'relative' }}
    >
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          ref={(el) => (itemRefs.current[index] = el)}
          className="transition-all duration-300"
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// ===== STICKY CONTAINER =====
interface StickyContainerProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export const StickyContainer: React.FC<StickyContainerProps> = ({
  children,
  offset = 0,
  className
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver({
    rootMargin: `-${offset}px 0px 0px 0px`
  });

  useEffect(() => {
    setIsSticky(!isIntersecting);
  }, [isIntersecting]);

  return (
    <>
      <div ref={elementRef} style={{ height: '1px' }} />
      <motion.div
        className={cn(
          'transition-all duration-300',
          isSticky && 'fixed top-0 left-0 right-0 z-50',
          className
        )}
        style={{ top: isSticky ? offset : 'auto' }}
        animate={{
          y: isSticky ? 0 : 0,
          boxShadow: isSticky 
            ? '0 4px 20px rgba(0, 0, 0, 0.1)' 
            : '0 0 0 rgba(0, 0, 0, 0)'
        }}
      >
        {children}
      </motion.div>
    </>
  );
};

// ===== SPLIT SCREEN LAYOUT =====
interface SplitScreenProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number;
  resizable?: boolean;
  className?: string;
}

export const SplitScreen: React.FC<SplitScreenProps> = ({
  left,
  right,
  leftWidth = 50,
  resizable = false,
  className
}) => {
  const [splitPosition, setSplitPosition] = useState(leftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.max(10, Math.min(90, newPosition)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full w-full relative', className)}
    >
      <motion.div
        className="h-full overflow-hidden"
        style={{ width: `${splitPosition}%` }}
        layout
      >
        {left}
      </motion.div>

      {resizable && (
        <div
          className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20" />
        </div>
      )}

      <motion.div
        className="h-full overflow-hidden"
        style={{ width: `${100 - splitPosition - (resizable ? 0.25 : 0)}%` }}
        layout
      >
        {right}
      </motion.div>
    </div>
  );
};

// ===== ACCORDION LAYOUT =====
interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      if (allowMultiple) {
        return prev.includes(id)
          ? prev.filter(item => item !== id)
          : [...prev, id];
      } else {
        return prev.includes(id) ? [] : [id];
      }
    });
  };

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
          layout
        >
          <motion.button
            className={cn(
              'w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors',
              'flex items-center justify-between',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !item.disabled && toggleItem(item.id)}
            disabled={item.disabled}
          >
            <span className="font-medium">{item.title}</span>
            <motion.div
              animate={{ rotate: openItems.includes(item.id) ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {openItems.includes(item.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-white">
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

// ===== TABS LAYOUT =====
interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  orientation = 'horizontal',
  className,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn(
      'flex',
      isHorizontal ? 'flex-col' : 'flex-row',
      className
    )}>
      {/* Tab Headers */}
      <div className={cn(
        'flex',
        isHorizontal ? 'flex-row border-b' : 'flex-col border-r',
        'bg-gray-50'
      )}>
        {items.map((item) => (
          <motion.button
            key={item.id}
            className={cn(
              'px-4 py-2 font-medium transition-colors relative',
              activeTab === item.id
                ? 'text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !item.disabled && handleTabChange(item.id)}
            disabled={item.disabled}
            whileHover={{ scale: item.disabled ? 1 : 1.02 }}
            whileTap={{ scale: item.disabled ? 1 : 0.98 }}
          >
            {item.label}
            
            {activeTab === item.id && (
              <motion.div
                className={cn(
                  'absolute bg-blue-600',
                  isHorizontal
                    ? 'bottom-0 left-0 right-0 h-0.5'
                    : 'top-0 bottom-0 right-0 w-0.5'
                )}
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {items.map((item) => (
            activeTab === item.id && (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: isHorizontal ? 20 : 0, y: isHorizontal ? 0 : 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: isHorizontal ? -20 : 0, y: isHorizontal ? 0 : -20 }}
                transition={{ duration: 0.2 }}
              >
                {item.content}
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
