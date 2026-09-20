import React from 'react';
import { ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';

export interface Column<T> {
  header: string | React.ReactNode;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactNode;
  maxHeight?: string; // e.g. 'max-h-[60vh]' or inline style
  pagination?: PaginationConfig;
  className?: string;
  tableClassName?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No records found.',
  emptySubtitle,
  emptyIcon,
  maxHeight = 'max-h-[62vh]',
  pagination,
  className = '',
  tableClassName = '',
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {
  const total = pagination ? pagination.total : data.length;
  const page = pagination ? pagination.page : 1;
  const pageSize = pagination ? pagination.pageSize : data.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(total / (pageSize || 1)));

  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  // Pagination range generator with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg shadow-xs overflow-hidden flex flex-col ${className}`}
    >
      {/* Scrollable Container with Bounded Height & Sticky Header */}
      <div
        className={`w-full overflow-x-auto overflow-y-auto ${maxHeight}`}
        style={{ scrollBehavior: 'smooth' }}
      >
        <table className={`w-full text-left text-xs border-collapse ${tableClassName}`}>
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] border-b border-slate-200 dark:border-[#27272A] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            <tr>
              {columns.map((col, idx) => {
                const alignClass =
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left';
                return (
                  <th
                    key={idx}
                    scope="col"
                    className={`px-3.5 py-2.5 text-[11px] uppercase font-semibold tracking-wider text-slate-600 dark:text-zinc-400 whitespace-nowrap bg-slate-50 dark:bg-[#18181B] ${alignClass} ${col.headerClassName || ''}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
            {loading ? (
              // Skeleton Loading Rows
              Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`} className="px-3.5 py-2.5">
                      <div className="h-3 bg-slate-200 dark:bg-[#27272A] rounded w-3/4 max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-[#737373]">
                    {emptyIcon || <Inbox className="w-8 h-8 mb-2 opacity-60 text-slate-400 dark:text-[#737373]" />}
                    <p className="text-xs font-semibold text-slate-700 dark:text-[#D4D4D4]">{emptyMessage}</p>
                    {emptySubtitle && (
                      <p className="text-[11px] text-slate-400 dark:text-[#737373] mt-0.5">{emptySubtitle}</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Render Data Rows
              data.map((item, rowIdx) => {
                const customRowClass = rowClassName ? rowClassName(item, rowIdx) : '';
                return (
                  <tr
                    key={keyExtractor(item, rowIdx)}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-slate-50 dark:hover:bg-[#18181B] transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${customRowClass}`}
                  >
                    {columns.map((col, colIdx) => {
                      const alignClass =
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left';

                      let content: React.ReactNode;
                      if (typeof col.accessor === 'function') {
                        content = col.accessor(item);
                      } else if (col.accessor) {
                        content = item[col.accessor] as unknown as React.ReactNode;
                      } else {
                        content = null;
                      }

                      return (
                        <td
                          key={colIdx}
                          className={`px-3.5 py-2.5 text-slate-700 dark:text-zinc-300 ${alignClass} ${col.className || ''}`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Record Count & Pagination Bar */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3.5 py-2.5 border-t border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] text-xs">
          <div className="flex items-center gap-3 text-slate-600 dark:text-zinc-400 font-medium">
            <span>
              Showing <strong className="text-slate-900 dark:text-zinc-100 font-mono">{startRecord}</strong>–
              <strong className="text-slate-900 dark:text-zinc-100 font-mono">{endRecord}</strong> of{' '}
              <strong className="text-slate-900 dark:text-zinc-100 font-mono">{total}</strong> records
            </span>

            {pagination.onPageSizeChange && pagination.pageSizeOptions && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                  className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded px-2 py-0.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {pagination.pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              aria-label="Previous Page"
              className="p-1 rounded-md border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#202025] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((pNum, pIdx) => {
                if (pNum === '...') {
                  return (
                    <span key={`dots-${pIdx}`} className="px-2 py-1 text-slate-400 dark:text-zinc-500">
                      ...
                    </span>
                  );
                }
                const isActive = pNum === page;
                return (
                  <button
                    key={`page-${pNum}`}
                    onClick={() => pagination.onPageChange(Number(pNum))}
                    disabled={loading}
                    className={`min-w-[26px] h-6 px-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#202025]'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => pagination.onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              aria-label="Next Page"
              className="p-1 rounded-md border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#202025] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable ScrollableTableWrapper for components that prefer customized JSX table content
 * while benefiting from bounded height, internal scroll, and sticky headers.
 */
export const TableContainer: React.FC<{
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}> = ({ children, maxHeight = 'max-h-[62vh]', className = '' }) => {
  return (
    <div className={`bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg shadow-xs overflow-hidden ${className}`}>
      <div className={`overflow-x-auto overflow-y-auto ${maxHeight}`}>
        {children}
      </div>
    </div>
  );
};
