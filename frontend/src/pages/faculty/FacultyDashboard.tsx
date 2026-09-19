import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Bot, 
  FileSpreadsheet, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { RiskBadge } from '../../components/common/RiskBadge';

export const FacultyDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentSuccessMsg, setAgentSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await api.getFacultyDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerAgent = async () => {
    setAgentRunning(true);
    setAgentSuccessMsg(null);
    try {
      const res = await api.triggerAgentAnalysis();
      setAgentSuccessMsg(
        res.summary || `Agent evaluated ${res.students_analyzed} students: ${res.alerts_created} new alerts created, ${res.duplicates_suppressed || 0} active alerts retained.`
      );
      await loadData();
    } catch (e: any) {
      alert(`Agent execution failed: ${e.message}`);
    } finally {
      setAgentRunning(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading faculty class analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header with Agent Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Faculty Academic Portal</h1>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Department of Computer Science • Class-wide Attendance &amp; Risk Intervention
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/faculty/attendance"
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#111111] hover:bg-slate-50 dark:hover:bg-[#171717] border border-slate-200 dark:border-[#262626] text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] transition-all inline-flex items-center gap-2 shadow-xs erp-button"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Mark / Import CSV</span>
          </a>

          <button
            onClick={handleTriggerAgent}
            disabled={agentRunning}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-all inline-flex items-center gap-2 disabled:opacity-50 erp-button cursor-pointer"
          >
            <Bot className={`w-4 h-4 ${agentRunning ? 'animate-spin' : ''}`} />
            <span>{agentRunning ? 'Agent Running...' : 'Run Attendance Agent'}</span>
          </button>
        </div>
      </div>

      {agentSuccessMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{agentSuccessMsg}</span>
        </div>
      )}

      {/* Class Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students Monitored"
          value={data.total_students}
          subtitle="Enrolled across assigned courses"
          icon={<Users className="w-5 h-5" />}
          accentColor="indigo"
        />

        <StatCard
          title="Class Average Attendance"
          value={`${data.class_average_percentage}%`}
          subtitle={`Mandatory minimum: ${data.required_threshold}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={data.class_average_percentage >= 75 ? 'Healthy' : 'Sub-threshold'}
          trendPositive={data.class_average_percentage >= 75}
          accentColor={data.class_average_percentage >= 80 ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Students Below 75%"
          value={data.students_below_threshold}
          subtitle="Require active recovery plan"
          icon={<AlertTriangle className="w-5 h-5" />}
          trendPositive={data.students_below_threshold === 0}
          accentColor={data.students_below_threshold > 0 ? 'orange' : 'emerald'}
        />

        <StatCard
          title="Critical Risk (< 65%)"
          value={data.critical_risk_students}
          subtitle="Immediate exam debarment risk"
          icon={<ShieldAlert className="w-5 h-5" />}
          trendPositive={data.critical_risk_students === 0}
          accentColor={data.critical_risk_students > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Subject Performance Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Assigned Course Analytics</h2>
            <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-0.5">Cohort attendance metrics across assigned curriculum</p>
          </div>
          <a href="/faculty/analytics" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            Full Analytics &amp; Export
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.subjects?.map((sub: any) => (
            <div key={sub.subject_id} className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] p-5 rounded-xl shadow-xs">
              <span className="font-mono text-[11px] text-slate-500 dark:text-[#A3A3A3] font-medium bg-slate-100 dark:bg-[#171717] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#262626]">
                {sub.code}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">{sub.name}</h3>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{sub.average_percentage}%</span>
                <span className="text-xs text-slate-500 dark:text-[#A3A3A3]">{sub.total_records} records logged</span>
              </div>

              <div className="mt-3 w-full bg-slate-100 dark:bg-[#171717] rounded-full h-2 overflow-hidden border border-slate-200 dark:border-[#262626]">
                <div
                  className={`h-full rounded-full ${
                    sub.average_percentage >= 80
                      ? 'bg-emerald-500'
                      : sub.average_percentage >= 75
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, sub.average_percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* At-Risk Students Snapshot */}
      <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#262626] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Students Requiring Intervention</h3>
            <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">Roster of students currently below institutional 75% cutoff</p>
          </div>
          <a
            href="/faculty/students"
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1"
          >
            <span>View Full Roster</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] border-b border-slate-200 dark:border-[#262626] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Attended / Total</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
              {data.student_roster?.filter((s: any) => s.percentage < 75).slice(0, 6).map((s: any) => (
                <tr key={s.student_id} className="hover:bg-slate-50/80 dark:hover:bg-[#171717] transition-colors erp-table-row">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-[#CBD5E1]">{s.roll_number}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-[#A3A3A3]">{s.attended} / {s.conducted}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${s.percentage < 65 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {s.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={s.risk_level} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/student/simulator?student=${s.student_id}`}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                    >
                      Simulate
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
