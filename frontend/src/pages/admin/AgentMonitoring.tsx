import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Layers
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
      alert(`Agent execution error: ${e.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const timelineSteps = [
    { num: 1, name: 'FETCH_DATA', label: 'Attendance Records Fetched', desc: 'Rosters & active sessions queried from database' },
    { num: 2, name: 'CALCULATE_PERCENTAGES', label: 'Attendance Percentages Calculated', desc: 'Deterministic calculation of attended / conducted' },
    { num: 3, name: 'CHECK_THRESHOLDS', label: 'Thresholds Evaluated', desc: 'Compared against dynamic Green/Yellow/Orange/Red cutoffs' },
    { num: 4, name: 'IDENTIFY_CASES', label: 'Warning & Critical Cases Flagged', desc: 'Deficits categorized into Warning and Critical tiers' },
    { num: 5, name: 'CALCULATE_RECOVERY', label: 'Recovery Requirements Computed', desc: 'Deterministic consecutive future lectures needed to reach 75%' },
    { num: 6, name: 'DISPATCH_ALERTS_AND_NOTIFICATIONS', label: 'AI Reasoning & Alert Delivery', desc: 'LLM personalized explanations generated & in-app alerts sent' },
    { num: 7, name: 'WORKFLOW_COMPLETE', label: 'Audit Log & Cycle Finalized', desc: 'Execution telemetry and immutable audit trail committed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      
      {/* Header with Live AI Badge & Run Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Agent Operations & Monitoring</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Autonomous Agent Engine Active</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Real-time observability of multi-step attendance monitoring, risk detection, and alert delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {engineStatus && (
            <div className="hidden md:block text-right">
              <span className="text-[10px] text-slate-500 dark:text-[#A3A3A3] font-medium">Active LLM Engine:</span>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">{engineStatus.display_badge}</p>
            </div>
          )}

          <button
            onClick={handleTriggerRun}
            disabled={executing}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold text-white shadow-xs transition-all inline-flex items-center gap-2 erp-button"
          >
            {executing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Cycle...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Trigger Manual Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Latest Run Highlights */}
      {selectedRun && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">Status</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{selectedRun.status}</span>
            </span>
          </div>
          <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">Last Run</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
              {new Date(selectedRun.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">Students Scanned</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">{selectedRun.students_analyzed}</span>
          </div>
          <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">At-Risk Detected</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-1 block">{selectedRun.at_risk_found}</span>
          </div>
          <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">Alerts Generated</span>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-400 mt-1 block">{selectedRun.alerts_created}</span>
          </div>
          <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] block">Notifications Sent</span>
            <span className="text-sm font-bold text-purple-700 dark:text-purple-400 mt-1 block">{selectedRun.notifications_sent}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Visual Timeline & Step Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Visual 7-Stage Execution Timeline */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111111] p-6 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-[#262626]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agent Execution Pipeline</h3>
              <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">Sequential 7-stage workflow</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900/50">
              Run #{selectedRun?.id || '—'}
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#262626]">
            {timelineSteps.map((step) => {
              const matchedLog = logs.find((l) => l.step_number === step.num);
              const isDone = !!matchedLog;

              return (
                <div key={step.num} className="relative">
                  <div
                    className={`absolute -left-6 top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'bg-white dark:bg-[#171717] border-slate-300 dark:border-[#333333] text-slate-400 dark:text-[#737373]'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none flex items-center gap-2">
                      <span>{step.label}</span>
                      {isDone && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Completed</span>}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] mt-1">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step-by-Step Execution Logs */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#262626]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Agent Telemetry Logs</h3>
                <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">Event records emitted by agent execution steps</p>
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-[#080808] border border-transparent dark:border-[#262626] text-slate-100 rounded-xl p-4 font-mono text-xs space-y-3 max-h-[360px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-slate-400 dark:text-[#737373] text-center py-6 font-sans">No logs for this execution run.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-slate-300 dark:text-[#D4D4D4] pb-2.5 border-b border-slate-800 dark:border-[#262626] last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-[#A3A3A3] mb-1">
                      <span className="text-blue-400 dark:text-blue-300 font-bold">
                        [{log.step_number}] {log.step_name}
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-200 dark:text-[#F5F5F5] leading-relaxed font-sans">{log.log_message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historical Runs List */}
          <div className="bg-white dark:bg-[#111111] p-5 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Historical Execution Cycles</h3>
              <span className="text-[10px] font-mono text-slate-400 dark:text-[#737373]">{runs.length} run{runs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {runs.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectRun(r)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs erp-button ${
                    selectedRun?.id === r.id
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-800 text-slate-900 dark:text-white font-medium shadow-xs'
                      : 'bg-slate-50 dark:bg-[#141414] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-[#A3A3A3] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Agent Run #{r.id}</span>
                      <span className="text-[10px] text-slate-500 dark:text-[#A3A3A3] block">
                        {new Date(r.start_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-blue-700 dark:text-blue-400 font-semibold">{r.alerts_created} alerts</span>
                    <span className="text-[10px] block text-slate-500 dark:text-[#A3A3A3]">{r.students_analyzed} students</span>
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
