import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { SubjectItem } from '../../types';

export const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, ACTIVE, ARCHIVED

  // Alerts / Notification banners
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [confirmSubject, setConfirmSubject] = useState<{
    subject: SubjectItem;
    action: 'archive_or_delete' | 'unarchive';
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
    semester: 5,
    total_classes_scheduled: 50,
    credits: 3,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminSubjects();
      setSubjects(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load course subjects.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Distinct departments & semesters derived dynamically from data
  const availableDepartments = Array.from(
    new Set(['Computer Science', 'Information Technology', 'Electronics & Comm', ...subjects.map((s) => s.department)])
  ).filter(Boolean);

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Validation function
  const validateForm = (isEdit: boolean = false): boolean => {
    const errors: Record<string, string> = {};
    const trimmedCode = formData.code.trim().toUpperCase();

    if (!trimmedCode) {
      errors.code = 'Course code is required (e.g. CS501).';
    } else if (trimmedCode.length < 2 || trimmedCode.length > 20) {
      errors.code = 'Course code must be between 2 and 20 characters.';
    } else if (
      !isEdit &&
      subjects.some((s) => s.code.toUpperCase() === trimmedCode)
    ) {
      errors.code = `Course code '${trimmedCode}' is already registered.`;
    } else if (
      isEdit &&
      editingSubject &&
      subjects.some((s) => s.code.toUpperCase() === trimmedCode && s.id !== editingSubject.id)
    ) {
      errors.code = `Course code '${trimmedCode}' is taken by another course.`;
    }

    if (!formData.name.trim()) {
      errors.name = 'Course title/name is required.';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Course title must be at least 3 characters.';
    }

    if (!formData.department.trim()) {
      errors.department = 'Department is required.';
    }

    if (formData.semester < 1 || formData.semester > 8) {
      errors.semester = 'Semester must be between 1 and 8.';
    }

    if (!formData.total_classes_scheduled || formData.total_classes_scheduled < 1) {
      errors.total_classes_scheduled = 'Scheduled classes must be at least 1 session.';
    }

    if (formData.credits !== undefined && (formData.credits < 1 || formData.credits > 10)) {
      errors.credits = 'Credits must be between 1 and 10.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      code: '',
      name: '',
      department: 'Computer Science',
      semester: 5,
      total_classes_scheduled: 50,
      credits: 3,
      is_active: true,
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sub: SubjectItem) => {
    setEditingSubject(sub);
    setFormData({
      code: sub.code,
      name: sub.name,
      department: sub.department,
      semester: sub.semester,
      total_classes_scheduled: sub.total_classes_scheduled,
      credits: sub.credits || 3,
      is_active: sub.is_active,
    });
    setFormErrors({});
  };

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const newSub = await api.createSubject({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        department: formData.department.trim(),
        semester: Number(formData.semester),
        total_classes_scheduled: Number(formData.total_classes_scheduled),
        credits: Number(formData.credits || 3),
      });
      setFeedback({
        type: 'success',
        text: `Subject [${newSub.code}] "${newSub.name}" added successfully to the curriculum.`,
      });
      setIsAddModalOpen(false);
      await fetchSubjects();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to add course subject.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    if (!validateForm(true)) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const updated = await api.updateSubject(editingSubject.id, {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        department: formData.department.trim(),
        semester: Number(formData.semester),
        total_classes_scheduled: Number(formData.total_classes_scheduled),
        credits: Number(formData.credits || 3),
        is_active: formData.is_active,
      });
      setFeedback({
        type: 'success',
        text: `Subject [${updated.code}] "${updated.name}" updated successfully.`,
      });
      setEditingSubject(null);
      await fetchSubjects();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Failed to update course subject.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Archive / Delete Confirmation Action
  const handleExecuteArchiveOrDelete = async () => {
    if (!confirmSubject) return;
    const { subject, action } = confirmSubject;
    setSubmitting(true);
    setFeedback(null);

    try {
      if (action === 'archive_or_delete') {
        const result = await api.deleteOrArchiveSubject(subject.id);
        if (result.archived) {
          setFeedback({
            type: 'info',
            text: result.message || `Subject [${subject.code}] archived. Historical attendance and alert integrity preserved.`,
          });
        } else {
          setFeedback({
            type: 'success',
            text: result.message || `Subject [${subject.code}] deleted cleanly from academic records.`,
          });
        }
      } else if (action === 'unarchive') {
        await api.unarchiveSubject(subject.id);
        setFeedback({
          type: 'success',
          text: `Subject [${subject.code}] reactivated and restored to active curriculum.`,
        });
      }
      setConfirmSubject(null);
      await fetchSubjects();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed on subject.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering
  const filteredSubjects = subjects.filter((sub) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match =
        sub.code.toLowerCase().includes(term) ||
        sub.name.toLowerCase().includes(term) ||
        sub.department.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (deptFilter && sub.department !== deptFilter) return false;
    if (semFilter && sub.semester !== Number(semFilter)) return false;
    if (statusFilter === 'ACTIVE' && !sub.is_active) return false;
    if (statusFilter === 'ARCHIVED' && sub.is_active) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header with Add Subject Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Course Subjects & Curriculum</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
              {subjects.length} Courses Monitored
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Authoritative curriculum database of courses, session targets, and historical enrollment requirements.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer erp-button"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              : feedback.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : feedback.type === 'info' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#111111] p-4 rounded-xl border border-slate-200 dark:border-[#262626] shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#737373]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search course code or title..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs font-medium"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 dark:text-[#A3A3A3]">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="">All Departments</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 dark:text-[#A3A3A3]">Sem:</span>
            <select
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="">All Semesters</option>
              {availableSemesters.map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 dark:text-[#A3A3A3]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="ALL">All Curriculum</option>
              <option value="ACTIVE">Active Courses</option>
              <option value="ARCHIVED">Archived Courses</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 dark:text-[#A3A3A3] font-medium font-mono text-[11px]">
          Showing <strong>{filteredSubjects.length}</strong> of <strong>{subjects.length}</strong> courses
        </div>
      </div>

      {/* Bounded Scrollable Catalog Grid */}
      <div className="bg-white/50 dark:bg-[#111111]/40 border border-slate-200 dark:border-[#262626] rounded-xl p-4 shadow-xs">
        <div className="max-h-[64vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500 dark:text-[#A3A3A3]">
              Loading dynamic curriculum catalog...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-[#404040] mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-[#D4D4D4]">No courses match current filters</p>
              <p className="text-xs text-slate-400 dark:text-[#737373] mt-1">Try resetting the department or semester filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map((sub) => {
                const isArchived = !sub.is_active;
                return (
                  <div
                    key={sub.id}
                    className={`bg-white dark:bg-[#111111] border rounded-xl p-5 shadow-xs transition-all duration-180 flex flex-col justify-between ${
                      isArchived
                        ? 'border-slate-200/80 dark:border-[#262626] opacity-75 bg-slate-50/50 dark:bg-[#141414]'
                        : 'border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#383838] hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      {/* Badge bar */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50">
                            {sub.code}
                          </span>
                          {isArchived ? (
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                              Archived
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-[#A3A3A3] font-medium">
                          Sem {sub.semester}
                        </span>
                      </div>

                      {/* Course Title & Dept */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 leading-snug">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-0.5">{sub.department}</p>

                      {/* Details row */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262626] grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-[#A3A3A3]">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-[#737373] uppercase font-bold block">
                            Target Sessions
                          </span>
                          <strong className="text-slate-900 dark:text-white font-mono">
                            {sub.total_classes_scheduled} classes
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-[#737373] uppercase font-bold block">
                            Credits
                          </span>
                          <strong className="text-slate-900 dark:text-white font-mono">
                            {sub.credits ?? 3} Credit units
                          </strong>
                        </div>
                      </div>

                      {/* Referential metrics if present */}
                      {(sub.attendance_records_count !== undefined || sub.alerts_count !== undefined) && (
                        <div className="mt-2 text-[10px] text-slate-400 dark:text-[#737373] flex items-center gap-3 font-mono">
                          {sub.attendance_records_count !== undefined && (
                            <span>{sub.attendance_records_count} attendance logs</span>
                          )}
                          {sub.alerts_count !== undefined && <span>{sub.alerts_count} alerts</span>}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors"
                        title="Edit course details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isArchived ? (
                        <button
                          onClick={() => setConfirmSubject({ subject: sub, action: 'unarchive' })}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                          title="Restore to active catalog"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reactivate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmSubject({ subject: sub, action: 'archive_or_delete' })}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                          title="Archive or remove subject"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Archive / Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ADD SUBJECT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Curriculum Subject</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrors.submit && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
                {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS507"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.code && <p className="text-rose-500 text-[11px] mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                  Subject Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Computing & Cloud Infrastructure"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.name && <p className="text-rose-500 text-[11px] mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                    Semester (1–8) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {availableSemesters.map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                    Target Scheduled Sessions <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={formData.total_classes_scheduled}
                    onChange={(e) => setFormData({ ...formData, total_classes_scheduled: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {formErrors.total_classes_scheduled && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.total_classes_scheduled}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                    Credits (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {formErrors.credits && <p className="text-rose-500 text-[11px] mt-1">{formErrors.credits}</p>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1c1c1c] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors shadow-xs"
                >
                  {submitting ? 'Saving Course...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUBJECT MODAL */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Subject [{editingSubject.code}]
                </h3>
              </div>
              <button
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrors.submit && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg text-xs">
                {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.code && <p className="text-rose-500 text-[11px] mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                  Subject Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {formErrors.name && <p className="text-rose-500 text-[11px] mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {availableSemesters.map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">
                    Scheduled Sessions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={formData.total_classes_scheduled}
                    onChange={(e) => setFormData({ ...formData, total_classes_scheduled: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {formErrors.total_classes_scheduled && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.total_classes_scheduled}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-[#D4D4D4] font-semibold mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit_is_active" className="text-slate-700 dark:text-[#D4D4D4] font-semibold">
                  Course Active in Enrollment Catalog
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1c1c1c] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors shadow-xs"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG (ARCHIVE / REMOVE) */}
      {confirmSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmSubject.action === 'archive_or_delete'
                    ? `Archive or Remove "${confirmSubject.subject.name}"?`
                    : `Reactivate "${confirmSubject.subject.name}"?`}
                </h3>
                <p className="text-[11px] font-mono text-slate-500 dark:text-[#A3A3A3]">
                  Code: {confirmSubject.subject.code}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-[#A3A3A3] leading-relaxed space-y-2">
              {confirmSubject.action === 'archive_or_delete' ? (
                <>
                  <p>
                    If this course has existing attendance records, student alerts, or faculty assignments, it will be{' '}
                    <strong className="text-slate-900 dark:text-white">Archived</strong> rather than permanently deleted.
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 font-medium">
                    This protects historical academic percentages, compliance audits, and statutory reports while removing the course from active rosters.
                  </p>
                </>
              ) : (
                <p>
                  Reactivating this subject will restore it to active curriculum selection for students and faculty course assignments.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmSubject(null)}
                disabled={submitting}
                className="px-4 py-2 bg-slate-100 dark:bg-[#1c1c1c] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-200 dark:hover:bg-[#262626] rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteArchiveOrDelete}
                disabled={submitting}
                className={`px-4 py-2 text-white rounded-lg font-semibold transition-colors shadow-xs ${
                  confirmSubject.action === 'archive_or_delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitting
                  ? 'Processing...'
                  : confirmSubject.action === 'archive_or_delete'
                  ? 'Confirm Archive / Remove'
                  : 'Reactivate Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
