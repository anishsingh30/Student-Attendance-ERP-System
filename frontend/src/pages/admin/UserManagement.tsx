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
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#262626]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">University User &amp; Role Management</h1>
          <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-1">
            Authoritative registry of enrolled students, faculty staff, and institutional administrators.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-all shadow-xs inline-flex items-center gap-2 erp-button"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setIsAddFacultyOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-all shadow-xs inline-flex items-center gap-2 erp-button"
          >
            <Users className="w-4 h-4" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-2 ${
          msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-2">
          {[
            { key: '', label: 'All Accounts' },
            { key: 'student', label: 'Students' },
            { key: 'faculty', label: 'Faculty' },
            { key: 'admin', label: 'Administrators' }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => handleRoleFilterChange(t.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === t.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#111111] border border-slate-300 dark:border-[#262626] text-slate-600 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            placeholder="Search by name, email, roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-[#737373] absolute left-3 pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
                fetchUsers(roleFilter, '', 1, pageSize);
              }}
              className="absolute right-2.5 text-slate-400 dark:text-[#737373] hover:text-slate-600 dark:hover:text-white text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </form>
      </div>

      {/* Bounded Users Table */}
      <div className="bg-white dark:bg-[#111111] rounded-xl overflow-hidden border border-slate-200 dark:border-[#262626] shadow-xs flex flex-col">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] border-b border-slate-200 dark:border-[#262626] uppercase tracking-wider font-semibold text-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">User</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Email</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Role</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Identifier</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Department</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717]">Status</th>
                <th className="px-5 py-3.5 bg-slate-50 dark:bg-[#171717] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-[#A3A3A3]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-[#737373] font-medium">
                    No matching users found in registry.
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-[#171717]/60 transition-colors erp-table-row">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {u.full_name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-[#A3A3A3]">
                    {u.email}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${
                      u.role === 'admin'
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50'
                        : u.role === 'faculty'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-[#D4D4D4]">
                    {u.roll_number || u.employee_id || `ADM-${u.id.toString().padStart(4, '0')}`}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-[#A3A3A3]">
                    {u.department || 'Administration'}
                  </td>
                  <td className="px-5 py-3.5">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-[#A3A3A3] font-semibold bg-slate-100 dark:bg-[#1a1a1a] px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#262626]">
                        <XCircle className="w-3 h-3 text-slate-400 dark:text-[#737373]" />
                        <span>Deactivated</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => setResetPwUser(u)}
                      className="p-1 rounded text-slate-500 dark:text-[#A3A3A3] hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      title="Reset password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={actionLoading}
                      className={`p-1 rounded transition-colors ${
                        u.is_active
                          ? 'text-slate-400 dark:text-[#737373] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          : 'text-slate-400 dark:text-[#737373] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-[#262626] bg-slate-50/50 dark:bg-[#141414] text-xs">
          <div className="text-slate-600 dark:text-[#A3A3A3] font-medium">
            Showing{' '}
            <strong className="text-slate-900 dark:text-white font-mono">
              {totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>
            –
            <strong className="text-slate-900 dark:text-white font-mono">
              {Math.min(currentPage * pageSize, totalUsers)}
            </strong>{' '}
            of <strong className="text-slate-900 dark:text-white font-mono">{totalUsers}</strong> users
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#171717] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-100 dark:hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 6 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400">...</span>;
                }
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  disabled={loading}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold transition-all ${
                    p === currentPage
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#333333] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-100 dark:hover:bg-[#222222]'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#171717] text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-100 dark:hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#262626] bg-slate-50 dark:bg-[#171717]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Student</h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">Enroll student in academic registry</p>
                </div>
              </div>
              <button onClick={() => setIsAddStudentOpen(false)} className="text-slate-400 dark:text-[#737373] hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={studentForm.full_name}
                    onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                    placeholder="e.g. Aryan Gupta"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Roll Number / Student ID</label>
                  <input
                    type="text"
                    required
                    value={studentForm.roll_number}
                    onChange={(e) => setStudentForm({ ...studentForm, roll_number: e.target.value })}
                    placeholder="e.g. CS2022-023"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Department</label>
                  <select
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Semester</label>
                  <select
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({ ...studentForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Section</label>
                  <input
                    type="text"
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    placeholder="A"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A3A3A3] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#262626] bg-slate-50 dark:bg-[#171717]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Faculty Member</h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">Register faculty credentials and course assignments</p>
                </div>
              </div>
              <button onClick={() => setIsAddFacultyOpen(false)} className="text-slate-400 dark:text-[#737373] hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFaculty} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={facultyForm.full_name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, full_name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Chander"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={facultyForm.employee_id}
                    onChange={(e) => setFacultyForm({ ...facultyForm, employee_id: e.target.value })}
                    placeholder="e.g. EMP-105"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    placeholder="faculty@college.edu"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={facultyForm.password}
                    onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Department</label>
                  <select
                    value={facultyForm.department}
                    onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">Designation</label>
                  <input
                    type="text"
                    value={facultyForm.designation}
                    onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                    placeholder="Associate Professor"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Assign Subjects */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1.5">
                  Assigned Teaching Subjects ({facultyForm.assigned_subject_ids.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-[#262626] rounded-lg bg-slate-50 dark:bg-[#141414]">
                  {subjects.map((sub) => {
                    const isChecked = facultyForm.assigned_subject_ids.includes(sub.id);
                    return (
                      <label key={sub.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#D4D4D4] cursor-pointer">
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
                        <span className="truncate">{sub.code} - {sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddFacultyOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A3A3A3] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#262626] bg-slate-50 dark:bg-[#171717]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Administrator Password Reset</h3>
              </div>
              <button 
                onClick={() => {
                  setResetPwUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }} 
                className="text-slate-400 dark:text-[#737373] hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#262626] rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Target Account:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{resetPwUser.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Email / Identifier:</span>
                  <span className="font-mono text-slate-700 dark:text-[#D4D4D4]">{resetPwUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-[#A3A3A3] font-medium">Role:</span>
                  <span className="font-semibold uppercase px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                    {resetPwUser.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">
                  New Temporary Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters (letters + digits)"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D4D4] mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-[#D4D4D4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireChangeOnNextLogin}
                    onChange={(e) => setRequireChangeOnNextLogin(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-[#F5F5F5]">Require password change on next login</span>
                    <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">
                      The user will be prompted to choose their own permanent password immediately after signing in.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#262626] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setResetPwUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-[#A3A3A3] hover:bg-slate-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
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
