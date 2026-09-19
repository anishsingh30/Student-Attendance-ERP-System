import React from 'react';
import { ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';
import { SubjectAttendanceDetail } from '../../types';

interface RecoveryCardProps {
  subject: SubjectAttendanceDetail;
  onSimulateClick?: (subjectId: number) => void;
}

export const RecoveryCard: React.FC<RecoveryCardProps> = ({ subject, onSimulateClick }) => {
  const isDeficit = subject.percentage < subject.required_threshold;

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] shadow-xs hover:border-slate-300 dark:hover:border-[#383838] hover:shadow-md transition-all duration-180 hover:-translate-y-0.5 group flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-[#A3A3A3] bg-slate-100 dark:bg-[#171717] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#262626]">
              {subject.subject_code}
            </span>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5 leading-snug">
              {subject.subject_name}
            </h4>
          </div>
          <div className="text-right flex-shrink-0">
            <span className={`text-base font-bold ${isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {subject.percentage}%
            </span>
            <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] mt-0.5">
              {subject.classes_attended} / {subject.classes_conducted} classes
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5">
          <div className="w-full bg-slate-100 dark:bg-[#171717] rounded-full h-2 overflow-hidden relative border border-slate-200/60 dark:border-[#262626]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                subject.risk_level === 'RED'
                  ? 'bg-rose-500'
                  : subject.risk_level === 'ORANGE'
                  ? 'bg-amber-500'
                  : subject.risk_level === 'YELLOW'
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, subject.percentage))}%` }}
            />
            {/* Threshold marker at 75% */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
              style={{ left: `${subject.required_threshold}%` }}
              title={`Required Threshold: ${subject.required_threshold}%`}
            />
          </div>
        </div>
      </div>

      {/* Recovery Guidance Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-xs gap-2">
        {isDeficit ? (
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>
              Need <strong className="font-bold underline decoration-rose-400 underline-offset-2">{subject.consecutive_classes_needed}</strong> consecutive classes
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              Buffer: Can miss <strong className="font-bold">{subject.max_classes_can_miss}</strong> class{subject.max_classes_can_miss === 1 ? '' : 'es'} safely
            </span>
          </div>
        )}

        {onSimulateClick && (
          <button
            onClick={() => onSimulateClick(subject.subject_id)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors ml-auto flex-shrink-0 group/btn"
          >
            <span>What-If</span>
            <ArrowRight className="w-3 h-3 transition-transform duration-180 group-hover/btn:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};
