import React, { useState } from 'react';
import { ShieldAlert, Lock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const ForceChangePasswordPage: React.FC = () => {
  const { user, updateUserData, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(newPassword)) {
      setError('Password must contain at least one alphabetical letter.');
      return;
    }

    if (!/\d/.test(newPassword)) {
      setError('Password must contain at least one numeric digit.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await api.forceChangePassword(newPassword);
      updateUserData(updatedUser);
      // Navigate to respective dashboard
      if (updatedUser.role === 'student') {
        window.location.href = '/student/dashboard';
      } else if (updatedUser.role === 'faculty') {
        window.location.href = '/faculty/dashboard';
      } else {
        window.location.href = '/admin/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090B] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <KeyRound className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Mandatory Password Update
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
          AttendanceAI • Institutional Account Security Policy
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] py-8 px-6 shadow-xs rounded-xl sm:px-10 space-y-5">
          
          <div className="p-3.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Password Reset Required</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              Your account password was reset by an institutional administrator. For security reasons, you must set a private password before accessing your university portal.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-lg space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400 font-medium">Account:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{user?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400 font-medium">Email / ID:</span>
              <span className="font-mono text-slate-700 dark:text-zinc-300">{user?.roll_number || user?.employee_id || user?.email}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                New Permanent Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters (letters + digits)"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#18181B] border border-slate-300 dark:border-[#27272A] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#18181B] border border-slate-300 dark:border-[#27272A] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 erp-button cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save Password &amp; Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={logout}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              Sign out and change later
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
