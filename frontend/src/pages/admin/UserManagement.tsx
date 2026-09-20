import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  GraduationCap, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  Search, 
  KeyRound, 
  UserCheck, 
  UserX,
  RefreshCw,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [resetPwUser, setResetPwUser] = useState<any | null>(null);

  // Add Student Form State
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    email: '',
    roll_number: '',
    password: '',
    department: 'Computer Science',
    semester: 5,
    section: 'A'
  });

  // Add Faculty Form State
  const [facultyForm, setFacultyForm] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    password: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    assigned_subject_ids: [] as number[]
  });

  // Reset Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requireChangeOnNextLogin, setRequireChangeOnNextLogin] = useState(true);

  const fetchUsers = async (
    role = roleFilter,
    search = searchTerm,
    page = currentPage,
    size = pageSize
  ) => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers(role || undefined, search || undefined, page, size);
      if (data && typeof data === 'object' && 'items' in data) {
        setUsers(data.items);
        setTotalUsers(data.total);
        setTotalPages(data.total_pages);
        setCurrentPage(data.page);
      } else {
        setUsers(Array.isArray(data) ? data : []);
        setTotalUsers(Array.isArray(data) ? data.length : 0);
        setTotalPages(1);
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to load user directory.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const subs = await api.getAdminSubjects();
      setSubjects(subs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsers('', '', 1, pageSize);
    fetchSubjects();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(roleFilter, searchTerm, 1, pageSize);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
    fetchUsers(role, searchTerm, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchUsers(roleFilter, searchTerm, newPage, pageSize);
  };

  const handleToggleStatus = async (user: any) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} account for ${user.full_name}?`)) return;

    setActionLoading(true);
    setMsg(null);
    try {
      const res = await api.updateUserStatus(user.id, !user.is_active);
      setMsg({ type: 'success', text: res.message });
      await fetchUsers();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || `Failed to update status.` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await api.addStudent(studentForm);
      setMsg({ type: 'success', text: res.message });
      setIsAddStudentOpen(false);
      setStudentForm({
        full_name: '',
        email: '',
        roll_number: '',
        password: '',
        department: 'Computer Science',
        semester: 5,
        section: 'A'
      });
      await fetchUsers();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to add student.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await api.addFaculty(facultyForm);
      setMsg({ type: 'success', text: res.message });
      setIsAddFacultyOpen(false);
      setFacultyForm({
        full_name: '',
        email: '',
        employee_id: '',
        password: '',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        assigned_subject_ids: []
      });
      await fetchUsers();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to add faculty member.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwUser || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setMsg({ type: 'error', text: 'Password must be at least 8 characters long and contain both letters and digits.' });
      return;
    }

    setActionLoading(true);
    setMsg(null);
    try {
      const res = await api.resetUserPassword(resetPwUser.id, newPassword, requireChangeOnNextLogin);
      setMsg({ type: 'success', text: res.message });
      setResetPwUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setRequireChangeOnNextLogin(true);
      await fetchUsers();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to reset password.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">University User &amp; Role Management</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Authoritative directory of enrolled students, faculty instructors, and institutional administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setIsAddFacultyOpen(true)}
            className="px-3 py-1.5 rounded-md bg-white dark:bg-[#121215] hover:bg-slate-50 dark:hover:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-md border text-xs flex items-center justify-between gap-2 ${
          msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 -mb-1 scrollbar-none">
          {[
            { key: '', label: 'All Accounts' },
            { key: 'student', label: 'Students' },
            { key: 'faculty', label: 'Faculty' },
            { key: 'admin', label: 'Administrators' }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => handleRoleFilterChange(t.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                roleFilter === t.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name, email, roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 pl-8 pr-8 py-1 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
                fetchUsers(roleFilter, '', 1, pageSize);
              }}
              className="absolute right-2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </form>
      </div>

      {/* Bounded Users Table */}
      <div className="bg-white dark:bg-[#121215] rounded-lg overflow-hidden border border-slate-200 dark:border-[#27272A] shadow-xs flex flex-col">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full min-w-[720px] text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-[#27272A] uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">User</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Email</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Role</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Identifier</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Department</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B]">Status</th>
                <th className="px-4 py-3 bg-slate-50 dark:bg-[#18181B] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#27272A]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 dark:text-zinc-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-zinc-500 font-medium">
                    No matching users found in registry.
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-zinc-100">
                    {u.full_name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-zinc-400">
                    {u.email}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold font-mono ${
                      u.role === 'admin'
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50'
                        : u.role === 'faculty'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-zinc-300">
                    {u.roll_number || u.employee_id || `ADM-${u.id.toString().padStart(4, '0')}`}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-zinc-400">
                    {u.department || 'Administration'}
                  </td>
                  <td className="px-4 py-2.5">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 font-medium bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-[#27272A]">
                        <XCircle className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        <span>Deactivated</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right space-x-1.5">
                    <button
                      onClick={() => setResetPwUser(u)}
                      className="p-1 rounded text-slate-500 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      title="Reset password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={actionLoading}
                      className={`p-1 rounded transition-colors ${
                        u.is_active
                          ? 'text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          : 'text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                      title={u.is_active ? 'Deactivate account' : 'Activate account'}
                    >
                      {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#141417] text-xs">
          <div className="text-slate-500 dark:text-zinc-400">
            Showing{' '}
            <strong className="text-slate-900 dark:text-zinc-200 font-mono">
              {totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>
            –
            <strong className="text-slate-900 dark:text-zinc-200 font-mono">
              {Math.min(currentPage * pageSize, totalUsers)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-zinc-200 font-mono">{totalUsers}</strong> users
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="p-1 rounded border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 6 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400 dark:text-zinc-500">...</span>;
                }
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  disabled={loading}
                  className={`min-w-[26px] h-6 px-1 rounded text-xs font-medium transition-colors ${
                    p === currentPage
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="p-1 rounded border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181B] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Add New Student</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Enroll student in academic registry</p>
                </div>
              </div>
              <button onClick={() => setIsAddStudentOpen(false)} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-4 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentForm.full_name}
                    onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                    placeholder="e.g. Aryan Gupta"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Roll Number / Student ID</label>
                  <input
                    type="text"
                    required
                    value={studentForm.roll_number}
                    onChange={(e) => setStudentForm({ ...studentForm, roll_number: e.target.value })}
                    placeholder="e.g. CS2022-023"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Department</label>
                  <select
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Semester</label>
                  <select
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({ ...studentForm, semester: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Section</label>
                  <input
                    type="text"
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    placeholder="A"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enroll Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {isAddFacultyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181B] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Add Faculty Member</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Register faculty credentials and course assignments</p>
                </div>
              </div>
              <button onClick={() => setIsAddFacultyOpen(false)} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFaculty} className="p-4 space-y-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={facultyForm.full_name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, full_name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Chander"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={facultyForm.employee_id}
                    onChange={(e) => setFacultyForm({ ...facultyForm, employee_id: e.target.value })}
                    placeholder="e.g. EMP-105"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    placeholder="faculty@college.edu"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={facultyForm.password}
                    onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Department</label>
                  <select
                    value={facultyForm.department}
                    onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={facultyForm.designation}
                    onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                    placeholder="Associate Professor"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Assign Subjects */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Assigned Teaching Subjects ({facultyForm.assigned_subject_ids.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-[#27272A] rounded-md bg-slate-50 dark:bg-[#18181B]">
                  {subjects.map((sub) => {
                    const isChecked = facultyForm.assigned_subject_ids.includes(sub.id);
                    return (
                      <label key={sub.id} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFacultyForm({
                                ...facultyForm,
                                assigned_subject_ids: [...facultyForm.assigned_subject_ids, sub.id]
                              });
                            } else {
                              setFacultyForm({
                                ...facultyForm,
                                assigned_subject_ids: facultyForm.assigned_subject_ids.filter((id) => id !== sub.id)
                              });
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate font-mono">{sub.code}</span> - <span className="truncate">{sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFacultyOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Faculty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121215] rounded-lg border border-slate-200 dark:border-[#27272A] shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-[#27272A] bg-slate-50 dark:bg-[#18181B] shrink-0">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Administrator Password Reset</h3>
              </div>
              <button 
                onClick={() => {
                  setResetPwUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }} 
                className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
              <div className="p-2.5 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Account:</span>
                  <span className="font-medium text-slate-900 dark:text-zinc-100">{resetPwUser.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Identifier:</span>
                  <span className="font-mono text-slate-700 dark:text-zinc-300">{resetPwUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Role:</span>
                  <span className="font-mono uppercase px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                    {resetPwUser.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                  New Temporary Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters (letters + digits)"
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireChangeOnNextLogin}
                    onChange={(e) => setRequireChangeOnNextLogin(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">Require password change on next login</span>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Prompt user to set permanent password upon first session.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#27272A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetPwUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Reset Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
