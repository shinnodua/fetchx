import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
  toast: (props: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    ({ title, description, type = 'default' }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const typeStyles = {
    default: 'bg-background border-foreground/10',
    success:
      'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50',
    warning:
      'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50',
  };

  const textStyles = {
    default: 'text-foreground',
    success: 'text-green-900 dark:text-green-100',
    error: 'text-red-900 dark:text-red-100',
    warning: 'text-yellow-900 dark:text-yellow-100',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:flex-col md:max-w-[420px]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={cn(
                'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-xl border p-4 pr-6 shadow-lg backdrop-blur-md mb-4',
                typeStyles[t.type || 'default'],
              )}
            >
              <div className="flex flex-col gap-1">
                <div
                  className={cn(
                    'text-sm font-semibold',
                    textStyles[t.type || 'default'],
                  )}
                >
                  {t.title}
                </div>
                {t.description && (
                  <div
                    className={cn(
                      'text-xs opacity-90',
                      textStyles[t.type || 'default'],
                    )}
                  >
                    {t.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <svg
                  className={cn('w-4 h-4', textStyles[t.type || 'default'])}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
