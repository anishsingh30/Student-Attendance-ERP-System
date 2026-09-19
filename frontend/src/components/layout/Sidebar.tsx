import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Calculator, 
  Bot, 
  BellRing, 
  Users, 
  FileSpreadsheet, 
  Sliders, 
  History, 
  BookOpen, 
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  User as UserIcon,
  Shield,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../common/Tooltip';

interface SidebarProps {
  currentPath: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface SidebarLink {
  name: string;
  path: string;
  icon: any;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPath, 
  isCollapsed = false, 
  onToggleCollapse,
  isMobileOpen, 
  onCloseMobile 
}) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const role = user.role.toLowerCase();

  const studentLinks: SidebarLink[] = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Attendance History', path: '/student/attendance', icon: CalendarCheck },
    { name: 'What-If Simulator', path: '/student/simulator', icon: Calculator },
    { name: 'AI Assistant', path: '/student/ai', icon: Bot },
    { name: 'My Alerts', path: '/student/alerts', icon: BellRing },
  ];

  const facultyLinks: SidebarLink[] = [
    { name: 'Faculty Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'Attendance & CSV Import', path: '/faculty/attendance', icon: FileSpreadsheet },
    { name: 'Student Roster', path: '/faculty/students', icon: Users },
    { name: 'Class Analytics', path: '/faculty/analytics', icon: Activity },
    { name: 'Course Reports & CSV', path: '/faculty/reports', icon: FileText },
  ];

  const adminLinks: SidebarLink[] = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Agent Monitoring', path: '/admin/agent', icon: Bot },
    { name: 'Statutory Reports', path: '/admin/reports', icon: FileText },
    { name: 'System & Engine Config', path: '/admin/config', icon: Settings },
    { name: 'Notification Gateway', path: '/admin/notifications', icon: BellRing },
    { name: 'Threshold Settings', path: '/admin/settings', icon: Sliders },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Course Subjects', path: '/admin/subjects', icon: BookOpen },
    { name: 'System Audit Logs', path: '/admin/audit', icon: History },
  ];

  const links = role === 'student' ? studentLinks : (role === 'faculty' ? facultyLinks : adminLinks);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#050505] text-slate-800 dark:text-[#D4D4D4] overflow-x-hidden transition-colors duration-200">
      
      {/* Institutional Branding Header */}
      <div className={`flex items-center h-16 border-b border-slate-200 dark:border-[#262626] transition-all duration-200 ${
        isCollapsed ? 'justify-center px-1' : 'justify-between px-3'
      }`}>
        {!isCollapsed ? (
          <>
            <a href="/" className="flex items-center gap-2.5 min-w-0" title="Apex Institute of Technology - AttendanceAI">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-blue-600/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate">
                  AttendanceAI
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-[#A3A3A3] font-medium truncate mt-1">
                  Apex Institute of Tech
                </p>
              </div>
            </a>

            {/* Header Collapse Button */}
            {onToggleCollapse && (
              <Tooltip content="Collapse sidebar" position="bottom">
                <button
                  onClick={onToggleCollapse}
                  className="hidden md:flex items-center justify-center w-7 h-7 rounded-md text-slate-500 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] border border-slate-200 dark:border-[#262626] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center">
            {onToggleCollapse ? (
              <Tooltip content="Expand sidebar" position="right">
                <button
                  onClick={onToggleCollapse}
                  className="relative w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 group"
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-xs">
                    <ChevronRight className="w-2.5 h-2.5 text-slate-600 dark:text-[#A3A3A3]" />
                  </span>
                </button>
              </Tooltip>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-blue-600/20">
                <GraduationCap className="w-5 h-5" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Profile Section */}
      <div className="pt-4 pb-2 border-b border-slate-200 dark:border-[#262626] relative overflow-visible flex-shrink-0" ref={profileMenuRef}>
        {!isCollapsed ? (
          <div className="px-3">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#111111] hover:bg-slate-100 dark:hover:bg-[#161616] border border-slate-200 dark:border-[#262626] cursor-pointer transition-all duration-150 group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowProfileMenu(!showProfileMenu);
                }
              }}
              aria-expanded={showProfileMenu}
              aria-label="Student profile menu"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs border border-blue-200 dark:border-blue-800/60 shadow-xs overflow-hidden">
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
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black shadow-xs pointer-events-none" title="Active" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] font-mono text-slate-600 dark:text-[#A3A3A3] truncate mt-0.5">
                    {user.roll_number || user.employee_id || user.email}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-[#737373] truncate">
                    {user.department ? `${user.department}` : (role === 'admin' ? 'System Administration' : 'Academic Dept')} {user.semester ? `• Sem ${user.semester}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center px-2">
            <Tooltip content={`${user.full_name} • ${role.toUpperCase()}`} position="right">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 group"
                aria-expanded={showProfileMenu}
                aria-label="User profile options"
                title={user.full_name}
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs border border-blue-200 dark:border-blue-800/60 group-hover:ring-2 group-hover:ring-blue-400/40 shadow-xs overflow-hidden">
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
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black shadow-xs pointer-events-none" title="Active" />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Profile Popover Menu */}
        {showProfileMenu && (
          <div 
            className={`absolute z-50 bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#262626] shadow-xl py-2 w-56 animate-fade-in text-slate-800 dark:text-slate-200 ${
              isCollapsed ? 'left-full top-2 ml-2' : 'left-3 right-3 top-full mt-1.5'
            }`}
          >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-[#262626]">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.full_name}</p>
              <p className="text-[11px] text-slate-500 dark:text-[#A3A3A3] truncate">{user.email}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                {role} account
              </span>
            </div>
            <div className="py-1">
              <a
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-[#D4D4D4] hover:bg-slate-50 dark:hover:bg-[#171717] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setShowProfileMenu(false)}
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-[#A3A3A3]" />
                <span>Academic Profile</span>
              </a>
            </div>
            <div className="border-t border-slate-100 dark:border-[#262626] pt-1">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
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

      {/* Navigation List */}
      <nav className="flex-1 px-2 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden" aria-label="Sidebar navigation">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentPath === link.path;

          const itemContent = (
            <a
              href={link.path}
              onClick={onCloseMobile}
              title={isCollapsed ? link.name : undefined}
              className={`flex items-center rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                isCollapsed 
                  ? 'justify-center w-10 h-10 p-0 mx-auto' 
                  : 'justify-between px-3 py-2.5 hover:translate-x-0.5'
              } ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold border-l-3 border-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-[#D4D4D4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#141414]'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-[#A3A3A3] group-hover:text-slate-900 dark:group-hover:text-white'
                }`} />
                {!isCollapsed && <span className="truncate">{link.name}</span>}
              </div>

              {!isCollapsed && link.badge && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#171717] text-slate-600 dark:text-[#A3A3A3] border border-slate-200 dark:border-[#262626]">
                  {link.badge}
                </span>
              )}
            </a>
          );

          if (isCollapsed) {
            return (
              <div key={link.path} className="flex justify-center w-full">
                <Tooltip content={link.name} position="right">
                  {itemContent}
                </Tooltip>
              </div>
            );
          }

          return <div key={link.path}>{itemContent}</div>;
        })}
      </nav>

      {/* Footer, Collapse Toggle & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-[#262626] mt-auto bg-slate-50/50 dark:bg-[#080808] space-y-2">
        {onToggleCollapse && (
          <div className="flex justify-center">
            {isCollapsed ? (
              <Tooltip content="Expand sidebar" position="right">
                <button
                  onClick={onToggleCollapse}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] border border-slate-200 dark:border-[#262626] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-[#A3A3A3] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141414] border border-slate-200 dark:border-[#262626] transition-colors"
                aria-label="Collapse sidebar"
              >
                <span className="text-[11px] text-slate-500 dark:text-[#A3A3A3]">Collapse View</span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 dark:text-[#737373]" />
              </button>
            )}
          </div>
        )}

        {!isCollapsed ? (
          <div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-[#A3A3A3] hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-180 erp-button"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Tooltip content="Sign Out" position="right">
              <button
                onClick={logout}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-[#A3A3A3] hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-[#262626] hover:border-rose-200 dark:hover:border-rose-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label="Sign Out"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-[#262626] bg-white dark:bg-[#050505] min-h-[calc(100vh-4rem)] flex-shrink-0 transition-[width] duration-200 ease-in-out z-30 overflow-x-hidden ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in" role="dialog" aria-modal="true">
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#050505] border-r border-slate-200 dark:border-[#262626] shadow-2xl z-10 transition-transform duration-200 overflow-x-hidden">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
