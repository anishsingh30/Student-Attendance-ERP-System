import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { CSVImportResult } from '../../types';

export const AttendanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('csv');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // CSV Import State
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);

  // Manual Add State
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionStatus, setSessionStatus] = useState<string>('PRESENT');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchOptions = async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const [subs, stList] = await Promise.all([
        api.getFacultySubjects(),
        api.getFacultyStudents()
      ]);
      setSubjects(subs || []);
      setStudents(stList || []);
      if (subs && subs.length > 0) setSelectedSubject(subs[0].id);
      if (stList && stList.length > 0) setSelectedStudent(stList[0].student_id);
    } catch (e: any) {
      console.error(e);
      setFetchError(e.message || 'Unable to load course subjects or student roster. Please verify connection.');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleDownloadTemplate = () => {
    const today = new Date().toISOString().split('T')[0];
    const sampleSubject = subjects.length > 0 ? (subjects[0].code || 'SUB-101') : 'COURSE-101';
    let rows = 'student_id,student_name,subject,date,status\n';
    if (students && students.length > 0) {
      students.slice(0, 5).forEach((st) => {
        const roll = st.roll_number || `STU-${st.student_id}`;
        const name = st.full_name || 'Student Name';
        rows += `${roll},${name},${sampleSubject},${today},PRESENT\n`;
      });
    } else {
      rows += `STU-001,Student Name,${sampleSubject},${today},PRESENT\n`;
    }
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_template_${sampleSubject}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await api.uploadAttendanceCSV(file);
      setImportResult(res);
    } catch (err: any) {
      alert(`CSV upload failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSubject) return;
    setManualLoading(true);
    setManualSuccess(null);
    setManualError(null);
    try {
      await api.addAttendanceRecord({
        student_id: Number(selectedStudent),
        subject_id: Number(selectedSubject),
        date: sessionDate,
        status: sessionStatus,
        notes: sessionNotes || undefined
      });
      setManualSuccess('Attendance record successfully recorded.');
      setSessionNotes('');
    } catch (err: any) {
      setManualError(err.message || 'Failed to add attendance record.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Attendance Recording &amp; Import</h1>
        <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
          Record individual lecture attendance or upload bulk institutional CSV sheets with row-level validation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#262626] pb-2">
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all erp-button cursor-pointer ${
            activeTab === 'csv'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-xs'
              : 'text-slate-600 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#171717]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Batch CSV Import</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all erp-button cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-xs'
              : 'text-slate-600 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#171717]'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Tab 1: CSV Import */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#262626] mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Attendance CSV File</h3>
                <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-0.5">
                  Required columns: <code className="font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded">student_id, student_name, subject, date, status</code>
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#171717] hover:bg-slate-100 dark:hover:bg-[#202020] border border-slate-200 dark:border-[#262626] text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] inline-flex items-center gap-2 transition-all erp-button cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Download Sample Template</span>
              </button>
            </div>

            <form onSubmit={handleCsvUpload} className="space-y-5">
              <div className="border-2 border-dashed border-slate-300 dark:border-[#262626] hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-8 text-center transition-all bg-slate-50/50 dark:bg-[#141414] cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  id="csvFile"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
                <label htmlFor="csvFile" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {file ? file.name : 'Click to select or drag CSV attendance file here'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] mt-1">
                    Accepts comma-separated values (.csv) with header row up to 2MB
                  </p>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!file || importing}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-xs font-semibold text-white transition-all shadow-xs inline-flex items-center gap-2 erp-button cursor-pointer"
                >
                  {importing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{importing ? 'Validating & Processing...' : 'Upload & Validate CSV'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Import Results Card */}
          {importResult && (
            <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs animate-fade-in">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Import Validation Telemetry</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-center">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{importResult.records_processed}</span>
                  <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-[#A3A3A3] mt-0.5">Processed</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{importResult.successful_records}</span>
                  <p className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">Successful</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center">
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-300">{importResult.duplicate_records}</span>
                  <p className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-300 mt-0.5">Duplicates Updated</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center">
                  <span className="text-xl font-bold text-rose-700 dark:text-rose-300">{importResult.failed_records}</span>
                  <p className="text-[10px] uppercase font-semibold text-rose-700 dark:text-rose-300 mt-0.5">Failed</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs">
                  <p className="font-semibold text-rose-700 dark:text-rose-300 mb-2">Row Validation Warnings:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
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

      {/* Tab 2: Manual Record Entry */}
      {activeTab === 'manual' && (
        <div className="bg-white dark:bg-[#111111] p-6 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Mark Single Attendance Record</h3>

          {fetchError && (
            <div className="mb-4 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={fetchOptions}
                className="px-2.5 py-1 bg-white dark:bg-[#141414] border border-rose-300 dark:border-rose-800 rounded text-rose-800 dark:text-rose-300 hover:bg-rose-100 font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {manualSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{manualSuccess}</span>
            </div>
          )}

          {manualError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{manualError}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Student</label>
                {fetchLoading ? (
                  <div className="p-2 text-xs text-slate-400 dark:text-[#737373]">Loading student roster...</div>
                ) : (
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(Number(e.target.value))}
                    required
                    className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {students.length === 0 && <option value="">No students found</option>}
                    {students.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.roll_number} - {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(Number(e.target.value))}
                  required
                  className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Status</label>
                <select
                  value={sessionStatus}
                  onChange={(e) => setSessionStatus(e.target.value)}
                  className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Session Notes (Optional)</label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Lab experiment 4 submission"
                className="w-full bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={manualLoading}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-xs inline-flex items-center gap-2 erp-button cursor-pointer"
              >
                {manualLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Record Attendance</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
