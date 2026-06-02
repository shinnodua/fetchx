import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, indicatorClassName, value, max = 100 }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-foreground/10',
          className,
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className={cn(
            'h-full w-full flex-1 bg-primary-500 transition-all',
            indicatorClassName,
          )}
          initial={{ x: '-100%' }}
          animate={{ x: `-${100 - percentage}%` }}
          transition={{ ease: 'easeInOut', duration: 0.5 }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';
