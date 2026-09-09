import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Heart, 
  Phone, 
  Mail, 
  Calendar, 
  Check, 
  Users, 
  Clock, 
  Truck, 
  Award, 
  Languages, 
  Building2,
  ArrowRight,
  MessageSquareQuote
} from 'lucide-react';

export const ProviderDetailModal: React.FC = () => {
  const { 
    selectedProvider, 
    setSelectedProvider, 
    listings, 
    reviews, 
    savedProviderIds, 
    toggleSaveProvider, 
    setInquiryPackage,
    formatPrice
  } = useApp();

  const [activeTab, setActiveTab] = useState<'packages' | 'about' | 'reviews'>('packages');

  if (!selectedProvider) return null;

  const providerListings = listings.filter((l) => l.providerId === selectedProvider.id && l.active);
  const providerReviews = reviews.filter((r) => r.providerId === selectedProvider.id);
  const isSaved = savedProviderIds.includes(selectedProvider.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-[#FAF7F2] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#E8DFC9]">
        {/* Modal Top Close */}
        <button
          onClick={() => setSelectedProvider(null)}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Close profile"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Hero Banner */}
        <div className="relative bg-linear-to-r from-[#1C2D24] via-[#284435] to-[#16241D] text-white p-6 sm:p-8 shrink-0">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>TALA Verified License: {selectedProvider.talaLicense}</span>
              </span>
              <span className="text-xs bg-[#E8B94A]/20 text-[#E8B94A] font-semibold px-2.5 py-1 rounded-full border border-[#E8B94A]/30">
                Est. {selectedProvider.establishedYear}
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight mb-2">
              {selectedProvider.name}
            </h2>
            <p className="text-sm text-[#D3DFD7] font-medium mb-4 max-w-xl">
              {selectedProvider.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#BED0C5]">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D97843]" />
                <span>{selectedProvider.location} ({selectedProvider.region})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <Star className="w-3.5 h-3.5 fill-[#E8B94A] text-[#E8B94A]" />
                <span className="font-bold text-white">{selectedProvider.rating.toFixed(1)}</span>
                <span>({selectedProvider.reviewsCount} verified traveler reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#E8B94A]" />
                <span>{selectedProvider.tripsCompleted}+ trips completed</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <button
              onClick={() => toggleSaveProvider(selectedProvider.id)}
              className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center gap-2 text-xs font-semibold backdrop-blur-md cursor-pointer transition-all border border-white/20"
            >
              <Heart className={`w-4 h-4 ${isSaved ? "fill-red-400 text-red-400" : ""}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved to Wishlist' : 'Save Provider'}</span>
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#E8DFC9] bg-white px-6 shrink-0">
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'packages'
                ? 'border-[#D97843] text-[#284435]'
                : 'border-transparent text-[#6B7A72] hover:text-[#1F2A24]'
            }`}
          >
            Available Tour Packages ({providerListings.length})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'about'
                ? 'border-[#D97843] text-[#284435]'
                : 'border-transparent text-[#6B7A72] hover:text-[#1F2A24]'
            }`}
          >
            About & Credentials
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#D97843] text-[#284435]'
                : 'border-transparent text-[#6B7A72] hover:text-[#1F2A24]'
            }`}
          >
            Traveler Reviews ({providerReviews.length})
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="bg-[#EAF3EC] p-3.5 rounded-2xl border border-[#CDE3D4] flex items-center justify-between gap-3 text-xs text-[#284435]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#284435] shrink-0" />
                  <span><strong>Bank of Tanzania Legal Rate Guarantee:</strong> All packages are priced transparently in TZS with no hidden fees.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {providerListings.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-2xl border border-[#E8DFC9] p-5 shadow-xs hover:border-[#284435] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold bg-[#FAF7F2] text-[#6B7A72] border border-[#E8DFC9] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#D97843]" />
                          {pkg.duration}
                        </span>
                        {pkg.maxGroupSize && (
                          <span className="text-[11px] font-semibold bg-[#FAF7F2] text-[#6B7A72] border border-[#E8DFC9] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#284435]" />
                            Max {pkg.maxGroupSize} guests
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-lg font-bold text-[#284435]">
                        {pkg.title}
                      </h4>
                      <p className="text-xs text-[#4D5E55] leading-relaxed max-w-2xl">
                        {pkg.description}
                      </p>

                      {/* Inclusions summary */}
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-[#8A9790] block mb-1.5">
                          Package Inclusions:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#4D5E55]">
                          {pkg.inclusions.map((inc, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-tight">{inc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price & Request Quote Button */}
                    <div className="w-full md:w-auto md:min-w-[220px] bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC9] text-center md:text-right shrink-0 space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-[#8A9790] block">
                          Legal Official Rate
                        </span>
                        <div className="font-bold text-base text-[#284435]">
                          {formatPrice(pkg.priceTZS)}
                        </div>
                        <span className="text-[11px] text-[#6B7A72]">{pkg.unit}</span>
                      </div>

                      <button
                        onClick={() => {
                          setInquiryPackage({ provider: selectedProvider, listing: pkg });
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#D97843] hover:bg-[#C26735] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquareQuote className="w-4 h-4" />
                        <span>Request Custom Quote</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E8DFC9] p-6 space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#284435]">Company Background</h3>
                <p className="text-sm text-[#4D5E55] leading-relaxed">
                  {selectedProvider.about}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#F0EBE0] text-xs">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-[#284435] mt-0.5" />
                    <div>
                      <span className="font-bold text-[#284435] block">Office Location</span>
                      <span className="text-[#6B7A72]">{selectedProvider.officeAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-[#284435] mt-0.5" />
                    <div>
                      <span className="font-bold text-[#284435] block">Direct Operator Line</span>
                      <span className="text-[#6B7A72]">{selectedProvider.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Languages className="w-4 h-4 text-[#284435] mt-0.5" />
                    <div>
                      <span className="font-bold text-[#284435] block">Guide Spoken Languages</span>
                      <span className="text-[#6B7A72]">{selectedProvider.languages.join(', ')}</span>
                    </div>
                  </div>
                  {selectedProvider.fleetInfo && (
                    <div className="flex items-start gap-3">
                      <Truck className="w-4 h-4 text-[#284435] mt-0.5" />
                      <div>
                        <span className="font-bold text-[#284435] block">Safari Fleet & Equipment</span>
                        <span className="text-[#6B7A72]">{selectedProvider.fleetInfo}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#F0EBE0]">
                  <span className="text-xs font-bold text-[#284435] block mb-2">Accreditations & Badges</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider.badges.map((b, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[#FAF7F2] border border-[#E8DFC9] rounded-full text-xs font-medium text-[#284435]">
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] flex items-center justify-between">
                <div>
                  <div className="font-serif text-2xl font-bold text-[#284435] flex items-center gap-2">
                    <span>{selectedProvider.rating.toFixed(1)}</span>
                    <div className="flex text-[#E8B94A] text-base">
                      {'★'.repeat(Math.round(selectedProvider.rating))}
                    </div>
                  </div>
                  <p className="text-xs text-[#6B7A72]">Based on {selectedProvider.reviewsCount} verified traveler trips</p>
                </div>
                <div className="text-right text-xs text-[#6B7A72]">
                  100% verified traveler feedback
                </div>
              </div>

              {providerReviews.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E8DFC9] text-xs text-[#6B7A72]">
                  No reviews submitted yet for this provider.
                </div>
              ) : (
                providerReviews.map((rev) => (
                  <div key={rev.id} className="bg-white rounded-2xl border border-[#E8DFC9] p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-[#284435]">{rev.touristName}</span>
                        <span className="text-xs text-[#8A9790] block">• Trip: {rev.tripPackage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex text-[#E8B94A] text-xs">
                          {'★'.repeat(rev.rating)}
                        </div>
                        <span className="text-[11px] text-[#8A9790]">{rev.date}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#4D5E55] leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                    {rev.providerResponse && (
                      <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFC9] text-xs text-[#284435] mt-2">
                        <span className="font-bold block text-[11px] text-[#D97843] mb-1">
                          Response from {selectedProvider.name}:
                        </span>
                        <p>{rev.providerResponse}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
