import React from 'react';

export const useCustomToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    title: string;
    description?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>>([]);

  const addToast = React.useCallback((toast: Omit<typeof toasts[0], 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    toast: addToast, // Alias for convenience
  };
};
