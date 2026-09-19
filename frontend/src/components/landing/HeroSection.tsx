import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  ArrowDown, 
  CheckCircle2, 
  Calculator, 
  GraduationCap, 
  Users, 
  Shield 
} from 'lucide-react';
import { HeroProductVisual } from './HeroProductVisual';
import { useAuth } from '../../context/AuthContext';

interface HeroSectionProps {
  statutoryThreshold?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  statutoryThreshold = 75 
}) => {
  const { user } = useAuth();

  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector('#how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getPortalHref = () => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'faculty') return '/faculty/dashboard';
    return '/admin/dashboard';
  };

  return (
    <section 
      id="hero" 
      className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9] dark:from-black dark:via-[#050505] dark:to-black border-b border-slate-200 dark:border-[#262626] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Eyebrow Institutional Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>University Attendance Management &amp; Early Warning System</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Academic Attendance ERP with{' '}
              <span className="text-blue-600 dark:text-blue-400">
                Deterministic Intelligence.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              AttendanceAI continuously monitors attendance, identifies risk, calculates recovery requirements, and helps students, faculty, and administrators act before attendance problems become serious.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={getPortalHref()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span>Access Your Portal</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#how-it-works"
                onClick={handleExploreClick}
                className="px-5 py-3 rounded-xl bg-white dark:bg-[#111111] hover:bg-slate-50 dark:hover:bg-[#1A1A1A] border border-slate-300 dark:border-[#262626] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-semibold shadow-2xs inline-flex items-center gap-2 transition-all hover:border-slate-400 dark:hover:border-[#383838] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <span>Explore How It Works</span>
                <ArrowDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </a>
            </div>

            {/* Institutional Trust Highlights */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-[#262626] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Statutory {statutoryThreshold}% Verification</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-medium">
                <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Deterministic Math Engine</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-medium">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Role-Based Academic RBAC</span>
              </div>
            </div>

          </div>

          {/* Right Hero Column: Realistic Product Visual */}
          <div className="lg:col-span-6 w-full">
            <HeroProductVisual statutoryThreshold={statutoryThreshold} />
          </div>

        </div>
      </div>
    </section>
  );
};
