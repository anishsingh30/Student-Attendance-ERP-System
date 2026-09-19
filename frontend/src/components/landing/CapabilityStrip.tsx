import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  BellRing, 
  Calculator 
} from 'lucide-react';

export const CapabilityStrip: React.FC = () => {
  const capabilities = [
    {
      icon: Activity,
      title: 'Real-Time Monitoring',
      description: 'Continuous attendance tracking across lecture sessions and lab rosters with zero delay.'
    },
    {
      icon: ShieldAlert,
      title: 'Intelligent Risk Detection',
      description: 'Identifies borderline and critical shortages based on university threshold policies.'
    },
    {
      icon: BellRing,
      title: 'Automated Alerts',
      description: 'Dispatches multi-channel early notifications before debarment becomes irreversible.'
    },
    {
      icon: Calculator,
      title: 'Deterministic Calculations',
      description: 'Strict algebraic formulas compute exact percentages and consecutive recovery lectures.'
    }
  ];

  return (
    <section className="bg-white dark:bg-[#0A0A0A] border-b border-slate-200 dark:border-[#262626] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111111] border border-slate-200/80 dark:border-[#262626] hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all duration-150"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

