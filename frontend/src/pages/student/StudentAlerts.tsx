import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Clock, Check, Loader2, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { AlertItem } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';

// Map lifecycle_status to a human-readable badge
function LifecycleBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    NEW:           { label: 'Active',       className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50' },
    ACKNOWLEDGED:  { label: 'Acknowledged', className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50' },
    IN_PROGRESS:   { label: 'In Progress',  className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' },
    RESOLVED:      { label: 'Resolved',     className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' },
    DISMISSED:     { label: 'Dismissed',    className: 'bg-slate-100 dark:bg-[#1a1a1a] text-slate-600 dark:text-[#A3A3A3] border border-slate-200 dark:border-[#262626]' },
    ESCALATED:     { label: 'Escalated',    className: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50' },
  };
  const c = cfg[status] ?? cfg['NEW'];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.className}`}>
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
    // Prevent duplicate clicks while loading
    if (actionLoading[alertId]) return;

    // Clear previous error and success for this alert
    setAlertErrors((prev) => ({ ...prev, [alertId]: '' }));
    setSuccessId(null);
    setActionLoading((prev) => ({ ...prev, [alertId]: true }));

    try {
      // Call backend with the OPPOSITE of current state
      const updated = await api.resolveAlert(alertId, !currentIsResolved);

      // Update state using the AUTHORITATIVE backend response (not optimistic toggle)
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, ...(updated as any) } : a))
      );

      // Show success notification briefly
      setSuccessId(alertId);
      setTimeout(() => setSuccessId(null), 3000);

    } catch (err: any) {
      // Parse error message from API client
      const rawMsg: string = err?.message || 'An unexpected error occurred.';

      let userMsg: string;
      if (rawMsg.includes('A newer active alert already exists')) {
        userMsg =
          'Cannot reopen: a newer active alert already exists for this subject. ' +
          'The monitoring agent has already issued an updated alert — review that one instead.';
      } else if (rawMsg.includes('Access forbidden') || rawMsg.includes('403') || rawMsg.includes('Forbidden')) {
        userMsg = 'You are not authorized to modify this alert.';
      } else if (rawMsg.includes('404') || rawMsg.includes('not found')) {
        userMsg = 'Alert not found. It may have been removed. Refreshing…';
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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Attendance Alerts &amp; Interventions</h1>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Personalized academic notices generated autonomously by the Attendance Monitoring Agent.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-[#111111] border border-slate-300 dark:border-[#262626] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] rounded-lg shadow-xs transition-colors erp-button"
          title="Refresh alerts"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-[#737373] font-medium">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400 dark:text-[#737373]" />
            Loading alerts…
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white dark:bg-[#111111] p-12 text-center rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Zero Compliance Alerts</h3>
            <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
              Your attendance is comfortably exceeding institutional thresholds across all courses.
            </p>
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className={`bg-white dark:bg-[#111111] p-5 rounded-xl border shadow-xs transition-all ${
                a.is_resolved
                  ? 'opacity-70 border-slate-200 dark:border-[#262626]'
                  : a.risk_level === 'RED'
                  ? 'border-l-4 border-l-rose-500 border-slate-200 dark:border-[#262626]'
                  : a.risk_level === 'ORANGE'
                  ? 'border-l-4 border-l-amber-500 border-slate-200 dark:border-[#262626]'
                  : 'border-l-4 border-l-amber-400 border-slate-200 dark:border-[#262626]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#262626]">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <RiskBadge level={a.risk_level} size="sm" />
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-[#A3A3A3]">{a.subject_code}</span>
                    {/* Lifecycle status badge — uses authoritative backend field */}
                    <LifecycleBadge status={a.lifecycle_status || (a.is_resolved ? 'RESOLVED' : 'NEW')} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{a.title}</h3>
                </div>

                <div className="text-right sm:self-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{a.current_percentage}%</span>
                  <span className="text-[11px] text-slate-500 dark:text-[#A3A3A3] block">
                    {a.classes_attended}/{a.classes_conducted} classes (Target: {a.required_percentage}%)
                  </span>
                </div>
              </div>

              {/* Narrative & Action */}
              <div className="my-4 space-y-2 text-xs leading-relaxed">
                <p className="text-slate-700 dark:text-slate-300">{a.explanation}</p>
                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-slate-800 dark:text-slate-200">
                  <strong className="text-blue-900 dark:text-blue-300 font-semibold">Recommended Recovery Action: </strong>
                  {a.recommended_action}
                </div>
              </div>

              {/* Per-alert error banner */}
              {alertErrors[a.id] && (
                <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-xs">
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
                <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {a.is_resolved
                      ? 'Alert marked as resolved successfully.'
                      : 'Alert reopened for continued monitoring.'}
                  </span>
                </div>
              )}

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-500 dark:text-[#A3A3A3] text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373]" />
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                  <span className="text-blue-700 dark:text-blue-400 font-semibold">
                    Recovery Quota: {a.classes_required} consecutive classes
                  </span>
                </div>

                <button
                  id={`alert-action-${a.id}`}
                  onClick={() => handleToggleResolve(a.id, a.is_resolved)}
                  disabled={actionLoading[a.id]}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all erp-button ${
                    actionLoading[a.id]
                      ? 'opacity-60 cursor-wait bg-slate-100 dark:bg-[#171717] text-slate-500 dark:text-[#737373]'
                      : a.is_resolved
                      ? 'bg-slate-100 dark:bg-[#171717] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-200 dark:hover:bg-[#202020] cursor-pointer'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer'
                  }`}
                >
                  {actionLoading[a.id] ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {actionLoading[a.id]
                      ? (a.is_resolved ? 'Reopening…' : 'Resolving…')
                      : (a.is_resolved ? 'Mark Unresolved' : 'Acknowledge & Resolve')}
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
