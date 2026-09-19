import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark/light theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      onClick={toggleTheme}
      className={`w-16 h-8 rounded-full border transition-colors duration-200 relative flex items-center justify-between px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
        isDark 
          ? 'bg-[#18181B] border-[#27272A] focus-visible:ring-offset-black' 
          : 'bg-slate-200 border-slate-300 focus-visible:ring-offset-white'
      } ${className}`}
    >
      {/* Sun Icon (Left) */}
      <Sun 
        className={`w-4 h-4 z-0 transition-opacity duration-200 ${
          isDark ? 'opacity-30 text-slate-400' : 'opacity-100 text-amber-500'
        }`} 
        aria-hidden="true" 
      />

      {/* Moon Icon (Right) */}
      <Moon 
        className={`w-4 h-4 z-0 transition-opacity duration-200 ${
          isDark ? 'opacity-100 text-indigo-400' : 'opacity-30 text-slate-400'
        }`} 
        aria-hidden="true" 
      />

      {/* Sliding Knob */}
      <span
        aria-hidden="true"
        className={`w-6 h-6 rounded-full bg-white shadow-xs absolute top-[3px] left-[3px] transition-transform duration-200 ease-out transform ${
          isDark ? 'translate-x-8' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
