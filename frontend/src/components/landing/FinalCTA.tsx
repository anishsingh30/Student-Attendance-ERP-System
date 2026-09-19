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
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[#F8FAFC] dark:from-black dark:to-[#0A0A0A]">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 dark:from-[#0E0E0E] dark:via-[#0A0A0A] dark:to-[#111827] border border-transparent dark:border-[#262626] rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
        
        {/* Subtle background ambient light */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            <span>Apex Institute of Technology • AttendanceAI ERP</span>
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
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 inline-flex items-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Access ERP Portal</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Statutory 75% Verification
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

