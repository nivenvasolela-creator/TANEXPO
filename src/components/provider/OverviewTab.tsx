import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  PackageCheck,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { COMMISSION_RATE } from '../../data/initialData';

export const OverviewTab: React.FC = () => {
  const { 
    activeProviderId, 
    providers, 
    leads, 
    bookings, 
    reviews, 
    listings, 
    setProviderTab,
    setIsNewListingModalOpen,
    formatPrice
  } = useApp();

  const provider = providers.find((p) => p.id === activeProviderId) || providers[0];
  const pLeads = leads.filter((l) => l.providerId === activeProviderId);
  const pBookings = bookings.filter((b) => b.providerId === activeProviderId);
  const pReviews = reviews.filter((r) => r.providerId === activeProviderId);
  const pListings = listings.filter((l) => l.providerId === activeProviderId && l.active);

  const newLeadsCount = pLeads.filter((l) => l.status === 'New').length;
  const bookedLeadsCount = pLeads.filter((l) => l.status === 'Booked').length;
  const conversionRate = pLeads.length > 0 ? Math.round((bookedLeadsCount / pLeads.length) * 100) : 0;

  const grossRevenue = pBookings.reduce((sum, b) => sum + b.amountTZS, 0);
  const commissionPaid = Math.round(grossRevenue * COMMISSION_RATE);
  const netEarnings = grossRevenue - commissionPaid;

  const avgRating = pReviews.length > 0 
    ? (pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length).toFixed(1)
    : provider.rating.toFixed(1);

  // Revenue by package breakdown
  const packageRevenueMap: Record<string, number> = {};
  pBookings.forEach((b) => {
    packageRevenueMap[b.listingTitle] = (packageRevenueMap[b.listingTitle] || 0) + b.amountTZS;
  });

  const maxRevenuePkg = Math.max(1, ...Object.values(packageRevenueMap));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-[#284435] to-[#1C2C24] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>TALA License {provider.talaLicense} Active</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Karibu, {provider.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#D3DFD7] leading-relaxed">
            Your centralized operating system for northern circuit safaris, client inquiries, dynamic quoting, and guaranteed mobile money settlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsNewListingModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#D97843] hover:bg-[#C26735] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            + Create Package
          </button>
          <button
            onClick={() => setProviderTab('leads')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
          >
            Pipeline CRM ({pLeads.length})
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pipeline Leads */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6B7A72]">
            <span className="text-xs font-bold uppercase tracking-wider">Active Leads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl font-bold text-[#284435]">{pLeads.length}</span>
            {newLeadsCount > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                {newLeadsCount} New!
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#6B7A72]">
            Conversion rate: <strong className="text-[#284435]">{conversionRate}%</strong>
          </p>
        </div>

        {/* Metric 2: Gross Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6B7A72]">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Volume (TZS)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif text-2xl font-bold text-[#284435] block truncate">
            {formatPrice(grossRevenue, false)}
          </span>
          <p className="text-[11px] text-[#6B7A72]">
            Total across {pBookings.length} confirmed trip{pBookings.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Metric 3: Net Operator Payout */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6B7A72]">
            <span className="text-xs font-bold uppercase tracking-wider">Net Payouts (85%)</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF3EC] text-[#284435] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif text-2xl font-bold text-emerald-800 block truncate">
            {formatPrice(netEarnings, false)}
          </span>
          <p className="text-[11px] text-[#6B7A72]">
            After 15% TANEXPO escrow & marketing
          </p>
        </div>

        {/* Metric 4: Traveler Rating */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6B7A72]">
            <span className="text-xs font-bold uppercase tracking-wider">Traveler Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-[#284435]">{avgRating}</span>
            <span className="text-xs text-[#8A9790]">/ 5.0</span>
          </div>
          <p className="text-[11px] text-[#6B7A72]">
            From {pReviews.length} verified traveler review{pReviews.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Two Column Layout: Revenue by Package + Regulatory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue by Tour Package */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#284435]">
                Revenue by Tour Package
              </h3>
              <p className="text-xs text-[#6B7A72]">
                Booking performance across your active itinerary offerings
              </p>
            </div>
            <button
              onClick={() => setProviderTab('listings')}
              className="text-xs font-semibold text-[#D97843] hover:underline cursor-pointer"
            >
              Manage Packages →
            </button>
          </div>

          {Object.keys(packageRevenueMap).length === 0 ? (
            <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-[#E8DFC9] text-xs text-[#6B7A72]">
              No booking transactions recorded yet. Leads moving through your CRM will populate here.
            </div>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(packageRevenueMap).map(([title, rev]) => {
                const percentage = Math.round((rev / maxRevenuePkg) * 100);
                return (
                  <div key={title} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#284435] truncate max-w-sm">{title}</span>
                      <span className="font-bold text-[#D97843]">{formatPrice(rev, false)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DFC9]">
                      <div
                        className="h-full bg-linear-to-r from-[#284435] to-[#D97843] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Tanzania Regulatory & Financial Compliance Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% BOT Currency Compliant</span>
            </div>

            <h3 className="font-serif text-lg font-bold text-[#284435]">
              Tanzania Operating Health
            </h3>

            <div className="space-y-3 text-xs text-[#4D5E55]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#284435] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#284435] block">TALA Registration:</span>
                  <span className="text-[#6B7A72]">{provider.talaLicense} (Verified Active)</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#284435] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#284435] block">Currency Law (2025):</span>
                  <span className="text-[#6B7A72]">All client invoices locked to TZS by law.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-[#284435] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#284435] block">Escrow Settlement:</span>
                  <span className="text-[#6B7A72]">M-Pesa / CRDB disbursement on departure.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EBE0]">
            <button
              onClick={() => setProviderTab('financials')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE5D5] text-[#284435] text-xs font-bold border border-[#E8DFC9] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Financial Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
