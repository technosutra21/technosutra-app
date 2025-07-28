export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'offline' | 'performance';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  progress?: number;
  metadata?: {
    isOnline?: boolean;
    cacheStatus?: 'hit' | 'miss' | 'updating';
    performanceScore?: number;
    loadTime?: number;
  };
}

class NotificationManager {
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private notifications: Notification[] = [];
  private nextId = 1;

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  add(notification: Omit<Notification, 'id'>): string {
    const id = `notification-${this.nextId++}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000
    };

    this.notifications.push(newNotification);
    this.notify();

    // Auto-remove if not persistent
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }

    return id;
  }

  remove(id: string) {
    // Add a small delay to prevent race condition with AnimatePresence
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      // Mark for removal instead of immediate removal
      notification.removing = true;
      this.notify();
      
      // Actually remove after animation time
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notify();
      }, 350); // Slightly longer than exit animation
    }
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  update(id: string, updates: Partial<Notification>) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, ...updates } : n
    );
    this.notify();
  }

  // Convenience methods
  success(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: 'success', title, message, ...options });
  }

  error(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: 'error', title, message, persistent: true, ...options });
  }

  warning(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: 'warning', title, message, ...options });
  }

  info(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: 'info', title, message, ...options });
  }

  offline(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ 
      type: 'offline', 
      title, 
      message, 
      persistent: true,
      metadata: { isOnline: false },
      ...options 
    });
  }

  performance(title: string, message: string, score: number, loadTime: number, options?: Partial<Notification>) {
    return this.add({ 
      type: 'performance', 
      title, 
      message,
      metadata: { performanceScore: score, loadTime },
      ...options 
    });
  }
}

export const notificationManager = new NotificationManager(); 