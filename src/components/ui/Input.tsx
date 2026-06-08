import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<HTMLMotionProps<'input'>, 'ref'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  highlightedContent?: React.ReactNode;
  highlightedContentClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      leftIcon,
      rightIcon,
      highlightedContent,
      highlightedContentClassName,
      id,
      ...props
    },
    ref,
  ) => {
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
          {highlightedContent && (
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-0 z-30 flex items-center overflow-visible whitespace-pre px-4 py-2 text-sm text-foreground',
                leftIcon ? 'pl-10' : '',
                rightIcon ? 'pr-10' : '',
                highlightedContentClassName,
              )}
            >
              {highlightedContent}
            </div>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            whileFocus={highlightedContent ? undefined : { scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'flex h-[44px] w-full rounded-xl border border-foreground/10 bg-background/50 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500',
              'hover:border-foreground/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              highlightedContent
                ? 'relative z-20 bg-transparent text-transparent caret-foreground backdrop-blur-none'
                : '',
              error
                ? 'border-red-500 focus-visible:ring-red-500/50 focus-visible:border-red-500'
                : '',
              className,
            )}
            onKeyDown={(e) => {
              props.onKeyDown?.(e);
              if (e.defaultPrevented) return;
              if (e.key === 'Enter') {
                const inputElement = e.currentTarget;
                const isSearch =
                  inputElement.type === 'search' ||
                  inputElement.placeholder.toLowerCase().includes('search') ||
                  inputElement.id.toLowerCase().includes('search');
                if (isSearch) return;

                const form = inputElement.form;
                if (form) {
                  e.preventDefault();
                  e.stopPropagation();
                  form.requestSubmit();
                } else {
                  let parent = inputElement.parentElement;
                  let submitBtn: HTMLButtonElement | null = null;
                  while (parent) {
                    const buttons = parent.querySelectorAll('button');
                    if (buttons.length > 0) {
                      const match = Array.from(buttons).find((btn) => {
                        if (btn.disabled || btn.offsetParent === null)
                          return false;
                        const isSubmitType =
                          btn.getAttribute('type') === 'submit';
                        const isPrimary =
                          btn.classList.contains('bg-primary-500') ||
                          btn.classList.contains('bg-secondary-500') ||
                          btn.classList.contains('bg-primary-600') ||
                          btn.classList.contains('bg-secondary-600');
                        const text = btn.textContent?.toLowerCase() || '';
                        const isSubmitText =
                          text.includes('send') ||
                          text.includes('create') ||
                          text.includes('add') ||
                          text.includes('save') ||
                          text.includes('submit') ||
                          text.includes('run');
                        return isSubmitType || isPrimary || isSubmitText;
                      });
                      if (match) {
                        submitBtn = match;
                        break;
                      }
                    }
                    if (
                      parent.getAttribute('role') === 'dialog' ||
                      parent.classList.contains('modal') ||
                      parent.tagName === 'BODY'
                    ) {
                      break;
                    }
                    parent = parent.parentElement;
                  }
                  if (submitBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    submitBtn.click();
                  }
                }
              }
            }}
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
