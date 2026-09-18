import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckSolidIcon,
  ChevronDownIcon,
  SpinnerIcon,
} from '../../assets/svgs';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  separatorAfter?: boolean;
  className?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  triggerLabelClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  size?: 'sm' | 'md';
}

export const getSelectTriggerLabel = (
  selectedOption: SelectOption | undefined,
  isLoading: boolean,
  loadingLabel: string,
  placeholder: string,
) => (isLoading ? loadingLabel : (selectedOption?.label ?? placeholder));

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      label,
      className,
      triggerLabelClassName,
      dropdownClassName,
      disabled,
      isLoading = false,
      loadingLabel = 'Loading…',
      size = 'md',
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<string | undefined>(
      value,
    );
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedValue = value !== undefined ? value : internalValue;
    const selectedOption = options.find((opt) => opt.value === selectedValue);
    const triggerLabel = getSelectTriggerLabel(
      selectedOption,
      isLoading,
      loadingLabel,
      placeholder,
    );

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
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      if (value === undefined) setInternalValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };

    return (
      <div
        className={cn('relative flex w-full flex-col gap-1', className)}
        ref={containerRef}
      >
        {label && (
          <label className="ml-1 text-xs font-medium text-foreground/80">
            {label}
          </label>
        )}
        <div
          ref={ref}
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          className={cn(
            'flex w-full cursor-pointer items-center justify-between rounded-xl border border-foreground/10 bg-background/50 text-xs text-foreground shadow-sm backdrop-blur-sm transition-all',
            size === 'sm' ? 'h-8 px-2.5 py-1' : 'h-[38px] px-3 py-1.5',
            'hover:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
            (disabled || isLoading) && 'cursor-not-allowed opacity-50',
            isOpen && 'border-primary-500 ring-2 ring-primary-500/50',
          )}
          tabIndex={disabled || isLoading ? -1 : 0}
          aria-busy={isLoading}
        >
          <span
            className={cn(
              'block truncate min-w-0 mr-2 flex-1 text-left',
              selectedOption || isLoading
                ? triggerLabelClassName || 'text-foreground'
                : 'text-foreground/40',
            )}
          >
            {triggerLabel}
          </span>
          {isLoading ? (
            <SpinnerIcon
              title={loadingLabel}
              className="h-4 w-4 shrink-0 animate-spin text-primary-600"
            />
          ) : (
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              className="h-4 w-4 text-foreground/50"
            >
              <ChevronDownIcon
                title="Toggle select options"
                className="h-4 w-4"
              />
            </motion.span>
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute top-[calc(100%+4px)] z-50 w-full rounded-xl border border-foreground/10 bg-background/90 p-1 shadow-xl backdrop-blur-xl',
                dropdownClassName || 'max-h-60 overflow-auto',
              )}
            >
              {options.map((option) => (
                <React.Fragment key={option.value}>
                  <div
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-xs outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5',
                      selectedValue === option.value
                        ? cn(
                            'bg-primary-50 font-medium dark:bg-primary-900/20',
                            option.className ||
                              'text-primary-900 dark:text-primary-100',
                          )
                        : option.className || 'text-foreground',
                    )}
                  >
                    <span className="block truncate">{option.label}</span>
                    {selectedValue === option.value && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-600 dark:text-primary-400">
                        <CheckSolidIcon
                          title="Selected option"
                          className="h-4 w-4"
                        />
                      </span>
                    )}
                  </div>
                  {option.separatorAfter && (
                    <div className="my-1 h-px bg-foreground/10" />
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
Select.displayName = 'Select';
