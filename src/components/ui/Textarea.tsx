import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps
  extends Omit<HTMLMotionProps<'textarea'>, 'ref'> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground/80 ml-1"
          >
            {label}
          </label>
        )}
        <motion.textarea
          ref={ref}
          id={textareaId}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-foreground/10 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm backdrop-blur-sm transition-all placeholder:text-foreground/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500',
            'hover:border-foreground/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500'
              : '',
            className,
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
