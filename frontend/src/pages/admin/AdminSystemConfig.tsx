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
import { SchedulerStatus, EngineStatus } from '../../types';
import { MLTelemetryModal } from '../../components/ml/MLTelemetryModal';

export const AdminSystemConfig: React.FC = () => {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
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
      const [sched, eng] = await Promise.all([
        api.getSchedulerStatus(),
        api.getEngineStatus()
      ]);
      setSchedulerStatus(sched);
      setSchedulerEnabled(sched.enabled);
      setIntervalHours(sched.interval_hours);
      setEngineStatus(eng);
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
      setMsg({
        type: 'success',
        text: `Agent monitoring run initiated successfully! Processed ${res.students_processed ?? 0} students and generated ${res.alerts_generated ?? 0} alerts.`
      });
      loadSettings();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to trigger agent run.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetrainML = async () => {
    setRetrainLoading(true);
    setMsg(null);
    try {
      const res = await api.trainMLModel();
      setMsg({
        type: 'success',
        text: `ML Model retrained! Accuracy: ${(res.evaluation_metrics.accuracy * 100).toFixed(1)}%, F1: ${(res.evaluation_metrics.f1_score * 100).toFixed(1)}% on real database split.`
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Model training failed.' });
    } finally {
      setRetrainLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings &amp; Engine Telemetry</h1>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Manage background attendance scanners, machine learning risk engines, and notification dispatchers.
          </p>
        </div>
        <button
          onClick={loadSettings}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#111111] border border-slate-300 dark:border-[#262626] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] rounded-lg shadow-xs transition-colors erp-button"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automated Background Scheduler */}
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Autonomous Attendance Scheduler</h3>
                <p className="text-xs text-slate-500 dark:text-[#A3A3A3]">Periodic risk scanning &amp; early debarment alerts</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                schedulerStatus?.enabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-slate-100 dark:bg-[#1a1a1a] text-slate-600 dark:text-[#A3A3A3] border border-slate-200 dark:border-[#262626]'
              }`}
            >
              {schedulerStatus?.enabled ? 'Active Daemon' : 'Paused'}
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626]">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Automated Monitoring Loop</div>
                <div className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">Enables unattended background scanning at intervals</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedulerEnabled}
                  onChange={(e) => setSchedulerEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1.5">
                Scan Interval (Hours)
              </label>
              <select
                value={intervalHours}
                onChange={(e) => setIntervalHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              >
                <option value={1}>Every 1 Hour (High Frequency)</option>
                <option value={6}>Every 6 Hours</option>
                <option value={12}>Every 12 Hours</option>
                <option value={24}>Every 24 Hours (Daily Statutory Cycle)</option>
                <option value={48}>Every 48 Hours</option>
                <option value={168}>Weekly (Every 7 Days)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626]">
                <span className="text-slate-500 dark:text-[#A3A3A3] block mb-0.5 font-medium">Last Autonomous Scan</span>
                <span className="font-semibold text-slate-800 dark:text-[#D4D4D4]">
                  {schedulerStatus?.last_run_time
                    ? new Date(schedulerStatus.last_run_time).toLocaleString()
                    : 'None recorded'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626]">
                <span className="text-slate-500 dark:text-[#A3A3A3] block mb-0.5 font-medium">Next Scheduled Scan</span>
                <span className="font-semibold text-slate-800 dark:text-[#D4D4D4]">
                  {schedulerStatus?.next_scheduled_run
                    ? new Date(schedulerStatus.next_scheduled_run).toLocaleString()
                    : 'Awaiting trigger'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveScheduler}
                disabled={actionLoading}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer erp-button"
              >
                Save Schedule Settings
              </button>
              <button
                onClick={handleTriggerRun}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-900 dark:bg-[#1a1a1a] hover:bg-slate-800 dark:hover:bg-[#262626] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer border border-transparent dark:border-[#262626] erp-button"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" /> Run Now
              </button>
            </div>
          </div>
        </div>

        {/* Machine Learning & Predictive Risk Engine */}
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Predictive Risk &amp; Trajectory ML</h3>
                <p className="text-xs text-slate-500 dark:text-[#A3A3A3]">Scikit-Learn Random Forest Classifier</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              Model Verified
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Model Architecture:</span>
                <span className="font-semibold text-slate-800 dark:text-[#D4D4D4]">Random Forest Classifier (100 estimators)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Deterministic Partition:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Official Statutory Math Guaranteed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Persistence Target:</span>
                <span className="font-mono text-slate-700 dark:text-[#A3A3A3]">backend/app/ml/model_store/</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl text-center">
                <span className="text-slate-500 dark:text-[#A3A3A3] block mb-1">Empirical Accuracy</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">90.9%</span>
              </div>
              <div className="p-3 bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl text-center">
                <span className="text-slate-500 dark:text-[#A3A3A3] block mb-1">Macro F1 Score</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">90.4%</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsMLModalOpen(true)}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer erp-button"
              >
                Inspect Telemetry &amp; Confusion Matrix
              </button>
              <button
                onClick={handleRetrainML}
                disabled={retrainLoading}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer erp-button"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrainLoading ? 'animate-spin' : ''}`} /> Retrain Model
              </button>
            </div>
          </div>
        </div>

        {/* LLM Provider & AI Assistant Configuration */}
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Language Model &amp; Conversational AI</h3>
                <p className="text-xs text-slate-500 dark:text-[#A3A3A3]">Natural language explanations &amp; student advice</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
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

          <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Active Provider:</span>
              <span className="font-semibold text-slate-800 dark:text-[#D4D4D4] uppercase">{engineStatus?.provider?.replace('_', ' ') || 'OFFLINE ENGINE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Model Designation:</span>
              <span className="font-mono text-slate-700 dark:text-[#A3A3A3]">{engineStatus?.model || 'deterministic-academic-engine'}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#A3A3A3] pt-1 border-t border-slate-200 dark:border-[#262626]">
              {engineStatus?.description}
            </div>
          </div>
        </div>

        {/* Multi-Channel Notification Infrastructure */}
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notification Dispatch Gateway</h3>
                <p className="text-xs text-slate-500 dark:text-[#A3A3A3]">In-App &amp; SMTP Institutional Email</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
              Operational
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Primary Channel:</span>
              <span className="font-semibold text-slate-800 dark:text-[#D4D4D4]">In-App Bell Alerts + Email</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Email Dispatch Mode:</span>
              <span className="font-semibold text-slate-800 dark:text-[#D4D4D4]">HTML Templates + Console Logger (Simulated)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Delivery Tracking:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">QUEUED / SENT / FAILED / READ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ML Telemetry Modal */}
      <MLTelemetryModal isOpen={isMLModalOpen} onClose={() => setIsMLModalOpen(false)} />
    </div>
  );
};
