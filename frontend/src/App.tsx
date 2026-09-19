import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { WhatIfSimulator } from './pages/student/WhatIfSimulator';
import { StudentAI } from './pages/student/StudentAI';
import { StudentAlerts } from './pages/student/StudentAlerts';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { AttendanceManagement } from './pages/faculty/AttendanceManagement';
import { StudentRoster } from './pages/faculty/StudentRoster';
import { FacultyAnalytics } from './pages/faculty/FacultyAnalytics';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AgentMonitoring } from './pages/admin/AgentMonitoring';
import { ThresholdSettings } from './pages/admin/ThresholdSettings';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { UserManagement } from './pages/admin/UserManagement';
import { SubjectManagement } from './pages/admin/SubjectManagement';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSystemConfig } from './pages/admin/AdminSystemConfig';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { FacultyReports } from './pages/faculty/FacultyReports';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForceChangePasswordPage } from './pages/ForceChangePasswordPage';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept normal anchor tag clicks for SPA transitions
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.getAttribute('href')?.startsWith('/') && !target.getAttribute('target')) {
        const href = target.getAttribute('href')!;
        if (href !== window.location.pathname) {
          e.preventDefault();
          window.history.pushState({}, '', href);
          setCurrentPath(href.split('?')[0]);
        }
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Initializing AttendanceAI Portal...</p>
        </div>
      </div>
    );
  }

  // Public Landing and Login
  if (currentPath === '/' && !user) {
    return <LandingPage />;
  }

  if (currentPath === '/login') {
    return <LoginPage />;
  }

  if (currentPath === '/register') {
    return <RegisterPage />;
  }

  // Redirect unauthenticated to login
  if (!user) {
    return <LoginPage />;
  }

  // Mandatory force password change guard
  if (user.must_change_password) {
    return <ForceChangePasswordPage />;
  }

  const cleanPath = currentPath.split('?')[0];

  // Route resolver
  let pageComponent = null;

  switch (cleanPath) {
    case '/':
      // If authenticated and visiting /, send to appropriate role dashboard
      if (user.role === 'student') pageComponent = <StudentDashboard />;
      else if (user.role === 'faculty') pageComponent = <FacultyDashboard />;
      else pageComponent = <AdminDashboard />;
      break;

    // Student Routes
    case '/student/dashboard':
      pageComponent = <StudentDashboard />;
      break;
    case '/student/attendance':
      pageComponent = <StudentAttendance />;
      break;
    case '/student/simulator':
      pageComponent = <WhatIfSimulator />;
      break;
    case '/student/ai':
      pageComponent = <StudentAI />;
      break;
    case '/student/alerts':
      pageComponent = <StudentAlerts />;
      break;

    // Faculty Routes
    case '/faculty/dashboard':
      pageComponent = <FacultyDashboard />;
      break;
    case '/faculty/attendance':
      pageComponent = <AttendanceManagement />;
      break;
    case '/faculty/students':
      pageComponent = <StudentRoster />;
      break;
    case '/faculty/analytics':
      pageComponent = <FacultyAnalytics />;
      break;
    case '/faculty/reports':
      pageComponent = <FacultyReports />;
      break;

    // Admin Routes
    case '/admin/dashboard':
      pageComponent = <AdminDashboard />;
      break;
    case '/admin/agent':
      pageComponent = <AgentMonitoring />;
      break;
    case '/admin/reports':
      pageComponent = <AdminReports />;
      break;
    case '/admin/config':
      pageComponent = <AdminSystemConfig />;
      break;
    case '/admin/notifications':
      pageComponent = <AdminNotifications />;
      break;
    case '/admin/settings':
      pageComponent = <ThresholdSettings />;
      break;
    case '/admin/audit':
      pageComponent = <AuditLogsPage />;
      break;
    case '/admin/users':
      pageComponent = <UserManagement />;
      break;
    case '/admin/subjects':
      pageComponent = <SubjectManagement />;
      break;

    // Profile Route
    case '/profile':
    case '/student/profile':
      pageComponent = <ProfilePage />;
      break;

    default:

      // Fallback redirect to user's home dashboard
      if (user.role === 'student') pageComponent = <StudentDashboard />;
      else if (user.role === 'faculty') pageComponent = <FacultyDashboard />;
      else pageComponent = <AdminDashboard />;
      break;
  }

  return (
    <DashboardLayout currentPath={cleanPath}>
      {pageComponent}
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

