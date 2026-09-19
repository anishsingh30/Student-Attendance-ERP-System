import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Calculator, 
  Bot, 
  Sparkles, 
  ArrowUpRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { RiskLevel } from '../../types';

interface SampleSubject {
  id: string;
  code: string;
  name: string;
  attended: number;
  conducted: number;
  percentage: number;
  risk: RiskLevel;
  recoveryNeeded: number;
  canMiss: number;
}

interface HeroProductVisualProps {
  statutoryThreshold?: number;
}

export const HeroProductVisual: React.FC<HeroProductVisualProps> = ({ 
  statutoryThreshold = 75 
}) => {
  const subjects: SampleSubject[] = [
    {
      id: 'cs301',
      code: 'CS-301',
      name: 'Data Structures & Algorithms',
      attended: 27,
      conducted: 30,
      percentage: 90.0,
      risk: 'GREEN',
      recoveryNeeded: 0,
      canMiss: 6
    },
    {
      id: 'cs302',
      code: 'CS-302',
      name: 'Computer Networks',
      attended: 21,
      conducted: 30,
      percentage: 70.0,
      risk: 'ORANGE',
      recoveryNeeded: 6,
      canMiss: 0
    },
    {
      id: 'cs303',
      code: 'CS-303',
      name: 'Database Management Systems',
      attended: 24,
      conducted: 30,
      percentage: 80.0,
      risk: 'GREEN',
      recoveryNeeded: 0,
      canMiss: 2
    },
    {
      id: 'cs304',
      code: 'CS-304',
      name: 'Operating Systems',
      attended: 22,
      conducted: 30,
      percentage: 73.3,
      risk: 'YELLOW',
      recoveryNeeded: 2,
      canMiss: 0
    }
  ];

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('cs302');
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[1];

  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalConducted = subjects.reduce((sum, s) => sum + s.conducted, 0);
  const overallPercentage = Math.round((totalAttended / totalConducted) * 1000) / 10;

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Compliant</span>
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Borderline</span>
          </span>
        );
      case 'ORANGE':
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <AlertOctagon className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Shortage Risk</span>
          </span>
        );
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      
      {/* Container simulating high-definition ERP application window */}
      <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-slate-200/90 dark:border-[#262626] shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-[#383838]">
        
        {/* Mock ERP Application Top Bar */}
        <div className="bg-slate-50 dark:bg-[#111111] px-4 py-2.5 border-b border-slate-200 dark:border-[#262626] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 tracking-tight text-[11px]">
              AttendanceAI Academic Portal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Deterministic Engine Live
            </span>
          </div>
        </div>

        {/* Product Visual Main Body */}
        <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-black/60">
          
          {/* Top Summary Bar */}
          <div className="bg-white dark:bg-[#111111] p-3.5 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                {overallPercentage}%
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Overall Attendance</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">({totalAttended}/{totalConducted} Sessions)</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Statutory Cutoff: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{statutoryThreshold}%</strong>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    Above Min Threshold
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1A1A1A] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#262626] text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Real-Time Sync</span>
            </div>
          </div>

          {/* Interactive Course Breakdown Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Course Roster &amp; Compliance Status
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                Click course to simulate recovery
              </span>
            </div>

            <div className="space-y-2">
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubject.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      isSelected 
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-xs ring-1 ring-blue-200 dark:ring-blue-800' 
                        : 'bg-white dark:bg-[#111111] border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#383838] hover:bg-slate-50/70 dark:hover:bg-[#161616]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1A1A1A] text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-[#262626]">
                          {sub.code}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white tracking-tight">
                          {sub.name}
                        </span>
                      </div>
                      {getRiskBadge(sub.risk)}
                    </div>

                    {/* Progress Track */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 dark:bg-[#262626] rounded-full h-2 overflow-hidden relative">
                        {/* 75% Statutory Marker Line */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10" 
                          style={{ left: `${statutoryThreshold}%` }}
                          title={`Statutory Minimum: ${statutoryThreshold}%`}
                        />
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            sub.percentage >= 80 
                              ? 'bg-emerald-500' 
                              : sub.percentage >= statutoryThreshold 
                              ? 'bg-amber-500' 
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="w-16 text-right font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                        {sub.percentage}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Recovery & Intelligence Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* Deterministic Recovery Calculation Box */}
            <div className="bg-white dark:bg-[#111111] p-3 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-[11px] font-bold mb-1">
                <Calculator className="w-3.5 h-3.5" />
                <span>Deterministic Recovery</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                {selectedSubject.recoveryNeeded > 0 ? (
                  <>
                    Must attend next <strong className="text-blue-700 dark:text-blue-400 font-bold">{selectedSubject.recoveryNeeded} consecutive lectures</strong> to exceed {statutoryThreshold}% cutoff in {selectedSubject.code}.
                  </>
                ) : (
                  <>
                    Safe margin: Can miss up to <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedSubject.canMiss} classes</strong> while remaining &ge; {statutoryThreshold}%.
                  </>
                )}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Algebraic Math Verified</span>
                <span>Formula: ceil((T·C - A)/(1 - T))</span>
              </div>
            </div>

            {/* AI Contextual Insight Box */}
            <div className="bg-white dark:bg-[#111111] p-3 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Academic Insight</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                {selectedSubject.percentage < statutoryThreshold ? (
                  <>
                    Automated alert triggered for {selectedSubject.code}. Advisor and student notified with recovery timetable.
                  </>
                ) : (
                  <>
                    Attendance trajectory for {selectedSubject.code} meets university criteria. No intervention necessary.
                  </>
                )}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Grounded Reasoning</span>
                <span>Audit-Tracked</span>
              </div>
            </div>

          </div>

        </div>

        {/* Product Visual Bottom Bar */}
        <div className="bg-slate-100/80 dark:bg-[#111111] px-4 py-2 border-t border-slate-200 dark:border-[#262626] flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Institutional ERP Grade Architecture
          </span>
          <span>Zero Fabricated Arithmetic</span>
        </div>

      </div>

    </div>
  );
};

