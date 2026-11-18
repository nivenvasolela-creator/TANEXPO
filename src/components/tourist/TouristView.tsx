import React, { Suspense, lazy, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  Bell,
  Heart,
  Scale,
  SlidersHorizontal,
  Map as MapIcon
} from 'lucide-react';
import { TouristHome } from './TouristHome';
import { ErrorBoundary } from '../ErrorBoundary';

const MyRequestsView = lazy(() =>
  import('./MyRequestsView').then((m) => ({ default: m.MyRequestsView }))
);
const TouristMapView = lazy(() =>
  import('./TouristMapView').then((m) => ({ default: m.TouristMapView }))
);
const SavedProvidersView = lazy(() =>
  import('./SavedProvidersView').then((m) => ({ default: m.SavedProvidersView }))
);
const ComplianceInfoView = lazy(() =>
  import('./ComplianceInfoView').then((m) => ({ default: m.ComplianceInfoView }))
);
const ProviderDetailModal = lazy(() =>
  import('./ProviderDetailModal').then((m) => ({ default: m.ProviderDetailModal }))
);
const BookingRequestModal = lazy(() =>
  import('./BookingRequestModal').then((m) => ({ default: m.BookingRequestModal }))
);
const BookingVoucherModal = lazy(() =>
  import('./BookingVoucherModal').then((m) => ({ default: m.BookingVoucherModal }))
);
const PlaceDetailModal = lazy(() =>
  import('./PlaceDetailModal').then((m) => ({ default: m.PlaceDetailModal }))
);
const CompareModal = lazy(() =>
  import('./CompareModal').then((m) => ({ default: m.CompareModal }))
);
const CheckoutModal = lazy(() =>
  import('./CheckoutModal').then((m) => ({ default: m.CheckoutModal }))
);
const WriteReviewModal = lazy(() =>
  import('./WriteReviewModal').then((m) => ({ default: m.WriteReviewModal }))
);

const TabFallback: React.FC = () => (
  <div className="rounded-3xl bg-white dark:bg-[#152019] border border-[#E8DFC9] dark:border-[#23352A] p-8 text-center text-xs text-[#6B7A72] dark:text-[#8DA195]">
    Loading section...
  </div>
);

export const TouristView: React.FC = () => {
  const {
    touristTab,
    setTouristTab,
    leads,
    savedProviderIds,
    comparedProviderIds,
    isCompareModalOpen,
    setIsCompareModalOpen,
    selectedProvider,
    inquiryPackage,
    activeVoucher,
    selectedDestination,
    checkoutLead,
    reviewingBooking,
    t
  } = useApp();

  // A new tab starts at the top instead of keeping the previous tab's scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [touristTab]);

  const negotiatingCount = leads.filter((l) => l.status === 'Negotiating').length;
  const requestsCount = leads.length;
  const savedCount = savedProviderIds.length;

  return (
    <div className="space-y-6">
      {/* Desktop Top Tourist Tabs */}
      <div className="hidden md:flex items-center justify-between gap-4 border-b border-[#E8DFC9] dark:border-[#23352A] pb-3 transition-colors">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTouristTab('explore')}
            className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'explore'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t('explore.tours', 'Explore Tours & Guides')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTouristTab('map')}
            className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'map'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>{t('nav.map', 'Map')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTouristTab('requests')}
            className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'requests'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <Bell className="w-4 h-4 text-[#D97843]" />
            <span>{t('my.requests', 'My Requests')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                touristTab === 'requests'
                  ? 'bg-[#D97843] text-white'
                  : 'bg-[#EAF3EC] dark:bg-[#12281D] text-[#284435] dark:text-[#A3E6C0]'
              }`}
            >
              {requestsCount}
            </span>
            {negotiatingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D97843]" title="Quote ready" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTouristTab('saved')}
            className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'saved'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <Heart className="w-4 h-4 text-red-500" />
            <span>{t('saved', 'Saved')} ({savedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTouristTab('compliance')}
            className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'compliance'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{t('laws', 'TZS & Licensing Laws')}</span>
          </button>
        </div>

        {comparedProviderIds.length > 0 && (
          <button
            type="button"
            onClick={() => setIsCompareModalOpen(true)}
            className="min-h-[40px] flex items-center gap-1.5 text-xs font-bold text-[#284435] dark:text-[#EDF3EF] bg-white dark:bg-[#152019] hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] px-3 py-1.5 rounded-xl border border-[#DED5C6] dark:border-[#23352A] cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D97843]" />
            <span>{t('compare', 'Compare')} ({comparedProviderIds.length})</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <ErrorBoundary fallbackTitle="View failed to load">
        <Suspense fallback={<TabFallback />}>
          {touristTab === 'explore' && <TouristHome />}
          {touristTab === 'map' && <TouristMapView />}
          {touristTab === 'requests' && <MyRequestsView />}
          {touristTab === 'saved' && <SavedProvidersView />}
          {touristTab === 'compliance' && <ComplianceInfoView />}
        </Suspense>
      </ErrorBoundary>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Tourist mobile navigation"
        className="md:hidden fixed inset-x-3 bottom-floating z-30 glass glass-capsule rounded-[30px] border"
      >
        <div className="grid grid-cols-5 gap-1 px-1.5 py-1.5">
          <button
            type="button"
            onClick={() => setTouristTab('explore')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-bold transition-all cursor-pointer ${
              touristTab === 'explore'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t('nav.explore', 'Explore')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTouristTab('map')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-bold transition-all cursor-pointer ${
              touristTab === 'map'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>{t('nav.map', 'Map')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTouristTab('requests')}
            className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-bold transition-all cursor-pointer ${
              touristTab === 'requests'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <div className="relative">
              <Bell className="w-4 h-4" />
              {requestsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D97843] text-white text-[9px] font-bold flex items-center justify-center">
                  {requestsCount}
                </span>
              )}
            </div>
            <span>{t('nav.requests', 'Requests')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTouristTab('saved')}
            className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-bold transition-all cursor-pointer ${
              touristTab === 'saved'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <div className="relative">
              <Heart className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#284435] dark:bg-[#E8B94A] text-white dark:text-[#1C2C24] text-[9px] font-bold flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </div>
            <span>{t('saved', 'Saved')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTouristTab('compliance')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-bold transition-all cursor-pointer ${
              touristTab === 'compliance'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{t('nav.laws', 'Laws')}</span>
          </button>
        </div>
      </nav>

      {/* Conditionally Mounted Lazy Modal Overlays */}
      <ErrorBoundary fallbackTitle="Dialog failed to load">
        <Suspense fallback={null}>
          {selectedProvider && <ProviderDetailModal />}
          {inquiryPackage && <BookingRequestModal />}
          {activeVoucher && <BookingVoucherModal />}
          {selectedDestination && <PlaceDetailModal />}
          {isCompareModalOpen && comparedProviderIds.length > 0 && <CompareModal />}
          {checkoutLead && <CheckoutModal />}
          {reviewingBooking && <WriteReviewModal />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
