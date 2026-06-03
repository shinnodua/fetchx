import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      label,
      className,
      disabled,
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
        className={cn('flex flex-col gap-1.5 w-full relative', className)}
        ref={containerRef}
      >
        {label && (
          <label className="text-sm font-medium text-foreground/80 ml-1">
            {label}
          </label>
        )}
        <div
          ref={ref}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-xl border border-foreground/10 bg-background/50 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur-sm transition-all cursor-pointer',
            'hover:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
            disabled && 'cursor-not-allowed opacity-50',
            isOpen && 'border-primary-500 ring-2 ring-primary-500/50',
          )}
          tabIndex={disabled ? -1 : 0}
        >
          <span
            className={cn(
              'block truncate min-w-0 mr-2 flex-1 text-left',
              selectedOption ? 'text-foreground' : 'text-foreground/40',
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="h-4 w-4 text-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </motion.svg>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-[calc(100%+4px)] z-50 max-h-60 w-full overflow-auto rounded-xl border border-foreground/10 bg-background/90 p-1 shadow-xl backdrop-blur-xl"
            >
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-3 pr-9 text-sm outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5',
                    selectedValue === option.value
                      ? 'bg-primary-50 text-primary-900 font-medium dark:bg-primary-900/20 dark:text-primary-100'
                      : 'text-foreground',
                  )}
                >
                  <span className="block truncate">{option.label}</span>
                  {selectedValue === option.value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-600 dark:text-primary-400">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
Select.displayName = 'Select';
