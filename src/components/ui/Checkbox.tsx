import { motion } from 'framer-motion';
import React from 'react';
import { CheckIcon } from '../../assets/svgs';
import { cn } from '../../utils/cn';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, disabled, checked, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    const [isInternalChecked, setIsInternalChecked] = React.useState(
      !!props.defaultChecked,
    );
    const isChecked = checked !== undefined ? checked : isInternalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (checked === undefined) {
        setIsInternalChecked(e.target.checked);
      }
      props.onChange?.(e);
    };

    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            disabled={disabled}
            checked={isChecked}
            onChange={handleChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              isChecked
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'bg-transparent',
              disabled && 'cursor-not-allowed opacity-50',
              className,
            )}
            onClick={() => {
              if (disabled) return;
              const input = document.getElementById(
                checkboxId,
              ) as HTMLInputElement;
              if (input) input.click();
            }}
          >
            <motion.span
              initial={false}
              animate={{
                opacity: isChecked ? 1 : 0,
                scale: isChecked ? 1 : 0.5,
              }}
              transition={{ duration: 0.2 }}
              className="h-3 w-3"
            >
              <CheckIcon title="Checked" className="h-3 w-3" strokeWidth={3} />
            </motion.span>
          </div>
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className={cn(
              'cursor-pointer text-xs font-medium',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
