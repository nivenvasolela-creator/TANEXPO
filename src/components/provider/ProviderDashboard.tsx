import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Kanban, 
  Package, 
  CalendarCheck, 
  BadgeDollarSign, 
  Star, 
  Settings, 
  Building2,
  ShieldCheck,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  MoreHorizontal,
  MessageCircle
} from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';

const OverviewTab = lazy(() =>
  import('./OverviewTab').then((m) => ({ default: m.OverviewTab }))
);
const LeadsPipelineTab = lazy(() =>
  import('./LeadsPipelineTab').then((m) => ({ default: m.LeadsPipelineTab }))
);
const WhatsAppTab = lazy(() =>
  import('./WhatsAppTab').then((m) => ({ default: m.WhatsAppTab }))
);
const ListingsTab = lazy(() =>
  import('./ListingsTab').then((m) => ({ default: m.ListingsTab }))
);
const BookingsTab = lazy(() =>
  import('./BookingsTab').then((m) => ({ default: m.BookingsTab }))
);
const FinancialsTab = lazy(() =>
  import('./FinancialsTab').then((m) => ({ default: m.FinancialsTab }))
);
const ReviewsTab = lazy(() =>
  import('./ReviewsTab').then((m) => ({ default: m.ReviewsTab }))
);
const ProfileSettingsTab = lazy(() =>
  import('./ProfileSettingsTab').then((m) => ({ default: m.ProfileSettingsTab }))
);
const QuoteBuilderModal = lazy(() =>
  import('./QuoteBuilderModal').then((m) => ({ default: m.QuoteBuilderModal }))
);
const ListingEditorModal = lazy(() =>
  import('./ListingEditorModal').then((m) => ({ default: m.ListingEditorModal }))
);

export const ProviderDashboard: React.FC = () => {
  const { 
    activeProviderId, 
    setActiveProviderId, 
    providers, 
    providerTab, 
    setProviderTab, 
    leads,
    bookings,
    listings,
    isNewListingModalOpen,
    setIsNewListingModalOpen,
    quoteBuilderLead,
    editingListing,
    currentUser
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tanexpo_provider_sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // A new section starts at the top instead of keeping the previous one's scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [providerTab]);

  useEffect(() => {
    localStorage.setItem('tanexpo_provider_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }, [isCollapsed]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileOpen]);

  const provider = providers.find((p) => p.id === activeProviderId) || providers[0];
  const pLeads = leads.filter((l) => l.providerId === activeProviderId);
  const newLeadsCount = pLeads.filter((l) => l.status === 'New').length;
  const pBookings = bookings.filter((b) => b.providerId === activeProviderId);
  const pListings = listings.filter((l) => l.providerId === activeProviderId && l.active);

  if (!provider) {
    return (
      <div className="bg-white dark:bg-[#152019] rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] p-12 text-center max-w-md mx-auto my-8 space-y-3">
        <Building2 className="w-10 h-10 text-[#D97843] mx-auto" />
        <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">No operator workspace selected</h3>
        <p className="text-xs text-[#6B7A72] dark:text-[#8DA195]">
          Sign in with an operator account or register your tourism business to access the Operator OS.
        </p>
      </div>
    );
  }

  const tabs: { 
    id: typeof providerTab; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    badge?: number;
    sublabel?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, sublabel: 'Metrics & Performance' },
    { id: 'leads', label: 'Pipeline Leads', icon: Kanban, badge: newLeadsCount, sublabel: 'Inquiries & Quotes' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, sublabel: 'Alerts & Commands' },
    { id: 'listings', label: 'Tour Packages', icon: Package, badge: pListings.length, sublabel: 'Inventory & Rates' },
    { id: 'bookings', label: 'Bookings & Trips', icon: CalendarCheck, badge: pBookings.length, sublabel: 'Confirmed Bookings' },
    { id: 'financials', label: 'Financials & Payouts', icon: BadgeDollarSign, sublabel: 'TZS Settlements' },
    { id: 'reviews', label: 'Reviews', icon: Star, sublabel: provider.reviewsCount > 0 ? `${provider.rating.toFixed(1)} Rating` : 'New' },
    { id: 'profile', label: 'Profile & Licenses', icon: Settings, sublabel: 'TALA Credentials' }
  ];

  const handleTabClick = (tabId: typeof providerTab) => {
    setProviderTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <div className="pb-28 lg:pb-20">
      {/* Mobile Top Header for Sidebar Toggle */}
      <div className="lg:hidden mb-4 flex items-center justify-between bg-white dark:bg-[#152019] p-3.5 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xs transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#101914] text-[#284435] dark:text-[#EDF3EF] hover:bg-[#EAE2D2] dark:hover:bg-[#1A2820] cursor-pointer transition-colors"
            aria-label="Toggle provider menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6B7A72] dark:text-[#8DA195] block leading-none">Operator OS</span>
            <span className="font-serif font-bold text-sm text-[#284435] dark:text-[#EDF3EF]">{provider.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] bg-[#FAF7F2] dark:bg-[#101914] px-2.5 py-1 rounded-lg border border-[#E8DFC9] dark:border-[#23352A]">
            {tabs.find(t => t.id === providerTab)?.label}
          </span>
          {newLeadsCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8B94A] text-[#1E332A] font-bold">
              {newLeadsCount} new
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Retractable Desktop & Mobile Sidebar */}
        <aside
          className={`
            ${isMobileOpen ? 'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#152019] shadow-2xl flex flex-col p-4' : 'hidden lg:flex'}
            ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}
            shrink-0 lg:sticky lg:top-24 bg-white dark:bg-[#152019] rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs flex-col justify-between transition-all duration-300 ease-in-out
          `}
          style={{ minHeight: 'calc(100vh - 120px)' }}
        >
          {/* Top of Sidebar: Operator Identity & Collapse Toggle */}
          <div>
            {/* Operator Card / Collapse Toggle Bar */}
            <div className="p-4 border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between transition-colors">
              {/* If expanded */}
              {!isCollapsed ? (
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-[#284435] dark:bg-emerald-800 text-[#E8B94A] flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {provider.verified ? 'TALA Verified' : 'Pending Verification'}
                    </span>
                  </div>

                  {currentUser?.role === 'admin' ? (
                    <select
                      value={activeProviderId}
                      onChange={(e) => setActiveProviderId(Number(e.target.value))}
                      className="w-full text-xs font-serif font-bold text-[#1F2A24] dark:text-[#EDF3EF] bg-transparent border border-[#E8DFC9] dark:border-[#2A3E31] rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer truncate"
                      title="Switch operator workspace"
                    >
                      {providers.map((p) => (
                        <option key={p.id} value={p.id} className="dark:bg-[#152019] dark:text-[#EDF3EF]">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full text-xs font-serif font-bold text-[#1F2A24] dark:text-[#EDF3EF] bg-transparent border border-[#E8DFC9] dark:border-[#2A3E31] rounded-lg px-2 py-1 truncate">
                      {provider.name}
                    </div>
                  )}
                  <span className="text-[10px] text-[#6B7A72] dark:text-[#8DA195] block mt-0.5 truncate">{provider.location}</span>
                </div>
              ) : (
                /* If collapsed */
                <div className="mx-auto">
                  <div className="w-10 h-10 rounded-xl bg-[#284435] dark:bg-emerald-800 text-[#E8B94A] flex items-center justify-center shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
              )}

              {/* Desktop Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-xl text-[#6B7A72] dark:text-[#8DA195] hover:text-[#284435] dark:hover:text-[#EDF3EF] hover:bg-[#FAF7F2] dark:hover:bg-[#101914] transition-colors cursor-pointer shrink-0"
                title={isCollapsed ? 'Expand sidebar' : 'Retract sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Retract sidebar'}
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5 text-[#D97843]" />
                ) : (
                  <PanelLeftClose className="w-5 h-5 text-[#D97843]" />
                )}
              </button>

              {/* Mobile Close Button */}
              {isMobileOpen && (
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#253A2E] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Navigation Tabs List */}
            <div className="p-3 space-y-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = providerTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-[#284435] dark:bg-emerald-800 text-white shadow-xs'
                        : 'text-[#52645A] dark:text-[#A7B9B0] hover:text-[#1F2A24] dark:hover:text-[#EDF3EF] hover:bg-[#FAF7F2] dark:hover:bg-[#101914]'
                    } ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                    title={isCollapsed ? `${tab.label} ${tab.badge ? `(${tab.badge})` : ''}` : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#E8B94A]' : 'text-[#8A9790] group-hover:text-[#284435] dark:group-hover:text-emerald-400'}`} />
                      {!isCollapsed && (
                        <div className="text-left truncate">
                          <span className="block leading-snug truncate">{tab.label}</span>
                          {tab.sublabel && (
                            <span className={`text-[10px] font-normal block truncate ${
                              isActive ? 'text-[#BED0C5] dark:text-emerald-200' : 'text-[#8A9790] dark:text-[#6B7A72]'
                            }`}>
                              {tab.sublabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isActive
                            ? 'bg-[#E8B94A] text-[#1E332A]'
                            : 'bg-[#FAF0E9] dark:bg-[#342217] text-[#D97843] border border-[#EBD0BC] dark:border-[#523321]'
                        } ${isCollapsed ? 'absolute -top-1 -right-1 ring-2 ring-white dark:ring-[#152019]' : ''}`}
                      >
                        {tab.badge}
                      </span>
                    )}

                    {/* Collapsed Tooltip on Hover */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1F2A24] dark:bg-[#101914] text-white text-xs font-semibold rounded-xl shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-transparent dark:border-[#23352A]">
                        {tab.label}
                        {tab.badge ? ` (${tab.badge})` : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Sidebar Action & Info */}
          <div className="p-3 border-t border-[#E8DFC9] dark:border-[#23352A] space-y-2 transition-colors">
            {/* Quick Action Button: New Tour Package */}
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => setIsNewListingModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FAF0E9] dark:bg-[#251A14] hover:bg-[#F3DFD1] dark:hover:bg-[#32231A] text-[#D97843] text-xs font-bold flex items-center justify-center gap-2 border border-[#EBD0BC] dark:border-[#523321] transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tour Package</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsNewListingModalOpen(true)}
                className="w-10 h-10 mx-auto rounded-xl bg-[#FAF0E9] dark:bg-[#251A14] hover:bg-[#F3DFD1] dark:hover:bg-[#32231A] text-[#D97843] flex items-center justify-center transition-colors cursor-pointer relative group"
                title="Add Tour Package"
              >
                <Plus className="w-5 h-5" />
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1F2A24] text-white text-xs font-semibold rounded-xl shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  Add Tour Package
                </div>
              </button>
            )}

            {/* Regulatory Footer */}
            {!isCollapsed ? (
              <div className="pt-2 text-center text-[10px] text-[#8A9790] dark:text-[#6B7A72] border-t border-[#F0EBE0] dark:border-[#23352A]">
                <span>TALA Tanzanian Operator OS</span>
              </div>
            ) : null}
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div 
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full">
          <ErrorBoundary fallbackTitle="Dashboard section failed to load">
            <Suspense
              fallback={
                <div className="rounded-3xl bg-white dark:bg-[#152019] border border-[#E8DFC9] dark:border-[#23352A] p-8 text-center text-xs text-[#6B7A72] dark:text-[#8DA195]">
                  Loading workspace...
                </div>
              }
            >
              {providerTab === 'overview' && <OverviewTab />}
              {providerTab === 'leads' && <LeadsPipelineTab />}
              {providerTab === 'listings' && <ListingsTab />}
              {providerTab === 'bookings' && <BookingsTab />}
              {providerTab === 'financials' && <FinancialsTab />}
              {providerTab === 'reviews' && <ReviewsTab />}
              {providerTab === 'profile' && <ProfileSettingsTab />}
              {providerTab === 'whatsapp' && <WhatsAppTab />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Operator mobile navigation"
        className="lg:hidden fixed inset-x-3 bottom-floating z-30 glass glass-capsule rounded-[30px] border"
      >
        <div className="grid grid-cols-5 gap-1 px-1.5 py-1.5">
          <button
            type="button"
            onClick={() => handleTabClick('overview')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-bold transition-all cursor-pointer ${
              providerTab === 'overview'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('leads')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-bold transition-all cursor-pointer ${
              providerTab === 'leads'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <div className="relative">
              <Kanban className="w-4 h-4" />
              {newLeadsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D97843] text-white text-[9px] font-bold flex items-center justify-center">
                  {newLeadsCount}
                </span>
              )}
            </div>
            <span>Leads</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('whatsapp')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-bold transition-all cursor-pointer ${
              providerTab === 'whatsapp'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('bookings')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-bold transition-all cursor-pointer ${
              providerTab === 'bookings'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Bookings</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="More operator sections"
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-[22px] text-[10px] font-bold transition-all cursor-pointer ${
              providerTab === 'listings' || providerTab === 'financials' || providerTab === 'reviews' || providerTab === 'profile'
                ? 'text-[#1C2C24] dark:text-[#F3E2B3] tab-lens'
                : 'text-[#6B7A72] dark:text-[#8DA195]'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Modals rendered only when active */}
      <ErrorBoundary fallbackTitle="Modal failed to load">
        <Suspense fallback={null}>
          {quoteBuilderLead && <QuoteBuilderModal />}
          {(isNewListingModalOpen || editingListing) && <ListingEditorModal />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
