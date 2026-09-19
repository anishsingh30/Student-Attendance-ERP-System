import React, { useState, ReactNode, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPath: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentPath }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('attendance_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('attendance_sidebar_collapsed', String(next));
      } catch {
        // Ignore localStorage error
      }
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-black text-[#111827] dark:text-white flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
      <Navbar 
        onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} 
        isMobileOpen={isMobileOpen}
        isSidebarCollapsed={isCollapsed}
        onToggleSidebar={toggleCollapse}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          currentPath={currentPath} 
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          isMobileOpen={isMobileOpen} 
          onCloseMobile={() => setIsMobileOpen(false)} 
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};
