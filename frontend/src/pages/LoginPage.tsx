import React, { useState, useRef } from 'react';
import { GraduationCap, ArrowRight, Lock, Users, Shield, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      if (selectedRole === 'student') {
        setError('Please enter your Student ID, Roll Number, or Email.');
      } else if (selectedRole === 'faculty') {
        setError('Please enter your Faculty Employee ID or Email.');
      } else {
        setError('Please enter your Administrator ID or Email.');
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const u = await login(trimmedId, password, selectedRole);

      if (u.must_change_password) {
        window.location.href = '/force-change-password';
        return;
      }

      if (u.role === 'student') {
        window.location.href = '/student/dashboard';
      } else if (u.role === 'faculty') {
        window.location.href = '/faculty/dashboard';
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err: any) {
      setPassword('');
      passwordInputRef.current?.focus();
      setError(err.message || 'Incorrect ID/email or password. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (roleKey: 'student_borderline' | 'student_safe' | 'student_critical' | 'faculty' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      const u = await quickLogin(roleKey);
      if (u.must_change_password) {
        window.location.href = '/force-change-password';
        return;
      }
      if (u.role === 'student') window.location.href = '/student/dashboard';
      else if (u.role === 'faculty') window.location.href = '/faculty/dashboard';
      else window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const getIdentifierConfig = () => {
    switch (selectedRole) {
      case 'student':
        return {
          label: 'Student ID / Roll Number or Email',
          placeholder: 'e.g. CS2022-001 or rahul.verma@college.edu',
          icon: GraduationCap,
        };
      case 'faculty':
        return {
          label: 'Faculty Employee ID or Email',
          placeholder: 'e.g. EMP-101 or faculty.rajesh@college.edu',
          icon: Users,
        };
      case 'admin':
        return {
          label: 'Administrator ID or Email',
          placeholder: 'e.g. admin@college.edu',
          icon: Shield,
        };
    }
  };

  const currentConfig = getIdentifierConfig();
  const IconComponent = currentConfig.icon;

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
            Institutional Sign-In
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Center Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-lg p-6 sm:p-7 shadow-xs">
            
            {/* Header within card */}
            <div className="mb-5 pb-4 border-b border-slate-100 dark:border-[#27272A]">
              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Sign In to Your Account
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                Attendance and Academic Compliance Portal
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className="mb-4">
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Select Portal Role
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A]">
                {(['student', 'faculty', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      if (error) setError(null);
                    }}
                    className={`py-1 text-xs font-medium rounded capitalize transition-colors ${
                      selectedRole === r
                        ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-zinc-100 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {r === 'admin' ? 'Administrator' : r}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-4 p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-800 dark:text-rose-300 text-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
                <div className="flex-1 leading-relaxed">
                  {error}
                </div>
              </div>
            )}

            <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  {currentConfig.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={() => {
                      if (error) setError(null);
                    }}
                    placeholder={currentConfig.placeholder}
                    className="block w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    ref={passwordInputRef}
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={() => {
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    className="block w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs font-medium text-white shadow-xs transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Portals Section */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#27272A]">
              <p className="text-center text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Fast Access Demo Portals
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoClick('student_borderline')}
                  className="w-full flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-[#18181B] hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-[#27272A] text-xs text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="text-slate-900 dark:text-zinc-200 font-medium">Rahul Verma (Borderline Risk)</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">student123 • Roll: CS2022-001</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                    Student
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoClick('student_safe')}
                  className="w-full flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-[#18181B] hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-[#27272A] text-xs text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-slate-900 dark:text-zinc-200 font-medium">Priya Sharma (Compliant)</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">student123 • Roll: CS2022-002</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                    Student
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoClick('faculty')}
                  className="w-full flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-[#18181B] hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-[#27272A] text-xs text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-slate-900 dark:text-zinc-200 font-medium">Prof. Rajesh Kumar (Faculty)</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">faculty123 • Computer Networks</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
                    Faculty
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoClick('admin')}
                  className="w-full flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-[#18181B] hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-[#27272A] text-xs text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <p className="text-slate-900 dark:text-zinc-200 font-medium">Dr. Anand Roy (Academic Dean)</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">admin123 • IT / Dean</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
                    Admin
                  </span>
                </button>
              </div>
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
