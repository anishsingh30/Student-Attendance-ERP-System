import React, { useState, useEffect } from 'react';
import { Calendar, Filter, CheckCircle2, XCircle, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { AttendanceRecord, StudentDashboardData } from '../../types';

export const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [dash, atts] = await Promise.all([
          api.getStudentDashboard(),
          api.getStudentAttendance()
        ]);
        setDashboard(dash);
        setRecords(atts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  const handleFilter = async (subId?: number, st?: string) => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const filtered = await api.getStudentAttendance(subId, st);
      setRecords(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const paginatedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getCsvDownloadUrl = () => {
    if (!dashboard?.student_id) return '#';
    return api.getReportDownloadUrl(`/reports/student/${dashboard.student_id}/csv`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Daily Attendance Log</h1>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Detailed historical record of all lecture sessions marked for your academic term.
          </p>
        </div>
        <div>
          <a
            href={getCsvDownloadUrl()}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors erp-button"
          >
            <Download className="w-3.5 h-3.5" /> Download My Attendance CSV
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] mb-1">Subject</label>
            <select
              value={selectedSubject || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : undefined;
                setSelectedSubject(val);
                handleFilter(val, selectedStatus);
              }}
              className="bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] text-xs rounded-lg px-3 py-1.5 text-slate-800 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="">All Subjects</option>
              {dashboard?.subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_code} - {s.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#A3A3A3] mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedStatus(val);
                handleFilter(selectedSubject, val);
              }}
              className="bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] text-xs rounded-lg px-3 py-1.5 text-slate-800 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-[#A3A3A3] font-mono">
          Showing <strong>{records.length}</strong> logged sessions
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-[#111111] rounded-xl overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] border-b border-slate-200 dark:border-[#262626] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Subject Code</th>
                <th className="px-5 py-3.5">Subject Name</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-[#737373] font-medium">
                    Loading records...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-[#737373] font-medium">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-[#171717] transition-colors erp-table-row">
                    <td className="px-5 py-3 font-mono text-slate-600 dark:text-[#A3A3A3]">
                      {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-blue-700 dark:text-blue-400">
                      {r.subject_code}
                    </td>
                    <td className="px-5 py-3 text-slate-900 dark:text-white font-medium">
                      {r.subject_name}
                    </td>
                    <td className="px-5 py-3">
                      {r.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PRESENT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>ABSENT</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-[#737373]">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {records.length > pageSize && (
          <div className="px-5 py-3 bg-slate-50 dark:bg-[#171717] border-t border-slate-200 dark:border-[#262626] flex items-center justify-between text-xs text-slate-600 dark:text-[#A3A3A3]">
            <div>
              Page <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#111111] border border-slate-300 dark:border-[#262626] text-slate-800 dark:text-[#D4D4D4] rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-[#1A1A1A] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#111111] border border-slate-300 dark:border-[#262626] text-slate-800 dark:text-[#D4D4D4] rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-[#1A1A1A] disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
