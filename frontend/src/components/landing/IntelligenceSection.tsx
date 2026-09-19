import React from 'react';
import { 
  Calculator, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Scale, 
  Cpu, 
  Binary, 
  Bot 
} from 'lucide-react';

export const IntelligenceSection: React.FC = () => {
  return (
    <section id="intelligence" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] dark:bg-black border-b border-slate-200 dark:border-[#262626]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>Dual-Engine Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI-assisted decisions. Deterministic academic calculations.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            AttendanceAI enforces an architectural separation between authoritative mathematical computation and natural-language advisory services.
          </p>
        </div>

        {/* 2-Column Comparison Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: Deterministic Engine */}
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Calculator className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                  AUTHORITATIVE CORE
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Deterministic Calculation Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                All statutory percentage calculations, cutoff comparisons, and consecutive recovery numbers execute via strict, deterministic mathematical logic.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Exact attendance percentage calculation via pure arithmetic',
                  'Deterministic comparison against institutional thresholds',
                  'Algebraic calculation of minimum consecutive lectures required',
                  'Rule-based risk classification (Green, Yellow, Orange, Red)',
                  'Immutable, auditable calculations stored directly in SQL registry'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold">
                <Binary className="w-3.5 h-3.5" />
                Zero Hallucination Arithmetic
              </span>
              <span>FastAPI Backend Services</span>
            </div>
          </div>

          {/* Column 2: AI Assistant */}
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                  ADVISORY INTELLIGENCE
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Agentic AI Academic Assistant
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Provides contextual natural-language explanations, tailored recovery advice, and proactive summaries grounded strictly in authoritative verified data.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Natural-language answers to student attendance queries',
                  'Contextual explanation of recovery timetables and course cutoffs',
                  'Personalized academic advising and debarment warnings',
                  'Synthesized attendance summaries for faculty course mentors',
                  'Strict data grounding to prevent hallucinated compliance states'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-semibold">
                <Bot className="w-3.5 h-3.5" />
                Fact-Grounded Advising
              </span>
              <span>Contextual LLM Provider</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

