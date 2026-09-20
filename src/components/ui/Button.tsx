import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { SpinnerIcon } from '../../assets/svgs';
import { cn } from '../../utils/cn';

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const getButtonSizeClasses = (
  size: NonNullable<ButtonProps['size']>,
  iconOnly = false,
) => {
  if (iconOnly) {
    return {
      sm: 'h-8 w-8 p-0',
      md: 'h-9 w-9 p-0',
      lg: 'h-11 w-11 p-0',
    }[size];
  }

  return {
    sm: 'h-7 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-base font-semibold',
  }[size];
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      iconOnly = false,
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

    return (
      <motion.button
        ref={ref}
        whileHover={!isLoading && !props.disabled ? { scale: 1.02 } : {}}
        whileTap={!isLoading && !props.disabled ? { scale: 0.98 } : {}}
        className={cn(
          baseStyles,
          variants[variant],
          getButtonSizeClasses(size, iconOnly),
          iconOnly && '[&>svg]:h-4 [&>svg]:w-4',
          className,
        )}
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
