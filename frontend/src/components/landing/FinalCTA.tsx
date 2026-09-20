import React from 'react';
import { 
  ArrowRight, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FinalCTA: React.FC = () => {
  const { user } = useAuth();

  const getPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'faculty') return '/faculty/dashboard';
    return '/admin/dashboard';
  };

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#09090B] border-t border-slate-200 dark:border-[#27272A]">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 dark:from-[#121215] dark:via-[#09090B] dark:to-[#18181B] border border-slate-800 dark:border-[#27272A] rounded-2xl p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
        
        {/* Subtle background ambient light */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold backdrop-blur-xs font-mono">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            <span>AttendanceAI • Student Attendance ERP System</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Make attendance management proactive.
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Eliminate attendance ambiguity with authoritative deterministic calculations, automated recovery analytics, and proactive risk alerts across your academic institution.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href={getPortalLink()}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 inline-flex items-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 erp-button"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Access ERP Portal</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Configurable Compliance Rules
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Algebraic Recovery Proofs
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Role-Based Authentication
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};

