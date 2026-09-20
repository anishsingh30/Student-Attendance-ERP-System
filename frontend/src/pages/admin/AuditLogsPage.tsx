import React, { useState, useEffect } from 'react';
import { History, Shield, Filter, Search, Clock, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { api } from '../../api/client';
import { AuditLogItem } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [filterAction, setFilterAction] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (action = filterAction, page = currentPage, size = pageSize) => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(action || undefined, page, size);
      if (data && typeof data === 'object' && 'items' in data) {
        setLogs(data.items);
        setTotalLogs(data.total);
        setTotalPages(data.total_pages);
        setCurrentPage(data.page);
      } else {
        setLogs(Array.isArray(data) ? data : []);
        setTotalLogs(Array.isArray(data) ? data.length : 0);
        setTotalPages(1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs('', 1, pageSize);
  }, []);

  const handleActionChange = (act: string) => {
    setFilterAction(act);
    setCurrentPage(1);
    fetchLogs(act, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLogs(filterAction, newPage, pageSize);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      <div className="pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">System Audit Trail</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Immutable audit record of all authentication, attendance updates, CSV uploads, and autonomous evaluation runs.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 -mb-1 scrollbar-none whitespace-nowrap">
          {['', 'LOGIN', 'ATTENDANCE', 'CSV', 'AGENT', 'THRESHOLD', 'ALERT', 'SUBJECT'].map((term) => (
            <button
              key={term}
              onClick={() => handleActionChange(term)}
              className={`erp-btn px-2.5 py-1 text-xs font-medium shrink-0 ${
                filterAction === term
                  ? 'erp-btn-primary'
                  : 'erp-btn-secondary'
              }`}
            >
              {term === '' ? 'All Audit Records' : term}
            </button>
          ))}
        </div>

        <div className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
          Showing {logs.length} of {totalLogs} events
        </div>
      </div>

      {/* Bounded Audit Log Table */}
      <div className="bg-white dark:bg-[#121215] rounded-lg overflow-hidden border border-slate-200 dark:border-[#27272A] shadow-xs flex flex-col">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-[#27272A] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Timestamp</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">User / Initiator</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Action</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Resource</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Status</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span>Loading audit trail...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500 font-medium">
                    No audit records match the filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="erp-table-row">
                    <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-900 dark:text-zinc-100 block">{log.username || 'System Evaluation Engine'}</span>
                      <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 uppercase font-semibold">{log.user_role || 'Service'}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-800 dark:text-zinc-200">
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                      {log.resource}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.status === 'SUCCESS' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-zinc-400 max-w-xs truncate font-mono text-[11px]" title={log.details || ''}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 border-t border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#141417] text-xs">
          <div className="text-slate-500 dark:text-zinc-400 text-center sm:text-left">
            Showing{' '}
            <strong className="text-slate-900 dark:text-zinc-200 font-mono">
              {totalLogs === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>
            –
            <strong className="text-slate-900 dark:text-zinc-200 font-mono">
              {Math.min(currentPage * pageSize, totalLogs)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-zinc-200 font-mono">{totalLogs}</strong> audit events
          </div>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="p-1 rounded border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 6 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400 dark:text-zinc-500">...</span>;
                }
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  disabled={loading}
                  className={`min-w-[26px] h-6 px-1 rounded text-xs font-medium transition-colors ${
                    p === currentPage
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="p-1 rounded border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
