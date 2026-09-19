import React from 'react';
import { 
  Database, 
  Binary, 
  ShieldAlert, 
  Calculator, 
  Sparkles, 
  BellRing,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: Database,
      title: 'Attendance Ingestion',
      category: 'Data Layer',
      description: 'Session logs and rosters are ingested in real-time or via structured faculty CSV uploads.'
    },
    {
      step: '02',
      icon: Binary,
      title: 'Deterministic Math',
      category: 'Backend Engine',
      description: 'Exact percentage arithmetic computed strictly via (attended / conducted * 100).'
    },
    {
      step: '03',
      icon: ShieldAlert,
      title: 'Risk Identification',
      category: 'Policy Evaluation',
      description: 'Scores evaluated against statutory cutoffs to categorize Green, Yellow, Orange, or Red.'
    },
    {
      step: '04',
      icon: Calculator,
      title: 'Recovery Engine',
      category: 'Mathematical Proof',
      description: 'Algebraically calculates the exact consecutive lectures needed to recover standing.'
    },
    {
      step: '05',
      icon: Sparkles,
      title: 'AI Explanation',
      category: 'Advisory Layer',
      description: 'Synthesizes clear, contextual explanations grounded strictly in verified database facts.'
    },
    {
      step: '06',
      icon: BellRing,
      title: 'Alert & Intervention',
      category: 'Proactive Delivery',
      description: 'Automated in-app and email notifications dispatched to student and faculty advisor.'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] dark:bg-black border-b border-slate-200 dark:border-[#262626]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
            End-to-End Pipeline
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            How AttendanceAI Operates
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A seamless six-stage pipeline connecting authoritative attendance data with deterministic recovery mathematics and contextual AI advising.
          </p>
        </div>

        {/* 6-Step Visual Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 relative group"
              >
                {/* Step Number & Category */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                      STEP {item.step}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                      {item.category}
                    </span>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#262626] flex items-center justify-center text-slate-700 dark:text-slate-300 mb-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Progress Dot Indicator */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  <span>Phase {idx + 1} of 6</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Deterministic Guarantee Banner */}
        <div className="mt-10 bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200 dark:border-[#262626] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Authoritative Deterministic Guarantee
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Official attendance arithmetic, recovery session requirements, and threshold evaluations are computed by deterministic backend services — not probabilistic models.
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1A1A1A] text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold whitespace-nowrap border border-slate-200 dark:border-[#262626]">
            Audit-Grade Precision
          </span>
        </div>

      </div>
    </section>
  );
};

