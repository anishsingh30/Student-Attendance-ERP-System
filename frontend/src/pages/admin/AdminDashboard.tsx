import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle, 
  Bot, 
  History, 
  Sliders, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { useNotifications } from '../../context/NotificationContext';

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
      setError(e?.message || 'Unable to load university administrative telemetry. Please verify your connection or privileges.');
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
      setAgentSuccess(`Agent execution completed: ${res.students_analyzed} students scanned, ${res.alerts_created} alerts generated.`);
      await loadAnalytics();
    } catch (e: any) {
      alert(`Agent execution failed: ${e.message}`);
    } finally {
      setAgentRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] font-medium">Loading university administrative telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-slate-200 dark:border-[#262626] max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Telemetry Unavailable</h3>
            <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
              {error || 'Unable to load administrative telemetry.'}
            </p>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2 erp-button"
          >
            <span>Retry Telemetry Fetch</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">University Administration Portal</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 uppercase font-semibold">
              System Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Apex Institute of Technology • System-Wide Attendance Intelligence & Agent Orchestration
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/admin/settings"
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#141414] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] border border-slate-200 dark:border-[#262626] text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] transition-all inline-flex items-center gap-2 shadow-xs erp-button"
          >
            <Sliders className="w-4 h-4 text-slate-500 dark:text-[#A3A3A3]" />
            <span>Configure Thresholds</span>
          </a>

          <button
            onClick={handleRunAgent}
            disabled={agentRunning}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold text-white shadow-xs transition-all inline-flex items-center gap-2 erp-button"
          >
            <Bot className={`w-4 h-4 ${agentRunning ? 'animate-spin' : ''}`} />
            <span>{agentRunning ? 'Agent Running...' : 'Execute Agent Cycle'}</span>
          </button>
        </div>
      </div>

      {agentSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{agentSuccess}</span>
        </div>
      )}

      {/* University Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data.total_students}
          subtitle={`${data.total_faculty} Faculty Members`}
          icon={<Users className="w-5 h-5" />}
          accentColor="indigo"
        />

        <StatCard
          title="Institutional Average"
          value={`${data.institutional_average_attendance}%`}
          subtitle={`Total ${data.total_attendance_records} Sessions Logged`}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor={data.institutional_average_attendance >= 75 ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Compliance Alerts"
          value={data.total_alerts_generated}
          subtitle={`${data.critical_students_count} Critical Red Alerts`}
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor={data.critical_students_count > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Autonomous Agent Runs"
          value={data.agent_runs_total}
          subtitle={`${data.notifications_dispatched} in-app alerts sent`}
          icon={<Bot className="w-5 h-5" />}
          accentColor="indigo"
        />
      </div>

      {/* Latest Agent Activity & Execution Summary Panel */}
      {data.latest_agent_run && (
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#262626]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Latest Agent Execution Summary</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900/50">
                    Run #{data.latest_agent_run.id}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">
                  Triggered: {data.latest_agent_run.trigger_type} • {data.latest_agent_run.start_time ? new Date(data.latest_agent_run.start_time).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
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
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-[#1a1a1a] hover:bg-slate-800 dark:hover:bg-[#262626] text-white text-xs font-semibold border border-transparent dark:border-[#262626] shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <span>View Full Agent Run</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">Students Evaluated</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">{data.latest_agent_run.students_analyzed}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">Subjects Scanned</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">{data.latest_agent_run.subjects_analyzed}</span>
            </div>
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">At-Risk Cases</span>
              <span className="text-base font-extrabold text-amber-800 dark:text-amber-300 mt-0.5 block">{data.latest_agent_run.at_risk_found}</span>
            </div>
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block">Alerts Published</span>
              <span className="text-base font-extrabold text-blue-800 dark:text-blue-300 mt-0.5 block">{data.latest_agent_run.alerts_created}</span>
            </div>
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 block">Notifications Sent</span>
              <span className="text-base font-extrabold text-purple-800 dark:text-purple-300 mt-0.5 block">{data.latest_agent_run.notifications_sent}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">Execution Duration</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">{data.latest_agent_run.duration_seconds ? `${data.latest_agent_run.duration_seconds}s` : '< 1s'}</span>
            </div>
          </div>

          {/* Summary Narrative */}
          {data.latest_agent_run.summary && (
            <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-lg border border-slate-200 dark:border-[#262626] text-xs text-slate-700 dark:text-[#D4D4D4] leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Execution Log Summary:</span>
              <span>{data.latest_agent_run.summary}</span>
            </div>
          )}

          {data.latest_agent_run.error_message && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
              <span className="font-semibold block mb-0.5">Execution Error:</span>
              <span>{data.latest_agent_run.error_message}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <a
          href="/admin/agent"
          className="bg-white dark:bg-[#111111] p-5 rounded-xl border border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#333333] hover:shadow-md transition-all block group erp-card-interactive"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
              <Bot className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-[#737373] group-hover:text-blue-700 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agent Monitoring Center</h3>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Visual 7-stage autonomous execution timeline, live run triggers, and step-by-step telemetry.
          </p>
        </a>

        <a
          href="/admin/settings"
          className="bg-white dark:bg-[#111111] p-5 rounded-xl border border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#333333] hover:shadow-md transition-all block group erp-card-interactive"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
              <Sliders className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-[#737373] group-hover:text-amber-700 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Threshold Management</h3>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Active Cutoffs: Green {data.thresholds.green_min}%, Yellow {data.thresholds.yellow_min}%, Orange {data.thresholds.orange_min}%.
          </p>
        </a>

        <a
          href="/admin/audit"
          className="bg-white dark:bg-[#111111] p-5 rounded-xl border border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#333333] hover:shadow-md transition-all block group erp-card-interactive"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
              <History className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-[#737373] group-hover:text-purple-700 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Audit Trail</h3>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Complete immutable log of all logins, attendance updates, CSV imports, and policy changes.
          </p>
        </a>

      </div>

    </div>
  );
};
