import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Calculator, 
  MessageSquareText, 
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
  Settings,
  X
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

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
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

  const studentSections: NavSection[] = [
    {
      title: 'Navigation',
      items: [
        { name: 'Overview', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
        { name: 'What-If Simulation', path: '/student/simulator', icon: Calculator },
        { name: 'Alerts', path: '/student/alerts', icon: BellRing },
        { name: 'Advisory', path: '/student/ai', icon: MessageSquareText },
      ]
    }
  ];

  const facultySections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { name: 'Overview', path: '/faculty/dashboard', icon: LayoutDashboard },
        { name: 'Attendance Operations', path: '/faculty/attendance', icon: FileSpreadsheet },
        { name: 'Students', path: '/faculty/students', icon: Users },
        { name: 'Analytics', path: '/faculty/analytics', icon: Activity },
        { name: 'Reports', path: '/faculty/reports', icon: FileText },
      ]
    }
  ];

  const adminSections: NavSection[] = [
    {
      title: 'Institutional Control',
      items: [
        { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
        { name: 'Attendance & Compliance', path: '/admin/settings', icon: Sliders },
        { name: 'Evaluation Engine', path: '/admin/agent', icon: Activity },
        { name: 'Notifications', path: '/admin/notifications', icon: BellRing },
        { name: 'Reports', path: '/admin/reports', icon: FileText },
        { name: 'Audit Logs', path: '/admin/audit', icon: History },
        { name: 'System Configuration', path: '/admin/config', icon: Settings },
      ]
    }
  ];

  const sections = role === 'student' ? studentSections : (role === 'faculty' ? facultySections : adminSections);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090B] text-slate-800 dark:text-zinc-200 overflow-x-hidden transition-colors duration-150">
      
      {/* Institutional Branding Header */}
      <div className={`flex items-center h-14 border-b border-slate-200 dark:border-[#27272A] transition-all duration-150 ${
        isCollapsed ? 'justify-center px-1' : 'justify-between px-3.5'
      }`}>
        {!isCollapsed ? (
          <>
            <a href="/" className="flex items-center gap-2.5 min-w-0" title="AttendanceAI - Student Attendance ERP System">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xs font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-none truncate">
                  AttendanceAI
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                  University Attendance ERP
                </p>
              </div>
            </a>

            {onToggleCollapse && (
              <Tooltip content="Collapse sidebar" position="bottom">
                <button
                  onClick={onToggleCollapse}
                  className="hidden md:flex items-center justify-center w-6 h-6 rounded text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-[#18181B] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </Tooltip>
            )}

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden flex items-center justify-center w-7 h-7 rounded-md text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-[#18181B] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center">
            {onToggleCollapse ? (
              <Tooltip content="Expand sidebar" position="right">
                <button
                  onClick={onToggleCollapse}
                  className="relative w-8 h-8 rounded-md bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label="Expand sidebar"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 flex items-center justify-center shadow-xs">
                    <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </button>
              </Tooltip>
            ) : (
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Context Card in Sidebar */}
      <div className="pt-3 pb-2 border-b border-slate-200 dark:border-[#27272A] relative overflow-visible flex-shrink-0" ref={profileMenuRef}>
        {!isCollapsed ? (
          <div className="px-3">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-2 rounded-md bg-slate-50 dark:bg-[#121215] hover:bg-slate-100 dark:hover:bg-[#18181B] border border-slate-200 dark:border-[#27272A] cursor-pointer transition-colors group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowProfileMenu(!showProfileMenu);
                }
              }}
              aria-expanded={showProfileMenu}
              aria-label="User profile menu"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs border border-blue-200 dark:border-blue-900/40 shadow-xs overflow-hidden">
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
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#09090B] pointer-events-none" title="Active" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {user.roll_number || user.employee_id || user.email}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                    {user.department || (role === 'admin' ? 'Administration' : 'Academic Dept')} {user.semester ? `• Sem ${user.semester}` : ''}
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
                className="relative w-8 h-8 rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 group"
                aria-expanded={showProfileMenu}
                aria-label="User profile options"
              >
                <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs border border-blue-200 dark:border-blue-900/40 shadow-xs overflow-hidden">
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
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#09090B] pointer-events-none" />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Profile Popover Menu */}
        {showProfileMenu && (
          <div 
            className={`absolute z-50 bg-white dark:bg-[#121215] rounded-lg border border-slate-200 dark:border-[#27272A] shadow-lg py-1.5 w-52 animate-fade-in text-slate-800 dark:text-zinc-200 ${
              isCollapsed ? 'left-full top-2 ml-2' : 'left-3 right-3 top-full mt-1'
            }`}
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#27272A]">
              <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{user.full_name}</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
              <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                {role} account
              </span>
            </div>
            <div className="py-1">
              <a
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#18181B] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setShowProfileMenu(false)}
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Account Profile</span>
              </a>
            </div>
            <div className="border-t border-slate-100 dark:border-[#27272A] pt-1">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Categorized Navigation List */}
      <nav className="flex-1 px-2.5 py-2.5 space-y-3 overflow-y-auto overflow-x-hidden" aria-label="Sidebar navigation">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            {!isCollapsed && (
              <p className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {section.title}
              </p>
            )}
            {section.items.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;

              const itemContent = (
                <a
                  href={link.path}
                  onClick={onCloseMobile}
                  title={isCollapsed ? link.name : undefined}
                  className={`flex items-center rounded-md text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    isCollapsed 
                      ? 'justify-center w-8 h-8 p-0 mx-auto' 
                      : 'justify-between px-2.5 py-2'
                  } ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-600'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#18181B] hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-zinc-400'}`} />
                    {!isCollapsed && <span className="truncate">{link.name}</span>}
                  </div>
                  {!isCollapsed && link.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      {link.badge}
                    </span>
                  )}
                </a>
              );

              return isCollapsed ? (
                <Tooltip key={link.path} content={link.name} position="right">
                  {itemContent}
                </Tooltip>
              ) : (
                <div key={link.path}>{itemContent}</div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Institutional Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-[#27272A] bg-slate-50/50 dark:bg-[#0C0C0E] text-[11px] text-slate-500 dark:text-zinc-400">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">v1.0 • ERP Core</span>
            <button
              onClick={() => {
                onCloseMobile?.();
                logout();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Sign out of AttendanceAI"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Tooltip content="Sign Out" position="right">
              <button
                onClick={() => {
                  onCloseMobile?.();
                  logout();
                }}
                className="p-1.5 rounded-md text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-[#18181B] transition-colors"
                aria-label="Sign Out"
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
        className={`hidden md:block fixed top-0 left-0 bottom-0 z-30 border-r border-slate-200 dark:border-[#27272A] transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
