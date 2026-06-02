import type React from 'react';
import { cn } from '../../utils/cn';

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export const Pagination = ({
  className,
  currentPage,
  totalPages,
  onPageChange,
  ...props
}: PaginationProps) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          <button
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-50"
          >
            Previous
          </button>
        </li>

        {pages.map((page) => (
          <li key={page}>
            <button
              onClick={() => onPageChange?.(page)}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-primary-500 text-white shadow-sm hover:bg-primary-600'
                  : 'hover:bg-foreground/5 text-foreground',
              )}
            >
              {page}
            </button>
          </li>
        ))}

        <li>
          <button
            onClick={() =>
              onPageChange?.(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-50"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};
