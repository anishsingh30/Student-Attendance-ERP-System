import React from 'react';
import { 
  CalendarCheck2, 
  ShieldAlert, 
  Calculator, 
  MessageSquareText, 
  BellRing, 
  BarChart3,
  CheckCircle2
} from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: CalendarCheck2,
      badge: 'Real-Time Logging',
      title: 'Automated Attendance Monitoring',
      description: 'Continuous visibility across lectures, laboratories, and electives. Synchronizes attendance session rosters with zero administrative latency.',
      highlights: ['Session-level tracking', 'Automated CSV batch import', 'Roster synchronization']
    },
    {
      icon: ShieldAlert,
      badge: 'Multi-Tier Cutoffs',
      title: 'Early Warning & Risk Detection',
      description: 'Classifies student attendance into Green (Compliant), Yellow (Borderline), Orange (Shortage), and Red (Critical) based on active university thresholds.',
      highlights: ['Configurable cutoffs', 'Proactive shortage detection', 'Debarment prevention']
    },
    {
      icon: Calculator,
      badge: 'Deterministic Math',
      title: 'Attendance Recovery Calculator',
      description: 'Deterministically computes the exact minimum number of consecutive future lectures a student must attend to safely surpass the statutory threshold.',
      highlights: ['Algebraic certainty', 'What-If scenario simulation', 'Zero speculative estimates']
    },
    {
      icon: MessageSquareText,
      badge: 'Advisory Engine',
      title: 'Attendance Advisory Assistant',
      description: 'Enables natural language interactions with verified attendance records, providing tailored explanations, recovery schedules, and policy guidance.',
      highlights: ['Grounded in database facts', 'Multi-turn query support', 'Privacy-isolated context']
    },
    {
      icon: BellRing,
      badge: 'Automated Dispatch',
      title: 'Automated Alerts & Notifications',
      description: 'Dispatches targeted in-app alerts and notifications to students, course instructors, and academic advisors when attendance dips below criteria.',
      highlights: ['Multi-channel delivery', 'Audit-logged dispatches', 'Threshold breach triggers']
    },
    {
      icon: BarChart3,
      badge: 'Institutional Reporting',
      title: 'Academic Analytics & Audit Trail',
      description: 'Provides department-level attendance trends, subject comparisons, student rosters, and an immutable log of administrative and user actions.',
      highlights: ['Full audit accountability', 'Cohort analytics', 'Dean & Faculty dashboards']
    }
  ];

  return (
    <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#09090B] border-b border-slate-200 dark:border-[#27272A]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Title */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 font-mono">
            Enterprise Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Comprehensive Capabilities for University Governance
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            Engineered specifically for collegiate environments requiring deterministic calculation precision, academic compliance enforcement, and automated student support.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="erp-card-interactive group bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] p-6 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors duration-200">
                      <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" aria-hidden="true" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-[#18181B] text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-[#27272A] font-mono">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {feat.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#27272A] space-y-1.5">
                  {feat.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-zinc-300 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

