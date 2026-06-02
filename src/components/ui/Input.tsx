import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<HTMLMotionProps<'input'>, 'ref'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground/80 ml-1"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {leftIcon && (
            <div className="absolute left-3.5 text-foreground/50 transition-colors group-focus-within:text-primary-500">
              {leftIcon}
            </div>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            whileFocus={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'flex h-12 w-full rounded-xl border border-foreground/10 bg-background/50 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500',
              'hover:border-foreground/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              error
                ? 'border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500'
                : '',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-foreground/50">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 ml-1 font-medium"
          >
            {error}
          </motion.span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
