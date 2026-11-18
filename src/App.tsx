import React, { Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { TouristView } from './components/tourist/TouristView';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineAndUpdateBanner } from './components/pwa/PWAControls';
import { ShieldCheck } from 'lucide-react';

const ProviderDashboard = React.lazy(() =>
  import('./components/provider/ProviderDashboard').then((m) => ({ default: m.ProviderDashboard }))
);

const LegalDocumentModal = React.lazy(() =>
  import('./components/legal/LegalDocumentModal').then((m) => ({ default: m.LegalDocumentModal }))
);

const ViewFallback: React.FC = () => (
  <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs text-[#6B7A72] dark:text-[#8DA195]">
    <div className="w-8 h-8 rounded-full border-2 border-[#D97843] border-t-transparent animate-spin" />
    <span>Loading workspace...</span>
  </div>
);

const PhotoCreditsModal = React.lazy(() =>
  import('./components/legal/PhotoCreditsModal').then((m) => ({ default: m.PhotoCreditsModal }))
);

const MainLayout: React.FC = () => {
  const [showPhotoCredits, setShowPhotoCredits] = useState(false);
  const closePhotoCredits = React.useCallback(() => setShowPhotoCredits(false), []);
  const { currentView, touristTab, isOnboardingOpen, activeLegalDoc, language, openLegalDoc } = useApp();

  // Sync <html lang> and SEO robots directive for private/dashboard routes
  useEffect(() => {
    document.documentElement.lang = language === 'sw' ? 'sw' : 'en';
  }, [language]);

  useEffect(() => {
    const isPrivateOrDashboard =
      currentView === 'provider' ||
      touristTab === 'requests' ||
      touristTab === 'saved' ||
      isOnboardingOpen;

    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = isPrivateOrDashboard ? 'noindex, nofollow' : 'index, follow';

    if (currentView === 'provider') {
      document.title = 'Operator OS — TANEXPO';
    } else if (activeLegalDoc === 'privacy') {
      document.title = 'Privacy Policy — TANEXPO';
    } else if (activeLegalDoc === 'terms') {
      document.title = 'Terms of Service — TANEXPO';
    } else {
      document.title = 'TANEXPO — Tanzania Tourism Marketplace & Operator OS';
    }
  }, [currentView, touristTab, isOnboardingOpen, activeLegalDoc]);

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] dark:bg-[#0D1511] text-[#1F2A24] dark:text-[#EDF3EF] flex flex-col font-sans transition-colors selection:bg-[#D97843]/20 selection:text-[#284435] dark:selection:text-[#E8B94A]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-28 md:pb-8">
        <ErrorBoundary fallbackTitle="We hit a snag loading this view">
          <Suspense fallback={<ViewFallback />}>
            {currentView === 'tourist' ? <TouristView /> : <ProviderDashboard />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Production Onboarding & First-Launch Experience Modal */}
      {isOnboardingOpen && (
        <ErrorBoundary fallbackTitle="Onboarding dialog encountered an error">
          <OnboardingFlow />
        </ErrorBoundary>
      )}

      {activeLegalDoc && (
        <ErrorBoundary fallbackTitle="Legal document viewer encountered an error">
          <Suspense fallback={null}>
            <LegalDocumentModal />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Offline Status & Service Worker Update Toast */}
      <OfflineAndUpdateBanner />

      {/* Floating Theme Toggle */}

      {/* Footer */}
      <footer className="bg-[#1C2C24] dark:bg-[#0A100D] text-[#E4DFD5] border-t border-[#2A3F33] dark:border-[#1A2820] py-10 pb-32 md:pb-10 mt-12 transition-colors">
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
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  openLegalDoc('privacy');
                }}
                className="min-h-[44px] inline-flex items-center hover:text-white underline cursor-pointer"
              >
                Privacy Policy (Draft)
              </a>
              <button
                type="button"
                onClick={() => setShowPhotoCredits(true)}
                className="min-h-[44px] inline-flex items-center hover:text-white underline cursor-pointer"
              >
                Photo credits
              </button>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  openLegalDoc('terms');
                }}
                className="min-h-[44px] inline-flex items-center hover:text-white underline cursor-pointer"
              >
                Terms of Service (Draft)
              </a>
              <span className="hidden md:inline">
                Built for Tanzania's local safari & tourism community
              </span>
            </div>
          </div>
        </div>
      </footer>
      {showPhotoCredits && (
        <Suspense fallback={null}>
          <PhotoCreditsModal onClose={closePhotoCredits} />
        </Suspense>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="TANEXPO encountered an unexpected error">
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
