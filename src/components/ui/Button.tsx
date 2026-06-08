import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { SpinnerIcon } from '../../assets/svgs';
import { cn } from '../../utils/cn';

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
      primary:
        'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-md shadow-primary-500/20',
      secondary:
        'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-md shadow-secondary-500/20',
      outline:
        'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/20',
      ghost: 'text-foreground hover:bg-foreground/10 focus:ring-foreground/50',
      glass:
        'bg-white/20 backdrop-blur-md border border-white/30 text-foreground shadow-xl hover:bg-white/30 dark:bg-black/20 dark:border-white/10 dark:hover:bg-black/30',
    };

    const sizes = {
      sm: 'h-[34px] px-4 text-sm',
      md: 'h-[42px] px-6 text-base',
      lg: 'h-[54px] px-8 text-lg font-semibold',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={!isLoading && !props.disabled ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !props.disabled ? { scale: 0.98 } : {}}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <SpinnerIcon
            title="Loading"
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          />
        )}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
