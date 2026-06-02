import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className={clsx("sys-pagination-container", className)}>
      
      {/* Left Side: Show Page Size & Total Pages */}
      <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0 justify-center sm:justify-start">
        <div className="flex items-center gap-3">
          <span className="sys-pagination-text text-slate-400">SHOW:</span>
          {onPageSizeChange ? (
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Reset to first page on size change
              }}
              className="sys-pagination-select"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          ) : (
            <div className="sys-pagination-select !cursor-default hover:bg-white flex items-center justify-center min-w-[40px]">
              {pageSize}
            </div>
          )}
        </div>
        
        <div className="h-4 w-px bg-slate-200"></div>
        
        <span className="sys-pagination-text">
          TOTAL <span className="text-accent">{totalPages}</span> PAGES
        </span>
      </div>

      {/* Right Side: Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="sys-pagination-btn"
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        <span className="sys-pagination-text">
          PAGE <span className="text-accent">{currentPage}</span> OF <span className="text-accent">{totalPages}</span>
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="sys-pagination-btn"
          aria-label="Next Page"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
      
    </div>
  );
}
