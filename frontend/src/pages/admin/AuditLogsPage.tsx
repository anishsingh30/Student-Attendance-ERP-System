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
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Audit Trail</h1>
        <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
          Immutable audit record of all authentication, attendance updates, CSV uploads, and agent executions.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'LOGIN', 'ATTENDANCE', 'CSV', 'AGENT', 'THRESHOLD', 'ALERT', 'SUBJECT'].map((term) => (
            <button
              key={term}
              onClick={() => handleActionChange(term)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all erp-button ${
                filterAction === term
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'
              }`}
            >
              {term === '' ? 'All Audit Records' : term}
            </button>
          ))}
        </div>

        <div className="text-slate-500 dark:text-[#A3A3A3] font-mono text-[11px]">
          Showing {logs.length} of {totalLogs} events
        </div>
      </div>

      {/* Bounded Audit Log Table */}
      <div className="bg-white dark:bg-[#111111] rounded-xl overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs flex flex-col">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] border-b border-slate-200 dark:border-[#262626] uppercase tracking-wider font-semibold text-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Timestamp</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">User / Initiator</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Action</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Resource</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Status</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-[#737373] font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span>Loading audit trail...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-[#737373] font-medium">
                    No audit records match the filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-[#171717]/60 transition-colors erp-table-row">
                    <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-[#A3A3A3] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-900 dark:text-white block">{log.username || 'System Daemon'}</span>
                      <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 uppercase font-semibold">{log.user_role || 'Service'}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-800 dark:text-[#D4D4D4]">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-[#A3A3A3] font-mono text-[11px]">
                      {log.resource}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-[#A3A3A3] max-w-xs truncate font-mono text-[11px]" title={log.details || ''}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-[#262626] bg-slate-50/50 dark:bg-[#141414] text-xs">
          <div className="text-slate-600 dark:text-[#A3A3A3] font-medium">
            Showing{' '}
            <strong className="text-slate-900 dark:text-white font-mono">
              {totalLogs === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>
            –
            <strong className="text-slate-900 dark:text-white font-mono">
              {Math.min(currentPage * pageSize, totalLogs)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-white font-mono">{totalLogs}</strong> audit events
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#171717] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-100 dark:hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 6 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400">...</span>;
                }
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  disabled={loading}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold transition-all ${
                    p === currentPage
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#333333] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-100 dark:hover:bg-[#222222]'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#171717] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-100 dark:hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
