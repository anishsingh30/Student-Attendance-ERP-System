import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showLabel = true }) => {
  const norm = (level || 'GREEN').toUpperCase();

  const configs: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    GREEN: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
      label: 'Safe (>= 80%)'
    },
    YELLOW: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      dot: 'bg-amber-500',
      label: 'Warning (75-79%)'
    },
    ORANGE: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800/60',
      dot: 'bg-orange-500',
      label: 'Shortage (65-74%)'
    },
    RED: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/60',
      dot: 'bg-rose-600 dark:bg-rose-500',
      label: 'Critical (< 65%)'
    }
  };

  const c = configs[norm] || configs.GREEN;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${c.bg} ${c.text} ${c.border} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
      <span className="font-semibold">{norm}</span>
      {showLabel && <span className="opacity-75 text-[10px] hidden sm:inline font-normal">({c.label.split(' ')[0]})</span>}
    </span>
  );
};
