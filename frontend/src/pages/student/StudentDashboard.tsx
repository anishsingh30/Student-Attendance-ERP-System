import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowUpRight, 
  Calculator, 
  CalendarCheck, 
  Bell, 
  User, 
  ArrowUpDown,
  Filter,
  Info,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  ReferenceLine 
} from 'recharts';
import { api } from '../../api/client';
import { StudentDashboardData, AlertItem, SubjectAttendanceDetail } from '../../types';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'shortage' | 'compliant'>('all');
  const [sortField, setSortField] = useState<'percentage' | 'code' | 'classes_needed'>('percentage');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dash, alertItems] = await Promise.all([
          api.getStudentDashboard(),
          api.getAlerts()
        ]);
        setData(dash);
        setAlerts(alertItems);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Determine standard threshold dynamically from subjects
  const defaultThreshold = useMemo(() => {
    if (!data || data.subjects.length === 0) return 75;
    return Math.max(...data.subjects.map(s => s.required_threshold));
  }, [data]);

  const differencePoints = useMemo(() => {
    if (!data) return 0;
    return Number((data.overall_percentage - defaultThreshold).toFixed(2));
  }, [data, defaultThreshold]);

  const filteredSubjects = useMemo(() => {
    if (!data) return [];
    let list = [...data.subjects];
    if (subjectFilter === 'shortage') {
      list = list.filter(s => s.percentage < s.required_threshold);
    } else if (subjectFilter === 'compliant') {
      list = list.filter(s => s.percentage >= s.required_threshold);
    }

    list.sort((a, b) => {
      if (sortField === 'percentage') {
        return sortAsc ? a.percentage - b.percentage : b.percentage - a.percentage;
      }
      if (sortField === 'code') {
        return sortAsc ? a.subject_code.localeCompare(b.subject_code) : b.subject_code.localeCompare(a.subject_code);
      }
      if (sortField === 'classes_needed') {
        return sortAsc ? a.consecutive_classes_needed - b.consecutive_classes_needed : b.consecutive_classes_needed - a.consecutive_classes_needed;
      }
      return 0;
    });

    return list;
  }, [data, subjectFilter, sortField, sortAsc]);

  // Categorize alerts
  const criticalAlerts = useMemo(() => {
    return alerts.filter(a => a.risk_level === 'RED' || a.risk_level === 'ORANGE');
  }, [alerts]);

  const academicNotices = useMemo(() => {
    return alerts.filter(a => a.risk_level === 'YELLOW');
  }, [alerts]);

  const systemNotices = useMemo(() => {
    return alerts.filter(a => a.risk_level === 'GREEN');
  }, [alerts]);

  // Trend direction
  const trendMetrics = useMemo(() => {
    if (!data || !data.attendance_trends || data.attendance_trends.length < 2) {
      return { direction: 'stable', delta: 0 };
    }
    const trends = data.attendance_trends;
    const first = trends[0].percentage;
    const last = trends[trends.length - 1].percentage;
    const delta = Number((last - first).toFixed(1));
    return {
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
      delta
    };
  }, [data]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Loading academic records...</p>
        </div>
      </div>
    );
  }

  const isCompliant = data.overall_percentage >= defaultThreshold;

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. TOP HEADER: Student Identity & Immediate Academic Status */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                {data.full_name}
              </h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272A]">
                Roll No: {data.roll_number}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${
                isCompliant
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
              }`}>
                {isCompliant ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span>
                  {isCompliant ? 'Attendance Compliant' : 'Shortage Intervention Required'}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
              {data.department} • Semester {data.semester} • Academic Year 2024–2025
            </p>
          </div>

          {/* Primary & Secondary Action Groups */}
          <div className="flex items-center flex-wrap gap-2">
            <a
              href="/student/attendance"
              className="erp-btn erp-btn-primary px-3.5 py-2 text-xs font-semibold shadow-xs"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>View Attendance</span>
            </a>

            <a
              href="/student/simulator"
              className="erp-btn erp-btn-secondary px-3.5 py-2 text-xs font-medium shadow-xs"
            >
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>What-If Simulation</span>
            </a>

            <div className="h-4 w-px bg-slate-200 dark:border-[#27272A] mx-1 hidden sm:block" />

            <a
              href="/student/alerts"
              className="erp-btn erp-btn-secondary p-2 text-slate-600 dark:text-zinc-300"
              title="Official Notices"
              aria-label="Official Notices"
            >
              <Bell className="w-4 h-4" />
            </a>

            <a
              href="/profile"
              className="erp-btn erp-btn-secondary p-2 text-slate-600 dark:text-zinc-300"
              title="Student Profile"
              aria-label="Student Profile"
            >
              <User className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. ATTENDANCE SUMMARY: Strong Academic Hierarchy (Not 4 floating cards) */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Academic Attendance Standing Summary
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
            Enrolled Courses: {data.total_subjects}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-[#27272A]">
          {/* Overall Attendance */}
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Overall Attendance
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isCompliant ? 'text-slate-900 dark:text-zinc-100' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {data.overall_percentage}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              Across all enrolled modules
            </p>
          </div>

          {/* Statutory Required */}
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Required Threshold
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-zinc-200 tracking-tight">
                {defaultThreshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              Statutory University Minimum
            </p>
          </div>

          {/* Difference Points */}
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Difference
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                differencePoints >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {differencePoints >= 0 ? `+${differencePoints}` : differencePoints}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">pp</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              {differencePoints >= 0 ? 'Surplus above threshold' : 'Deficit below threshold'}
            </p>
          </div>

          {/* Subjects at Risk */}
          <div className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Subjects at Risk
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                data.subjects_below_threshold > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-zinc-200'
              }`}>
                {data.subjects_below_threshold}
              </span>
              <span className="text-sm font-semibold text-slate-400 dark:text-zinc-500">
                of {data.total_subjects}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              {data.critical_subjects_count > 0 ? `${data.critical_subjects_count} debarment risk` : 'Monitoring actively'}
            </p>
          </div>

          {/* Active Alerts */}
          <div className="p-4 sm:p-5 col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Active Alerts
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                data.active_alerts_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-zinc-200'
              }`}>
                {data.active_alerts_count}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              Official academic warnings
            </p>
          </div>
        </div>
      </div>

      {/* 3. SUBJECT ATTENDANCE TABLE / MANAGEMENT VIEW (Primary Dashboard Centerpiece) */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg overflow-hidden shadow-xs space-y-0">
        
        {/* Table Controls & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#151518]">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Subject Attendance &amp; Quota Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Official course attendance register and minimum consecutive lectures needed to clear shortages
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-md border border-slate-200 dark:border-[#27272A] p-0.5 bg-white dark:bg-[#18181B]">
              <button
                type="button"
                onClick={() => setSubjectFilter('all')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  subjectFilter === 'all'
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                All ({data.subjects.length})
              </button>
              <button
                type="button"
                onClick={() => setSubjectFilter('shortage')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  subjectFilter === 'shortage'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                Shortage ({data.subjects.filter(s => s.percentage < s.required_threshold).length})
              </button>
              <button
                type="button"
                onClick={() => setSubjectFilter('compliant')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  subjectFilter === 'compliant'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                Compliant ({data.subjects.filter(s => s.percentage >= s.required_threshold).length})
              </button>
            </div>

            {/* Sort Dropdown */}
            <button
              type="button"
              onClick={() => {
                setSortAsc(!sortAsc);
              }}
              className="px-2.5 py-1 text-xs border border-slate-200 dark:border-[#27272A] rounded bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#202025] inline-flex items-center gap-1 transition-colors"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortAsc ? 'Asc' : 'Desc'}</span>
            </button>
          </div>
        </div>

        {/* Academic Table with Sticky Header and Bounded Scrolling */}
        <div className="overflow-x-auto overflow-y-auto max-h-[440px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-[#27272A] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Subject</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Code</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Present / Total</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Attendance</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Required</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Status</th>
                <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Classes Needed</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-zinc-500 font-medium">
                    No courses found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((sub) => {
                  const meets = sub.percentage >= sub.required_threshold;
                  const isCritical = sub.percentage < sub.required_threshold - 10;
                  
                  return (
                    <tr 
                      key={sub.subject_id} 
                      className="erp-table-row group"
                    >
                      {/* Subject Name */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100">
                          {sub.subject_name}
                        </div>
                        {sub.faculty_name && (
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            Instructor: {sub.faculty_name}
                          </div>
                        )}
                      </td>

                      {/* Course Code */}
                      <td className="px-3 py-3 font-mono font-medium text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                        {sub.subject_code}
                      </td>

                      {/* Present / Total */}
                      <td className="px-3 py-3 whitespace-nowrap font-mono text-slate-700 dark:text-zinc-300">
                        <strong>{sub.classes_attended}</strong> / {sub.classes_conducted}
                      </td>

                      {/* Attendance % */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`font-bold text-sm ${
                          meets ? 'text-slate-900 dark:text-zinc-100' : isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {sub.percentage}%
                        </span>
                      </td>

                      {/* Required */}
                      <td className="px-3 py-3 whitespace-nowrap text-slate-500 dark:text-zinc-400 font-mono">
                        {sub.required_threshold}%
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          meets 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40' 
                            : isCritical
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                        }`}>
                          {meets ? 'Compliant' : isCritical ? 'Critical' : 'Shortage'}
                        </span>
                      </td>

                      {/* Classes Needed */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {sub.consecutive_classes_needed > 0 ? (
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {sub.consecutive_classes_needed} {sub.consecutive_classes_needed === 1 ? 'class' : 'classes'}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 font-mono">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/student/attendance?subject=${sub.subject_id}`}
                            className="erp-btn erp-btn-secondary px-2.5 py-1 text-[11px]"
                          >
                            View
                          </a>
                          <a
                            href={`/student/simulator?subject=${sub.subject_id}`}
                            className="erp-btn erp-btn-secondary erp-link px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 group"
                          >
                            <span>What-If</span>
                            <ArrowUpRight className="w-3 h-3 erp-arrow" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Strip */}
        <div className="p-3 border-t border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Showing {filteredSubjects.length} of {data.subjects.length} registered academic subjects</span>
          <span className="font-medium text-slate-700 dark:text-zinc-300">
            Official Semester Quota: Minimum {defaultThreshold}% Attendance per Course
          </span>
        </div>
      </div>

      {/* 4 & 5: ATTENDANCE TREND & ALERTS / ACADEMIC NOTICES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col (7 cols): Clean Academic Attendance Trend */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#27272A]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Attendance Progression Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Semester attendance rate over recorded class sessions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                trendMetrics.direction === 'up'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  : trendMetrics.direction === 'down'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400'
              }`}>
                {trendMetrics.direction === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : trendMetrics.direction === 'down' ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                <span>
                  {trendMetrics.delta > 0 ? `+${trendMetrics.delta}%` : `${trendMetrics.delta}%`}
                </span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">since start</span>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.attendance_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" opacity={0.6} />
                <XAxis 
                  dataKey="label" 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  domain={[0, 100]} 
                  ticks={[0, 25, 50, 75, 100]} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderColor: '#334155', 
                    borderRadius: '6px', 
                    fontSize: '12px',
                    color: '#F8FAFC'
                  }}
                  itemStyle={{ color: '#F8FAFC' }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                />
                <ReferenceLine 
                  y={defaultThreshold} 
                  stroke="#DC2626" 
                  strokeDasharray="4 4" 
                  label={{ value: `Threshold (${defaultThreshold}%)`, fill: '#DC2626', fontSize: 10, position: 'insideTopRight' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#2563EB" 
                  strokeWidth={2} 
                  fill="#3B82F6"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#27272A] flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-600 inline-block" />
                <span>Current: <strong>{data.overall_percentage}%</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-rose-600 inline-block" />
                <span>Statutory Minimum: <strong>{defaultThreshold}%</strong></span>
              </span>
            </div>
            <span className="font-mono text-[11px]">
              Trend: {isCompliant ? 'Compliant' : 'Shortage deficit'}
            </span>
          </div>
        </div>

        {/* Right Col (5 cols): Categorized Official Notices & Alerts */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Official Notices &amp; Warnings
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Academic compliance interventions
              </p>
            </div>
            <a
              href="/student/alerts"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              View All ({alerts.length})
            </a>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {/* Critical Attendance Alerts */}
            {criticalAlerts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Critical Attendance Warnings</span>
                </span>
                {criticalAlerts.slice(0, 2).map((a) => (
                  <div 
                    key={a.id} 
                    className="erp-card-interactive p-3 rounded-md bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-rose-900 dark:text-rose-200 truncate">{a.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold shrink-0">
                        {a.current_percentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 leading-snug">
                      {a.explanation}
                    </p>
                    <div className="mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-zinc-400">{a.subject_code}</span>
                      <span className="font-bold text-rose-700 dark:text-rose-400">
                        {a.classes_required} lectures needed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Academic Notices */}
            {academicNotices.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Approaching Threshold Notices</span>
                </span>
                {academicNotices.slice(0, 2).map((a) => (
                  <div 
                    key={a.id} 
                    className="erp-card-interactive p-3 rounded-md bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{a.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold shrink-0">
                        {a.current_percentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-snug">
                      {a.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* System Notices or Empty fallback */}
            {alerts.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <Info className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                <span>No active attendance shortage alerts or formal notices.</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
