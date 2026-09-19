import React, { useEffect, useState } from 'react';
import {
  Mail,
  Bell,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadNotifications = async (page = currentPage, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAllNotifications(statusFilter || undefined, channelFilter || undefined, page, size);
      if (data && typeof data === 'object' && 'items' in data) {
        setNotifications(data.items);
        setTotalNotifications(data.total);
        setTotalPages(data.total_pages);
        setCurrentPage(data.page);
      } else {
        setNotifications(Array.isArray(data) ? data : []);
        setTotalNotifications(Array.isArray(data) ? data.length : 0);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadNotifications(1, pageSize);
  }, [statusFilter, channelFilter]);

  const handleRetry = async (id: number) => {
    setRetryingId(id);
    setActionMsg(null);
    try {
      await api.retryNotification(id);
      setActionMsg(`Notification #${id} retried successfully.`);
      loadNotifications();
    } catch (err: any) {
      setError(err.message || `Failed to retry notification #${id}.`);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Notification Delivery Gateway</h1>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Monitor autonomous alert dispatch across In-App and Email channels with delivery retry tracking.
          </p>
        </div>
        <button
          onClick={() => loadNotifications()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#111111] border border-slate-300 dark:border-[#262626] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] rounded-lg shadow-xs transition-colors erp-button"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Deliveries
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{actionMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-[#D4D4D4]">Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Channels</option>
              <option value="IN_APP">In-App</option>
              <option value="EMAIL">Email (SMTP)</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-[#D4D4D4]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="QUEUED">Queued</option>
              <option value="FAILED">Failed</option>
              <option value="READ">Read</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 dark:text-[#A3A3A3] font-medium font-mono text-[11px]">
          Showing {notifications.length} of {totalNotifications} total deliveries
        </div>
      </div>

      {/* Bounded Notifications Table */}
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] font-semibold border-b border-slate-200 dark:border-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              <tr>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717]">ID</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717]">User ID</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717]">Channel</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717]">Notification Title</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717]">Message Snippet</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717] text-center">Status</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717] text-center">Retries</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717] text-center">Dispatched</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 dark:text-[#737373]">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span>Loading delivery logs...</span>
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 dark:text-[#737373]">
                    No notification dispatch records found matching criteria.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-[#171717]/60 transition-colors erp-table-row">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">#{n.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-[#A3A3A3]">User {n.user_id}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-[#1a1a1a] text-slate-700 dark:text-[#D4D4D4] border border-slate-200 dark:border-[#262626]">
                        {n.channel === 'EMAIL' ? (
                          <Mail className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Bell className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        )}
                        {n.channel || 'IN_APP'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{n.title}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-[#A3A3A3] max-w-xs truncate" title={n.message}>
                      {n.message}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          n.status === 'SENT' || n.status === 'READ'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                            : n.status === 'FAILED'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                        }`}
                      >
                        {n.status || (n.is_read ? 'READ' : 'SENT')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-[#A3A3A3]">
                      {n.retry_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 dark:text-[#A3A3A3] font-mono text-[11px]">
                      {n.sent_at ? new Date(n.sent_at).toLocaleString() : new Date(n.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {n.status === 'FAILED' ? (
                        <button
                          onClick={() => handleRetry(n.id)}
                          disabled={retryingId === n.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/70 rounded text-[11px] font-semibold border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                        >
                          <RotateCw className={`w-3 h-3 ${retryingId === n.id ? 'animate-spin' : ''}`} /> Retry
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-[#737373] text-[11px]">—</span>
                      )}
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
              {totalNotifications === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>
            –
            <strong className="text-slate-900 dark:text-white font-mono">
              {Math.min(currentPage * pageSize, totalNotifications)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-white font-mono">{totalNotifications}</strong> delivery records
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const p = currentPage - 1;
                setCurrentPage(p);
                loadNotifications(p, pageSize);
              }}
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
                  onClick={() => {
                    setCurrentPage(p);
                    loadNotifications(p, pageSize);
                  }}
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
              onClick={() => {
                const p = currentPage + 1;
                setCurrentPage(p);
                loadNotifications(p, pageSize);
              }}
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
