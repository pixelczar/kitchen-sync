import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  emoji?: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const getToastColors = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green text-cream';
      case 'error':
        return 'bg-red text-cream';
      case 'info':
        return 'bg-blue text-cream';
    }
  };

  const getDefaultEmoji = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`${getToastColors(toast.type)} rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-md flex items-center gap-3 pointer-events-auto min-w-[300px]`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-3xl tracking-tight">
              {toast.emoji || getDefaultEmoji(toast.type)}
            </span>
            <span className="font-bold text-lg flex-1">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Helper hook to use toasts easily
export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);

  return {
    success: (message: string, emoji?: string) =>
      addToast({ type: 'success', message, emoji }),
    error: (message: string, emoji?: string) =>
      addToast({ type: 'error', message, emoji }),
    info: (message: string, emoji?: string) =>
      addToast({ type: 'info', message, emoji }),
  };
};

