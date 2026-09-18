import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

export const DropdownMenu = ({
  trigger,
  children,
  className,
  align = 'left',
}: DropdownMenuProps) => {
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

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="inline-block cursor-pointer"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-1.5 min-w-[8rem] overflow-hidden rounded-xl border border-foreground/10 bg-background/90 p-1 shadow-xl backdrop-blur-xl',
              align === 'left'
                ? 'left-0 origin-top-left'
                : 'right-0 origin-top-right',
              className,
            )}
            onClick={() => setIsOpen(false)} // Close on item click
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DropdownMenuItem = ({
  children,
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const DropdownMenuSeparator = ({
  className,
}: {
  className?: string;
}) => <div className={cn('-mx-1 my-1 h-px bg-foreground/10', className)} />;
