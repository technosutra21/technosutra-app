import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { Button } from './button';

interface CustomToastProps {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const typeStyles = {
  success: {
    icon: CheckCircle,
    colors: 'border-green-500 bg-green-500/10 text-green-400',
    iconColor: 'text-green-500',
    glow: '0 0 20px hsl(120 100% 50% / 0.3)'
  },
  error: {
    icon: XCircle,
    colors: 'border-red-500 bg-red-500/10 text-red-400',
    iconColor: 'text-red-500',
    glow: '0 0 20px hsl(0 100% 50% / 0.3)'
  },
  warning: {
    icon: AlertCircle,
    colors: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    iconColor: 'text-yellow-500',
    glow: '0 0 20px hsl(60 100% 50% / 0.3)'
  },
  info: {
    icon: Info,
    colors: 'border-cyan-500 bg-cyan-500/10 text-cyan-400',
    iconColor: 'text-cyan-500',
    glow: '0 0 20px hsl(180 100% 50% / 0.3)'
  }
};

export const CustomToast: React.FC<CustomToastProps> = ({
  id,
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose
}) => {
  const style = typeStyles[type];
  const Icon = style.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md
        ${style.colors}
        min-w-[300px] max-w-[500px] shadow-lg
      `}
      style={{ boxShadow: style.glow }}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${style.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-1">
        <div className="text-sm font-bold text-glow">
          {title}
        </div>
        {description && (
          <div className="text-xs opacity-90">
            {description}
          </div>
        )}
      </div>
      
      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onClose(id)}
        className="flex-shrink-0 h-auto p-1 hover:bg-white/10 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </Button>
      
      {/* Progress bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-1 ${style.iconColor} bg-current opacity-50 rounded-bl-lg`}
      />
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <CustomToast
            key={toast.id}
            {...toast}
            onClose={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

