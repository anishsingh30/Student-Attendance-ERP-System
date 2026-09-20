import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RotateCw, 
  Users, 
  Calendar, 
  Save, 
  Check, 
  X,
  FileCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { api } from '../../api/client';
import { CSVImportResult } from '../../types';

interface StudentRosterItem {
  student_id: number;
  roll_number: string;
  name: string;
  percentage: number;
  status: 'PRESENT' | 'ABSENT';
  notes?: string;
}

export const AttendanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'session' | 'csv'>('session');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<string>('Lecture');
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);
  const [savingSession, setSavingSession] = useState<boolean>(false);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // CSV Import State
  const [file, setFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{ headers: string[]; rows: string[][]; totalRows: number } | null>(null);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'csv') {
      setActiveTab('csv');
    }
    const subParam = urlParams.get('subject');

    const fetchInitial = async () => {
      try {
        const subs = await api.getFacultySubjects();
        setSubjects(subs || []);
        if (subs && subs.length > 0) {
          const initialSub = subParam ? parseInt(subParam) : subs[0].id;
          setSelectedSubjectId(initialSub);
          loadRosterForSubject(initialSub);
        }
      } catch (e) {
        console.error('Failed to load faculty subjects:', e);
      }
    };
    fetchInitial();
  }, []);

  const loadRosterForSubject = async (subId: number) => {
    setLoadingRoster(true);
    setSessionSuccess(null);
    setSessionError(null);
    try {
      const stList = await api.getFacultyStudents();
      if (stList) {
        const mapped: StudentRosterItem[] = stList.map((st: any) => ({
          student_id: st.student_id,
          roll_number: st.roll_number || `STU-${st.student_id}`,
          name: st.name || 'Student Name',
          percentage: st.percentage || 0,
          status: 'PRESENT',
          notes: ''
        }));
        setRoster(mapped);
      }
    } catch (e: any) {
      console.error('Failed to load roster:', e);
      setSessionError('Unable to load student roster for selected course.');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleSubjectChange = (subId: number) => {
    setSelectedSubjectId(subId);
    loadRosterForSubject(subId);
  };

  const handleStatusToggle = (studentId: number, status: 'PRESENT' | 'ABSENT') => {
    setRoster(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster(prev => prev.map(s => ({ ...s, status })));
  };

  // Save full session attendance
  const handleSaveSession = async () => {
    if (!selectedSubjectId) {
      setSessionError('Please select an active course.');
      return;
    }
    if (roster.length === 0) {
      setSessionError('No students are enrolled in this roster.');
      return;
    }

    setSavingSession(true);
    setSessionSuccess(null);
    setSessionError(null);

    try {
      // Record attendance for all students in the roster
      let successCount = 0;
      for (const st of roster) {
        await api.addAttendanceRecord({
          student_id: st.student_id,
          subject_id: Number(selectedSubjectId),
          date: sessionDate,
          status: st.status,
          notes: `${sessionType}${st.notes ? ` - ${st.notes}` : ''}`
        });
        successCount++;
      }

      setSessionSuccess(
        `Session attendance successfully recorded for ${successCount} students on ${new Date(sessionDate).toLocaleDateString()}.`
      );
    } catch (err: any) {
      console.error('Failed to record session attendance:', err);
      setSessionError(err.message || 'An error occurred while committing attendance records.');
    } finally {
      setSavingSession(false);
    }
  };

  // CSV Client-side validation & preview
  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setImportResult(null);
    setParsedPreview(null);
    setPreviewErrors([]);

    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setPreviewErrors(['The selected file is empty or missing data rows.']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const required = ['student_id', 'student_name', 'subject', 'date', 'status'];
      const missing = required.filter(r => !headers.some(h => h.toLowerCase() === r));

      const errors: string[] = [];
      if (missing.length > 0) {
        errors.push(`Missing mandatory column headers: ${missing.join(', ')}`);
      }

      const rows: string[][] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        rows.push(lines[i].split(',').map(c => c.trim()));
      }

      setParsedPreview({
        headers,
        rows,
        totalRows: lines.length - 1
      });
      setPreviewErrors(errors);
    };
    reader.readAsText(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const today = new Date().toISOString().split('T')[0];
    const subCode = subjects.length > 0 ? subjects[0].code : 'CS501';
    let content = 'student_id,student_name,subject,date,status\n';
    if (roster.length > 0) {
      roster.slice(0, 5).forEach(s => {
        content += `${s.roll_number},${s.name},${subCode},${today},PRESENT\n`;
      });
    } else {
      content += `CS2022-001,Rahul Verma,${subCode},${today},PRESENT\n`;
      content += `CS2022-002,Priya Sharma,${subCode},${today},PRESENT\n`;
    }

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_template_${subCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await api.uploadAttendanceCSV(file);
      setImportResult(res);
    } catch (err: any) {
      alert(`CSV Upload failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Session stats
  const sessionStats = useMemo(() => {
    const total = roster.length;
    const present = roster.filter(s => s.status === 'PRESENT').length;
    const absent = roster.filter(s => s.status === 'ABSENT').length;
    const rate = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;
    return { total, present, absent, rate };
  }, [roster]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* 1. Header */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Attendance Recording &amp; Batch Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Take live session attendance by class roster or execute enterprise batch CSV register uploads
            </p>
          </div>

          {/* Workflow Tabs */}
          <div className="inline-flex rounded-md border border-slate-200 dark:border-[#27272A] p-0.5 bg-slate-50 dark:bg-[#18181B]">
            <button
              onClick={() => setActiveTab('session')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === 'session'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Session Roster Marking</span>
            </button>

            <button
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === 'csv'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Enterprise CSV Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: SESSION ROSTER ATTENDANCE WORKFLOW                   */}
      {/* ========================================================== */}
      {activeTab === 'session' && (
        <div className="space-y-5">
          
          {/* Controls Bar: Course, Date, Session Type */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
              Session Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Course Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Assigned Course
                </label>
                <select
                  value={selectedSubjectId || ''}
                  onChange={(e) => handleSubjectChange(Number(e.target.value))}
                  className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-2 text-xs font-medium text-slate-900 dark:text-zinc-100"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Session Type
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md px-3 py-2 text-xs text-slate-900 dark:text-zinc-100"
                >
                  <option value="Lecture">Lecture (Theory)</option>
                  <option value="Laboratory">Laboratory Session</option>
                  <option value="Tutorial">Tutorial / Discussion</option>
                  <option value="Extra Class">Remedial / Extra Class</option>
                </select>
              </div>
            </div>

            {/* Quick Batch Actions & Counters */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-zinc-400">
                <span>Roster Count: <strong className="text-slate-900 dark:text-zinc-100 font-mono">{sessionStats.total}</strong></span>
                <span className="text-emerald-700 dark:text-emerald-400">Present: <strong className="font-mono">{sessionStats.present}</strong></span>
                <span className="text-rose-700 dark:text-rose-400">Absent: <strong className="font-mono">{sessionStats.absent}</strong></span>
                <span>Session Rate: <strong className="font-mono">{sessionStats.rate}%</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="erp-btn px-2.5 py-1 text-xs border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-medium"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="erp-btn px-2.5 py-1 text-xs border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100 font-medium"
                >
                  Mark All Absent
                </button>
              </div>
            </div>
          </div>

          {/* Validation & Feedback Banners */}
          {sessionSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{sessionSuccess}</span>
            </div>
          )}

          {sessionError && (
            <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-rose-800 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{sessionError}</span>
            </div>
          )}

          {/* Interactive Roster Table */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-[#27272A] uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Roll Number</th>
                    <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Student Name</th>
                    <th className="px-3 py-3 bg-slate-50 dark:bg-[#18181B]">Current Attendance</th>
                    <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Attendance Status Control</th>
                    <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                  {loadingRoster ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-zinc-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <RotateCw className="w-4 h-4 text-blue-600 animate-spin" />
                          <span>Loading course student roster...</span>
                        </div>
                      </td>
                    </tr>
                  ) : roster.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-zinc-500 font-medium">
                        No students enrolled in this section.
                      </td>
                    </tr>
                  ) : (
                    roster.map((st) => (
                      <tr 
                        key={st.student_id} 
                        className="erp-table-row"
                      >
                        <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-zinc-300">
                          {st.roll_number}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-zinc-100">
                          {st.name}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`font-mono font-bold ${
                            st.percentage >= 75 ? 'text-slate-800 dark:text-zinc-200' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {st.percentage}%
                          </span>
                        </td>

                        {/* Present / Absent Segmented Controls */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="inline-flex rounded-md border border-slate-200 dark:border-[#27272A] p-0.5 bg-slate-50 dark:bg-[#18181B]">
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(st.student_id, 'PRESENT')}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1 ${
                                st.status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-500 dark:text-zinc-400 hover:text-emerald-700'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Present</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(st.student_id, 'ABSENT')}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1 ${
                                st.status === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-500 dark:text-zinc-400 hover:text-rose-700'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Absent</span>
                            </button>
                          </div>
                        </td>

                        {/* Individual Student Notes */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={st.notes || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRoster(prev => prev.map(item => item.student_id === st.student_id ? { ...item, notes: val } : item));
                            }}
                            className="erp-input w-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded px-2.5 py-1 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Commit Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#151518] flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Ready to commit session attendance for <strong>{roster.length}</strong> students.
              </span>

              <button
                type="button"
                onClick={handleSaveSession}
                disabled={savingSession || roster.length === 0}
                className="erp-btn erp-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2"
              >
                {savingSession ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{savingSession ? 'Saving Attendance...' : 'Commit & Save Session Attendance'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: ENTERPRISE CSV IMPORT WORKFLOW                      */}
      {/* ========================================================== */}
      {activeTab === 'csv' && (
        <div className="space-y-5">
          
          {/* Step 1: Upload Card */}
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#27272A]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Step 1: Upload Attendance Register CSV
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Required columns: <code className="font-mono text-blue-700 dark:text-blue-400 bg-slate-100 dark:bg-[#18181B] px-1 py-0.5 rounded text-[11px]">student_id, student_name, subject, date, status</code>
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="erp-btn erp-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Sample Template</span>
              </button>
            </div>

            <div className="border border-dashed border-slate-300 dark:border-[#27272A] hover:border-blue-500 rounded-lg p-8 text-center transition-colors bg-slate-50/50 dark:bg-[#151518] cursor-pointer">
              <input
                type="file"
                accept=".csv"
                id="csvUploadFile"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
              />
              <label htmlFor="csvUploadFile" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {file ? file.name : 'Click to select or drag attendance CSV file here'}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Supports comma-separated values up to 5MB with header row
                </p>
              </label>
            </div>
          </div>

          {/* Step 2: Validation & Preview */}
          {parsedPreview && (
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A]">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Step 2: CSV Data Validation &amp; Preview</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Parsed {parsedPreview.totalRows} records from <span className="font-mono">{file?.name}</span>
                  </p>
                </div>

                <div className="text-xs font-mono text-slate-600 dark:text-zinc-400">
                  Columns: {parsedPreview.headers.length}
                </div>
              </div>

              {previewErrors.length > 0 && (
                <div className="p-3.5 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>File Validation Issues:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                    {previewErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample Rows Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-[#27272A] rounded-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-[#27272A] uppercase font-semibold text-[10px]">
                    <tr>
                      {parsedPreview.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
                    {parsedPreview.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="erp-table-row">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 font-mono text-slate-700 dark:text-zinc-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirm Import Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  Confirm validation before committing changes to the attendance registry.
                </span>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || previewErrors.length > 0}
                  className="erp-btn erp-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-2"
                >
                  {importing ? <RotateCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{importing ? 'Processing Register...' : 'Confirm & Import Register'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Import Execution Result */}
          {importResult && (
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                Step 3: Execution Result &amp; Audit Summary
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-md bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{importResult.records_processed}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block mt-0.5">Processed</span>
                </div>
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-center">
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{importResult.successful_records}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">Succeeded</span>
                </div>
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-center">
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{importResult.duplicate_records}</span>
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block mt-0.5">Duplicates</span>
                </div>
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center">
                  <span className="text-2xl font-bold text-rose-700 dark:text-rose-400">{importResult.failed_records}</span>
                  <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block mt-0.5">Failed</span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="p-3.5 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs">
                  <p className="font-bold text-rose-700 dark:text-rose-400 mb-1">Row Exceptions:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-zinc-300 text-[11px]">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
