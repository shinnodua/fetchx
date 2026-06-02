import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface AvatarProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    const sizes = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-xl',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-primary-100 text-primary-900 border border-primary-200/50 dark:bg-primary-900/50 dark:text-primary-100',
          sizes[size],
          className,
        )}
        {...props}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="aspect-square h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-semibold">
            {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
          </div>
        )}
      </motion.div>
    );
  },
);
Avatar.displayName = 'Avatar';
