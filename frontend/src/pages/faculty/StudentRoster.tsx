import React, { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { RiskBadge } from '../../components/common/RiskBadge';
import { DataTable, Column } from '../../components/common/DataTable';

export const StudentRoster: React.FC = () => {
  const [roster, setRoster] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchRoster = async (risk?: string, query?: string) => {
    setLoading(true);
    try {
      const data = await api.getFacultyStudents(undefined, risk || undefined, query || undefined);
      setRoster(data);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    fetchRoster(selectedRisk, val);
  };

  const handleRiskChange = (risk: string) => {
    setSelectedRisk(risk);
    fetchRoster(risk, search);
  };

  const columns: Column<any>[] = [
    {
      header: 'Roll No',
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
          {s.name}
        </span>
      ),
    },
    {
      header: 'Department',
      accessor: (s) => (
        <span className="text-slate-500 dark:text-zinc-400">
          {s.department}
        </span>
      ),
    },
    {
      header: 'Semester',
      accessor: (s) => (
        <span className="text-slate-600 dark:text-zinc-400 font-mono">
          Sem {s.semester}
        </span>
      ),
    },
    {
      header: 'Sessions (Attended / Held)',
      accessor: (s) => (
        <span className="text-slate-600 dark:text-zinc-400 font-mono">
          {s.attended} / {s.conducted}
        </span>
      ),
    },
    {
      header: 'Attendance %',
      accessor: (s) => (
        <span className={`font-semibold ${
          s.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        }`}>
          {s.percentage}%
        </span>
      ),
    },
    {
      header: 'Risk Level',
      accessor: (s) => (
        <RiskBadge level={s.risk_level} size="sm" />
      ),
    },
    {
      header: 'Action',
      align: 'right',
      accessor: (s) => (
        <a
          href={`/student/simulator?student=${s.student_id}`}
          className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium inline-flex items-center gap-1"
        >
          <span>Simulate</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      ),
    }
  ];

  const paginatedData = roster.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5 pb-10">
      <div className="pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Student Roster &amp; Risk Directory</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Review attendance standings, monitor recovery requirements, and identify students needing intervention.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] p-3 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs rounded-md pl-8 pr-3 py-1.5 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {['', 'GREEN', 'YELLOW', 'ORANGE', 'RED'].map((r) => (
              <button
                key={r}
                onClick={() => handleRiskChange(r)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedRisk === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-[#202025] border border-slate-200 dark:border-[#27272A]'
                }`}
              >
                {r === '' ? 'All Tiers' : r}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
          Total: <strong>{roster.length}</strong> students
        </span>
      </div>

      {/* Bounded Data Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(s) => s.student_id}
        loading={loading}
        emptyMessage="No students found matching your criteria."
        emptySubtitle="Try adjusting the search query or risk filter."
        maxHeight="max-h-[62vh]"
        pagination={{
          page: currentPage,
          pageSize: pageSize,
          total: roster.length,
          totalPages: Math.max(1, Math.ceil(roster.length / pageSize)),
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
