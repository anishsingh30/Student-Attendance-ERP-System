import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Sliders, 
  KeyRound, 
  Server 
} from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'Role-Based Access Control (RBAC)',
      description: 'Strict separation of privileges across Student, Faculty, and Administrator roles with automated authorization enforcement on all API routes.'
    },
    {
      icon: FileText,
      title: 'Immutable System Audit Logging',
      description: 'Every threshold modification, password update, CSV import, and attendance correction is permanently logged in an auditable database ledger.'
    },
    {
      icon: KeyRound,
      title: 'Secure JWT Authentication & Sessions',
      description: 'Cryptographic access tokens, enforced password complexity rules, administrative password reset workflows, and rate-limited endpoints.'
    },
    {
      icon: Sliders,
      title: 'Configurable Policy Engine',
      description: 'University statutory minimums, warning cutoffs, consecutive absence triggers, and alert cooldown periods can be dynamically tuned by administrators.'
    },
    {
      icon: Server,
      title: 'Data Protection & API Isolation',
      description: 'Context-isolated data querying ensures students can only view their own records, preventing cross-tenant information exposure.'
    },
    {
      icon: ShieldCheck,
      title: 'Controlled AI Execution Boundaries',
      description: 'The AI assistant operates within sanitized database bounds and cannot modify official attendance records or mutate user credentials.'
    }
  ];

  return (
    <section id="security" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0A0A0A] border-b border-slate-200 dark:border-[#262626]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Institutional Trust &amp; Governance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Enterprise Security &amp; Compliance Architecture
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Engineered with strict academic governance standards to safeguard student privacy, prevent unauthorized modifications, and maintain audit-grade compliance.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div
                key={idx}
                className="bg-[#F8FAFC] dark:bg-[#111111] border border-slate-200/90 dark:border-[#262626] hover:border-blue-200 dark:hover:border-blue-800 p-6 rounded-2xl transition-all duration-180 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {sec.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {sec.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-[#262626] flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-400 font-semibold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  <span>Verified Platform Property</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

