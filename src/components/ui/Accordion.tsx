import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

export const Accordion = ({
  items,
  className,
  allowMultiple = false,
}: AccordionProps) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (openItems.includes(id)) {
      setOpenItems(openItems.filter((item) => item !== id));
    } else {
      if (allowMultiple) {
        setOpenItems([...openItems, id]);
      } else {
        setOpenItems([id]);
      }
    }
  };

  return (
    <div
      className={cn(
        'w-full divide-y divide-foreground/10 border border-foreground/10 rounded-xl overflow-hidden bg-background',
        className,
      )}
    >
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);

        return (
          <div key={item.id} className="w-full">
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left font-medium transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:bg-foreground/5"
            >
              <span>{item.title}</span>
              <motion.svg
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="h-4 w-4 shrink-0 text-foreground/50"
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
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-1 text-sm text-foreground/70">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
