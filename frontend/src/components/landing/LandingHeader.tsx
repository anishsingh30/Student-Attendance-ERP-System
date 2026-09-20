import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowRight, 
  Menu, 
  X, 
  Shield, 
  GraduationCap, 
  Users,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';

export const LandingHeader: React.FC = () => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardHref = () => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'faculty') return '/faculty/dashboard';
    return '/admin/dashboard';
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Portals', href: '#portals' },
    { name: 'Architecture', href: '#intelligence' },
    { name: 'Security', href: '#security' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetElement = document.querySelector(href);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#27272A] shadow-sm py-2.5' 
          : 'bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-[#27272A] py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo & Institution Info */}
        <a 
          href="/" 
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-0.5"
          aria-label="AttendanceAI Home"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Attendance<span className="text-blue-600">AI</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                ERP
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block leading-none mt-0.5">
              Student Attendance ERP System
            </span>
          </div>
        </a>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-[#18181B] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Actions: Theme Toggle & Portal Login */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <a
              href={getDashboardHref()}
              className="erp-btn erp-btn-primary erp-link px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Access ERP Portal</span>
              <ArrowRight className="w-3.5 h-3.5 erp-arrow" aria-hidden="true" />
            </a>
          ) : (
            <a
              href="/login"
              className="erp-btn erp-btn-primary erp-link px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ERP Portal Login</span>
              <ArrowRight className="w-3.5 h-3.5 erp-arrow" aria-hidden="true" />
            </a>
          )}
        </div>

        {/* Mobile Hamburger & Controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />

          {user ? (
            <a
              href={getDashboardHref()}
              className="erp-btn erp-btn-primary erp-link px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1"
            >
              <span>Portal</span>
              <ArrowRight className="w-3 h-3 erp-arrow" />
            </a>
          ) : (
            <a
              href="/login"
              className="erp-btn erp-btn-primary erp-link px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1"
            >
              <span>Login</span>
              <ArrowRight className="w-3 h-3 erp-arrow" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181B] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#09090B] px-4 pt-3 pb-5 shadow-lg animate-fade-in">
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-[#18181B] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#27272A] flex flex-col gap-2">
              <a
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold erp-button"
              >
                <span>Access University Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

