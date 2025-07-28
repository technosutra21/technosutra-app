import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  X,
  Wifi,
  WifiOff,
  Database,
  Zap,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Notification,
  NotificationType,
  notificationManager
} from '@/lib/notification-manager';


interface EnhancedNotificationSystemProps {
  maxNotifications?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableSound?: boolean;
  enableVibration?: boolean;
}

export const EnhancedNotificationSystem: React.FC<EnhancedNotificationSystemProps> = ({
  maxNotifications = 5,
  position = 'top-right',
  enableSound = false,
  enableVibration = false
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNewNotification = (newNotifications: Notification[]) => {
      setNotifications(newNotifications);
      if (newNotifications.length > 0) {
        const latest = newNotifications[newNotifications.length - 1];
        playNotificationSound(latest.type);
      }
    };
    return notificationManager.subscribe(handleNewNotification);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-orange-400" />;
      case 'performance':
        return <Zap className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getColorClasses = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'offline':
        return 'border-orange-500/30 bg-orange-500/10';
      case 'performance':
        return 'border-purple-500/30 bg-purple-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default: // top-right
        return 'top-4 right-4';
    }
  };

  const handleDismiss = useCallback((id: string) => {
    // Add a small delay to allow exit animation to complete
    setTimeout(() => {
      notificationManager.remove(id);
    }, 150); // Small delay to prevent race condition
  }, []);

  const playNotificationSound = useCallback((type: NotificationType) => {
    if (!enableSound) return;

    // Create audio context for notification sounds
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 500,
        offline: 300,
        performance: 700
      };

      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [enableSound]);

  const triggerVibration = useCallback((type: NotificationType) => {
    if (!enableVibration || !navigator.vibrate) return;

    // Different vibration patterns for different types
    const patterns = {
      success: [100],
      error: [200, 100, 200],
      warning: [150, 50, 150],
      info: [100],
      offline: [300],
      performance: [50, 50, 50]
    };

    navigator.vibrate(patterns[type]);
  }, [enableVibration]);

  const handleActionClick = (action: () => void, notificationType: NotificationType) => {
    triggerVibration(notificationType);
    action();
  };

  const visibleNotifications = notifications.slice(-maxNotifications);

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full pointer-events-none`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              x: position.includes('right') ? 300 : -300, 
              scale: 0.8,
              transition: { duration: 0.2 }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`
              relative p-4 rounded-lg border backdrop-blur-sm pointer-events-auto
              ${getColorClasses(notification.type)}
            `}
          >
            {/* Main Content */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white mb-1">
                  {notification.title}
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {notification.message}
                </p>

                {/* Progress Bar */}
                {notification.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={notification.progress} className="h-1" />
                  </div>
                )}

                {/* Metadata */}
                {notification.metadata && (
                  <div className="flex items-center gap-2 mt-2">
                    {notification.metadata.isOnline !== undefined && (
                      <div className="flex items-center gap-1">
                        {notification.metadata.isOnline ? (
                          <Wifi className="w-3 h-3 text-green-400" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-red-400" />
                        )}
                        <span className="text-xs text-gray-400">
                          {notification.metadata.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    )}

                    {notification.metadata.cacheStatus && (
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-gray-400">
                          {notification.metadata.cacheStatus}
                        </span>
                      </div>
                    )}

                    {notification.metadata.loadTime && (
                      <Badge variant="outline" className="text-xs">
                        {notification.metadata.loadTime}ms
                      </Badge>
                    )}

                    {notification.metadata.performanceScore && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          notification.metadata.performanceScore > 80 ? 'text-green-400' :
                          notification.metadata.performanceScore > 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}
                      >
                        {notification.metadata.performanceScore}/100
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {notification.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        onClick={() => handleActionClick(action.action, notification.type)}
                        variant={action.variant || 'outline'}
                        size="sm"
                        className="text-xs py-1 px-2"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              <Button
                onClick={() => handleDismiss(notification.id)}
                variant="ghost"
                size="sm"
                className="flex-shrink-0 w-6 h-6 p-0 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Auto-dismiss timer */}
            {!notification.persistent && notification.duration && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: notification.duration / 1000, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30"
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
