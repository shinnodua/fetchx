import { motion } from 'framer-motion';
import type React from 'react';
import { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = ({
  defaultValue,
  children,
  className,
  onValueChange,
}: TabsProps) => {
  const [activeTab, setInternalActiveTab] = useState(defaultValue);

  const setActiveTab = (value: string) => {
    setInternalActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'inline-flex h-12 items-center justify-center rounded-xl bg-foreground/5 p-1 text-foreground/60 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  );
};

export const TabsTrigger = ({
  value,
  children,
  className,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'text-foreground shadow-sm'
          : 'hover:bg-foreground/5 hover:text-foreground',
        className,
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-lg bg-background shadow-sm"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const TabsContent = ({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {children}
    </motion.div>
  );
};
