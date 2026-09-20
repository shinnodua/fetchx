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

export const alertVariantClassNames = {
  default:
    'bg-primary-50 text-primary-900 border-primary-200 dark:bg-primary-900/20 dark:text-primary-100 dark:border-primary-900/50',
  destructive:
    'bg-status-error/10 text-status-error border-status-error/30 dark:bg-status-error/20 dark:text-status-error dark:border-status-error/40',
  success:
    'bg-status-success/10 text-status-success border-status-success/30 dark:bg-status-success/20 dark:text-status-success dark:border-status-success/40',
  warning:
    'bg-status-warning/10 text-status-warning border-status-warning/30 dark:bg-status-warning/20 dark:text-status-warning dark:border-status-warning/40',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, variant = 'default', title, icon, children, ...props },
    ref,
  ) => {
    const variants = alertVariantClassNames;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative w-full rounded-xl border p-3 [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3 [&>svg]:text-foreground',
          variants[variant],
          className,
        )}
        {...props}
      >
        {icon && (
          <div className="absolute left-3 top-3 text-inherit opacity-70">
            {icon}
          </div>
        )}
        <div className={cn('flex flex-col gap-1', icon && 'pl-8')}>
          {title && (
            <h5 className="font-semibold leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-xs opacity-90">{children}</div>
        </div>
      </motion.div>
    );
  },
);
Alert.displayName = 'Alert';
