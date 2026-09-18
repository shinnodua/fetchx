import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../../assets/svgs';
import { cn } from '../../utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

export const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  hideCloseButton,
}: DialogProps) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative z-50 w-full max-w-lg rounded-2xl border border-foreground/10 bg-background p-4 shadow-2xl',
              className,
            )}
          >
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 hover:bg-foreground/10"
              >
                <CloseIcon title="Close dialog" className="h-5 w-5" />
              </button>
            )}

            {(title || description) && (
              <div className="mb-4 space-y-1 pr-6">
                {title && (
                  <h2 className="text-lg font-semibold leading-none tracking-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs text-foreground/60">{description}</p>
                )}
              </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(dialogContent, document.body);
  }
  return null;
};
