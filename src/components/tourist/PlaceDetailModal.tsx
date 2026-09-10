import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  MapPin, 
  Calendar, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  Compass, 
  ChevronLeft, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Camera, 
  FileText, 
  Truck, 
  Users, 
  HelpCircle,
  Clock,
  Check,
  Plane,
  HeartPulse,
  Tag
} from 'lucide-react';
import { DestinationPlace } from '../../types';

// Deterministic map of verified local operators serving each circuit
const DESTINATION_OPERATOR_IDS: Record<string, number[]> = {
  serengeti: [1, 3, 4],
  ngorongoro: [1, 4, 3],
  kilimanjaro: [3, 1, 4],
  zanzibar: [2, 5, 6],
  eyasi: [4, 1, 3],
  mafia: [6, 2, 5],
};

export const PlaceDetailModal: React.FC = () => {
  const { 
    selectedDestination, 
    setSelectedDestination, 
    destinations, 
    providers, 
    listings, 
    setSelectedProvider, 
    formatPrice,
    setIsLeadModalOpen,
    setSelectedListingForLead,
    showUSDApprox,
    t 
  } = useApp();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'photos' | 'logistics' | 'operators'>('overview');

  if (!selectedDestination) return null;

  // Reset photo index when destination changes
  const handleSelectDestination = (dest: DestinationPlace) => {
    setSelectedDestination(dest);
    setActivePhotoIndex(0);
  };

  const currentImages = selectedDestination.images || (selectedDestination.featuredImage ? [
    {
      url: selectedDestination.featuredImage,
      caption: selectedDestination.name,
      tag: 'Featured'
    }
  ] : []);

  const activePhoto = currentImages[activePhotoIndex] || currentImages[0];

  const handleNextPhoto = () => {
    if (currentImages.length > 0) {
      setActivePhotoIndex((prev) => (prev + 1) % currentImages.length);
    }
  };

  const handlePrevPhoto = () => {
    if (currentImages.length > 0) {
      setActivePhotoIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
    }
  };

  // Find verified operators that serve this destination
  const explicitIds = DESTINATION_OPERATOR_IDS[selectedDestination.id] || [];
  const matchedProviders = providers.filter((p) => {
    if (explicitIds.includes(p.id)) return true;
    if (p.category === selectedDestination.categoryId) return true;
    const destNameFirst = selectedDestination.name.toLowerCase().split(' ')[0];
    if (p.about.toLowerCase().includes(destNameFirst)) return true;
    if (p.location.toLowerCase().includes(destNameFirst)) return true;
    return false;
  });

  // Guarantee at least 2 verified operators for all destinations
  const effectiveOperators = matchedProviders.length >= 2
    ? matchedProviders
    : [
        ...matchedProviders,
        ...providers.filter(p => !matchedProviders.some(mp => mp.id === p.id))
      ].slice(0, Math.max(2, matchedProviders.length));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative bg-[#FAF7F2] dark:bg-[#0D1511] rounded-3xl max-w-6xl w-full h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] transition-colors">
        {/* Top Control Bar with Fully Working Navigation Tabs */}
        <div className="p-3 sm:p-4 bg-white dark:bg-[#152019] border-b border-[#E8DFC9] dark:border-[#23352A] flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 transition-colors">
          {/* Left: Sidebar Toggle & Destination Title */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2820] hover:bg-[#EFE7D8] dark:hover:bg-[#25392D] text-[#284435] dark:text-[#EDF3EF] text-xs font-bold border border-[#E0D5C1] dark:border-[#2A3E31] transition-colors cursor-pointer"
              title={isSidebarOpen ? "Collapse destinations list" : "Expand destinations list"}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-4 h-4 text-[#D97843]" />
                  <span className="hidden sm:inline">Hide Guides</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-[#D97843]" />
                  <span>Destinations ({destinations.length})</span>
                </>
              )}
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#6B7A72] dark:text-[#8DA195]">
              <Compass className="w-3.5 h-3.5 text-[#D97843]" />
              <span>Guide /</span>
              <strong className="text-[#284435] dark:text-[#EDF3EF]">{selectedDestination.name}</strong>
            </div>
          </div>

          {/* Center: The 4 Interactive Tabs (Works for ALL destinations) */}
          <div className="flex items-center gap-1 overflow-x-auto bg-[#FAF7F2] dark:bg-[#0D1511] p-1 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] text-xs max-w-full">
            {/* Tab 1: Overview & Guide */}
            <button
              type="button"
              onClick={() => setActiveSection('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'overview' 
                  ? 'bg-[#284435] dark:bg-[#1F3A2C] text-white shadow-xs' 
                  : 'text-[#52645A] dark:text-[#9DB0A4] hover:text-[#284435] dark:hover:text-[#EDF3EF] hover:bg-[#F0EBE0] dark:hover:bg-[#1A2820]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Overview & Guide</span>
            </button>

            {/* Tab 2: Photos */}
            <button
              type="button"
              onClick={() => setActiveSection('photos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'photos' 
                  ? 'bg-[#284435] dark:bg-[#1F3A2C] text-white shadow-xs' 
                  : 'text-[#52645A] dark:text-[#9DB0A4] hover:text-[#284435] dark:hover:text-[#EDF3EF] hover:bg-[#F0EBE0] dark:hover:bg-[#1A2820]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photos ({currentImages.length})</span>
            </button>

            {/* Tab 3: Logistics & Fees */}
            <button
              type="button"
              onClick={() => setActiveSection('logistics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'logistics' 
                  ? 'bg-[#284435] dark:bg-[#1F3A2C] text-white shadow-xs' 
                  : 'text-[#52645A] dark:text-[#9DB0A4] hover:text-[#284435] dark:hover:text-[#EDF3EF] hover:bg-[#F0EBE0] dark:hover:bg-[#1A2820]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Logistics & Fees</span>
            </button>

            {/* Tab 4: Operators */}
            <button
              type="button"
              onClick={() => setActiveSection('operators')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'operators' 
                  ? 'bg-[#284435] dark:bg-[#1F3A2C] text-white shadow-xs' 
                  : 'text-[#52645A] dark:text-[#9DB0A4] hover:text-[#284435] dark:hover:text-[#EDF3EF] hover:bg-[#F0EBE0] dark:hover:bg-[#1A2820]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Operators ({effectiveOperators.length})</span>
            </button>
          </div>

          {/* Right: Close Button */}
          <button
            type="button"
            onClick={() => setSelectedDestination(null)}
            className="w-9 h-9 rounded-full bg-[#FAF7F2] dark:bg-[#1A2820] hover:bg-[#EDE5D5] dark:hover:bg-[#25392D] text-[#1F2A24] dark:text-[#EDF3EF] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close destination guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Retractable Sidebar and Tab Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Retractable Destination Selector Sidebar */}
          {isSidebarOpen && (
            <aside className="w-72 sm:w-80 shrink-0 bg-white dark:bg-[#152019] border-r border-[#E8DFC9] dark:border-[#23352A] flex flex-col overflow-hidden transition-all z-10">
              <div className="p-3.5 bg-[#FAF7F2] dark:bg-[#121D17] border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#D97843]" />
                  <span className="font-serif font-bold text-xs text-[#284435] dark:text-[#EDF3EF] uppercase tracking-wider">
                    All Tanzania Destinations
                  </span>
                </div>
                <span className="text-[10px] bg-white dark:bg-[#1A2820] px-2 py-0.5 rounded-md border border-[#E0D5C1] dark:border-[#2A3E31] font-bold text-[#6B7A72] dark:text-[#8DA195]">
                  {destinations.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                {destinations.map((dest) => {
                  const isSelected = dest.id === selectedDestination.id;
                  const thumb = dest.featuredImage || (dest.images && dest.images[0]?.url);

                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => handleSelectDestination(dest)}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center gap-3 transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-[#284435] dark:bg-[#1F3A2C] text-white border-[#284435] dark:border-[#2E553F] shadow-xs' 
                          : 'bg-[#FAF7F2] dark:bg-[#121D17] hover:bg-[#EDE5D5] dark:hover:bg-[#1A2820] text-[#1F2A24] dark:text-[#EDF3EF] border-transparent'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative bg-black/20">
                        {thumb ? (
                          <img 
                            src={thumb} 
                            alt={dest.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className={`w-full h-full bg-linear-to-br ${dest.heroGradient}`} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider truncate ${
                            isSelected ? 'text-[#E8B94A]' : 'text-[#D97843]'
                          }`}>
                            {dest.categoryId}
                          </span>
                        </div>
                        <h4 className={`font-serif font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-[#284435] dark:text-[#EDF3EF]'}`}>
                          {dest.name}
                        </h4>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-[#D3DFD7]' : 'text-[#6B7A72] dark:text-[#8DA195]'}`}>
                          {dest.region.split('(')[0]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-[#FAF7F2] dark:bg-[#121D17] border-t border-[#E8DFC9] dark:border-[#23352A] text-center">
                <span className="text-[11px] text-[#6B7A72] dark:text-[#8DA195] block">
                  🇹🇿 Ministry of Natural Resources & Tourism Circuit Guides
                </span>
              </div>
            </aside>
          )}

          {/* Main Scrollable Tab View Pane */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-[#FAF7F2] dark:bg-[#0D1511]">
            
            {/* ============================================================ */}
            {/* TAB 1: OVERVIEW & GUIDE SECTION */}
            {/* ============================================================ */}
            {activeSection === 'overview' && (
              <div className="space-y-6 pb-12 animate-fade-in">
                {/* Hero Header Banner with Active Image Preview */}
                <div className="relative bg-[#19261F] text-white shrink-0 overflow-hidden">
                  <div className="relative h-64 sm:h-72 md:h-80 w-full group">
                    {activePhoto && (
                      <img 
                        src={activePhoto.url} 
                        alt={activePhoto.caption || selectedDestination.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#E8B94A] text-xs font-semibold uppercase tracking-wider border border-white/20">
                        <Compass className="w-3.5 h-3.5" />
                        <span>{selectedDestination.region}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setActiveSection('photos')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#E8B94A]" />
                        <span>View All {currentImages.length} Photos</span>
                      </button>
                    </div>

                    {/* Bottom Title & Tagline */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white mb-1.5 drop-shadow-md">
                        {selectedDestination.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#E2ECE5] max-w-2xl font-medium drop-shadow-xs">
                        {selectedDestination.tagline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="px-4 sm:px-6 space-y-6">
                  {/* Detailed Description */}
                  <div className="bg-white dark:bg-[#152019] p-5 sm:p-6 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xs space-y-3 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D97843]" />
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">About the Destination</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4D5E55] dark:text-[#A7B9B0] leading-relaxed">
                      {selectedDestination.description}
                    </p>
                  </div>

                  {/* Best Time to Visit & Typical Daily Cost Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#152019] p-5 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] space-y-2 shadow-2xs transition-colors">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF0E9] dark:bg-[#2A1D16] text-[#D97843] flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span>{t('best.time', 'Best Time to Visit')}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#4D5E55] dark:text-[#A7B9B0] leading-relaxed pt-1 font-medium">
                        {selectedDestination.bestTimeToVisit}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-[#152019] p-5 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] space-y-2 shadow-2xs transition-colors">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF7E8] dark:bg-[#252516] text-[#E8B94A] flex items-center justify-center">
                          <Coins className="w-4 h-4 text-[#C4942B] dark:text-[#E8B94A]" />
                        </div>
                        <span>{t('typical.cost', 'Typical Daily Cost')}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#284435] dark:text-[#EDF3EF] font-bold pt-1">
                        {selectedDestination.typicalCostRangeTZS}
                      </p>
                      <span className="text-[11px] text-[#6B7A72] dark:text-[#8DA195] block">
                        Covers TANAPA / NCAA entry conservation fees, licensed guide, and transfers.
                      </span>
                    </div>
                  </div>

                  {/* Highlights Checklist */}
                  <div className="bg-white dark:bg-[#152019] p-5 sm:p-6 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] space-y-3 shadow-2xs transition-colors">
                    <h4 className="font-serif font-bold text-sm sm:text-base text-[#284435] dark:text-[#EDF3EF] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E8B94A]" />
                      <span>Key Highlights & Signature Experiences</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {selectedDestination.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#121D17] border border-[#E8DFC9]/60 dark:border-[#23352A]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-[#384840] dark:text-[#C5D5CC] font-medium leading-relaxed">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Action Navigation Buttons to Other Sections */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection('photos')}
                      className="p-4 rounded-2xl bg-white dark:bg-[#152019] hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] border border-[#E8DFC9] dark:border-[#23352A] hover:border-[#284435] dark:hover:border-[#385B46] transition-all text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Camera className="w-5 h-5 text-[#D97843]" />
                        <ArrowRight className="w-4 h-4 text-[#6B7A72] dark:text-[#8DA195] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#284435] dark:text-[#EDF3EF] mb-1">
                        Photo Gallery ({currentImages.length})
                      </h4>
                      <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                        High-resolution landscapes, wildlife, and cultural imagery.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('logistics')}
                      className="p-4 rounded-2xl bg-white dark:bg-[#152019] hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] border border-[#E8DFC9] dark:border-[#23352A] hover:border-[#284435] dark:hover:border-[#385B46] transition-all text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <ShieldCheck className="w-5 h-5 text-[#284435] dark:text-emerald-400" />
                        <ArrowRight className="w-4 h-4 text-[#6B7A72] dark:text-[#8DA195] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#284435] dark:text-[#EDF3EF] mb-1">
                        Logistics & Park Fees
                      </h4>
                      <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                        TANAPA/NCAA permits, vehicle rules, and travel health tips.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('operators')}
                      className="p-4 rounded-2xl bg-white dark:bg-[#152019] hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] border border-[#E8DFC9] dark:border-[#23352A] hover:border-[#284435] dark:hover:border-[#385B46] transition-all text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-[#E8B94A]" />
                        <ArrowRight className="w-4 h-4 text-[#6B7A72] dark:text-[#8DA195] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#284435] dark:text-[#EDF3EF] mb-1">
                        Verified Operators ({effectiveOperators.length})
                      </h4>
                      <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                        Book directly with TALA-certified local specialists in TZS.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: PHOTOS SECTION */}
            {/* ============================================================ */}
            {activeSection === 'photos' && (
              <div className="p-4 sm:p-6 space-y-6 flex-1 flex flex-col animate-fade-in">
                {/* Large Interactive Photo Viewer */}
                <div className="relative bg-[#19261F] text-white rounded-3xl overflow-hidden shadow-md">
                  <div className="relative h-72 sm:h-96 md:h-[440px] w-full flex items-center justify-center group">
                    <img 
                      src={activePhoto.url} 
                      alt={activePhoto.caption || selectedDestination.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-500" 
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Left / Right Carousel Controls */}
                    {currentImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevPhoto}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-lg"
                          title="Previous photograph"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextPhoto}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-lg"
                          title="Next photograph"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    {/* Top Metadata Tag */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#E8B94A] text-xs font-bold uppercase tracking-wider border border-white/20">
                        Photo {activePhotoIndex + 1} of {currentImages.length}
                      </span>
                      {activePhoto.tag && (
                        <span className="px-2.5 py-1 rounded-full bg-[#D97843] text-white text-xs font-bold">
                          {activePhoto.tag}
                        </span>
                      )}
                    </div>

                    {/* Bottom Caption Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-md">
                        {selectedDestination.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#E8DFC9] font-medium leading-relaxed max-w-3xl drop-shadow-xs">
                        {activePhoto.caption || selectedDestination.tagline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Strip Selector */}
                {currentImages.length > 1 && (
                  <div className="bg-white dark:bg-[#152019] p-3 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] flex items-center gap-2.5 overflow-x-auto shadow-2xs">
                    <span className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] pl-2 shrink-0 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#D97843]" />
                      Thumbnails:
                    </span>
                    {currentImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          activePhotoIndex === idx 
                            ? 'border-[#284435] dark:border-[#E8B94A] ring-2 ring-[#284435]/30 dark:ring-[#E8B94A]/30 scale-105 shadow-xs' 
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={img.url} 
                          alt={img.caption} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Complete Photographic Grid */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm sm:text-base text-[#284435] dark:text-[#EDF3EF] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E8B94A]" />
                      <span>All Photographs ({currentImages.length})</span>
                    </h4>
                    <span className="text-xs text-[#6B7A72] dark:text-[#8DA195]">
                      Click any photo to view in high resolution
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {currentImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActivePhotoIndex(idx);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`p-2.5 rounded-2xl bg-white dark:bg-[#152019] border text-left transition-all cursor-pointer group shadow-2xs ${
                          activePhotoIndex === idx 
                            ? 'border-[#284435] dark:border-[#E8B94A] ring-2 ring-[#284435]/20 dark:ring-[#E8B94A]/20' 
                            : 'border-[#E8DFC9] dark:border-[#23352A] hover:border-[#D97843]'
                        }`}
                      >
                        <div className="h-44 rounded-xl overflow-hidden relative mb-2.5 bg-black/10">
                          <img 
                            src={img.url} 
                            alt={img.caption} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          {img.tag && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#E8B94A] text-[10px] font-bold">
                              {img.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#284435] dark:text-[#EDF3EF] line-clamp-2 leading-relaxed">
                          {img.caption}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: LOGISTICS & FEES SECTION */}
            {/* ============================================================ */}
            {activeSection === 'logistics' && (
              <div className="p-4 sm:p-6 space-y-6 flex-1 text-[#1F2A24] dark:text-[#EDF3EF] animate-fade-in">
                {/* Official Park Tariffs & Fee Structure */}
                <div className="bg-white dark:bg-[#152019] p-5 sm:p-6 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xs space-y-4 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-[#E8DFC9] dark:border-[#23352A] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        <h3 className="font-serif text-base sm:text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">
                          Official Park Entry & Conservation Tariffs
                        </h3>
                      </div>
                      <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] mt-0.5">
                        {selectedDestination.parkFees?.authority || 'Tanzania National Parks Authority (TANAPA) Tariffs'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDestination.parkFees?.lastVerified && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#1A2820] text-[#6B7A72] dark:text-[#8DA195] border border-[#E8DFC9] dark:border-[#2A3E31] shrink-0">
                          Verified: {selectedDestination.parkFees.lastVerified}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shrink-0">
                        BOT Compliant (TZS)
                      </span>
                    </div>
                  </div>

                  {/* Mandatory Tariff Accuracy Disclaimer */}
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <span className="font-bold shrink-0">Disclaimer:</span>
                    <span>Tariff figures shown are approximate — confirm current rates with your operator or TANAPA/NCAA prior to departure. Statutory tariffs are periodically adjusted by government gazette.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#121D17] border border-[#E8DFC9]/70 dark:border-[#23352A] space-y-1">
                      <span className="text-[11px] font-bold text-[#52645A] dark:text-[#9DB0A4] uppercase tracking-wider block">
                        Conservation Fee (Per Person / 24 Hours)
                      </span>
                      <p className="font-bold text-sm text-[#284435] dark:text-[#EDF3EF]">
                        {selectedDestination.parkFees?.conservationFeePerDay || 'USD 70.00 + 18% VAT (TZS ~218,000) for Non-Residents'}
                      </p>
                      <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                        EAC Citizens & Tanzanian Nationals enjoy preferential subsidized rate (TZS 11,800).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#121D17] border border-[#E8DFC9]/70 dark:border-[#23352A] space-y-1">
                      <span className="text-[11px] font-bold text-[#52645A] dark:text-[#9DB0A4] uppercase tracking-wider block">
                        Vehicle Permits & Special Access
                      </span>
                      <p className="font-bold text-sm text-[#284435] dark:text-[#EDF3EF]">
                        {selectedDestination.parkFees?.vehicleOrDescentPermit || 'Standard 4WD vehicle entry: TZS 41,300 per day'}
                      </p>
                      <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                        Includes electronic TANAPA / NCAA gate smart card clearance via your licensed operator.
                      </p>
                    </div>
                  </div>

                  {selectedDestination.parkFees?.concessionOrCampFee && (
                    <div className="p-3 rounded-xl bg-[#FAF7E8] dark:bg-[#252516] border border-[#E8B94A]/40 dark:border-[#E8B94A]/20 text-xs text-[#384840] dark:text-[#D5DECE]">
                      <strong>Concession & Campsite Fee: </strong>
                      <span>{selectedDestination.parkFees.concessionOrCampFee}</span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/40 border border-[#CDE3D4] dark:border-emerald-800/60 flex items-center gap-2 text-xs text-[#284435] dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {selectedDestination.parkFees?.currencyNote || 
                        'Under the Tanzania Tourism Act (No. 29 of 2008), all quotes on TANEXPO are settled legally in Tanzanian Shillings (TZS).'}
                    </span>
                  </div>
                </div>

                {/* Transport & Route Access */}
                <div className="bg-white dark:bg-[#152019] p-5 sm:p-6 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xs space-y-4 transition-colors">
                  <div className="flex items-center gap-2 border-b border-[#E8DFC9] dark:border-[#23352A] pb-3">
                    <Truck className="w-4 h-4 text-[#D97843]" />
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">
                      Transport & Route Access
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#121D17] border border-[#E8DFC9]/70 dark:border-[#23352A]">
                      <span className="text-[10px] font-bold text-[#6B7A72] dark:text-[#8DA195] uppercase block mb-1">
                        Nearest Airport / Airstrip
                      </span>
                      <span className="font-bold text-[#284435] dark:text-[#EDF3EF]">
                        {selectedDestination.logisticsInfo?.nearestAirport || 'Local Regional Bush Airstrip'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#121D17] border border-[#E8DFC9]/70 dark:border-[#23352A]">
                      <span className="text-[10px] font-bold text-[#6B7A72] dark:text-[#8DA195] uppercase block mb-1">
                        Road Transit Time
                      </span>
                      <span className="font-bold text-[#284435] dark:text-[#EDF3EF]">
                        {selectedDestination.logisticsInfo?.driveTimeFromHub || '3 to 6 hours from regional hub'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#121D17] border border-[#E8DFC9]/70 dark:border-[#23352A]">
                      <span className="text-[10px] font-bold text-[#6B7A72] dark:text-[#8DA195] uppercase block mb-1">
                        Required Vehicle Standard
                      </span>
                      <span className="font-bold text-[#284435] dark:text-[#EDF3EF]">
                        {selectedDestination.logisticsInfo?.requiredVehicles || 'High-clearance 4WD Safari Cruiser'}
                      </span>
                    </div>
                  </div>

                  {selectedDestination.logisticsInfo?.accessRoute && (
                    <p className="text-xs text-[#4D5E55] dark:text-[#A7B9B0] leading-relaxed pt-1">
                      <strong>Access Logistics: </strong>
                      {selectedDestination.logisticsInfo.accessRoute}
                    </p>
                  )}
                </div>

                {/* Mandatory Regulations & Health Safety Guides */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regulations */}
                  <div className="bg-white dark:bg-[#152019] p-5 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xs space-y-3 transition-colors">
                    <h4 className="font-serif font-bold text-sm text-[#284435] dark:text-[#EDF3EF] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#D97843]" />
                      <span>Mandatory Park Regulations</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[#4D5E55] dark:text-[#A7B9B0]">
                      {(selectedDestination.logisticsInfo?.mandatoryRegulations || selectedDestination.travelTips).map((reg, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D97843] shrink-0 mt-1.5" />
                          <span>{reg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Health & Packing Recommendations */}
                  <div className="bg-white dark:bg-[#152019] p-5 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xs space-y-3 transition-colors">
                    <h4 className="font-serif font-bold text-sm text-[#284435] dark:text-[#EDF3EF] flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Health & Gear Recommendations</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-[#4D5E55] dark:text-[#A7B9B0]">
                      {(selectedDestination.logisticsInfo?.recommendedGear || [
                        'Neutral colored clothing (khaki, olive, tan; avoid dark blue/black)',
                        'Wide-brim sunhat and polarized UV sunglasses',
                        'High-magnification binoculars for distant wildlife viewing',
                        'Personal prescription medicines and malaria prophylaxis'
                      ]).map((gear, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{gear}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: OPERATORS SECTION */}
            {/* ============================================================ */}
            {activeSection === 'operators' && (
              <div className="p-4 sm:p-6 space-y-6 flex-1 text-[#1F2A24] dark:text-[#EDF3EF] animate-fade-in">
                {/* Header Information */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E8DFC9] dark:border-[#23352A] pb-3">
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
                      Verified Local Operators Serving {selectedDestination.name}
                    </h3>
                    <p className="text-xs text-[#6B7A72] dark:text-[#8DA195]">
                      TALA-licensed Tanzanian operators with direct transparent booking in official TZS
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] bg-white dark:bg-[#152019] px-3 py-1.5 rounded-xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xs">
                    {effectiveOperators.length} Verified Specialist{effectiveOperators.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Operator Cards with Direct Tour Packages */}
                <div className="space-y-4">
                  {effectiveOperators.map((prov) => {
                    // Packages belonging to this provider
                    const provPackages = listings.filter((l) => l.providerId === prov.id && l.active);
                    const minPrice = provPackages.length > 0 ? Math.min(...provPackages.map((l) => l.priceTZS)) : 0;

                    return (
                      <div
                        key={prov.id}
                        className="bg-white dark:bg-[#152019] p-5 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] hover:border-[#284435] dark:hover:border-[#385B46] transition-all shadow-2xs space-y-4"
                      >
                        {/* Operator Info Row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-serif font-bold text-base sm:text-lg text-[#284435] dark:text-[#EDF3EF]">
                                {prov.name}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/80">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{prov.rating.toFixed(1)}</span>
                                <span className="text-[#6B7A72] dark:text-[#8DA195]">({prov.reviewsCount})</span>
                              </div>
                            </div>

                            <p className="text-xs text-[#D97843] font-semibold mb-1">
                              {prov.tagline}
                            </p>

                            <p className="text-xs text-[#4D5E55] dark:text-[#A7B9B0] line-clamp-2 max-w-2xl">
                              {prov.about}
                            </p>
                          </div>

                          {/* Quick Starting Price & Profile Button */}
                          <div className="sm:text-right shrink-0">
                            <span className="text-[10px] text-[#8A9790] uppercase block">Starting rate</span>
                            <span className="text-sm font-bold text-[#284435] dark:text-[#EDF3EF] block">
                              {minPrice > 0 ? formatPrice(minPrice) : 'Custom quote'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDestination(null);
                                setSelectedProvider(prov);
                              }}
                              className="mt-1.5 px-3 py-1.5 bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <span>View Profile</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Badges & Fleet Details */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F0EBE0] dark:border-[#23352A]">
                          <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/80">
                            <ShieldCheck className="w-3 h-3 inline mr-1 text-emerald-600 dark:text-emerald-400" />
                            {prov.talaLicense}
                          </span>
                          <span className="text-[10px] text-[#52645A] dark:text-[#A7B9B0] bg-[#FAF7F2] dark:bg-[#121D17] px-2 py-1 rounded-md border border-[#E8DFC9] dark:border-[#23352A]">
                            📍 {prov.location}
                          </span>
                          {prov.fleetInfo && (
                            <span className="text-[10px] text-[#52645A] dark:text-[#A7B9B0] bg-[#FAF7F2] dark:bg-[#121D17] px-2 py-1 rounded-md border border-[#E8DFC9] dark:border-[#23352A]">
                              🚙 {prov.fleetInfo.split('+')[0]}
                            </span>
                          )}
                          <span className="text-[10px] text-[#6B7A72] dark:text-[#8DA195]">
                            🗣️ {prov.languages.join(', ')}
                          </span>
                        </div>

                        {/* Direct Tour Packages for this Circuit */}
                        {provPackages.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-[11px] font-bold text-[#52645A] dark:text-[#9DB0A4] uppercase tracking-wider block">
                              Available Tour Packages ({provPackages.length}):
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {provPackages.map((pkg) => (
                                <div
                                  key={pkg.id}
                                  className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#121D17] border border-[#E8DFC9]/80 dark:border-[#23352A] flex flex-col justify-between hover:border-[#284435] dark:hover:border-[#385B46] transition-all"
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h5 className="font-serif font-bold text-xs text-[#284435] dark:text-[#EDF3EF]">
                                        {pkg.title}
                                      </h5>
                                      <span className="text-[10px] font-bold bg-white dark:bg-[#1A2820] px-2 py-0.5 rounded-md border border-[#E8DFC9] dark:border-[#2A3E31] text-[#6B7A72] dark:text-[#8DA195] shrink-0">
                                        {pkg.duration}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195] line-clamp-2 mb-2">
                                      {pkg.description}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-[#E8DFC9]/60 dark:border-[#23352A]">
                                    <span className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">
                                      {formatPrice(pkg.priceTZS)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDestination(null);
                                        setSelectedProvider(prov);
                                        setSelectedListingForLead(pkg);
                                        setIsLeadModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-[#D97843] hover:bg-[#C26532] text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                                    >
                                      Request Quote
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
