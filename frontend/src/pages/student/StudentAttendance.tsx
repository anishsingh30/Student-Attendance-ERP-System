import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Search, 
  Calendar, 
  RotateCw, 
  AlertCircle,
  FileSpreadsheet,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';
import { AttendanceRecord, StudentDashboardData } from '../../types';

export const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const fetchRecords = async (subId?: number, st?: string) => {
    setLoading(true);
    setError(null);
    try {
      const atts = await api.getStudentAttendance(subId, st);
      setRecords(atts);
      setCurrentPage(1);
    } catch (e: any) {
      console.error('Failed to load attendance records:', e);
      setError(e?.message || 'Unable to load attendance records from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInit = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dash, atts] = await Promise.all([
          api.getStudentDashboard(),
          api.getStudentAttendance()
        ]);
        setDashboard(dash);
        setRecords(atts);

        // Check if subject query parameter exists in URL
        const urlParams = new URLSearchParams(window.location.search);
        const subParam = urlParams.get('subject');
        if (subParam) {
          const parsedSubId = parseInt(subParam);
          setSelectedSubject(parsedSubId);
          fetchRecords(parsedSubId, selectedStatus);
        }
      } catch (e: any) {
        console.error('Failed to load initial attendance data:', e);
        setError(e?.message || 'Unable to connect to academic records service.');
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  // Filter handlers
  const handleSubjectChange = (val: string) => {
    const subId = val ? parseInt(val) : undefined;
    setSelectedSubject(subId);
    fetchRecords(subId, selectedStatus);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    fetchRecords(selectedSubject, val);
  };

  // Map subjects to faculty names
  const subjectFacultyMap = useMemo(() => {
    const map = new Map<number, string>();
    if (dashboard?.subjects) {
      dashboard.subjects.forEach(s => {
        if (s.faculty_name) {
          map.set(s.subject_id, s.faculty_name);
        }
      });
    }
    return map;
  }, [dashboard]);

  // Client-side filtering for search and date range
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (startDate && new Date(r.date) < new Date(startDate)) return false;
      if (endDate && new Date(r.date) > new Date(endDate)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.subject_name?.toLowerCase().includes(q);
        const matchCode = r.subject_code?.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchNotes) return false;
      }
      return true;
    });
  }, [records, startDate, endDate, searchQuery]);

  // Summary statistics of filtered results
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'PRESENT').length;
    const absent = filteredRecords.filter(r => r.status === 'ABSENT').length;
    const rate = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;
    return { total, present, absent, rate };
  }, [filteredRecords]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (!dashboard?.student_id) return;
    setIsExporting(true);
    try {
      const url = api.getReportDownloadUrl(`/reports/student/${dashboard.student_id}/csv`);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_records_${dashboard.roll_number || 'student'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const handleResetFilters = () => {
    setSelectedSubject(undefined);
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    fetchRecords(undefined, '');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Page Header & Student Identity Banner */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Academic Attendance Registry
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Official institutional audit records of all scheduled lecture and laboratory sessions
            </p>

            {dashboard && (
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-300 flex-wrap">
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{dashboard.full_name}</span>
                <span>•</span>
                <span className="font-mono text-slate-500 dark:text-zinc-400">Roll: {dashboard.roll_number}</span>
                <span>•</span>
                <span>{dashboard.department} (Sem {dashboard.semester})</span>
                <span>•</span>
                <span className="font-semibold text-blue-700 dark:text-blue-400">
                  Cumulative: {dashboard.overall_percentage}%
                </span>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={handleExportCSV}
              disabled={isExporting || loading || records.length === 0}
              className="erp-btn erp-btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-2"
            >
              {isExporting ? (
                <RotateCw className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
              <span>{isExporting ? 'Generating CSV...' : 'Export Official CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Operations & Filter Bar */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          
          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject || ''}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs rounded-md px-2.5 py-1.5 text-slate-800 dark:text-zinc-200"
            >
              <option value="">All Enrolled Subjects</option>
              {dashboard?.subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_code} — {s.subject_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs rounded-md px-2.5 py-1.5 text-slate-800 dark:text-zinc-200"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">PRESENT Only</option>
              <option value="ABSENT">ABSENT Only</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs rounded-md px-2.5 py-1.5 text-slate-800 dark:text-zinc-200"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs rounded-md px-2.5 py-1.5 text-slate-800 dark:text-zinc-200"
            />
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
              Search Notes
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Topic / Remarks..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs rounded-md pl-8 pr-2.5 py-1.5 text-slate-800 dark:text-zinc-200 placeholder-slate-400"
              />
            </div>
          </div>

        </div>

        {(selectedSubject || selectedStatus || startDate || endDate || searchQuery) && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#27272A] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400">
              Active filters applied. Showing {filteredRecords.length} filtered entries.
            </span>
            <button
              onClick={handleResetFilters}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Filtered Registry Summary Metrics */}
      <div className="bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
            Filtered Sessions
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block">
            {stats.total}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Sessions Attended
          </span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
            {stats.present}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
            Sessions Absent
          </span>
          <span className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-0.5 block">
            {stats.absent}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
            Attendance Rate
          </span>
          <span className={`text-xl font-bold mt-0.5 block ${
            stats.rate >= 75 ? 'text-slate-900 dark:text-zinc-100' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {stats.rate}%
          </span>
        </div>
      </div>

      {/* 4. Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchRecords(selectedSubject, selectedStatus)}
            className="px-3 py-1 bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900 rounded font-semibold text-rose-700 hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Official Attendance Records Table (Bounded Scrolling with Sticky Header) */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-[#27272A] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B] whitespace-nowrap">Session Date</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Subject</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Faculty Instructor</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Session</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Status</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Remarks / Syllabus Topic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-zinc-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 text-blue-600 animate-spin" />
                      <span>Loading attendance audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-zinc-500 font-medium">
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                      <p className="font-semibold text-slate-700 dark:text-zinc-300">No attendance records found</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">
                        No sessions match the current course or date filter criteria.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1 bg-slate-100 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded text-slate-700 dark:text-zinc-300 text-xs font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const faculty = subjectFacultyMap.get(r.subject_id) || 'Academic Faculty';
                  const dateObj = new Date(r.date);
                  const isPresent = r.status === 'PRESENT';

                  return (
                    <tr 
                      key={r.id} 
                      className="erp-table-row"
                    >
                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 dark:text-zinc-300">
                        {dateObj.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-400 mr-1.5">
                          {r.subject_code}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                          {r.subject_name}
                        </span>
                      </td>

                      {/* Faculty */}
                      <td className="px-3 py-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        {faculty}
                      </td>

                      {/* Session */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272A]">
                          Lecture
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>PRESENT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>ABSENT</span>
                          </span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 max-w-xs truncate" title={r.notes || ''}>
                        {r.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Dynamic Pagination & Table Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] text-xs">
          <div className="text-slate-500 dark:text-zinc-400">
            Showing{' '}
            <strong className="text-slate-900 dark:text-zinc-100 font-mono">
              {filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-900 dark:text-zinc-100 font-mono">
              {Math.min(currentPage * pageSize, filteredRecords.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-900 dark:text-zinc-100 font-mono">
              {filteredRecords.length}
            </strong>{' '}
            sessions
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs rounded px-2 py-1 text-slate-800 dark:text-zinc-200"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1 rounded border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono text-xs text-slate-600 dark:text-zinc-300">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1 rounded border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
