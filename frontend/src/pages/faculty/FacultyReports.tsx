import React, { useEffect, useState } from 'react';
import { Download, FileText, Filter, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';

export const FacultyReports: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const subs = await api.getFacultySubjects();
      setSubjects(subs);
      if (subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
        const stus = await api.getFacultyStudents(subs[0].id);
        setStudents(stus);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSubjectChange = async (subjectId: number) => {
    setSelectedSubjectId(subjectId);
    setLoading(true);
    try {
      const stus = await api.getFacultyStudents(subjectId);
      setStudents(stus);
    } catch (err: any) {
      setError(err.message || 'Failed to load roster.');
    } finally {
      setLoading(false);
    }
  };

  const getCsvDownloadUrl = () => {
    const qs = selectedSubjectId ? `?subject_id=${selectedSubjectId}` : '';
    return api.getReportDownloadUrl(`/reports/at-risk/csv${qs}`);
  };

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(term) ||
      s.roll_number?.toLowerCase().includes(term) ||
      s.risk_level?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Course Attendance Reports</h1>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Generate and export classroom attendance registers, at-risk rosters, and recovery quotas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={getCsvDownloadUrl()}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors erp-button"
          >
            <Download className="w-3.5 h-3.5" /> Download Course CSV Report
          </a>
        </div>
      </div>

      {/* Course Selector & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-[#D4D4D4]">Select Subject:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs font-medium"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or roll..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-[#737373]" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[62vh]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] font-semibold border-b border-slate-200 dark:border-[#262626] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              <tr>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717]">Roll Number</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717]">Student Name</th>
                <th className="py-3 px-4 bg-slate-50 dark:bg-[#171717]">Email</th>
                <th className="py-3 px-4 text-center bg-slate-50 dark:bg-[#171717]">Classes Attended</th>
                <th className="py-3 px-4 text-center bg-slate-50 dark:bg-[#171717]">Total Conducted</th>
                <th className="py-3 px-4 text-center bg-slate-50 dark:bg-[#171717]">Current %</th>
                <th className="py-3 px-4 text-center bg-slate-50 dark:bg-[#171717]">Recovery Classes</th>
                <th className="py-3 px-4 text-center bg-slate-50 dark:bg-[#171717]">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 dark:text-[#737373]">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#171717] transition-colors erp-table-row">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{s.roll_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{s.full_name}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-[#A3A3A3]">{s.email}</td>
                    <td className="py-3 px-4 text-center text-slate-800 dark:text-[#D4D4D4]">{s.classes_attended ?? 0}</td>
                    <td className="py-3 px-4 text-center text-slate-600 dark:text-[#A3A3A3]">{s.classes_conducted ?? 0}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                      {s.percentage !== undefined ? `${Number(s.percentage).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                      {s.consecutive_classes_needed > 0 ? `+${s.consecutive_classes_needed}` : 'Safe'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.risk_level === 'RED'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                            : s.risk_level === 'ORANGE' || s.risk_level === 'YELLOW'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        }`}
                      >
                        {s.risk_level || 'GREEN'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Record Count */}
        <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-[#141414] border-t border-slate-200 dark:border-[#262626] text-[11px] text-slate-500 dark:text-[#A3A3A3] font-mono">
          Showing <strong className="text-slate-900 dark:text-white">{filtered.length}</strong> of <strong className="text-slate-900 dark:text-white">{students.length}</strong> students
        </div>
      </div>
    </div>
  );
};
