import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  PanelLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Tooltip } from '../common/Tooltip';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  onMenuToggle?: () => void;
  isMobileOpen?: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onMenuToggle, 
  isMobileOpen,
  isSidebarCollapsed = false,
  onToggleSidebar
}) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#050505] border-b border-slate-200 dark:border-[#262626] shadow-xs transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left: Sidebar Toggle & Institutional Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          {onToggleSidebar && (
            <Tooltip content={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} position="bottom">
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            </Tooltip>
          )}

          <div className="hidden sm:block">
            <span className="text-xs font-semibold text-slate-900 dark:text-[#F5F5F5] tracking-tight">
              Apex Institute of Technology
            </span>
            <span className="mx-2 text-slate-300 dark:text-[#303030]">|</span>
            <span className="text-xs text-slate-500 dark:text-[#A3A3A3]">
              Student Attendance ERP System
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle, Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Global Light/Dark Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <Tooltip content="Notifications" position="bottom">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-600 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label="View notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-[#262626] bg-white dark:bg-[#111111] shadow-xl p-4 z-50 animate-fade-in text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262626]">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F5F5F5]">Alerts &amp; Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200 dark:border-blue-800/60">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-[#262626]">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 dark:text-[#737373] text-xs font-medium">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`pt-2.5 pb-2 px-2 flex items-start gap-2.5 cursor-pointer rounded-lg transition-colors ${
                          n.is_read ? 'opacity-65 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-[#171717]' : 'bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {n.notification_type === 'CRITICAL' ? (
                            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          ) : n.notification_type === 'WARNING' ? (
                            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          ) : n.notification_type === 'RECOVERY' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{n.title}</p>
                          <p className="text-[11px] text-slate-600 dark:text-[#A3A3A3] line-clamp-2 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 dark:text-[#737373] mt-1 block font-medium">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 mt-1 flex-shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          {user ? (
            <div className="relative pl-2 border-l border-slate-200 dark:border-[#262626]" ref={userRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#141414] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 group"
                aria-expanded={showUserDropdown}
                aria-label="User account menu"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-xs font-bold shadow-xs overflow-hidden">
                  {user.profile_photo_url ? (
                    <img 
                      src={user.profile_photo_url} 
                      alt={user.full_name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    getInitials(user.full_name)
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.full_name}
                  </p>
                  <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-[#A3A3A3]">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373] hidden sm:block" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#262626] shadow-xl py-1.5 z-50 animate-fade-in text-slate-800 dark:text-slate-200">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-[#262626]">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.full_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <a
                      href="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-50 dark:hover:bg-[#171717] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-[#A3A3A3]" />
                      <span>Academic Profile</span>
                    </a>
                  </div>
                  <div className="border-t border-slate-100 dark:border-[#262626] pt-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-all shadow-xs"
            >
              Sign In
            </a>
          )}

        </div>
      </div>
    </header>
  );
};

