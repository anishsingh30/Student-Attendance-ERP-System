import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Download, Activity, BarChart2 } from 'lucide-react';
import { api } from '../../api/client';

export const FacultyAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getFacultyDashboard();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Loading attendance analytics charts...</p>
        </div>
      </div>
    );
  }

  // Aggregate risk distribution
  const roster = data.student_roster || [];
  const riskCounts = {
    GREEN: roster.filter((s: any) => s.risk_level === 'GREEN').length,
    YELLOW: roster.filter((s: any) => s.risk_level === 'YELLOW').length,
    ORANGE: roster.filter((s: any) => s.risk_level === 'ORANGE').length,
    RED: roster.filter((s: any) => s.risk_level === 'RED').length,
  };

  const pieData = [
    { name: 'Compliant / Safe', value: riskCounts.GREEN, color: '#16A34A' },
    { name: 'Advisory / Warning', value: riskCounts.YELLOW, color: '#D97706' },
    { name: 'Attendance Shortage', value: riskCounts.ORANGE, color: '#EA580C' },
    { name: 'Debarment Risk', value: riskCounts.RED, color: '#DC2626' },
  ];

  const handleExport = () => {
    const headers = 'Roll Number,Name,Attended,Conducted,Percentage,Risk Level\n';
    const rows = roster.map((s: any) => `"${s.roll_number}","${s.name}",${s.attended},${s.conducted},${s.percentage},"${s.risk_level}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_attendance_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Class Attendance Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Distribution of student compliance tiers and course attendance distributions.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3 py-1.5 rounded-md bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-xs font-medium text-slate-700 dark:text-zinc-300 inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Course-Wise Bar Chart */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] p-4 rounded-lg shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">Course Average Attendance %</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4">Comparison across assigned curriculum</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subjects} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" opacity={0.3} vertical={false} />
                <XAxis dataKey="code" stroke="#71717A" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121215', borderColor: '#27272A', borderRadius: '6px', fontSize: '11px', color: '#F4F4F5' }}
                  itemStyle={{ color: '#F4F4F5' }}
                  labelStyle={{ color: '#A1A1AA', fontWeight: 'bold' }}
                  formatter={(val: any) => [`${val}%`, 'Avg Attendance']}
                />
                <Bar dataKey="average_percentage" fill="#2563EB" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] p-4 rounded-lg shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">Student Risk Categorization</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4">Proportion of enrolled students across compliance tiers</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121215', borderColor: '#27272A', borderRadius: '6px', fontSize: '11px', color: '#F4F4F5' }}
                  itemStyle={{ color: '#F4F4F5' }}
                  formatter={(val: any, name: any) => [`${val} students`, name]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconSize={8} 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
