import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../utils/cn';

export interface AlertProps
  extends Omit<HTMLMotionProps<'div'>, 'ref' | 'title' | 'children'> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, variant = 'default', title, icon, children, ...props },
    ref,
  ) => {
    const variants = {
      default:
        'bg-primary-50 text-primary-900 border-primary-200 dark:bg-primary-900/20 dark:text-primary-100 dark:border-primary-900/50',
      destructive:
        'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-900/50',
      success:
        'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-900/50',
      warning:
        'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-100 dark:border-yellow-900/50',
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative w-full rounded-xl border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
          variants[variant],
          className,
        )}
        {...props}
      >
        {icon && (
          <div className="absolute left-4 top-4 text-inherit opacity-70">
            {icon}
          </div>
        )}
        <div className={cn('flex flex-col gap-1', icon && 'pl-8')}>
          {title && (
            <h5 className="font-semibold leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </motion.div>
    );
  },
);
Alert.displayName = 'Alert';
