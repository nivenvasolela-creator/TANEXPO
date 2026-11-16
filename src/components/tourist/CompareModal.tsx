import React from 'react';
import { useApp } from '../../context/AppContext';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import { 
  X, 
  Star, 
  MapPin, 
  Truck, 
  ArrowRight
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
    formatPrice
  } = useApp();

  const isOpen = isCompareModalOpen && comparedProviderIds.length > 0;
  const dialogRef = useModalAccessibility(isOpen, () => setIsCompareModalOpen(false));

  if (!isOpen) return null;

  const comparedProviders = providers.filter((p) => comparedProviderIds.includes(p.id));

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Compare Local Tour Operators"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-[#FAF7F2] dark:bg-[#0D1511] rounded-t-3xl sm:rounded-3xl max-w-5xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] transition-colors focus:outline-hidden"
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-white dark:bg-[#152019] border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between gap-4 shrink-0 transition-colors">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#D97843] uppercase tracking-wider">
                Side-by-Side Comparison
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF7F2] dark:bg-[#1A2820] text-[#284435] dark:text-[#EDF3EF] font-semibold border border-[#E8DFC9] dark:border-[#2A3E31]">
                {comparedProviders.length} Selected
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#284435] dark:text-[#EDF3EF]">
              Compare Local Tour Operators
            </h2>
            <p className="text-xs text-[#6B7A72] dark:text-[#8DA195]">
              Compare credentials, fleet equipment, languages, and pricing to find the right fit for your itinerary.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={clearCompare}
              className="min-h-[40px] text-xs font-semibold text-[#6B7A72] dark:text-[#8DA195] hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-xl border border-[#E8DFC9] dark:border-[#2A3E31] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(false)}
              aria-label="Close comparison dialog"
              className="min-h-[40px] min-w-[40px] rounded-full bg-[#FAF7F2] dark:bg-[#1A2820] hover:bg-[#EDE5D5] dark:hover:bg-[#253A2E] text-[#1F2A24] dark:text-[#EDF3EF] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6 overflow-y-auto overflow-x-auto flex-1 bg-[#FAF7F2] dark:bg-[#0D1511] transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:min-w-[700px]">
            {comparedProviders.map((provider) => {
              const pPackages = listings.filter((l) => l.providerId === provider.id && l.active);
              const minPrice = pPackages.length > 0 ? Math.min(...pPackages.map((l) => l.priceTZS)) : 0;

              return (
                <div
                  key={provider.id}
                  className="bg-white dark:bg-[#152019] rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] overflow-hidden shadow-xs flex flex-col justify-between transition-colors"
                >
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#F0EBE0] dark:border-[#23352A] pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#6B7A72] dark:text-[#8DA195] mb-1">
                          <MapPin className="w-3.5 h-3.5 text-[#D97843]" />
                          <span>{provider.location}</span>
                        </div>
                        <h3 className="font-serif font-bold text-lg text-[#284435] dark:text-[#EDF3EF]">
                          {provider.name}
                        </h3>
                        <p className="text-[11px] text-[#D97843] font-medium mt-0.5 line-clamp-1">
                          {provider.tagline}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCompareProvider(provider.id)}
                        aria-label={`Remove ${provider.name} from comparison`}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-red-500 p-1 cursor-pointer"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Ratings & Verification */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7A72] dark:text-[#8DA195]">Rating & Reviews:</span>
                        <div className="flex items-center gap-1 font-bold text-[#284435] dark:text-[#EDF3EF]">
                          <Star className="w-3.5 h-3.5 fill-[#E8B94A] text-[#E8B94A]" />
                          {provider.reviewsCount > 0 ? (
                            <>
                              <span>{provider.rating.toFixed(1)}</span>
                              <span className="text-zinc-400 font-normal">({provider.reviewsCount})</span>
                            </>
                          ) : (
                            <span>New</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7A72] dark:text-[#8DA195]">TALA License:</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${
                            provider.verified
                              ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80'
                              : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80'
                          }`}
                        >
                          {provider.verified ? provider.talaLicense : `${provider.talaLicense} (Pending)`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7A72] dark:text-[#8DA195]">Trips Completed:</span>
                        <span className="font-semibold text-[#284435] dark:text-[#EDF3EF]">
                          {provider.tripsCompleted}+ trips
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7A72] dark:text-[#8DA195]">Established:</span>
                        <span className="font-semibold text-[#284435] dark:text-[#EDF3EF]">
                          {provider.establishedYear}
                        </span>
                      </div>
                    </div>

                    {/* Starting Rates */}
                    <div className="bg-[#FAF7F2] dark:bg-[#101914] p-3 rounded-xl border border-[#EDE5D5] dark:border-[#23352A] space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#8A9790] dark:text-[#8DA195] block">
                        Lowest Package Rate
                      </span>
                      <div className="font-bold text-sm text-[#284435] dark:text-[#EDF3EF]">
                        {minPrice > 0 ? formatPrice(minPrice) : 'On Request'}
                      </div>
                    </div>

                    {/* Fleet & Equipment */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[#8A9790] dark:text-[#8DA195] font-bold text-[10px] uppercase block">
                        Fleet & Gear:
                      </span>
                      <div className="p-2 rounded-lg bg-[#FAF7F2] dark:bg-[#101914] text-[#4D5E55] dark:text-[#A7B9B0] text-[11px] flex items-start gap-2">
                        <Truck className="w-3.5 h-3.5 text-[#284435] dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{provider.fleetInfo || 'Custom safari outfitted vehicles'}</span>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[#8A9790] dark:text-[#8DA195] font-bold text-[10px] uppercase block">
                        Languages Spoken:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {provider.languages.map((lang) => (
                          <span
                            key={lang}
                            className="px-2 py-0.5 rounded-md bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A] text-[11px] text-[#4D5E55] dark:text-[#A7B9B0]"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Popular Tours */}
                    <div className="space-y-1.5 pt-2 border-t border-[#F0EBE0] dark:border-[#23352A]">
                      <span className="text-[10px] uppercase font-bold text-[#8A9790] dark:text-[#8DA195] block">
                        Active Packages ({pPackages.length})
                      </span>
                      {pPackages.slice(0, 3).map((pkg) => (
                        <div key={pkg.id} className="text-xs text-[#284435] dark:text-[#EDF3EF] truncate">
                          • {pkg.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="p-4 bg-[#FAF7F2] dark:bg-[#101914] border-t border-[#E8DFC9] dark:border-[#23352A]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCompareModalOpen(false);
                        setSelectedProvider(provider);
                      }}
                      className="w-full min-h-[44px] py-2.5 rounded-xl bg-[#284435] hover:bg-[#1E332A] dark:bg-[#1F3A2C] dark:hover:bg-[#284B38] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
