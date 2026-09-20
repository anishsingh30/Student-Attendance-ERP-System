import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ArrowUp, 
  Lock 
} from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto bg-white dark:bg-[#09090B] border-t border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-100 dark:border-[#27272A]">
          
          {/* Institutional Branding */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Attendance<span className="text-blue-600 dark:text-blue-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm">
              AttendanceAI ERP • Automated Student Attendance Monitoring, Deterministic Recovery Calculation, and Early Alert Platform.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>University ERP Edition • Version 2.0</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-slate-500 dark:text-zinc-400 text-xs">
              <li>
                <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Platform Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Recovery Pipeline
                </a>
              </li>
              <li>
                <a href="#intelligence" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Deterministic Intelligence
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Security &amp; Compliance
                </a>
              </li>
            </ul>
          </div>

          {/* Institutional Portals */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              ERP Portals
            </h4>
            <ul className="space-y-1.5 text-slate-500 dark:text-zinc-400 text-xs">
              <li>
                <a href="/login?role=student" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Student Portal
                </a>
              </li>
              <li>
                <a href="/login?role=faculty" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Faculty Portal
                </a>
              </li>
              <li>
                <a href="/login?role=admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Administrator Portal
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-blue-700 dark:text-blue-400">
                  Institutional Single Sign-On
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-zinc-400">
          <p>
            &copy; {currentYear} AttendanceAI. All rights reserved. Student Attendance ERP System.
          </p>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-400">
              <Lock className="w-3 h-3 text-slate-400" />
              Institutional Data Privacy
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              aria-label="Back to Top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

