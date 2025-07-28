import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useInView, useMotionValue, useTransform } from 'framer-motion';

// ===== ADVANCED SCROLL ANIMATIONS =====
interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 50,
  className
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  const directionVariants = {
    up: { y: distance, opacity: 0 },
    down: { y: -distance, opacity: 0 },
    left: { x: distance, opacity: 0 },
    right: { x: -distance, opacity: 0 }
  };

  useEffect(() => {
    if (isInView) {
      controls.start({
        x: 0,
        y: 0,
        opacity: 1,
        transition: {
          duration,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      });
    }
  }, [isInView, controls, duration, delay]);

  return (
    <motion.div
      ref={ref}
      initial={directionVariants[direction]}
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ===== PARALLAX SCROLL EFFECT =====
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  className
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [elementTop, setElementTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  const y = useMotionValue(0);
  const yTransform = useTransform(y, [0, 1], [0, -speed * 100]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onResize = () => {
      setElementTop(element.offsetTop);
      setClientHeight(window.innerHeight);
    };

    const onScroll = () => {
      const scrolled = window.scrollY;
      const rate = scrolled / (elementTop + clientHeight);
      y.set(rate);
    };

    onResize();
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [y, elementTop, clientHeight]);

  return (
    <motion.div
      ref={ref}
      style={{ y: yTransform }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ===== FLOATING PARTICLES BACKGROUND =====
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface FloatingParticlesProps {
  count?: number;
  colors?: string[];
  speed?: number;
  size?: { min: number; max: number };
  className?: string;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 50,
  colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'],
  speed = 1,
  size = { min: 1, max: 3 },
  className
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();

    const initialParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (size.max - size.min) + size.min,
      speedX: (Math.random() - 0.5) * speed,
      speedY: (Math.random() - 0.5) * speed,
      opacity: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setParticles(initialParticles);

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => {
        let newX = particle.x + particle.speedX;
        let newY = particle.y + particle.speedY;

        if (newX < 0 || newX > width) particle.speedX *= -1;
        if (newY < 0 || newY > height) particle.speedY *= -1;

        newX = Math.max(0, Math.min(width, newX));
        newY = Math.max(0, Math.min(height, newY));

        return { ...particle, x: newX, y: newY };
      }));
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, [count, colors, speed, size]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// ===== MORPHING SHAPES =====
interface MorphingShapeProps {
  shapes?: string[];
  duration?: number;
  size?: number;
  color?: string;
  className?: string;
}

export const MorphingShape: React.FC<MorphingShapeProps> = ({
  shapes = [
    "M50,10 L90,90 L10,90 Z", // Triangle
    "M10,50 Q10,10 50,10 Q90,10 90,50 Q90,90 50,90 Q10,90 10,50", // Circle
    "M10,10 L90,10 L90,90 L10,90 Z", // Square
    "M50,10 L70,30 L90,50 L70,70 L50,90 L30,70 L10,50 L30,30 Z" // Octagon
  ],
  duration = 3,
  size = 100,
  color = "#00ffff",
  className
}) => {
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShapeIndex(prev => (prev + 1) % shapes.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [shapes.length, duration]);

  return (
    <div className={className}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <motion.path
          d={shapes[currentShapeIndex]}
          fill={color}
          animate={{ d: shapes[currentShapeIndex] }}
          transition={{
            duration: duration * 0.8,
            ease: "easeInOut"
          }}
          style={{
            filter: `drop-shadow(0 0 10px ${color})`
          }}
        />
      </svg>
    </div>
  );
};

// ===== GLITCH TEXT EFFECT =====
interface GlitchTextProps {
  text: string;
  intensity?: number;
  speed?: number;
  className?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  intensity = 5,
  speed = 100,
  className
}) => {
  const [glitchedText, setGlitchedText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance to glitch
        setIsGlitching(true);
        
        const glitchDuration = Math.random() * 200 + 50;
        const glitchSteps = Math.floor(glitchDuration / 20);
        
        let step = 0;
        const stepInterval = setInterval(() => {
          const newText = text.split('').map(char => {
            if (Math.random() < intensity / 100) {
              return glitchChars[Math.floor(Math.random() * glitchChars.length)];
            }
            return char;
          }).join('');
          
          setGlitchedText(newText);
          step++;
          
          if (step >= glitchSteps) {
            clearInterval(stepInterval);
            setGlitchedText(text);
            setIsGlitching(false);
          }
        }, 20);
      }
    }, speed);

    return () => clearInterval(glitchInterval);
  }, [text, intensity, speed]);

  return (
    <motion.span
      className={`font-mono ${className}`}
      animate={isGlitching ? {
        x: [0, -2, 2, -1, 1, 0],
        textShadow: [
          "0 0 0 transparent",
          "2px 0 0 #ff0000, -2px 0 0 #00ffff",
          "0 0 0 transparent"
        ]
      } : {}}
      transition={{ duration: 0.1 }}
    >
      {glitchedText}
    </motion.span>
  );
};

// ===== TYPING ANIMATION =====
interface TypingAnimationProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  onComplete,
  className
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete?.();
      }
    }, currentIndex === 0 ? delay : speed);

    return () => clearTimeout(timeout);
  }, [currentIndex, text, speed, delay, onComplete]);

  useEffect(() => {
    if (cursor) {
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);

      return () => clearInterval(cursorInterval);
    }
  }, [cursor]);

  return (
    <span className={className}>
      {displayedText}
      {cursor && (
        <motion.span
          animate={{ opacity: showCursor ? 1 : 0 }}
          transition={{ duration: 0 }}
          className="text-cyan-400"
        >
          |
        </motion.span>
      )}
    </span>
  );
};

// ===== WAVE ANIMATION =====
interface WaveAnimationProps {
  amplitude?: number;
  frequency?: number;
  speed?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const WaveAnimation: React.FC<WaveAnimationProps> = ({
  amplitude = 20,
  frequency = 0.02,
  speed = 0.05,
  color = "#00ffff",
  width = 300,
  height = 100,
  className
}) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + speed);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [speed]);

  const generateWavePath = () => {
    const points = [];
    const steps = width / 2;
    
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const y = height / 2 + Math.sin(x * frequency + time) * amplitude;
      points.push(`${x},${y}`);
    }
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className={className}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <motion.path
          d={generateWavePath()}
          stroke={color}
          strokeWidth="2"
          fill="none"
          style={{
            filter: `drop-shadow(0 0 5px ${color})`
          }}
        />
      </svg>
    </div>
  );
};
