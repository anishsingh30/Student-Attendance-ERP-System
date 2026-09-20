import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CalendarCheck, 
  AlertTriangle, 
  FileSpreadsheet, 
  Activity, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  ArrowRight, 
  RotateCw,
  TrendingUp,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentSuccessMsg, setAgentSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await api.getFacultyDashboard();
      setData(res);
    } catch (e) {
      console.error('Failed to load faculty dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerEvaluation = async () => {
    setAgentRunning(true);
    setAgentSuccessMsg(null);
    try {
      const res = await api.triggerAgentAnalysis();
      setAgentSuccessMsg(
        res.summary || `Evaluation complete: ${res.students_analyzed} students verified, ${res.alerts_created} notices generated.`
      );
      await loadData();
    } catch (e: any) {
      alert(`Evaluation failed: ${e.message}`);
    } finally {
      setAgentRunning(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Loading faculty course operations...</p>
        </div>
      </div>
    );
  }

  const threshold = data.required_threshold || 75;
  const atRiskStudents = data.student_roster?.filter((s: any) => s.percentage < threshold) || [];

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header: Faculty Identity & Operations Action Group */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                Faculty Attendance Operations
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 font-semibold">
                Instructor Console
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Instructor: <strong className="text-slate-800 dark:text-zinc-200">{user?.full_name}</strong> • {user?.department || 'Academic Department'} • Active Term 2024–2025
            </p>
          </div>

          {/* Primary Action: Record Attendance, Secondary Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <a
              href="/faculty/attendance?tab=manual"
              className="erp-btn erp-btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Record Attendance</span>
            </a>

            <a
              href="/faculty/attendance?tab=csv"
              className="erp-btn erp-btn-secondary px-3.5 py-2 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Import Attendance</span>
            </a>

            <a
              href="/faculty/students"
              className="erp-btn erp-btn-secondary px-3 py-2 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Roster</span>
            </a>

            <a
              href="/faculty/reports"
              className="erp-btn erp-btn-secondary px-3 py-2 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Reports</span>
            </a>
          </div>
        </div>
      </div>

      {agentSuccessMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{agentSuccessMsg}</span>
        </div>
      )}

      {/* 2. Operations Prioritization Bar */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Attendance Operations Overview
          </span>
          <button
            onClick={handleTriggerEvaluation}
            disabled={agentRunning}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 inline-flex items-center gap-1 disabled:opacity-50"
          >
            {agentRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
            <span>{agentRunning ? 'Evaluating...' : 'Run Policy Evaluation'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-[#27272A]">
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Assigned Courses
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1.5 block">
              {data.subjects?.length || 0}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
              Active semester modules
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Students Monitored
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1.5 block">
              {data.total_students}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
              Enrolled across sections
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Class Average
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className={`text-2xl sm:text-3xl font-extrabold ${
                data.class_average_percentage >= threshold ? 'text-slate-900 dark:text-zinc-100' : 'text-amber-600'
              }`}>
                {data.class_average_percentage}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
              Statutory threshold: {threshold}%
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Students Below {threshold}%
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold mt-1.5 block ${
              data.students_below_threshold > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-zinc-100'
            }`}>
              {data.students_below_threshold}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
              Shortage alerts active
            </span>
          </div>

          <div className="p-4 sm:p-5 col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Critical Debarment Risk
            </span>
            <span className={`text-2xl sm:text-3xl font-extrabold mt-1.5 block ${
              data.critical_risk_students > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-zinc-100'
            }`}>
              {data.critical_risk_students}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 block">
              Urgent intervention required
            </span>
          </div>
        </div>
      </div>

      {/* 3. Assigned Courses Operations Table */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Assigned Course Roster &amp; Attendance Status
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Course-wide compliance and rapid session attendance logging
            </p>
          </div>
          <a
            href="/faculty/analytics"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800"
          >
            Detailed Analytics
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-[#27272A] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Course Code</th>
                <th className="px-4 py-3">Course Name</th>
                <th className="px-3 py-3">Sessions Logged</th>
                <th className="px-3 py-3">Average Attendance</th>
                <th className="px-3 py-3">Compliance Status</th>
                <th className="px-4 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {data.subjects?.map((sub: any) => {
                const isPassing = sub.average_percentage >= threshold;
                return (
                  <tr key={sub.subject_id} className="erp-table-row">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {sub.code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-zinc-100">
                      {sub.name}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600 dark:text-zinc-300">
                      {sub.total_records} records
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-sm font-bold ${
                        isPassing ? 'text-slate-900 dark:text-zinc-100' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {sub.average_percentage}%
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        isPassing
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                      }`}>
                        {isPassing ? 'Compliant' : 'Shortage'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/faculty/attendance?subject=${sub.subject_id}&tab=manual`}
                          className="erp-btn erp-btn-primary px-2.5 py-1 text-[11px] inline-flex items-center gap-1"
                        >
                          <CalendarCheck className="w-3 h-3" />
                          <span>Mark Session</span>
                        </a>
                        <a
                          href={`/faculty/students?subject=${sub.subject_id}`}
                          className="erp-btn erp-btn-secondary px-2.5 py-1 text-[11px] font-medium"
                        >
                          Roster
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Students at Risk Interventions Table */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Students Requiring Academic Intervention</span>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                Below {threshold}%
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Identified students eligible for official shortage counseling and recovery warnings
            </p>
          </div>

          <a
            href="/faculty/students"
            className="erp-link text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 inline-flex items-center gap-1"
          >
            <span>Complete Student Roster</span>
            <ArrowRight className="w-3.5 h-3.5 erp-arrow" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-[#27272A] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-3 py-3">Attended / Total</th>
                <th className="px-3 py-3">Attendance</th>
                <th className="px-3 py-3">Risk Level</th>
                <th className="px-4 py-3 text-right">Intervention Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {atRiskStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-zinc-500 font-medium">
                    No students are currently below the {threshold}% minimum attendance threshold.
                  </td>
                </tr>
              ) : (
                atRiskStudents.slice(0, 8).map((s: any) => {
                  const isCritical = s.percentage < threshold - 10;
                  return (
                    <tr key={s.student_id} className="erp-table-row">
                      <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-zinc-300">
                        {s.roll_number}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-zinc-100">
                        {s.name}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-600 dark:text-zinc-400">
                        {s.attended} / {s.conducted}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`font-bold ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {s.percentage}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isCritical
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                        }`}>
                          {s.risk_level || (isCritical ? 'CRITICAL' : 'WARNING')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/student/simulator?student=${s.student_id}`}
                          className="erp-btn erp-btn-secondary px-2.5 py-1 text-[11px] font-medium"
                        >
                          Simulate Recovery
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
