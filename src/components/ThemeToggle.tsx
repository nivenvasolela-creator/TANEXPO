import React from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        title={isDark ? 'Switch to Light Safari Mode' : 'Switch to Dark Serengeti Mode'}
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 cursor-pointer border hover:scale-110 active:scale-95 group ${
          isDark
            ? 'bg-[#192A20] hover:bg-[#21382A] text-[#E8B94A] border-[#2E4537] ring-1 ring-[#E8B94A]/20 shadow-black/40'
            : 'bg-[#284435] hover:bg-[#1E332A] text-[#E8B94A] border-white/20 shadow-stone-800/30'
        }`}
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-[#E8B94A] transition-transform duration-500 group-hover:rotate-90" />
        ) : (
          <Moon className="w-5 h-5 text-[#E8B94A] transition-transform duration-500 group-hover:-rotate-12" />
        )}
      </button>
    </div>
  );
};
