import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    { className, label, checked, onCheckedChange, id, disabled, ...props },
    ref,
  ) => {
    const generatedId = React.useId();
    const switchId = id || generatedId;

    const [isInternalChecked, setIsInternalChecked] = React.useState(
      !!props.defaultChecked,
    );
    const isChecked = checked !== undefined ? checked : isInternalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (checked === undefined) {
        setIsInternalChecked(e.target.checked);
      }
      onCheckedChange?.(e.target.checked);
      props.onChange?.(e);
    };

    return (
      <div className="flex items-center gap-2">
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            checked={isChecked}
            onChange={handleChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <motion.div
            className={cn(
              'flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors',
              isChecked ? 'bg-primary-500' : 'bg-foreground/20',
              disabled && 'cursor-not-allowed opacity-50',
              className,
            )}
            onClick={() => {
              if (disabled) return;
              const newChecked = !isChecked;
              if (checked === undefined) setIsInternalChecked(newChecked);
              onCheckedChange?.(newChecked);
            }}
          >
            <motion.div
              layout
              className="h-4 w-4 rounded-full bg-white shadow-sm"
              animate={{ x: isChecked ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </div>
        {label && (
          <label
            htmlFor={switchId}
            className={cn(
              'text-xs font-medium',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);
Switch.displayName = 'Switch';
