import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Award, 
  Languages, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Coins 
} from 'lucide-react';

export const CompareModal: React.FC = () => {
  const { 
    isCompareModalOpen, 
    setIsCompareModalOpen, 
    comparedProviderIds, 
    toggleCompareProvider, 
    clearCompare, 
    providers, 
    listings, 
    setSelectedProvider, 
    formatPrice,
    t
  } = useApp();

  if (!isCompareModalOpen || comparedProviderIds.length === 0) return null;

  const comparedProviders = providers.filter((p) => comparedProviderIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-[#FAF7F2] rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#E8DFC9]">
        {/* Modal Top Header */}
        <div className="p-6 bg-white border-b border-[#E8DFC9] flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#D97843] uppercase tracking-wider">
                Side-by-Side Comparison
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#284435] font-semibold border border-[#E8DFC9]">
                {comparedProviders.length} Selected
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#284435]">
              Compare Local Tour Operators
            </h2>
            <p className="text-xs text-[#6B7A72]">
              Compare credentials, fleet equipment, languages, and pricing to find the right fit for your itinerary.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearCompare}
              className="text-xs font-semibold text-[#6B7A72] hover:text-red-600 px-3 py-1.5 rounded-xl border border-[#E8DFC9] hover:bg-red-50 transition-colors cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#EDE5D5] text-[#1F2A24] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 overflow-y-auto overflow-x-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-[700px]">
            {comparedProviders.map((provider) => {
              const pPackages = listings.filter((l) => l.providerId === provider.id && l.active);
              const minPrice = pPackages.length > 0 ? Math.min(...pPackages.map((l) => l.priceTZS)) : 0;

              return (
                <div
                  key={provider.id}
                  className="bg-white rounded-2xl border border-[#E8DFC9] overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#F0EBE0] pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#6B7A72] mb-1">
                          <MapPin className="w-3.5 h-3.5 text-[#D97843]" />
                          <span>{provider.location}</span>
                        </div>
                        <h3 className="font-serif font-bold text-lg text-[#284435]">
                          {provider.name}
                        </h3>
                        <p className="text-[11px] text-[#D97843] font-medium mt-0.5 line-clamp-1">
                          {provider.tagline}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleCompareProvider(provider.id)}
                        className="text-zinc-400 hover:text-red-500 p-1"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Ratings & Verification */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7A72]">Rating & Reviews:</span>
                        <div className="flex items-center gap-1 font-bold text-[#284435]">
                          <Star className="w-3.5 h-3.5 fill-[#E8B94A] text-[#E8B94A]" />
                          <span>{provider.rating.toFixed(1)}</span>
                          <span className="text-zinc-400 font-normal">({provider.reviewsCount})</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7A72]">TALA License:</span>
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          {provider.talaLicense}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7A72]">Trips Completed:</span>
                        <span className="font-semibold text-[#284435]">
                          {provider.tripsCompleted}+ trips
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7A72]">Established:</span>
                        <span className="font-semibold text-[#284435]">
                          {provider.establishedYear}
                        </span>
                      </div>
                    </div>

                    {/* Starting Rates */}
                    <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE5D5] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#8A9790] block">
                        Lowest Package Rate
                      </span>
                      <div className="font-bold text-sm text-[#284435]">
                        {minPrice > 0 ? formatPrice(minPrice) : 'On Request'}
                      </div>
                    </div>

                    {/* Fleet & Equipment */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[#8A9790] font-bold text-[10px] uppercase block">
                        Fleet & Gear:
                      </span>
                      <div className="p-2 rounded-lg bg-[#FAF7F2] text-[#4D5E55] text-[11px] flex items-start gap-2">
                        <Truck className="w-3.5 h-3.5 text-[#284435] shrink-0 mt-0.5" />
                        <span>{provider.fleetInfo || 'Custom safari outfitted vehicles'}</span>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[#8A9790] font-bold text-[10px] uppercase block">
                        Languages Spoken:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {provider.languages.map((lang) => (
                          <span
                            key={lang}
                            className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DFC9] text-[11px] text-[#4D5E55]"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Popular Tours */}
                    <div className="space-y-1.5 pt-2 border-t border-[#F0EBE0]">
                      <span className="text-[10px] uppercase font-bold text-[#8A9790] block">
                        Active Packages ({pPackages.length})
                      </span>
                      {pPackages.slice(0, 3).map((pkg) => (
                        <div key={pkg.id} className="text-xs text-[#284435] truncate">
                          • {pkg.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFC9]">
                    <button
                      onClick={() => {
                        setIsCompareModalOpen(false);
                        setSelectedProvider(provider);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>View Full Profile & Quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
