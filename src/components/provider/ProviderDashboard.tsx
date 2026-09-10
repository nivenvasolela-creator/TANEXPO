import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { LeadsPipelineTab } from './LeadsPipelineTab';
import { ListingsTab } from './ListingsTab';
import { BookingsTab } from './BookingsTab';
import { FinancialsTab } from './FinancialsTab';
import { ReviewsTab } from './ReviewsTab';
import { ProfileSettingsTab } from './ProfileSettingsTab';
import { QuoteBuilderModal } from './QuoteBuilderModal';
import { ListingEditorModal } from './ListingEditorModal';

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
    setIsNewListingModalOpen
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tanexpo_provider_sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('tanexpo_provider_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }, [isCollapsed]);

  const provider = providers.find((p) => p.id === activeProviderId) || providers[0];
  const pLeads = leads.filter((l) => l.providerId === activeProviderId);
  const newLeadsCount = pLeads.filter((l) => l.status === 'New').length;
  const pBookings = bookings.filter((b) => b.providerId === activeProviderId);
  const pListings = listings.filter((l) => l.providerId === activeProviderId && l.active);

  const tabs: { 
    id: typeof providerTab; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    badge?: number;
    sublabel?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, sublabel: 'Metrics & Performance' },
    { id: 'leads', label: 'Pipeline Leads', icon: Kanban, badge: newLeadsCount, sublabel: 'Inquiries & Quotes' },
    { id: 'listings', label: 'Tour Packages', icon: Package, badge: pListings.length, sublabel: 'Inventory & Rates' },
    { id: 'bookings', label: 'Bookings & Trips', icon: CalendarCheck, badge: pBookings.length, sublabel: 'Confirmed Bookings' },
    { id: 'financials', label: 'Financials & Payouts', icon: BadgeDollarSign, sublabel: 'TZS Settlements' },
    { id: 'reviews', label: 'Reviews', icon: Star, sublabel: `${provider?.rating.toFixed(1)} Rating` },
    { id: 'profile', label: 'Profile & Licenses', icon: Settings, sublabel: 'TALA Credentials' }
  ];

  const handleTabClick = (tabId: typeof providerTab) => {
    setProviderTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <div className="pb-20">
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
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8B94A] text-[#1E332A] font-bold animate-pulse">
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
                      TALA Verified
                    </span>
                  </div>

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
                  className="lg:hidden p-1.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#253A2E] cursor-pointer"
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
                <span className="block text-[9px] text-[#6B7A72] dark:text-[#8DA195]">Licensed Payment Partner Protected</span>
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
          {providerTab === 'overview' && <OverviewTab />}
          {providerTab === 'leads' && <LeadsPipelineTab />}
          {providerTab === 'listings' && <ListingsTab />}
          {providerTab === 'bookings' && <BookingsTab />}
          {providerTab === 'financials' && <FinancialsTab />}
          {providerTab === 'reviews' && <ReviewsTab />}
          {providerTab === 'profile' && <ProfileSettingsTab />}
        </main>
      </div>

      {/* Modals rendered when active */}
      <QuoteBuilderModal />
      <ListingEditorModal />
    </div>
  );
};
