import React, { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { RiskBadge } from '../../components/common/RiskBadge';

export const StudentRoster: React.FC = () => {
  const [roster, setRoster] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRoster = async (risk?: string, query?: string) => {
    setLoading(true);
    try {
      const data = await api.getFacultyStudents(undefined, risk || undefined, query || undefined);
      setRoster(data);
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Student Roster &amp; Risk Tracking</h1>
        <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
          Monitor attendance percentages, examine consecutive recovery class requirements, and detect at-risk students.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] text-xs rounded-lg pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['', 'GREEN', 'YELLOW', 'ORANGE', 'RED'].map((r) => (
              <button
                key={r}
                onClick={() => handleRiskChange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-180 cursor-pointer ${
                  selectedRisk === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#171717] text-slate-600 dark:text-[#D4D4D4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#202020] border border-slate-300 dark:border-[#262626]'
                }`}
              >
                {r === '' ? 'All Students' : r}
              </button>
            ))}
          </div>

        </div>

        <span className="text-xs text-slate-500 dark:text-[#A3A3A3] font-medium">
          Showing <strong className="text-slate-850 dark:text-white">{roster.length}</strong> enrolled students
        </span>
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-[#111111] rounded-xl overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] border-b border-slate-200 dark:border-[#262626] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Roll No</th>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Semester</th>
                <th className="px-5 py-3.5">Attended / Held</th>
                <th className="px-5 py-3.5">Attendance %</th>
                <th className="px-5 py-3.5">Risk Level</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-[#737373]">
                    Loading student roster...
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-[#737373]">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                roster.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/80 dark:hover:bg-[#171717] transition-colors erp-table-row">
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-700 dark:text-[#CBD5E1]">
                      {s.roll_number}
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 dark:text-white font-semibold">
                      {s.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-[#A3A3A3]">
                      {s.department}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-[#CBD5E1] font-mono">
                      Sem {s.semester}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-[#CBD5E1]">
                      {s.attended} / {s.conducted}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold text-sm ${
                        s.percentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : s.percentage >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {s.percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge level={s.risk_level} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <a
                        href={`/student/simulator?student=${s.student_id}`}
                        className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[11px] font-semibold transition-all inline-flex items-center gap-1 erp-button"
                      >
                        <span>Simulate</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
