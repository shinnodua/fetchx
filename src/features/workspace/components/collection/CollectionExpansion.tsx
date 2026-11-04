import type { ReactNode } from 'react';

interface CollectionExpansionProps {
  expanded: boolean;
  children: ReactNode;
}

export const CollectionExpansion = ({
  expanded,
  children,
}: CollectionExpansionProps) => (
  <div
    aria-hidden={!expanded}
    inert={!expanded}
    className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
      expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    }`}
  >
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
);
