import React, { useState, useRef } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Calendar, 
  Hash, 
  Building2, 
  ArrowRight,
  LogOut,
  Camera,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const ProfilePage: React.FC = () => {
  const { user, updateUserData, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const role = user.role.toLowerCase();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Image size must be less than 2MB.');
      return;
    }

    setUploading(true);
    setPhotoError(null);
    setPhotoSuccess(null);
    try {
      const updated = await api.uploadProfilePhoto(file);
      updateUserData(updated);
      setPhotoSuccess('Profile photo successfully updated.');
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setUploading(true);
    setPhotoError(null);
    setPhotoSuccess(null);
    try {
      const updated = await api.removeProfilePhoto();
      updateUserData(updated);
      setPhotoSuccess('Profile photo removed.');
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to remove profile photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }

    setPwLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-[#A3A3A3] mb-1">
          <span>University Portal</span>
          <span>/</span>
          <span className="text-slate-800 dark:text-white font-semibold">User Profile</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Academic Profile &amp; Settings</h1>
        <p className="text-xs text-slate-500 dark:text-[#A3A3A3] mt-0.5">
          Official institutional identity, avatar management, and security credentials.
        </p>
      </div>

      {photoSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{photoSuccess}</span>
        </div>
      )}

      {photoError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{photoError}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl shadow-xs overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-slate-900 dark:bg-zinc-900 border-b border-slate-800 dark:border-zinc-800 h-28 px-6 flex items-end pb-4 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-white/10 text-white font-mono tracking-wider border border-white/20 uppercase">
              {role} Record
            </span>
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-6">
            <div className="flex items-end gap-4">
              
              {/* Profile Avatar with Upload Controls */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-xl bg-white dark:bg-[#18181B] p-1 shadow-md border border-slate-200 dark:border-[#27272A] flex-shrink-0 overflow-hidden">
                  {user.profile_photo_url ? (
                    <img 
                      src={user.profile_photo_url.startsWith('http') ? user.profile_photo_url : `${user.profile_photo_url}`} 
                      alt={user.full_name} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center text-xl border border-slate-200 dark:border-zinc-700">
                      {getInitials(user.full_name)}
                    </div>
                  )}
                </div>

                {/* Upload overlay button */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                >
                  <Camera className="w-3 h-3" />
                </button>

                {user.profile_photo_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    className="absolute top-0 right-0 p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remove profile photo"
                    aria-label="Remove profile photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{user.full_name}</h2>
                <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                  ID: {user.roll_number || user.employee_id || `ID-${user.id}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <a
                href={role === 'student' ? '/student/dashboard' : (role === 'faculty' ? '/faculty/dashboard' : '/admin/dashboard')}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-all shadow-xs inline-flex items-center gap-1.5 erp-button"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#18181B] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-700 dark:text-zinc-300 hover:text-rose-700 dark:hover:text-rose-400 border border-slate-200 dark:border-[#27272A] hover:border-rose-200 dark:hover:border-rose-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5 erp-button cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Academic Details Grid */}
          <div className="border-t border-slate-100 dark:border-[#27272A] pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-4 font-mono">
              Institutional Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                  <UserIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Full Name</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.full_name}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                  <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">{role === 'student' ? 'Roll Number' : (role === 'faculty' ? 'Employee ID' : 'Admin ID')}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                  {user.roll_number || user.employee_id || `ADM-${user.id.toString().padStart(4, '0')}`}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Institutional Email</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.email}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Department / Program</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user.department || 'General Academic Department'}
                </p>
              </div>

              {role === 'student' && (
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">Academic Semester</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user.semester ? `Semester ${user.semester}` : 'Enrolled'}
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium">Enrollment Status</span>
                </div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active / Good Standing
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Academic Session</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {new Date().getFullYear()}–{new Date().getFullYear() + 1} Academic Session
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A]">
                <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">System</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  AttendanceAI ERP
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Account Security / Change Password Section */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#27272A]">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security &amp; Password</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Update your institutional account credentials</p>
          </div>
        </div>

        {pwSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Current Password</label>
            <input 
              type="password" 
              required 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white dark:bg-[#18181B] border border-slate-300 dark:border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">New Password</label>
              <input 
                type="password" 
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-white dark:bg-[#18181B] border border-slate-300 dark:border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-white dark:bg-[#18181B] border border-slate-300 dark:border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer erp-button"
            >
              {pwLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
