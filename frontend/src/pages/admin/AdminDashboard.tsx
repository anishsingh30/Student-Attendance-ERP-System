import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  History, 
  Sliders, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentSuccess, setAgentSuccess] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminAnalytics();
      setData(res);
    } catch (e: any) {
      console.error('Failed to load admin analytics:', e);
      setError(e?.message || 'Unable to load university administrative telemetry. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRunAgent = async () => {
    setAgentRunning(true);
    setAgentSuccess(null);
    try {
      const res = await api.triggerAgentAnalysis();
      setAgentSuccess(`Evaluation cycle completed: ${res.students_analyzed} students scanned, ${res.alerts_created} notices generated.`);
      await loadAnalytics();
    } catch (e: any) {
      alert(`Evaluation cycle failed: ${e.message}`);
    } finally {
      setAgentRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Loading university administrative telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white dark:bg-[#121215] p-5 rounded-lg border border-slate-200 dark:border-[#27272A] max-w-md w-full text-center space-y-3 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Telemetry Unavailable</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {error || 'Unable to load administrative telemetry.'}
            </p>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const greenCutoff = data.thresholds?.green_min ?? 75;

  return (
    <div className="space-y-5 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">University Administration Portal</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 uppercase font-semibold">
              Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            AttendanceAI • Institution-Wide Attendance Monitoring &amp; Policy Compliance
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <a
            href="/admin/settings"
            className="erp-btn erp-btn-secondary flex-1 sm:flex-initial justify-center px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Attendance Thresholds</span>
          </a>

          <button
            onClick={handleRunAgent}
            disabled={agentRunning}
            className="erp-btn erp-btn-primary flex-1 sm:flex-initial justify-center px-3.5 py-1.5 text-xs font-medium inline-flex items-center gap-1.5"
          >
            {agentRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            <span>{agentRunning ? 'Evaluating...' : 'Run Policy Evaluation'}</span>
          </button>
        </div>
      </div>

      {agentSuccess && (
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{agentSuccess}</span>
        </div>
      )}

      {/* Institutional Executive Governance Strip */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Institutional Administration &amp; Compliance Console
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>System Status: Healthy</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-[#27272A]">
          {/* Institutional Users */}
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              University Population
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
                {data.total_students}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">students</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              {data.total_faculty} Faculty Instructors • {data.total_subjects || 'All'} Subjects
            </p>
          </div>

          {/* Institutional Attendance Average */}
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Attendance Compliance
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold ${
                data.institutional_average_attendance >= greenCutoff ? 'text-slate-900 dark:text-zinc-100' : 'text-amber-600'
              }`}>
                {data.institutional_average_attendance}%
              </span>
              <span className={`text-xs font-semibold ${
                data.institutional_average_attendance >= greenCutoff ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700'
              }`}>
                {data.institutional_average_attendance >= greenCutoff ? 'Compliant' : 'Below Cutoff'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              Statutory threshold: {greenCutoff}% minimum
            </p>
          </div>

          {/* Active Notices & Shortages */}
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Shortage Notices
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold ${
                data.critical_students_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-zinc-100'
              }`}>
                {data.total_alerts_generated}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">active</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              {data.critical_students_count} Critical Debarment Risk Cases
            </p>
          </div>

          {/* Policy Evaluation Cycles */}
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Policy Cycles
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
                {data.agent_runs_total}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">completed</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              {data.notifications_dispatched} Notices Dispatched via Gateway
            </p>
          </div>
        </div>
      </div>

      {/* Latest Evaluation Run Summary */}
      {data.latest_agent_run && (
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#27272A]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Latest Policy Evaluation Cycle</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 font-semibold border border-slate-200 dark:border-[#27272A]">
                    Cycle #{data.latest_agent_run.id}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Trigger: {data.latest_agent_run.trigger_type} • {data.latest_agent_run.start_time ? new Date(data.latest_agent_run.start_time).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1.5 ${
                data.latest_agent_run.status === 'COMPLETED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                  : data.latest_agent_run.status === 'FAILED'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
              }`}>
                {data.latest_agent_run.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span>{data.latest_agent_run.status}</span>
              </span>

              <a
                href="/admin/agent"
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#18181B] hover:bg-slate-200 dark:hover:bg-[#222228] text-slate-800 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-[#27272A] transition-colors inline-flex items-center gap-1"
              >
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">Students</span>
              <span className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block">{data.latest_agent_run.students_analyzed}</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">Courses</span>
              <span className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block">{data.latest_agent_run.subjects_analyzed}</span>
            </div>
            <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-md text-center">
              <span className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-400 block">At-Risk Cases</span>
              <span className="text-base font-bold text-amber-800 dark:text-amber-300 mt-0.5 block">{data.latest_agent_run.at_risk_found}</span>
            </div>
            <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-md text-center">
              <span className="text-[10px] uppercase font-semibold text-blue-700 dark:text-blue-400 block">Alerts Issued</span>
              <span className="text-base font-bold text-blue-800 dark:text-blue-300 mt-0.5 block">{data.latest_agent_run.alerts_created}</span>
            </div>
            <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-md text-center">
              <span className="text-[10px] uppercase font-semibold text-purple-700 dark:text-purple-400 block">Dispatches</span>
              <span className="text-base font-bold text-purple-800 dark:text-purple-300 mt-0.5 block">{data.latest_agent_run.notifications_sent}</span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">Duration</span>
              <span className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block">{data.latest_agent_run.duration_seconds ? `${data.latest_agent_run.duration_seconds}s` : '< 1s'}</span>
            </div>
          </div>

          {/* Narrative Summary */}
          {data.latest_agent_run.summary && (
            <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A] text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-zinc-100 block mb-0.5">Evaluation Outcome:</span>
              <span>{data.latest_agent_run.summary}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <a
          href="/admin/agent"
          className="erp-card-interactive bg-white dark:bg-[#121215] p-4 rounded-lg border border-slate-200 dark:border-[#27272A] block group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
              <Activity className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 erp-arrow group-hover:text-blue-600" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">Evaluation Engine Center</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Autonomous multi-stage audit execution timeline and cycle history logs.
          </p>
        </a>

        <a
          href="/admin/settings"
          className="erp-card-interactive bg-white dark:bg-[#121215] p-4 rounded-lg border border-slate-200 dark:border-[#27272A] block group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
              <Sliders className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 erp-arrow group-hover:text-amber-600" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">Threshold Governance</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Active Cutoffs: Green {data.thresholds.green_min}%, Yellow {data.thresholds.yellow_min}%, Orange {data.thresholds.orange_min}%.
          </p>
        </a>

        <a
          href="/admin/audit"
          className="erp-card-interactive bg-white dark:bg-[#121215] p-4 rounded-lg border border-slate-200 dark:border-[#27272A] block group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
              <History className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 erp-arrow group-hover:text-purple-600" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">System Audit Trail</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Immutable log of all administrative actions, attendance submissions, and user edits.
          </p>
        </a>

      </div>

    </div>
  );
};
