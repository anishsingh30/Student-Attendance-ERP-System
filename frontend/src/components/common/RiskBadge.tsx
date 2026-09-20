import React from 'react';
import { RiskLevel } from '../../types';
import { CheckCircle2, AlertTriangle, AlertOctagon, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  customLabel?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showLabel = true, customLabel }) => {
  const norm = (level || 'GREEN').toUpperCase();

  const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; defaultLabel: string }> = {
    GREEN: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
      defaultLabel: 'Compliant'
    },
    YELLOW: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
      defaultLabel: 'Advisory'
    },
    ORANGE: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800/60',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />,
      defaultLabel: 'Shortage Warning'
    },
    RED: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/60',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
      defaultLabel: 'Debarment Risk'
    }
  };

  const c = configs[norm] || configs.GREEN;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  }[size];

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${c.bg} ${c.text} ${c.border} ${sizeClasses}`}>
      {c.icon}
      <span className="font-semibold tracking-tight">{norm}</span>
      {showLabel && (
        <span className="opacity-80 text-[10px] hidden sm:inline font-normal">
          ({customLabel || c.defaultLabel})
        </span>
      )}
    </span>
  );
};
