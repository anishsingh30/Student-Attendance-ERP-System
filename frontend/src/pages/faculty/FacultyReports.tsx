import React, { useEffect, useState } from 'react';
import { Download, Filter, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';
import { RiskBadge } from '../../components/common/RiskBadge';
import { DataTable, Column } from '../../components/common/DataTable';

export const FacultyReports: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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
      setError(err.message || 'Failed to load faculty courses.');
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
    setCurrentPage(1);
    try {
      const stus = await api.getFacultyStudents(subjectId);
      setStudents(stus);
    } catch (err: any) {
      setError(err.message || 'Failed to load course roster.');
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

  const columns: Column<any>[] = [
    {
      header: 'Roll Number',
      accessor: (s) => (
        <span className="font-mono font-medium text-slate-700 dark:text-zinc-300">
          {s.roll_number}
        </span>
      ),
    },
    {
      header: 'Student Name',
      accessor: (s) => (
        <span className="font-medium text-slate-900 dark:text-zinc-100">
          {s.full_name}
        </span>
      ),
    },
    {
      header: 'Email',
      accessor: (s) => (
        <span className="text-slate-500 dark:text-zinc-400">
          {s.email}
        </span>
      ),
    },
    {
      header: 'Attended',
      align: 'center',
      accessor: (s) => (
        <span className="font-mono text-slate-700 dark:text-zinc-300">
          {s.classes_attended ?? 0}
        </span>
      ),
    },
    {
      header: 'Held',
      align: 'center',
      accessor: (s) => (
        <span className="font-mono text-slate-600 dark:text-zinc-400">
          {s.classes_conducted ?? 0}
        </span>
      ),
    },
    {
      header: 'Percentage',
      align: 'center',
      accessor: (s) => (
        <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">
          {s.percentage !== undefined ? `${Number(s.percentage).toFixed(1)}%` : '—'}
        </span>
      ),
    },
    {
      header: 'Recovery Needed',
      align: 'center',
      accessor: (s) => (
        <span className={`font-medium ${s.consecutive_classes_needed > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {s.consecutive_classes_needed > 0 ? `+${s.consecutive_classes_needed} classes` : 'Compliant'}
        </span>
      ),
    },
    {
      header: 'Compliance Tier',
      align: 'center',
      accessor: (s) => (
        <RiskBadge level={s.risk_level || 'GREEN'} size="sm" />
      ),
    }
  ];

  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Course Attendance Reports</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Export classroom attendance registers and compliance rosters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={getCsvDownloadUrl()}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 rounded-md text-xs font-medium shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Export Course CSV</span>
          </a>
        </div>
      </div>

      {/* Course Selector & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold uppercase text-slate-500 dark:text-zinc-400">Course:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(Number(e.target.value))}
            className="px-2.5 py-1 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} — {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search student or roll..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <Filter className="w-3 h-3 absolute left-2.5 top-2 text-slate-400 dark:text-zinc-500" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-md text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(s, idx) => s.roll_number || idx}
        loading={loading}
        emptyMessage="No student records found."
        emptySubtitle="Try selecting a different course or clearing your search query."
        maxHeight="max-h-[62vh]"
        pagination={{
          page: currentPage,
          pageSize: pageSize,
          total: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
          onPageChange: setCurrentPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setCurrentPage(1);
          },
          pageSizeOptions: [10, 15, 25, 50]
        }}
      />
    </div>
  );
};
