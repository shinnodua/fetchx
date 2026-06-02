import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends Omit<HTMLMotionProps<'span'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary:
        'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      secondary:
        'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
      outline:
        'border border-primary-500/50 text-primary-700 dark:text-primary-400',
      ghost: 'bg-foreground/10 text-foreground',
    };

    return (
      <motion.span
        ref={ref}
        whileHover={{ scale: 1.05 }}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = 'Badge';
