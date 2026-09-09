import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { TouristView } from './components/tourist/TouristView';
import { ProviderDashboard } from './components/provider/ProviderDashboard';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { ThemeToggle } from './components/ThemeToggle';
import { ShieldCheck, Compass, Heart } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView } = useApp();

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0D1511] text-[#1F2A24] dark:text-[#EDF3EF] flex flex-col font-sans transition-colors selection:bg-[#D97843]/20 selection:text-[#284435] dark:selection:text-[#E8B94A]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {currentView === 'tourist' ? <TouristView /> : <ProviderDashboard />}
      </main>

      {/* Production Onboarding & First-Launch Experience Modal */}
      <OnboardingFlow />

      {/* Floating Theme Toggle (Bottom Right Corner) */}
      <ThemeToggle />

      {/* Footer */}
      <footer className="bg-[#1C2C24] dark:bg-[#0A100D] text-[#E4DFD5] border-t border-[#2A3F33] dark:border-[#1A2820] py-10 mt-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-2xl text-white">
                  TAN<span className="text-[#D97843]">EXPO</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Tanzania National Tourism OS
                </span>
              </div>
              <p className="text-xs text-[#BED0C5] max-w-md">
                Bridging licensed Tanzanian tour operators with global travelers through direct CRM management, dynamic quoting, and legal TZS currency settlement.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#BED0C5]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#E8B94A]" />
                <span>Tourism Act (No. 29 of 2008) Compliant</span>
              </div>
              <span>•</span>
              <div>
                <span>Bank of Tanzania (BOT) TZS Official Directive</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A9790]">
            <p>© {new Date().getFullYear()} TANEXPO Ltd. All rights reserved. Registered in Dar es Salaam & Arusha, United Republic of Tanzania.</p>
            <p className="flex items-center gap-1">
              Built with dedication for Tanzania's local safari & tourism community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
