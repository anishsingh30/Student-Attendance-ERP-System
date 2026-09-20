import React, { useEffect, useState } from 'react';
import {
  Settings,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Brain,
  Mail,
  Database,
  Cpu,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Server
} from 'lucide-react';
import { api } from '../../api/client';
import { SchedulerStatus, EngineStatus, MLMetrics } from '../../types';
import { MLTelemetryModal } from '../../components/ml/MLTelemetryModal';

export const AdminSystemConfig: React.FC = () => {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [mlMetrics, setMlMetrics] = useState<MLMetrics | null>(null);
  const [intervalHours, setIntervalHours] = useState<number>(24);
  const [schedulerEnabled, setSchedulerEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMLModalOpen, setIsMLModalOpen] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [sched, eng, mlData] = await Promise.all([
        api.getSchedulerStatus(),
        api.getEngineStatus(),
        api.getMLMetrics().catch(() => null)
      ]);
      setSchedulerStatus(sched);
      setSchedulerEnabled(sched.enabled);
      setIntervalHours(sched.interval_hours);
      setEngineStatus(eng);
      if (mlData) setMlMetrics(mlData);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load system configuration.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveScheduler = async () => {
    setActionLoading(true);
    setMsg(null);
    try {
      const updated = await api.updateSchedulerConfig(schedulerEnabled, intervalHours);
      setSchedulerStatus(updated);
      setMsg({ type: 'success', text: 'Scheduler configuration updated successfully.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update scheduler.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerRun = async () => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await api.triggerSchedulerRun();
      if (res.status === 'ALREADY_RUNNING') {
        setMsg({
          type: 'error',
          text: res.message || 'An attendance evaluation cycle is already in progress.'
        });
        return;
      }

      const analyzed = res.students_analyzed ?? res.students_processed ?? 0;
      const created = res.alerts_created ?? res.alerts_generated ?? 0;
      const atRisk = res.at_risk_found ?? 0;
      const suppressed = res.duplicates_suppressed ?? 0;
      const recovered = res.recovered_resolved ?? 0;
      const critical = res.critical_cases_count ?? 0;
      const warning = res.warning_cases_count ?? 0;

      let msgText = `Attendance evaluation completed successfully! Evaluated ${analyzed} student profiles.`;
      if (created > 0) {
        msgText += ` Detected ${atRisk} deficit cases (${critical} critical, ${warning} warning) and published ${created} new alerts.`;
      } else if (atRisk > 0) {
        msgText += ` Detected ${atRisk} deficit cases (${suppressed} existing alerts retained under 24h idempotency cooldown).`;
      } else if (analyzed === 0) {
        msgText = `No eligible attendance records found for evaluation.`;
      } else {
        msgText += ` All student records meet institutional compliance thresholds.`;
      }
      if (recovered > 0) {
        msgText += ` Auto-resolved ${recovered} recovered cases now in good standing.`;
      }

      setMsg({
        type: 'success',
        text: msgText
      });
      await loadSettings();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Attendance evaluation could not be completed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetrainML = async () => {
    setRetrainLoading(true);
    setMsg(null);
    try {
      const res = await api.trainMLModel();
      const evalMetrics = res?.results?.metrics || res?.metrics || res?.evaluation_metrics;
      const accText = evalMetrics?.accuracy !== undefined ? ` Accuracy: ${(evalMetrics.accuracy * 100).toFixed(1)}%` : '';
      const f1Text = evalMetrics?.f1_score !== undefined ? `, F1: ${(evalMetrics.f1_score * 100).toFixed(1)}%` : '';
      if (evalMetrics) {
        setMlMetrics((prev: any) => ({
          ...(prev || {}),
          metrics: evalMetrics,
          evaluation_metrics: evalMetrics
        }));
      }
      setMsg({
        type: 'success',
        text: res?.message ? `${res.message}${accText}${f1Text}` : `ML Model retrained successfully!${accText}${f1Text}`
      });
      await loadSettings();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Model training failed.' });
    } finally {
      setRetrainLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">System Settings &amp; Engine Telemetry</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Configure automated attendance evaluation schedules, predictive risk models, and notification gateways.
          </p>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-md shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Grid of config panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Automated Background Scheduler */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Automated Attendance Scheduler</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Periodic risk scanning &amp; early debarment alerts</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                schedulerStatus?.enabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#27272A]'
              }`}
            >
              {schedulerStatus?.enabled ? 'Active Daemon' : 'Paused'}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A]">
              <div>
                <div className="text-xs font-medium text-slate-900 dark:text-zinc-100">Automated Evaluation Loop</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Enables unattended background scanning at intervals</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedulerEnabled}
                  onChange={(e) => setSchedulerEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Scan Interval (Hours)
              </label>
              <select
                value={intervalHours}
                onChange={(e) => setIntervalHours(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-xs"
              >
                <option value={1}>Every 1 Hour (High Frequency)</option>
                <option value={6}>Every 6 Hours</option>
                <option value={12}>Every 12 Hours</option>
                <option value={24}>Every 24 Hours (Daily Statutory Cycle)</option>
                <option value={48}>Every 48 Hours</option>
                <option value={168}>Weekly (Every 7 Days)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A]">
                <span className="text-slate-500 dark:text-zinc-400 block mb-0.5 text-[11px]">Last Evaluation Scan</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  {schedulerStatus?.last_run_time
                    ? new Date(schedulerStatus.last_run_time).toLocaleString()
                    : 'None recorded'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A]">
                <span className="text-slate-500 dark:text-zinc-400 block mb-0.5 text-[11px]">Next Scheduled Scan</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  {schedulerStatus?.next_scheduled_run
                    ? new Date(schedulerStatus.next_scheduled_run).toLocaleString()
                    : 'Awaiting trigger'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleSaveScheduler}
                disabled={actionLoading}
                className="w-full sm:flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer text-center"
              >
                Save Schedule Settings
              </button>
              <button
                onClick={handleTriggerRun}
                disabled={actionLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer border border-transparent dark:border-[#27272A] disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{actionLoading ? 'Running Evaluation...' : 'Run Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Machine Learning & Predictive Risk Engine */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Predictive Risk &amp; Trajectory ML</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Scikit-Learn Random Forest Classifier</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              Model Verified
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Model Architecture:</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">Random Forest Classifier (100 estimators)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Deterministic Partition:</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Official Statutory Math Guaranteed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Persistence Target:</span>
                <span className="font-mono text-slate-700 dark:text-zinc-300">PostgreSQL (Neon BYTEA)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-center">
                <span className="text-slate-500 dark:text-zinc-400 block mb-0.5 text-[11px]">Empirical Accuracy</span>
                <span className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {mlMetrics?.metrics?.accuracy !== undefined
                    ? `${(mlMetrics.metrics.accuracy * 100).toFixed(1)}%`
                    : mlMetrics?.evaluation_metrics?.accuracy !== undefined
                    ? `${(mlMetrics.evaluation_metrics.accuracy * 100).toFixed(1)}%`
                    : loading ? '...' : '—'}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-center">
                <span className="text-slate-500 dark:text-zinc-400 block mb-0.5 text-[11px]">Macro F1 Score</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {mlMetrics?.metrics?.f1_score !== undefined
                    ? `${(mlMetrics.metrics.f1_score * 100).toFixed(1)}%`
                    : mlMetrics?.evaluation_metrics?.f1_score !== undefined
                    ? `${(mlMetrics.evaluation_metrics.f1_score * 100).toFixed(1)}%`
                    : loading ? '...' : '—'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href="/admin/telemetry"
                className="w-full sm:flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer text-center inline-flex items-center justify-center"
              >
                Inspect Telemetry &amp; Matrix
              </a>
              <button
                onClick={handleRetrainML}
                disabled={retrainLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 py-1.5 px-3 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrainLoading ? 'animate-spin' : ''}`} /> Retrain Model
              </button>
            </div>
          </div>
        </div>

        {/* LLM Provider Configuration */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Language Model &amp; Attendance Assistant</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Natural language explanations &amp; academic advice</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                engineStatus?.is_live
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                  : engineStatus?.status === 'CONFIGURATION_ERROR'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
              }`}
            >
              {engineStatus?.display_badge || 'OFFLINE REASONING'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Active Provider:</span>
              <span className="font-medium text-slate-800 dark:text-zinc-200 uppercase">{engineStatus?.provider?.replace('_', ' ') || 'OFFLINE ENGINE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Model Designation:</span>
              <span className="font-mono text-slate-700 dark:text-zinc-300">{engineStatus?.model || 'deterministic-academic-engine'}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-200 dark:border-[#27272A]">
              {engineStatus?.description}
            </div>
          </div>
        </div>

        {/* Multi-Channel Notification Infrastructure */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Notification Dispatch Gateway</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">In-App &amp; SMTP Institutional Email</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              Operational
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Primary Channel:</span>
              <span className="font-medium text-slate-800 dark:text-zinc-200">In-App Alerts + Email</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Email Dispatch Mode:</span>
              <span className="font-medium text-slate-800 dark:text-zinc-200">HTML Templates + Console Logger (Simulated)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Delivery Tracking:</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">QUEUED / SENT / FAILED / READ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ML Telemetry Modal */}
      <MLTelemetryModal isOpen={isMLModalOpen} onClose={() => setIsMLModalOpen(false)} />
    </div>
  );
};
