import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  MinusCircle, 
  PlusCircle, 
  RotateCw, 
  Info, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { WhatIfResponse } from '../../types';

interface SubjectOption {
  id: number;
  code: string;
  name: string;
  percentage?: number;
  classes_attended?: number;
  classes_conducted?: number;
}

export const WhatIfSimulator: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  
  const [classesToMiss, setClassesToMiss] = useState<number>(2);
  const [classesToAttend, setClassesToAttend] = useState<number>(0);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initLoading, setInitLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role?.toLowerCase() || 'student';

  const loadData = async () => {
    setInitLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const studentParam = urlParams.get('student');
      const subjectParam = urlParams.get('subject');

      if (role === 'student') {
        const dash = await api.getStudentDashboard();
        const subs: SubjectOption[] = dash.subjects.map(s => ({
          id: s.subject_id,
          code: s.subject_code,
          name: s.subject_name,
          percentage: s.percentage,
          classes_attended: s.classes_attended,
          classes_conducted: s.classes_conducted
        }));
        setSubjects(subs);

        if (subs.length > 0) {
          const targetSubId = subjectParam ? parseInt(subjectParam) : subs[0].id;
          setSelectedSubjectId(targetSubId);
          runSimulation(targetSubId, 0, 2);
        }
      } else {
        const [subList, stList] = await Promise.all([
          role === 'admin' ? api.getAdminSubjects() : api.getFacultySubjects(),
          api.getFacultyStudents()
        ]);

        const mappedSubs: SubjectOption[] = (subList || []).map(s => ({
          id: s.id,
          code: s.code,
          name: s.name
        }));
        setSubjects(mappedSubs);
        setStudents(stList || []);

        let initialStudentId: number | null = null;
        if (studentParam) {
          initialStudentId = parseInt(studentParam);
        } else if (stList && stList.length > 0) {
          initialStudentId = stList[0].student_id;
        }
        setSelectedStudentId(initialStudentId);

        let initialSubId: number | null = null;
        if (subjectParam) {
          initialSubId = parseInt(subjectParam);
        } else if (mappedSubs.length > 0) {
          initialSubId = mappedSubs[0].id;
        }
        setSelectedSubjectId(initialSubId);

        if (initialSubId && initialStudentId) {
          runSimulation(initialSubId, 0, 2, initialStudentId);
        }
      }
    } catch (e: any) {
      console.error('Failed to load simulator data:', e);
      setError(e.message || 'Unable to load course and attendance records for simulation.');
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const runSimulation = async (subId: number, attend: number, miss: number, studentId?: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const stId = role === 'student' ? undefined : (studentId || selectedStudentId || undefined);
      const res = await api.runWhatIf(subId, attend, miss, stId);
      setResult(res);
    } catch (e: any) {
      console.error('Simulation failed:', e);
      setError(e.message || 'Simulation calculation failed for requested parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (stId: number) => {
    setSelectedStudentId(stId);
    if (selectedSubjectId) {
      runSimulation(selectedSubjectId, classesToAttend, classesToMiss, stId);
    }
  };

  const handleSubjectChange = (subId: number) => {
    setSelectedSubjectId(subId);
    runSimulation(subId, classesToAttend, classesToMiss, selectedStudentId);
  };

  const handleMissChange = (val: number) => {
    setClassesToMiss(val);
    if (selectedSubjectId) {
      runSimulation(selectedSubjectId, classesToAttend, val, selectedStudentId);
    }
  };

  const handleAttendChange = (val: number) => {
    setClassesToAttend(val);
    if (selectedSubjectId) {
      runSimulation(selectedSubjectId, val, classesToMiss, selectedStudentId);
    }
  };

  const selectedSubjectData = subjects.find(s => s.id === selectedSubjectId);

  if (initLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RotateCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Loading course attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* 1. Page Header */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Attendance What-If Simulator
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Deterministic scenario modeling tool for forecasting future eligibility against university minimum attendance requirements
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-300 text-xs font-mono border border-slate-200 dark:border-[#27272A]">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Authoritative Backend Formula</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-2.5 py-1 bg-white dark:bg-[#18181B] border border-rose-200 dark:border-rose-900 rounded font-medium hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Structured Academic Workspace: LEFT Scenario Inputs, RIGHT Projected Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* LEFT: SCENARIO INPUTS                                    */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-5">
          
          <div className="pb-3 border-b border-slate-100 dark:border-[#27272A] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
              Scenario Parameters
            </h2>
            {loading && (
              <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                <RotateCw className="w-3 h-3 animate-spin" />
                <span>Recalculating...</span>
              </span>
            )}
          </div>

          {/* Student Selector (Faculty / Admin only) */}
          {role !== 'student' && students.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Student</span>
              </label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => handleStudentChange(Number(e.target.value))}
                className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-zinc-100"
              >
                {students.map((st) => (
                  <option key={st.student_id} value={st.student_id}>
                    {st.roll_number} — {st.name} ({st.percentage}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              1. Enrolled Subject
            </label>
            <select
              value={selectedSubjectId || ''}
              onChange={(e) => handleSubjectChange(Number(e.target.value))}
              className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-medium"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} {s.percentage !== undefined ? `(${s.percentage}%)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Current Subject Standing Display */}
          {selectedSubjectData && (
            <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                Current Registered Attendance
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                    {result ? result.current_percentage : selectedSubjectData.percentage}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 ml-2">
                    ({result ? result.current_attended : selectedSubjectData.classes_attended} / {result ? result.current_conducted : selectedSubjectData.classes_conducted} sessions)
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  Cutoff: {result ? result.required_threshold : 75}%
                </span>
              </div>
            </div>
          )}

          {/* Future Classes: Planned Absences */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#27272A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4 text-rose-600" />
                <span>Planned Future Absences</span>
              </span>
              <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                +{classesToMiss} classes
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={classesToMiss}
              onChange={(e) => handleMissChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-rose-600"
            />

            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              <span>0 (No absence)</span>
              <span>6 classes</span>
              <span>12 classes</span>
            </div>
          </div>

          {/* Future Classes: Planned Attendance */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#27272A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Planned Consecutive Presences</span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                +{classesToAttend} classes
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={classesToAttend}
              onChange={(e) => handleAttendChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              <span>0 (None)</span>
              <span>7 classes</span>
              <span>15 classes</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#27272A] flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setClassesToMiss(2);
                setClassesToAttend(0);
                if (selectedSubjectId) runSimulation(selectedSubjectId, 0, 2, selectedStudentId);
              }}
              className="erp-btn erp-btn-secondary px-2.5 py-1 text-[11px]"
            >
              Preset: Miss 2 Lectures
            </button>
            <button
              type="button"
              onClick={() => {
                setClassesToMiss(0);
                setClassesToAttend(5);
                if (selectedSubjectId) runSimulation(selectedSubjectId, 5, 0, selectedStudentId);
              }}
              className="erp-btn erp-btn-secondary px-2.5 py-1 text-[11px]"
            >
              Preset: Attend Next 5
            </button>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT: PROJECTED RESULT                                  */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <>
              {/* Projected Result Block */}
              <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-5">
                
                <div className="pb-3 border-b border-slate-100 dark:border-[#27272A] flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      {result.subject_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                      {result.subject_name}
                    </h3>
                  </div>

                  {/* Standing Badge */}
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                    result.is_above_threshold
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                  }`}>
                    {result.is_above_threshold ? 'ELIGIBLE' : 'BELOW REQUIREMENT'}
                  </span>
                </div>

                {/* Comparative Metric Hierarchy */}
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Current */}
                  <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-zinc-400 block">
                      Current
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1 block">
                      {result.current_percentage}%
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block">
                      {result.current_attended} / {result.current_conducted} sessions
                    </span>
                  </div>

                  {/* Projected */}
                  <div className={`p-3.5 rounded-md border ${
                    result.is_above_threshold
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                  }`}>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-zinc-400 block">
                      Projected
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className={`text-2xl font-extrabold ${
                        result.is_above_threshold ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                      }`}>
                        {result.projected_percentage}%
                      </span>
                      <span className={`text-xs font-semibold ${
                        result.percentage_change >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                      }`}>
                        {result.percentage_change >= 0 ? `+${result.percentage_change}%` : `${result.percentage_change}%`}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 block">
                      {result.simulated_classes_attended} / {result.simulated_classes_conducted} sessions
                    </span>
                  </div>

                  {/* Required */}
                  <div className="p-3.5 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-zinc-400 block">
                      Required
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1 block">
                      {result.required_threshold}%
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block">
                      University Standard
                    </span>
                  </div>

                </div>

                {/* Progress Visual against Required Threshold */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <span>Projected Standing vs Threshold</span>
                    <span className="font-bold">{result.projected_percentage}%</span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-[#18181B] rounded-full h-3 overflow-hidden relative border border-slate-200 dark:border-[#27272A]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        result.is_above_threshold ? 'bg-blue-600' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, result.projected_percentage))}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                      style={{ left: `${result.required_threshold}%` }}
                      title={`Statutory Requirement: ${result.required_threshold}%`}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    <span>0%</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      Required Threshold: {result.required_threshold}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Result Verdict Banner */}
                <div className={`p-3.5 rounded-md border flex items-center gap-3 ${
                  result.is_above_threshold
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                }`}>
                  {result.is_above_threshold ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Result: {result.is_above_threshold ? 'Eligible for Examination' : 'Below Requirement — Debarment Risk'}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 mt-0.5">
                      {result.status_summary}
                    </p>
                  </div>
                </div>

              </div>

              {/* Step-by-Step Calculation Explanation */}
              <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#27272A]">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                    Academic Calculation Breakdown
                  </h4>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#18181B] rounded border border-slate-200 dark:border-[#27272A] font-mono text-xs text-slate-800 dark:text-zinc-200 space-y-1.5">
                  <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
                    Projected Rate = (Attended Sessions + Planned Presences) / (Conducted Sessions + Total Planned) × 100
                  </p>
                  <p className="font-bold text-slate-900 dark:text-zinc-100">
                    = ({result.current_attended} + {classesToAttend}) / ({result.current_conducted} + {classesToAttend + classesToMiss}) × 100
                  </p>
                  <p className="font-bold text-blue-700 dark:text-blue-400">
                    = {result.simulated_classes_attended} / {result.simulated_classes_conducted} × 100 = {result.projected_percentage}%
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {result.ai_explanation}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-12 text-center text-xs text-slate-500">
              Select an enrolled course and adjust hypothetical parameters on the left to view the projected calculation.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
