import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, Bell, Heart, Scale, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { TouristHome } from './TouristHome';
import { MyRequestsView } from './MyRequestsView';
import { SavedProvidersView } from './SavedProvidersView';
import { ComplianceInfoView } from './ComplianceInfoView';
import { ProviderDetailModal } from './ProviderDetailModal';
import { BookingRequestModal } from './BookingRequestModal';
import { BookingVoucherModal } from './BookingVoucherModal';
import { PlaceDetailModal } from './PlaceDetailModal';
import { CompareModal } from './CompareModal';
import { CheckoutModal } from './CheckoutModal';
import { WriteReviewModal } from './WriteReviewModal';

export const TouristView: React.FC = () => {
  const { 
    touristTab, 
    setTouristTab, 
    leads, 
    savedProviderIds,
    comparedProviderIds,
    setIsCompareModalOpen,
    t 
  } = useApp();

  const negotiatingCount = leads.filter((l) => l.status === 'Negotiating').length;

  return (
    <div className="space-y-6">
      {/* Secondary Tourist Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-[#E8DFC9] dark:border-[#23352A] pb-3 transition-colors">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setTouristTab('explore')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'explore'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t('explore.tours', 'Explore Tours & Guides')}</span>
          </button>

          <button
            onClick={() => setTouristTab('requests')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'requests'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <Bell className="w-4 h-4 text-[#D97843]" />
            <span>{t('my.requests', 'My Requests')}</span>
            {leads.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  touristTab === 'requests' ? 'bg-[#D97843] text-white' : 'bg-[#EAF3EC] dark:bg-[#12281D] text-[#284435] dark:text-[#A3E6C0]'
                }`}
              >
                {leads.length}
              </span>
            )}
            {negotiatingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#D97843] animate-ping" />
            )}
          </button>

          <button
            onClick={() => setTouristTab('saved')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'saved'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>{t('saved', 'Saved')} ({savedProviderIds.length})</span>
          </button>

          <button
            onClick={() => setTouristTab('compliance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              touristTab === 'compliance'
                ? 'bg-[#284435] dark:bg-[#1F3327] text-white shadow-xs border border-transparent dark:border-[#2E4537]'
                : 'text-[#6B7A72] dark:text-[#8DA195] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-white dark:hover:bg-[#152019]'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">{t('laws', 'TZS & Licensing Laws')}</span>
            <span className="sm:hidden">Laws</span>
          </button>
        </div>

        {comparedProviderIds.length > 0 && (
          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#284435] dark:text-[#EDF3EF] bg-white dark:bg-[#152019] hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] px-3 py-1.5 rounded-xl border border-[#DED5C6] dark:border-[#23352A] cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D97843]" />
            <span>Compare ({comparedProviderIds.length})</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div>
        {touristTab === 'explore' && <TouristHome />}
        {touristTab === 'requests' && <MyRequestsView />}
        {touristTab === 'saved' && <SavedProvidersView />}
        {touristTab === 'compliance' && <ComplianceInfoView />}
      </div>

      {/* All Modal Overlays */}
      <ProviderDetailModal />
      <BookingRequestModal />
      <BookingVoucherModal />
      <PlaceDetailModal />
      <CompareModal />
      <CheckoutModal />
      <WriteReviewModal />
    </div>
  );
};
