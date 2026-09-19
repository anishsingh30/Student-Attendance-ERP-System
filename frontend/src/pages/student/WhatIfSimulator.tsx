import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Bot, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  MinusCircle, 
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Users,
  Info
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StudentDashboardData, WhatIfResponse } from '../../types';
import { RiskBadge } from '../../components/common/RiskBadge';

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
        // Faculty / Admin
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
      setError(e.message || 'Mathematical simulation failed for the requested parameters.');
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

  if (initLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading authoritative course attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Calculator className="w-3.5 h-3.5" />
          <span>Authoritative Backend Simulation Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">What-If Attendance Simulator</h1>
        <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1 max-w-2xl">
          Model future attendance scenarios before absences occur. Calculations are executed strictly by the backend statutory math engine to guarantee 100% mathematical precision.
        </p>
      </div>

      {/* Hypothetical Notice Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2.5 text-amber-900 dark:text-amber-300 text-xs font-medium">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Hypothetical Simulation Mode:</strong> Adjusting parameters below will NOT modify your official academic records or attendance history.
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-2 text-rose-800 dark:text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-2.5 py-1 bg-white dark:bg-[#141414] border border-rose-300 dark:border-rose-800 rounded text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Simulator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Controls */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Student Selector for Faculty / Admin */}
          {role !== 'student' && students.length > 0 && (
            <div className="bg-white dark:bg-[#111111] p-5 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
              <label className="block text-xs font-bold text-slate-800 dark:text-[#D4D4D4] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Target Student</span>
              </label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => handleStudentChange(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                {students.map((st) => (
                  <option key={st.student_id} value={st.student_id}>
                    {st.roll_number} — {st.name} ({st.percentage}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Picker */}
          <div className="bg-white dark:bg-[#111111] p-5 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <label className="block text-xs font-bold text-slate-800 dark:text-[#D4D4D4] mb-2 uppercase tracking-wider">
              1. Select Subject ({subjects.length} available)
            </label>
            {subjects.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-[#737373] py-3 text-center">No authorized subjects found.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSubjectChange(s.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs erp-button ${
                      selectedSubjectId === s.id
                        ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-500 text-slate-900 dark:text-white font-medium shadow-xs ring-1 ring-blue-400'
                        : 'bg-slate-50 dark:bg-[#171717] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-[#A3A3A3] hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-mono text-[10px] text-slate-500 dark:text-[#A3A3A3] block">{s.code}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white truncate block">{s.name}</strong>
                    </div>
                    {s.percentage !== undefined && (
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white">{s.percentage}%</span>
                        <span className="text-[10px] block text-slate-500 dark:text-[#A3A3A3]">{s.classes_attended}/{s.classes_conducted}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scenario Sliders */}
          <div className="bg-white dark:bg-[#111111] p-5 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs space-y-6">
            <h3 className="text-xs font-bold text-slate-800 dark:text-[#D4D4D4] uppercase tracking-wider">
              2. Define Attendance Scenario
            </h3>

            {/* Slider: Miss Next Classes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
                  <MinusCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  <span>Hypothetical Absences</span>
                </span>
                <span className="font-mono text-sm font-bold text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                  +{classesToMiss}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={classesToMiss}
                onChange={(e) => handleMissChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-[#262626] rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#737373] mt-1">
                <span>0</span>
                <span>5</span>
                <span>10 classes</span>
              </div>
            </div>

            {/* Slider: Attend Next Classes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Consecutive Presences</span>
                </span>
                <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  +{classesToAttend}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={classesToAttend}
                onChange={(e) => handleAttendChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-[#262626] rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#737373] mt-1">
                <span>0</span>
                <span>7</span>
                <span>15 classes</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#262626] flex items-center justify-between">
              <button
                onClick={() => {
                  setClassesToMiss(2);
                  setClassesToAttend(0);
                  if (selectedSubjectId) runSimulation(selectedSubjectId, 0, 2, selectedStudentId);
                }}
                className="text-xs font-medium text-slate-500 dark:text-[#A3A3A3] hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Reset Default (Miss 2)
              </button>
              {loading && (
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Computing...</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Col: Mathematical Projection & AI Narrative */}
        <div className="lg:col-span-7 space-y-6">
          
          {result ? (
            <>
              {/* Projection Comparison Card */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#262626]">
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-[#A3A3A3]">{result.subject_code}</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{result.subject_name}</h3>
                    {result.student_name && role !== 'student' && (
                      <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-0.5 font-medium">Student: {result.student_name}</p>
                    )}
                  </div>
                  <RiskBadge level={result.projected_risk_level} />
                </div>

                <div className="grid grid-cols-2 gap-4 my-6">
                  {/* Current */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626]">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-[#A3A3A3]">Current Standing</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{result.current_percentage}%</span>
                      <RiskBadge level={result.current_risk_level} size="sm" showLabel={false} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">{result.current_attended} of {result.current_conducted} sessions</p>
                  </div>

                  {/* Projected */}
                  <div className={`p-4 rounded-lg border ${
                    result.is_above_threshold 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60' 
                      : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                  }`}>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-[#A3A3A3]">Projected Result</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className={`text-3xl font-extrabold ${result.is_above_threshold ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                        {result.projected_percentage}%
                      </span>
                      <span className={`text-xs font-bold ${result.percentage_change >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                        {result.percentage_change >= 0 ? `+${result.percentage_change}%` : `${result.percentage_change}%`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#CBD5E1] mt-1">{result.simulated_classes_attended} of {result.simulated_classes_conducted} sessions</p>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-[#CBD5E1] font-medium">
                    <span>Projected vs Mandatory {result.required_threshold}% Threshold</span>
                    <span className="font-bold text-slate-900 dark:text-white">{result.projected_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#171717] rounded-full h-3 overflow-hidden relative border border-slate-200 dark:border-[#262626]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.is_above_threshold ? 'bg-blue-600' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, result.projected_percentage))}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                      style={{ left: `${result.required_threshold}%` }}
                      title={`Threshold: ${result.required_threshold}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#737373]">
                    <span>0%</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">Cutoff: {result.required_threshold}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className="mt-5 p-3 rounded-lg bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] flex items-center gap-3">
                  {result.is_above_threshold ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">{result.status_summary}</p>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">{result.status_summary}</p>
                    </>
                  )}
                </div>

              </div>

              {/* AI Strategic Reasoning Narrative */}
              <div className="p-5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <Bot className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Deterministic Scenario Assessment</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {result.ai_explanation}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-xl text-xs text-slate-500 dark:text-[#A3A3A3]">
              Select a subject and define a scenario to run the simulator.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
