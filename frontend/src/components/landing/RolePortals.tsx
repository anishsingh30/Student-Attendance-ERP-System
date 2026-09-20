import React from 'react';
import { 
  GraduationCap, 
  Users, 
  Shield, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RolePortals: React.FC = () => {
  const { user } = useAuth();

  const getPortalLink = (role: 'student' | 'faculty' | 'admin') => {
    if (!user) return `/login?role=${role}`;
    if (user.role === role) {
      if (role === 'student') return '/student/dashboard';
      if (role === 'faculty') return '/faculty/dashboard';
      return '/admin/dashboard';
    }
    // If authenticated under another role, still direct to their dashboard
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'faculty') return '/faculty/dashboard';
    return '/admin/dashboard';
  };

  const portals = [
    {
      id: 'student',
      title: 'Student Portal',
      subtitle: 'Learner Attendance & Compliance Hub',
      icon: GraduationCap,
      color: 'blue',
      badge: 'Student Access',
      description: 'Provides real-time visibility into overall attendance percentages, subject-by-subject status, recovery requirements, and contextual AI advising.',
      features: [
        'Live course attendance percentages',
        'Deterministic recovery calculation',
        'Interactive What-If simulator',
        'Contextual academic advisory',
        'In-app threshold & shortage alerts'
      ],
      ctaText: 'Access Student Portal'
    },
    {
      id: 'faculty',
      title: 'Faculty Portal',
      subtitle: 'Course & Roster Management System',
      icon: Users,
      color: 'indigo',
      badge: 'Faculty Access',
      description: 'Enables instructors to log lecture sessions, manage rosters, upload CSV batches, identify at-risk learners, and generate compliance reports.',
      features: [
        'Session-level attendance recording',
        'Batch CSV attendance imports',
        'Student roster risk identification',
        'Subject analytics & attendance trends',
        'Departmental compliance reporting'
      ],
      ctaText: 'Access Faculty Portal'
    },
    {
      id: 'admin',
      title: 'Administrator Portal',
      subtitle: 'Institutional Governance & Telemetry',
      icon: Shield,
      color: 'slate',
      badge: 'Administrative Access',
      description: 'Provides institution-wide attendance oversight, statutory threshold configuration, subject lifecycle management, audit logs, and agent observability.',
      features: [
        'Statutory threshold & policy configuration',
        'Academic subject & roster controls',
        'Automated evaluation pipeline observability',
        'Immutable audit logs & access history',
        'Comprehensive compliance export'
      ],
      ctaText: 'Access Administrator Portal'
    }
  ];

  return (
    <section id="portals" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#09090B] border-b border-slate-200 dark:border-[#27272A]">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 font-mono">
            Institutional Access
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Role-Based Academic Portals
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            Tailored interfaces engineered for each university stakeholder with strict role-based access control and secure authentication.
          </p>
        </div>

        {/* 3 Portal Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className="erp-card-interactive group bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  {/* Top Icon & Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors duration-200">
                      <Icon className="w-6 h-6 transition-transform duration-200 group-hover:scale-105" aria-hidden="true" />
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272A] font-mono">
                      {portal.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                    {portal.subtitle}
                  </p>

                  <p className="mt-3 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    {portal.description}
                  </p>

                  {/* Capabilities List */}
                  <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#27272A] space-y-2.5">
                    {portal.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portal Access Button */}
                <div className="mt-8 pt-4">
                  <a
                    href={getPortalLink(portal.id as any)}
                    className="erp-btn erp-btn-secondary erp-link w-full py-2.5 px-4 text-xs font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <span>{portal.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 erp-arrow" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

