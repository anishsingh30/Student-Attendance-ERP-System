import React, { useState, useRef } from 'react';
import { GraduationCap, ArrowRight, Lock, Users, Shield, AlertCircle, RefreshCw } from 'lucide-react';
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

    // Client-side field level validation
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

      // Check if administrative password reset requires mandatory password change
      if (u.must_change_password) {
        window.location.href = '/force-change-password';
        return;
      }

      // Backend authoritatively returned actual authenticated role
      if (u.role === 'student') {
        window.location.href = '/student/dashboard';
      } else if (u.role === 'faculty') {
        window.location.href = '/faculty/dashboard';
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err: any) {
      // Clear password and refocus for secure retry while keeping identifier
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
          label: 'Admin ID or Email',
          placeholder: 'e.g. admin@college.edu',
          icon: Shield,
        };
    }
  };

  const currentConfig = getIdentifierConfig();
  const IconComponent = currentConfig.icon;

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-black text-slate-900 dark:text-white flex flex-col justify-center py-16 sm:py-20 sm:px-6 lg:px-8 relative selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      
      {/* Top Header Bar with Brand and Theme Toggle */}
      <header className="absolute top-4 left-4 right-4 sm:top-6 sm:left-8 sm:right-8 flex items-center justify-between z-20">
        <a 
          href="/" 
          className="inline-flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1" 
          title="Return to AttendanceAI Home"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Attendance<span className="text-blue-600">AI</span>
          </span>
        </a>

        {/* Reference Theme Toggle */}
        <ThemeToggle />
      </header>

      {/* Main Center Form Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-xs mb-3 mx-auto">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Apex Institute of Technology
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          Authoritative Academic Attendance &amp; Compliance Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#262626] py-8 px-6 shadow-xs dark:shadow-2xl rounded-2xl sm:px-10 transition-colors duration-200">
          
          {/* Role Selection Tabs */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Portal Role
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#262626]">
              {(['student', 'faculty', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r);
                    if (error) setError(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                    selectedRole === r
                      ? 'bg-white dark:bg-[#222222] text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-[#333333]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-800 dark:text-rose-300 text-xs animate-shake"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 leading-relaxed font-medium">
                {error}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {currentConfig.label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
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
                  className="block w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
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
                  className="block w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-[#141414] border border-slate-300 dark:border-[#262626] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 erp-button"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Portals Section */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#262626]">
            <p className="text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Fast Access Demo Accounts
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoClick('student_borderline')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#111111] hover:bg-blue-50/60 dark:hover:bg-[#181818] border border-slate-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-500/40 text-xs text-left transition-all erp-button"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">Rahul Verma (At Risk / 68%)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">student123 • Roll: CS2022-001</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-semibold">
                  Student
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('student_safe')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#111111] hover:bg-blue-50/60 dark:hover:bg-[#181818] border border-slate-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-500/40 text-xs text-left transition-all erp-button"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">Priya Sharma (Safe / 92%)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">student123 • Roll: CS2022-002</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                  Student
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('faculty')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#111111] hover:bg-blue-50/60 dark:hover:bg-[#181818] border border-slate-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-500/40 text-xs text-left transition-all erp-button"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">Prof. Rajesh Kumar (Head)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">faculty123 • Computer Networks</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold">
                  Faculty
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick('admin')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#111111] hover:bg-blue-50/60 dark:hover:bg-[#181818] border border-slate-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-500/40 text-xs text-left transition-all erp-button"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">Dr. Anand Roy (Academic Dean)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">admin123 • IT / Dean</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-semibold">
                  Admin
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

