import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Layers,
  Activity,
  Check
} from 'lucide-react';
import { api } from '../../api/client';
import { AgentRunItem, AgentLogItem } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

export const AgentMonitoring: React.FC = () => {
  const [runs, setRuns] = useState<AgentRunItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<AgentRunItem | null>(null);
  const [logs, setLogs] = useState<AgentLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const { engineStatus } = useNotifications();

  const fetchRuns = async () => {
    try {
      const data = await api.getAgentRuns();
      setRuns(data);
      if (data.length > 0) {
        setSelectedRun(data[0]);
        fetchLogs(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (runId: number) => {
    try {
      const stepLogs = await api.getAgentRunLogs(runId);
      setLogs(stepLogs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleSelectRun = (run: AgentRunItem) => {
    setSelectedRun(run);
    fetchLogs(run.id);
  };

  const handleTriggerRun = async () => {
    setExecuting(true);
    try {
      await api.triggerAgentAnalysis();
      await fetchRuns();
    } catch (e: any) {
      alert(`Evaluation engine error: ${e.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const timelineSteps = [
    { num: 1, name: 'FETCH_DATA', label: 'Attendance Records Queried', desc: 'Rosters & active sessions queried from database' },
    { num: 2, name: 'CALCULATE_PERCENTAGES', label: 'Attendance Percentages Computed', desc: 'Deterministic calculation of attended vs conducted sessions' },
    { num: 3, name: 'CHECK_THRESHOLDS', label: 'Policy Thresholds Evaluated', desc: 'Compared against dynamic Green/Yellow/Orange/Red cutoffs' },
    { num: 4, name: 'IDENTIFY_CASES', label: 'At-Risk Cases Categorized', desc: 'Deficits flagged into Warning and Critical shortage tiers' },
    { num: 5, name: 'CALCULATE_RECOVERY', label: 'Recovery Quotas Calculated', desc: 'Consecutive future sessions needed to reach statutory threshold' },
    { num: 6, name: 'DISPATCH_ALERTS_AND_NOTIFICATIONS', label: 'Guidance & Alert Delivery', desc: 'Personalized explanations and official notices dispatched' },
    { num: 7, name: 'WORKFLOW_COMPLETE', label: 'Audit Trail Finalized', desc: 'Execution telemetry and immutable audit log committed' },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Evaluation Engine Observability</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Engine Ready</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Observability and telemetry of multi-stage policy evaluations, deficit detection, and notice generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {engineStatus && (
            <div className="hidden md:block text-right">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Model Engine:</span>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{engineStatus.display_badge}</p>
            </div>
          )}

          <button
            onClick={handleTriggerRun}
            disabled={executing}
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-medium text-white shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            {executing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Cycle...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Trigger Manual Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selected Run Metrics */}
      {selectedRun && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">Status</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{selectedRun.status}</span>
            </span>
          </div>
          <div className="bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">Timestamp</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 mt-0.5 block font-mono">
              {new Date(selectedRun.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">Students</span>
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block">{selectedRun.students_analyzed}</span>
          </div>
          <div className="bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">At-Risk Cases</span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5 block">{selectedRun.at_risk_found}</span>
          </div>
          <div className="bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">Alerts Issued</span>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-0.5 block">{selectedRun.alerts_created}</span>
          </div>
          <div className="bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block">Notifications</span>
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block">{selectedRun.notifications_sent}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Pipeline & Step Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* 7-Stage Execution Pipeline */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121215] p-4 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-[#27272A]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">Evaluation Pipeline</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Sequential multi-step workflow</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 font-medium border border-slate-200 dark:border-[#27272A]">
              Cycle #{selectedRun?.id || '—'}
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#27272A]">
            {timelineSteps.map((step) => {
              const matchedLog = logs.find((l) => l.step_number === step.num);
              const isDone = !!matchedLog;

              return (
                <div key={step.num} className="relative">
                  <div
                    className={`absolute -left-6 top-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-white dark:bg-[#18181B] border-slate-300 dark:border-[#3F3F46] text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 leading-none flex items-center gap-2">
                      <span>{step.label}</span>
                      {isDone && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Passed</span>}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetry Logs & History */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white dark:bg-[#121215] p-4 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-[#27272A]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">Step Telemetry Logs</h3>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{logs.length} events</span>
            </div>

            <div className="bg-slate-900 dark:bg-[#09090B] border border-slate-800 dark:border-[#27272A] text-slate-100 rounded-md p-3.5 font-mono text-xs space-y-2.5 max-h-[300px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-slate-400 dark:text-zinc-500 text-center py-6 font-sans">No log entries for this evaluation cycle.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-slate-300 dark:text-zinc-300 pb-2 border-b border-slate-800 dark:border-[#1F1F23] last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">
                      <span className="text-blue-400 font-medium">
                        [{log.step_number}] {log.step_name}
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-200 dark:text-zinc-200 leading-relaxed font-sans">{log.log_message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historical Runs */}
          <div className="bg-white dark:bg-[#121215] p-4 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">Evaluation Cycle History</h3>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">{runs.length} logged runs</span>
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {runs.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRun(r)}
                  className={`p-2.5 rounded-md border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                    selectedRun?.id === r.id
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-slate-900 dark:text-zinc-100 font-medium'
                      : 'bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#202025]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">Cycle #{r.id}</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-mono">
                        {new Date(r.start_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-blue-700 dark:text-blue-400 font-semibold">{r.alerts_created} alerts</span>
                    <span className="text-[10px] block text-slate-500 dark:text-zinc-400">{r.students_analyzed} students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
