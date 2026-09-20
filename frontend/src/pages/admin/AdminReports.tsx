import React, { useEffect, useState } from 'react';
import { Download, FileText, Filter, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';

export const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'at-risk' | 'subjects' | 'departments' | 'agent-runs'>('at-risk');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'at-risk') {
        const res = await api.getReportsAtRisk();
        setData(res);
      } else if (activeTab === 'subjects') {
        const res = await api.getReportsSubjects();
        setData(res);
      } else if (activeTab === 'departments') {
        const res = await api.getReportsDepartment();
        setData(res);
      } else if (activeTab === 'agent-runs') {
        const res = await api.getReportsAgentRuns();
        setData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const getCsvDownloadUrl = () => {
    if (activeTab === 'at-risk') return api.getReportDownloadUrl('/reports/at-risk/csv');
    if (activeTab === 'subjects') return api.getReportDownloadUrl('/reports/subjects/csv');
    if (activeTab === 'departments') return api.getReportDownloadUrl('/reports/departments/csv');
    return api.getReportDownloadUrl('/reports/agent-runs/csv');
  };

  const filteredData = data.filter((row) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(s));
  });

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Institutional Reports &amp; Exports</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Generate and export statutory attendance reports, at-risk rosters, and autonomous evaluation logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={getCsvDownloadUrl()}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export {activeTab.toUpperCase().replace('-', ' ')} CSV
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#27272A] gap-5 text-xs font-medium overflow-x-auto max-w-full pb-1 -mb-1 scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveTab('at-risk')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'at-risk'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          At-Risk Students Roster
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'subjects'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          Subject Attendance Summaries
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'departments'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          Department Analytics
        </button>
        <button
          onClick={() => setActiveTab('agent-runs')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'agent-runs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          Evaluation Engine Logs
        </button>
      </div>

      {/* Search and refresh toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-full sm:max-w-xs w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report records..."
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="erp-btn erp-btn-secondary px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-md text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Display */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[62vh]">
          {activeTab === 'at-risk' && (
            <table className="w-full min-w-[700px] text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-[#27272A]">
                <tr>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Roll Number</th>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Student Name</th>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Department</th>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Subject</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Attendance %</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Attended / Total</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Consecutive Needed</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 dark:text-zinc-500 font-medium">
                      No records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-medium text-slate-900 dark:text-zinc-100">{row.roll_number}</td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-zinc-100">{row.student_name}</td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-zinc-400">{row.department}</td>
                      <td className="py-2.5 px-3.5 text-slate-800 dark:text-zinc-200">
                        <span className="font-mono text-slate-500 dark:text-zinc-400 mr-1">{row.subject_code}</span>
                        {row.subject_name}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-slate-900 dark:text-zinc-100">
                        {Number(row.attendance_percentage).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3.5 text-center text-slate-600 dark:text-zinc-400">
                        {row.classes_attended} / {row.classes_conducted}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-semibold text-blue-600 dark:text-blue-400">
                        {row.consecutive_classes_needed > 0 ? `+${row.consecutive_classes_needed}` : 'None'}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            row.risk_level === 'RED'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                          }`}
                        >
                          {row.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'subjects' && (
            <table className="w-full min-w-[650px] text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-[#27272A]">
                <tr>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Subject Code</th>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Subject Title</th>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Department</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Enrolled Students</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Average Attendance</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">At-Risk Count</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Critical Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 dark:text-zinc-500 font-medium">
                      No subjects found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900 dark:text-zinc-100">{row.subject_code}</td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-zinc-100">{row.subject_name}</td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-zinc-400">{row.department}</td>
                      <td className="py-2.5 px-3.5 text-center text-slate-800 dark:text-zinc-300">{row.total_enrolled}</td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-slate-900 dark:text-zinc-100">
                        {Number(row.average_percentage).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3.5 text-center text-amber-600 dark:text-amber-400 font-semibold">{row.at_risk_count}</td>
                      <td className="py-2.5 px-3.5 text-center text-rose-600 dark:text-rose-400 font-semibold">{row.critical_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'departments' && (
            <table className="w-full min-w-[650px] text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-[#27272A]">
                <tr>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Department</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Total Students</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Total Subjects</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Average Attendance %</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">At-Risk Total</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Critical Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-zinc-500 font-medium">
                      No department data.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-zinc-100">{row.department}</td>
                      <td className="py-2.5 px-3.5 text-center text-slate-800 dark:text-zinc-300">{row.total_students}</td>
                      <td className="py-2.5 px-3.5 text-center text-slate-800 dark:text-zinc-300">{row.total_subjects}</td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-slate-900 dark:text-zinc-100">
                        {Number(row.average_percentage).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3.5 text-center text-amber-600 dark:text-amber-400 font-semibold">{row.at_risk_count}</td>
                      <td className="py-2.5 px-3.5 text-center text-rose-600 dark:text-rose-400 font-semibold">{row.critical_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'agent-runs' && (
            <table className="w-full min-w-[750px] text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-[#27272A]">
                <tr>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Run ID</th>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Trigger</th>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Start Time</th>
                  <th className="py-2.5 px-3.5 bg-slate-50 dark:bg-[#18181B]">Duration</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Students Analyzed</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Alerts Created</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Notifications</th>
                  <th className="py-2.5 px-3.5 text-center bg-slate-50 dark:bg-[#18181B]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 dark:text-zinc-500 font-medium">
                      No evaluation executions found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900 dark:text-zinc-100">#{row.run_id}</td>
                      <td className="py-2.5 px-3.5">
                        <span className="font-medium text-slate-700 dark:text-zinc-300">{row.trigger_type}</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-zinc-400">
                        {row.start_time ? new Date(row.start_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-zinc-400">{row.duration_seconds}s</td>
                      <td className="py-2.5 px-3.5 text-center font-medium text-slate-900 dark:text-zinc-100">{row.students_analyzed}</td>
                      <td className="py-2.5 px-3.5 text-center text-amber-600 dark:text-amber-400 font-semibold">{row.alerts_created}</td>
                      <td className="py-2.5 px-3.5 text-center text-blue-600 dark:text-blue-400 font-semibold">{row.notifications_sent}</td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            row.status === 'COMPLETED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Record Count */}
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-[#141417] border-t border-slate-200 dark:border-[#27272A] text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
          Showing <strong className="text-slate-900 dark:text-zinc-200">{filteredData.length}</strong> of{' '}
          <strong className="text-slate-900 dark:text-zinc-200">{data.length}</strong> records
        </div>
      </div>
    </div>
  );
};
