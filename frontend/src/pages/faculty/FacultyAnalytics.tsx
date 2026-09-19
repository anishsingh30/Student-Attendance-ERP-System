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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading attendance analytics charts...</p>
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
    { name: 'Safe (>=80%)', value: riskCounts.GREEN, color: '#10B981' },
    { name: 'Warning (75-79%)', value: riskCounts.YELLOW, color: '#F59E0B' },
    { name: 'Shortage (65-74%)', value: riskCounts.ORANGE, color: '#F97316' },
    { name: 'Critical (<65%)', value: riskCounts.RED, color: '#DC2626' },
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
    <div className="space-y-6 animate-fade-in pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Class Attendance Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Visual distribution of attendance compliance and subject performance metrics.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#111111] hover:bg-slate-50 dark:hover:bg-[#171717] border border-slate-300 dark:border-[#262626] text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] inline-flex items-center gap-2 shadow-xs transition-all erp-button cursor-pointer"
        >
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Subject-Wise Bar Chart */}
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] p-5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Subject Average Attendance %</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] mb-6">Comparison across department course offerings</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subjects} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#262626]" vertical={false} />
                <XAxis dataKey="code" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg, #111111)', borderColor: '#262626', borderRadius: '8px', fontSize: '11px', color: '#F5F5F5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.4)' }}
                  itemStyle={{ color: '#F5F5F5' }}
                  labelStyle={{ color: '#A3A3A3', fontWeight: 'bold' }}
                  formatter={(val: any) => [`${val}%`, 'Avg Attendance']}
                />
                <Bar dataKey="average_percentage" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] p-5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Student Compliance Distribution</h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] mb-4">Breakdown by risk categorization</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg, #111111)', borderColor: '#262626', borderRadius: '8px', fontSize: '11px', color: '#F5F5F5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.4)' }}
                  itemStyle={{ color: '#F5F5F5' }}
                  formatter={(val: any, name: any) => [`${val} students`, name]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconSize={10} 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
