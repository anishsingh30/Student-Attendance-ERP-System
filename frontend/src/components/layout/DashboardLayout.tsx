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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090B] text-slate-900 dark:text-zinc-100 antialiased selection:bg-blue-100 selection:text-blue-900 transition-colors duration-150">
      <Sidebar 
        currentPath={currentPath} 
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen} 
        onCloseMobile={() => setIsMobileOpen(false)} 
      />
      
      <div className={`flex flex-col min-h-screen transition-all duration-200 ${
        isCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}>
        <Navbar 
          onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} 
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={toggleCollapse}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
