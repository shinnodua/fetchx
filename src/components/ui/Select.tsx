import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { CheckSolidIcon, ChevronDownIcon } from '../../assets/svgs';
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
  dropdownClassName?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
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
      dropdownClassName,
      disabled,
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
            'flex w-full items-center justify-between rounded-xl border border-foreground/10 bg-background/50 text-sm text-foreground shadow-sm backdrop-blur-sm transition-all cursor-pointer',
            size === 'sm' ? 'h-10 px-3 py-1.5' : 'h-[44px] px-4 py-2',
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
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="h-4 w-4 text-foreground/50"
          >
            <ChevronDownIcon
              title="Toggle select options"
              className="h-4 w-4"
            />
          </motion.span>
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
                      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-3 pr-9 text-sm outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/5',
                      selectedValue === option.value
                        ? 'bg-primary-50 text-primary-900 font-medium dark:bg-primary-900/20 dark:text-primary-100'
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
