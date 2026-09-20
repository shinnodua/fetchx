import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { CloseIcon } from '../../assets/svgs';
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

export const toastViewportClassName =
  'pointer-events-none fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:flex-col md:max-w-[420px]';

export const toastTypeStyles = {
  default: 'bg-background border-foreground/10',
  success:
    'bg-status-success/10 border-status-success/30 dark:bg-status-success/20 dark:border-status-success/40',
  error:
    'bg-status-error/10 border-status-error/30 dark:bg-status-error/20 dark:border-status-error/40',
  warning:
    'bg-status-warning/10 border-status-warning/30 dark:bg-status-warning/20 dark:border-status-warning/40',
};

export const toastTextStyles = {
  default: 'text-foreground',
  success: 'text-status-success',
  error: 'text-status-error',
  warning: 'text-status-warning',
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

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={toastViewportClassName}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={cn(
                'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-xl border p-4 pr-10 shadow-lg backdrop-blur-md mb-4',
                toastTypeStyles[t.type || 'default'],
              )}
            >
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div
                  className={cn(
                    'text-sm font-semibold break-words',
                    toastTextStyles[t.type || 'default'],
                  )}
                >
                  {t.title}
                </div>
                {t.description && (
                  <div
                    className={cn(
                      'text-xs opacity-90 break-words whitespace-pre-wrap',
                      toastTextStyles[t.type || 'default'],
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
                <CloseIcon
                  title="Dismiss toast"
                  className={cn(
                    'w-4 h-4',
                    toastTextStyles[t.type || 'default'],
                  )}
                />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
