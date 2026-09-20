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
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      {/* Header with Add Subject Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Course Subjects &amp; Curriculum</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
              {subjects.length} Courses Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Institutional curriculum catalog of academic courses, session quotas, and requirements.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center justify-between gap-3 ${
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
      <div className="bg-white dark:bg-[#121215] p-3 rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-full sm:min-w-[200px] flex-1 sm:max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search course code or title..."
              className="w-full pl-8 pr-3 py-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-500 dark:text-zinc-400">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
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
            <span className="font-medium text-slate-500 dark:text-zinc-400">Sem:</span>
            <select
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
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
            <span className="font-medium text-slate-500 dark:text-zinc-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
            >
              <option value="ALL">All Curriculum</option>
              <option value="ACTIVE">Active Courses</option>
              <option value="ARCHIVED">Archived Courses</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
          Showing <strong>{filteredSubjects.length}</strong> of <strong>{subjects.length}</strong> courses
        </div>
      </div>

      {/* Bounded Scrollable Catalog Grid */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-4 shadow-xs">
        <div className="max-h-[64vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500 dark:text-zinc-400">
              Loading dynamic curriculum catalog...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No courses match current filters</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Try resetting the department or semester filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSubjects.map((sub) => {
                const isArchived = !sub.is_active;
                return (
                  <div
                    key={sub.id}
                    className={`bg-white dark:bg-[#18181B] border rounded-lg p-4 shadow-xs flex flex-col justify-between ${
                      isArchived
                        ? 'border-slate-200/80 dark:border-[#27272A] opacity-70 bg-slate-50/50 dark:bg-[#141417]'
                        : 'border-slate-200 dark:border-[#27272A] hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      {/* Badge bar */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">
                            {sub.code}
                          </span>
                          {isArchived ? (
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
                              Archived
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                          Sem {sub.semester}
                        </span>
                      </div>

                      {/* Course Title & Dept */}
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-1 leading-snug">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{sub.department}</p>

                      {/* Details row */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#27272A] grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-zinc-400">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold block">
                            Target Sessions
                          </span>
                          <strong className="text-slate-900 dark:text-zinc-200 font-mono">
                            {sub.total_classes_scheduled} classes
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold block">
                            Credits
                          </span>
                          <strong className="text-slate-900 dark:text-zinc-200 font-mono">
                            {sub.credits ?? 3} Credit units
                          </strong>
                        </div>
                      </div>

                      {/* Referential metrics if present */}
                      {(sub.attendance_records_count !== undefined || sub.alerts_count !== undefined) && (
                        <div className="mt-2 text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-3 font-mono">
                          {sub.attendance_records_count !== undefined && (
                            <span>{sub.attendance_records_count} attendance logs</span>
                          )}
                          {sub.alerts_count !== undefined && <span>{sub.alerts_count} alerts</span>}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#27272A] flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1 rounded border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit course details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isArchived ? (
                        <button
                          onClick={() => setConfirmSubject({ subject: sub, action: 'unarchive' })}
                          className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                          title="Restore to active catalog"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reactivate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmSubject({ subject: sub, action: 'archive_or_delete' })}
                          className="px-2 py-1 text-xs font-medium rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col p-4 sm:p-5 shadow-xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Add Curriculum Course</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrors.submit && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-md text-xs shrink-0">
                {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS507"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {formErrors.code && <p className="text-rose-500 text-[11px] mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Computing & Cloud Infrastructure"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {formErrors.name && <p className="text-rose-500 text-[11px] mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                    Semester (1–8) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                  <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                    Target Scheduled Sessions <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={formData.total_classes_scheduled}
                    onChange={(e) => setFormData({ ...formData, total_classes_scheduled: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  {formErrors.total_classes_scheduled && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.total_classes_scheduled}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                    Credits (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  {formErrors.credits && <p className="text-rose-500 text-[11px] mt-1">{formErrors.credits}</p>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUBJECT MODAL */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col p-4 sm:p-5 shadow-xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272A] shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Edit Course [{editingSubject.code}]
                </h3>
              </div>
              <button
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrors.submit && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-md text-xs shrink-0">
                {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {formErrors.code && <p className="text-rose-500 text-[11px] mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {formErrors.name && <p className="text-rose-500 text-[11px] mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                  <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                    Scheduled Sessions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={formData.total_classes_scheduled}
                    onChange={(e) => setFormData({ ...formData, total_classes_scheduled: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  {formErrors.total_classes_scheduled && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.total_classes_scheduled}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit_is_active" className="text-slate-700 dark:text-zinc-300 font-medium">
                  Course Active in Enrollment Catalog
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG (ARCHIVE / REMOVE) */}
      {confirmSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg max-w-md w-full max-h-[90vh] flex flex-col p-4 sm:p-5 shadow-xl space-y-4 overflow-hidden">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {confirmSubject.action === 'archive_or_delete'
                    ? `Archive or Remove "${confirmSubject.subject.name}"?`
                    : `Reactivate "${confirmSubject.subject.name}"?`}
                </h3>
                <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  Code: {confirmSubject.subject.code}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed space-y-2">
              {confirmSubject.action === 'archive_or_delete' ? (
                <>
                  <p>
                    If this course has existing attendance records, student alerts, or faculty assignments, it will be{' '}
                    <strong className="text-slate-900 dark:text-zinc-100">Archived</strong> rather than permanently deleted.
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

            <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmSubject(null)}
                disabled={submitting}
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteArchiveOrDelete}
                disabled={submitting}
                className={`px-3 py-1.5 text-white rounded-md font-medium transition-colors shadow-xs ${
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
