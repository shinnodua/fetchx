import React from 'react';
import { cn } from '../../utils/cn';

export interface SliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const sliderId = id || generatedId;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={sliderId}
            className="text-sm font-medium text-foreground/80 ml-1"
          >
            {label}
          </label>
        )}
        <div className="relative flex w-full touch-none select-none items-center py-2">
          <input
            type="range"
            ref={ref}
            id={sliderId}
            className={cn(
              'w-full h-2 bg-foreground/20 rounded-lg appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Customizing the thumb for Webkit (Chrome/Safari)
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
              '[&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
              // Customizing the thumb for Firefox
              '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5',
              '[&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white',
              className,
            )}
            {...props}
          />
        </div>
      </div>
    );
  },
);
Slider.displayName = 'Slider';
