import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps
  extends Omit<HTMLMotionProps<'textarea'>, 'ref'> {
  label?: string;
  error?: string;
  highlightedContent?: React.ReactNode;
  highlightedContentClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      highlightedContent,
      highlightedContentClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const [scrollPosition, setScrollPosition] = React.useState({
      left: 0,
      top: 0,
    });

    return (
      <div className="flex w-full flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="ml-1 text-xs font-medium text-foreground/80"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {highlightedContent && (
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-0 z-30 overflow-visible text-xs text-foreground',
              )}
            >
              <div
                className={cn(
                  'whitespace-pre-wrap break-words px-3 py-2',
                  highlightedContentClassName,
                )}
                style={{
                  transform: `translate(${-scrollPosition.left}px, ${-scrollPosition.top}px)`,
                }}
              >
                {highlightedContent}
              </div>
            </div>
          )}
          <motion.textarea
            ref={ref}
            id={textareaId}
            whileFocus={highlightedContent ? undefined : { scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'flex min-h-16 w-full rounded-xl border border-foreground/10 bg-background/50 px-3 py-2 text-xs text-foreground shadow-sm backdrop-blur-sm transition-all placeholder:text-foreground/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500',
              'hover:border-foreground/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              highlightedContent
                ? 'relative z-20 bg-transparent text-transparent caret-foreground backdrop-blur-none'
                : '',
              error
                ? 'border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500'
                : '',
              className,
            )}
            {...props}
            onScroll={(event) => {
              props.onScroll?.(event);
              setScrollPosition({
                left: event.currentTarget.scrollLeft,
                top: event.currentTarget.scrollTop,
              });
            }}
          />
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

Textarea.displayName = 'Textarea';
