import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  BookOpen, 
  AlertTriangle, 
  Bell, 
  ArrowRight,
  Calculator,
  Bot
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { api } from '../../api/client';
import { StudentDashboardData, AlertItem } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { RiskBadge } from '../../components/common/RiskBadge';
import { RecoveryCard } from '../../components/common/RecoveryCard';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dash, alertItems] = await Promise.all([
          api.getStudentDashboard(),
          api.getAlerts()
        ]);
        setData(dash);
        setAlerts(alertItems.slice(0, 3));
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
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
          <p className="text-xs text-slate-500 font-medium">Loading student attendance analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Welcome & Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{data.full_name}</h1>
            <RiskBadge level={data.overall_risk_level} size="sm" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Roll No: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{data.roll_number}</span> • {data.department} • Semester {data.semester}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/student/simulator"
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#111111] hover:bg-slate-50 dark:hover:bg-[#171717] border border-slate-200 dark:border-[#262626] text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] transition-all inline-flex items-center gap-2 shadow-xs erp-button focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>What-If Simulator</span>
          </a>
          <a
            href="/student/ai"
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-all inline-flex items-center gap-2 erp-button focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI Assistant</span>
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${data.overall_percentage}%`}
          subtitle={data.overall_percentage >= 75 ? 'Compliant with university standard' : 'Below mandatory 75% threshold'}
          icon={<BarChart2 className="w-5 h-5" />}
          trend={data.overall_percentage >= 75 ? 'Compliant' : 'Shortage'}
          trendPositive={data.overall_percentage >= 75}
          accentColor={data.overall_percentage >= 80 ? 'emerald' : data.overall_percentage >= 75 ? 'amber' : 'rose'}
        />

        <StatCard
          title="Subjects Enrolled"
          value={data.total_subjects}
          subtitle="Registered courses in term"
          icon={<BookOpen className="w-5 h-5" />}
          accentColor="indigo"
        />

        <StatCard
          title="Subjects At Risk"
          value={data.subjects_below_threshold}
          subtitle={data.critical_subjects_count > 0 ? `${data.critical_subjects_count} critically below 65%` : 'Below 75% cutoff'}
          icon={<AlertTriangle className="w-5 h-5" />}
          trendPositive={data.subjects_below_threshold === 0}
          accentColor={data.subjects_below_threshold > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Active Alerts"
          value={data.active_alerts_count}
          subtitle={`${data.unread_notifications_count} unread notifications`}
          icon={<Bell className="w-5 h-5" />}
          accentColor={data.active_alerts_count > 0 ? 'amber' : 'indigo'}
        />
      </div>

      {/* Main Grid: Subject Recovery Cards & Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Subject Recovery Calculator Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Enrolled Courses &amp; Recovery Quotas</h2>
              <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-0.5">
                Deterministic calculation of consecutive classes required to reach 75%
              </p>
            </div>
            <a
              href="/student/attendance"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.subjects.map((sub) => (
              <RecoveryCard
                key={sub.subject_id}
                subject={sub}
                onSimulateClick={() => {
                  window.location.href = `/student/simulator?subject=${sub.subject_id}`;
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Col: Trend Chart & Active Alerts */}
        <div className="space-y-6">
          
          {/* Trend Chart */}
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Attendance Trajectory</h3>
            <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] mb-4">Historical attendance rolling progression</p>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.attendance_trends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#262626]" />
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--tooltip-bg, #111111)', 
                      borderColor: '#262626', 
                      borderRadius: '8px', 
                      fontSize: '11px',
                      color: '#F5F5F5',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
                    }}
                    itemStyle={{ color: '#F5F5F5' }}
                    labelStyle={{ color: '#A3A3A3', fontWeight: 'bold' }}
                    formatter={(val: any) => [`${val}%`, 'Attendance']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#attendanceGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Alerts Feed */}
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Notices</h3>
              <a href="/student/alerts" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                View all
              </a>
            </div>

            <div className="space-y-2.5">
              {alerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-[#737373] font-medium">
                  No active alerts. Attendance is currently compliant!
                </div>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-xs hover:border-slate-300 dark:hover:border-[#383838] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white truncate pr-2">{a.title}</span>
                      <RiskBadge level={a.risk_level} size="sm" showLabel={false} />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-[#A3A3A3] line-clamp-2">{a.explanation}</p>
                    <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-[#262626] flex items-center justify-between text-[10px] text-slate-500 dark:text-[#737373]">
                      <span>{a.subject_code} ({a.current_percentage}%)</span>
                      <span className="text-blue-700 dark:text-blue-400 font-semibold">{a.classes_required} classes needed</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
