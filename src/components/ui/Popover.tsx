import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const Popover = ({
  trigger,
  children,
  className,
  align = 'center',
}: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignStyles = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0',
  };

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="inline-block cursor-pointer"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={cn(
              'absolute top-full z-50 mt-1.5 w-72 rounded-xl border border-foreground/10 bg-background/90 p-3 shadow-xl backdrop-blur-xl outline-none',
              alignStyles[align],
              className,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
