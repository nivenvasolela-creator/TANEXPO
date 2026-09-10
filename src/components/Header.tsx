import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Compass, 
  Briefcase, 
  Bell,
  SlidersHorizontal,
  User as UserIcon,
  LogOut,
  Sparkles,
  ChevronDown,
  Settings2,
  Languages,
  Coins,
  RotateCcw,
  ShieldCheck,
  Check,
  Sun,
  Moon
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentView,
    leads,
    showUSDApprox,
    setShowUSDApprox,
    resetAllData,
    touristTab,
    setTouristTab,
    setProviderTab,
    language,
    setLanguage,
    comparedProviderIds,
    setIsCompareModalOpen,
    currentUser,
    startOnboarding,
    logout,
    isDomesticTourist,
    isGuest,
    theme,
    toggleTheme,
    t
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const preferencesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (preferencesRef.current && !preferencesRef.current.contains(event.target as Node)) {
        setIsPreferencesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Logo Click: stays strictly in the user's role space
  const handleLogoClick = () => {
    if (currentView === 'tourist') {
      setTouristTab('explore');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setProviderTab('overview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 dark:bg-[#0D1511]/95 backdrop-blur-md border-b border-[#E7DFD3] dark:border-[#23352A] shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Workspace Indicator */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleLogoClick}
            className="cursor-pointer group flex items-center gap-2.5 bg-transparent border-none p-0 focus:outline-hidden"
            title={currentView === 'tourist' ? 'Explore Tanzania' : 'Provider Dashboard'}
          >
            {/* Minimalist Tanexpo Favicon Badge */}
            <div className="w-9 h-9 rounded-xl bg-[#284435] flex items-center justify-center text-[#E8B94A] shadow-xs group-hover:bg-[#1E332A] dark:group-hover:bg-[#20362B] transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-[#284435] dark:text-[#EDF3EF]">
              TAN<span className="text-[#D97843]">EXPO</span>
            </span>
          </button>

          {/* Strict Role Workspace Pill */}
          <div className="hidden sm:flex items-center">
            {currentView === 'tourist' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#152019] border border-[#E8DFC9] dark:border-[#23352A] text-xs font-semibold text-[#284435] dark:text-[#E2ECE5] shadow-2xs">
                <Compass className="w-3.5 h-3.5 text-[#D97843]" />
                <span>Explorer</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#284435] dark:bg-[#1F3327] text-white text-xs font-semibold shadow-2xs border border-transparent dark:border-[#2E4537]">
                <Briefcase className="w-3.5 h-3.5 text-[#E8B94A]" />
                <span>Operator OS</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Comparison Action (Traveler Only) */}
          {comparedProviderIds.length > 0 && currentView === 'tourist' && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8B94A] hover:bg-[#D4A335] text-[#1C2C24] text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Compare ({comparedProviderIds.length})</span>
            </button>
          )}

          {/* Tourist My Requests Tab Button */}
          {currentView === 'tourist' && (
            <button
              onClick={() => setTouristTab('requests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                touristTab === 'requests'
                  ? 'bg-[#284435] dark:bg-[#1F3327] text-white border-[#284435] dark:border-[#2E4537]'
                  : 'bg-white dark:bg-[#152019] text-[#284435] dark:text-[#E2ECE5] border-[#DED5C6] dark:border-[#23352A] hover:bg-[#F3EFE6] dark:hover:bg-[#1A2820]'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-[#D97843]" />
              <span className="hidden xs:inline">{t('tab.requests', 'My Requests')}</span>
              {leads.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#D97843] text-white text-[10px] font-bold">
                  {leads.length}
                </span>
              )}
            </button>
          )}

          {/* Direct Dark Mode Toggle Button (Icon only, no words) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            title={theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
            className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-[#DED5C6] dark:border-[#23352A] bg-white dark:bg-[#152019] text-[#52645A] dark:text-[#E8B94A] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-zinc-50 dark:hover:bg-[#1A2820] transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#E8B94A] transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-[#284435] transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Preferences / System Settings Popover (Stores Currency, Language, Reset, Compliance cleanly inside) */}
          <div className="relative" ref={preferencesRef}>
            <button
              type="button"
              onClick={() => {
                setIsPreferencesOpen(!isPreferencesOpen);
                setIsUserMenuOpen(false);
              }}
              aria-label="System Preferences"
              title="Preferences (Currency, Language, Legal & Reset)"
              className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                isPreferencesOpen
                  ? 'bg-[#284435] dark:bg-[#1F3327] text-white border-[#284435] dark:border-[#2E4537]'
                  : 'bg-white dark:bg-[#152019] text-[#52645A] dark:text-[#9DB0A4] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] border-[#DED5C6] dark:border-[#23352A] hover:bg-zinc-50 dark:hover:bg-[#1A2820]'
              }`}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {isPreferencesOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#152019] rounded-2xl shadow-xl border border-[#D9CEBF] dark:border-[#23352A] p-3.5 z-50 text-xs animate-fade-in space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#E8DFC9] dark:border-[#23352A] pb-2.5">
                  <span className="font-bold text-[#1F2A24] dark:text-[#EDF3EF] text-xs uppercase tracking-wider">Preferences</span>
                  <span className="text-[10px] text-[#6B7A72] dark:text-[#8DA195]">TANEXPO System</span>
                </div>

                {/* Language Switcher */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#52645A] dark:text-[#B5C5BC] flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-[#D97843]" />
                    Language
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        language === 'en'
                          ? 'bg-[#284435] dark:bg-[#1F3327] text-white border-[#284435] dark:border-[#2E4537]'
                          : 'bg-[#FAF7F2] dark:bg-[#0D1511] text-[#52645A] dark:text-[#B5C5BC] border-[#E8DFC9] dark:border-[#23352A] hover:bg-[#F3EFE6] dark:hover:bg-[#1A2820]'
                      }`}
                    >
                      <span>🇬🇧 English</span>
                      {language === 'en' && <Check className="w-3 h-3 text-[#E8B94A]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('sw')}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        language === 'sw'
                          ? 'bg-[#284435] dark:bg-[#1F3327] text-white border-[#284435] dark:border-[#2E4537]'
                          : 'bg-[#FAF7F2] dark:bg-[#0D1511] text-[#52645A] dark:text-[#B5C5BC] border-[#E8DFC9] dark:border-[#23352A] hover:bg-[#F3EFE6] dark:hover:bg-[#1A2820]'
                      }`}
                    >
                      <span>🇹🇿 Kiswahili</span>
                      {language === 'sw' && <Check className="w-3 h-3 text-[#E8B94A]" />}
                    </button>
                  </div>
                </div>

                {/* Currency Display Toggle */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#52645A] dark:text-[#B5C5BC] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#E8B94A]" />
                    Currency Display
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowUSDApprox(!showUSDApprox)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0D1511] hover:bg-[#F3EFE6] dark:hover:bg-[#1A2820] border border-[#E8DFC9] dark:border-[#23352A] text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-[#1F2A24] dark:text-[#EDF3EF] text-xs">
                        USD Estimates ({showUSDApprox ? 'Visible' : 'Hidden'})
                      </p>
                      <p className="text-[10px] text-[#6B7A72] dark:text-[#8DA195]">
                        Mandatory settlement remains in Tanzanian Shillings (TZS)
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      showUSDApprox ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {showUSDApprox ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                {/* Legal & BOT Compliance Info Box */}
                <div className="p-2.5 rounded-xl bg-[#EAF3EC] dark:bg-[#12281D] border border-[#CDE3D4] dark:border-[#1E3B29] space-y-1 text-[11px] text-[#1F2A24] dark:text-[#D2E9DA]">
                  <div className="flex items-center gap-1.5 font-bold text-[#284435] dark:text-[#A3E6C0]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Bank of Tanzania (BOT) Compliant</span>
                  </div>
                  <p className="text-[10px] text-[#4D5E55] dark:text-[#B5C5BC] leading-relaxed">
                    Tourism Act (No. 29 of 2008). All contracts and payments are legally invoiced and settled in Tanzanian Shillings (TZS).
                  </p>
                </div>

                {/* Reset State Action */}
                <div className="pt-1 border-t border-[#E8DFC9] dark:border-[#23352A]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreferencesOpen(false);
                      resetAllData();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-[#8C3A27] dark:text-[#F08C75] hover:bg-[#FAF0E9] dark:hover:bg-[#2A1D17] transition-colors cursor-pointer border border-transparent hover:border-[#EBD0BC] dark:hover:border-[#4A2D22]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo State</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Account / Profile */}
          {currentUser && !isGuest ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsPreferencesOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-white dark:bg-[#152019] border border-[#DED5C6] dark:border-[#23352A] rounded-xl text-xs font-semibold text-[#1C2C24] dark:text-[#EDF3EF] hover:bg-zinc-50 dark:hover:bg-[#1A2820] cursor-pointer transition-colors shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-[#284435] dark:bg-[#1F3327] text-[#E8B94A] flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#152019] rounded-2xl shadow-xl border border-[#D9CEBF] dark:border-[#23352A] py-2 z-50 text-xs animate-fade-in">
                  <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-[#23352A]">
                    <p className="font-bold text-[#1C2C24] dark:text-[#EDF3EF] truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{currentUser.email || currentUser.phone || 'Active Session'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {currentUser.role === 'provider' 
                        ? 'Tour Operator' 
                        : (isDomesticTourist ? 'Domestic Tourist' : 'International Tourist')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      startOnboarding('role_select');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-[#1A2820] text-zinc-700 dark:text-[#EDF3EF] flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D97843]" />
                    <span>Switch Role / Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400 flex items-center gap-2 cursor-pointer border-t border-zinc-100 dark:border-[#23352A] mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startOnboarding('role_select')}
              className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-semibold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#E8B94A]" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
