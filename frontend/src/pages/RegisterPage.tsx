import React, { useState } from 'react';
import { GraduationCap, ArrowRight, Lock, Mail, User as UserIcon, BookOpen, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.register({
        email,
        password,
        full_name: fullName,
        role,
        roll_number: role === 'student' ? rollNumber : undefined,
        department,
        semester: role === 'student' ? Number(semester) : undefined,
      });

      setSuccess('Account registered successfully! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] flex items-center justify-between">
        <a 
          href="/" 
          className="inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 rounded" 
          title="Return to AttendanceAI Home"
        >
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Attendance<span className="text-blue-600">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
              University Attendance ERP
            </span>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Institutional Registration
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Center Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-6 sm:p-7 shadow-xs">
            {/* Form Header */}
            <div className="mb-5 pb-4 border-b border-slate-100 dark:border-[#27272A]">
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Register Institutional Account
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                Enroll student or faculty credentials into the registry
              </p>
            </div>

            {/* Role selector tabs */}
            <div className="flex rounded-md bg-slate-100 dark:bg-[#18181B] p-1 mb-4 border border-slate-200 dark:border-[#27272A]">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                  role === 'student'
                    ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Student Account
              </button>
              <button
                type="button"
                onClick={() => setRole('faculty')}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                  role === 'faculty'
                    ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                Faculty Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'student' ? 'e.g. Rahul Sharma' : 'e.g. Dr. Priya Nair'}
                    className="block w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'student' ? 'student@university.edu' : 'faculty@university.edu'}
                    className="block w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              {role === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="CS-2024-042"
                      className="block w-full px-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                      Semester
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="block w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Department
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  >
                    <option value="Computer Science">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics & Communication</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Electrical">Electrical Engineering</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-1.5 py-2 px-4 rounded-md shadow-xs text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  'Enrolling Account...'
                ) : (
                  <>
                    <span>Register Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center border-t border-slate-100 dark:border-[#27272A] pt-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Already registered?{' '}
                <a href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  Sign in to your portal
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <footer className="px-6 py-3 border-t border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#121215] text-center text-xs text-slate-500 dark:text-zinc-500">
        AttendanceAI ERP &copy; {new Date().getFullYear()} — Institutional Student Attendance Management System
      </footer>
    </div>
  );
};
