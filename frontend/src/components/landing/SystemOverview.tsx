import React from 'react';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  ClipboardCheck,
  Building,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { PublicLandingStats } from '../../types';

interface SystemOverviewProps {
  stats: PublicLandingStats | null;
  loading: boolean;
}

export const SystemOverview: React.FC<SystemOverviewProps> = ({ stats, loading }) => {
  const metrics = stats?.metrics;

  const statItems = [
    {
      label: 'Enrolled Students',
      value: metrics ? metrics.total_students.toLocaleString() : '—',
      icon: GraduationCap,
      description: 'Active learner profiles monitored'
    },
    {
      label: 'Faculty Members',
      value: metrics ? metrics.total_faculty.toLocaleString() : '—',
      icon: Users,
      description: 'Instructors & department heads'
    },
    {
      label: 'Academic Courses',
      value: metrics ? metrics.total_courses.toLocaleString() : '—',
      icon: BookOpen,
      description: 'Lectures, labs, & electives'
    },
    {
      label: 'Attendance Records',
      value: metrics ? metrics.total_attendance_records.toLocaleString() : '—',
      icon: ClipboardCheck,
      description: 'Auditable session logs tracked'
    }
  ];

  return (
    <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F8FAFC] to-white dark:from-[#0A0A0A] dark:to-black border-b border-slate-200 dark:border-[#262626]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <Building className="w-3.5 h-3.5" />
            <span>Institutional Governance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built for proactive academic attendance management.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            AttendanceAI connects attendance tracking, deterministic calculations, risk identification, automated notifications, and AI-assisted academic advising into an integrated university ecosystem.
          </p>
        </div>

        {/* Dynamic System Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xs hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-180 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                    Live System Data
                  </span>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                    {loading ? (
                      <div className="h-8 w-16 bg-slate-200 dark:bg-[#262626] animate-pulse rounded" />
                    ) : (
                      item.value
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {item.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-[#0E0E0E] p-6 rounded-2xl border border-slate-200 dark:border-[#262626]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Statutory Compliance</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enforces university attendance rules with multi-tier risk classification, ensuring every student understands their compliance standing.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Authoritative Calculations</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every percentage and recovery calculation is computed deterministically through verified algebraic functions with zero hallucination.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Proactive Early Warnings</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Automated notifications alert students, faculty mentors, and academic advisors weeks before debarment thresholds are breached.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

