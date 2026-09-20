import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Check, Loader2, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { AlertItem } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';

function LifecycleBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    NEW:           { label: 'Active',       className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40' },
    ACKNOWLEDGED:  { label: 'Acknowledged', className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40' },
    IN_PROGRESS:   { label: 'In Progress',  className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40' },
    RESOLVED:      { label: 'Resolved',     className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40' },
    DISMISSED:     { label: 'Dismissed',    className: 'bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A]' },
    ESCALATED:     { label: 'Escalated',    className: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40' },
  };
  const c = cfg[status] ?? cfg['NEW'];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

export const StudentAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [alertErrors, setAlertErrors] = useState<Record<number, string>>({});
  const [successId, setSuccessId] = useState<number | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const items = await api.getAlerts();
      setAlerts(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleToggleResolve = async (alertId: number, currentIsResolved: boolean) => {
    if (actionLoading[alertId]) return;

    setAlertErrors((prev) => ({ ...prev, [alertId]: '' }));
    setSuccessId(null);
    setActionLoading((prev) => ({ ...prev, [alertId]: true }));

    try {
      const updated = await api.resolveAlert(alertId, !currentIsResolved);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, ...(updated as any) } : a))
      );
      setSuccessId(alertId);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err: any) {
      const rawMsg: string = err?.message || 'An unexpected error occurred.';
      let userMsg: string;
      if (rawMsg.includes('A newer active alert already exists')) {
        userMsg =
          'Cannot reopen: a newer active alert already exists for this subject. ' +
          'The monitoring system has already issued an updated notice.';
      } else if (rawMsg.includes('Access forbidden') || rawMsg.includes('403') || rawMsg.includes('Forbidden')) {
        userMsg = 'You are not authorized to modify this alert.';
      } else if (rawMsg.includes('404') || rawMsg.includes('not found')) {
        userMsg = 'Alert not found. Refreshing…';
        fetchAlerts();
      } else if (rawMsg.includes('cannot be') || rawMsg.includes('invalid') || rawMsg.includes('lifecycle')) {
        userMsg = 'This alert cannot be changed from its current state.';
      } else if (rawMsg.includes('Unable to connect') || rawMsg.includes('network') || rawMsg.includes('fetch')) {
        userMsg = 'Unable to reach the server. Please check your connection and try again.';
      } else {
        userMsg = 'Unable to update this alert. Please try again.';
      }

      setAlertErrors((prev) => ({ ...prev, [alertId]: userMsg }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Attendance Notices &amp; Warnings</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Official attendance notifications evaluated according to university policies.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#18181B] rounded-md shadow-xs transition-colors"
          title="Refresh alerts"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-3.5">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400 dark:text-zinc-500" />
            Loading notices…
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white dark:bg-[#121215] p-10 text-center rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Zero Attendance Alerts</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Your attendance currently complies with requirements across all enrolled courses.
            </p>
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`bg-white dark:bg-[#121215] p-4 rounded-lg border shadow-xs transition-colors ${
                a.is_resolved
                  ? 'opacity-70 border-slate-200 dark:border-[#27272A]'
                  : a.risk_level === 'RED'
                  ? 'border-l-3 border-l-rose-500 border-slate-200 dark:border-[#27272A]'
                  : a.risk_level === 'ORANGE'
                  ? 'border-l-3 border-l-amber-500 border-slate-200 dark:border-[#27272A]'
                  : 'border-l-3 border-l-amber-400 border-slate-200 dark:border-[#27272A]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#27272A]">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <RiskBadge level={a.risk_level} size="sm" />
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-zinc-400">{a.subject_code}</span>
                    <LifecycleBadge status={a.lifecycle_status || (a.is_resolved ? 'RESOLVED' : 'NEW')} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{a.title}</h3>
                </div>

                <div className="text-left sm:text-right sm:self-center">
                  <span className="text-base font-bold text-slate-900 dark:text-zinc-100">{a.current_percentage}%</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                    {a.classes_attended} / {a.classes_conducted} sessions (Requirement: {a.required_percentage}%)
                  </span>
                </div>
              </div>

              {/* Explanation & Action */}
              <div className="my-3 space-y-2 text-xs leading-relaxed">
                <p className="text-slate-700 dark:text-zinc-300">{a.explanation}</p>
                <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-800 dark:text-zinc-200">
                  <strong className="text-blue-700 dark:text-blue-400 font-semibold">Recommended Recovery Action: </strong>
                  {a.recommended_action}
                </div>
              </div>

              {/* Per-alert error banner */}
              {alertErrors[a.id] && (
                <div className="mb-2.5 flex items-start gap-2 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>{alertErrors[a.id]}</span>
                  <button
                    onClick={() => setAlertErrors((prev) => ({ ...prev, [a.id]: '' }))}
                    className="ml-auto text-rose-400 hover:text-rose-600 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Per-alert success banner */}
              {successId === a.id && (
                <div className="mb-2.5 flex items-center gap-2 p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {a.is_resolved
                      ? 'Notice marked as resolved successfully.'
                      : 'Notice reopened for monitoring.'}
                  </span>
                </div>
              )}

              {/* Card Footer */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                  <span className="text-blue-700 dark:text-blue-400 font-semibold">
                    Recovery Quota: {a.classes_required} consecutive sessions
                  </span>
                </div>

                <button
                  id={`alert-action-${a.id}`}
                  onClick={() => handleToggleResolve(a.id, a.is_resolved)}
                  disabled={actionLoading[a.id]}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                    actionLoading[a.id]
                      ? 'opacity-60 cursor-wait bg-slate-100 dark:bg-[#18181B] text-slate-500 dark:text-zinc-400'
                      : a.is_resolved
                      ? 'bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#202025]'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                  }`}
                >
                  {actionLoading[a.id] ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {actionLoading[a.id]
                      ? (a.is_resolved ? 'Updating…' : 'Resolving…')
                      : (a.is_resolved ? 'Reopen Notice' : 'Acknowledge & Resolve')}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
