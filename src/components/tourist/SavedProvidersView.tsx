import React from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, MapPin, Star, ArrowRight, ShieldCheck, Trash2 } from 'lucide-react';

export const SavedProvidersView: React.FC = () => {
  const { 
    providers, 
    savedProviderIds, 
    toggleSaveProvider, 
    setSelectedProvider, 
    listings,
    formatPrice 
  } = useApp();

  const savedProviders = providers.filter((p) => savedProviderIds.includes(p.id));

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9]">
        <span className="text-xs font-bold text-[#D97843] uppercase tracking-wider block mb-1">
          Traveler Wishlist
        </span>
        <h2 className="font-serif text-2xl font-bold text-[#284435]">
          Saved Local Operators ({savedProviders.length})
        </h2>
        <p className="text-xs text-[#6B7A72] mt-0.5">
          Bookmark safari companies, mountain expedition teams, and Zanzibar captains to review and compare later.
        </p>
      </div>

      {savedProviders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8DFC9] p-12 text-center max-w-md mx-auto space-y-3">
          <Heart className="w-12 h-12 text-[#DED5C6] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#284435]">Your Wishlist is Empty</h3>
          <p className="text-xs text-[#6B7A72]">
            Tap the heart icon on any operator card while browsing to save them here for quick quoting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProviders.map((provider) => {
            const providerListings = listings.filter((l) => l.providerId === provider.id && l.active);
            const minPrice = providerListings.length > 0 
              ? Math.min(...providerListings.map((l) => l.priceTZS)) 
              : 0;

            return (
              <div
                key={provider.id}
                className="bg-white rounded-2xl border border-[#E8DFC9] p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>TALA Verified</span>
                    </span>
                    <button
                      onClick={() => toggleSaveProvider(provider.id)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 
                    onClick={() => setSelectedProvider(provider)}
                    className="font-serif text-xl font-bold text-[#284435] hover:text-[#D97843] cursor-pointer mb-1"
                  >
                    {provider.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#6B7A72] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#D97843]" />
                    <span>{provider.location}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-700 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{provider.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#4D5E55] line-clamp-3 leading-relaxed mb-4">
                    {provider.about}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#F0EBE0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-[#8A9790] block">Starting from</span>
                    <span className="font-bold text-sm text-[#284435]">
                      {minPrice > 0 ? formatPrice(minPrice) : 'On Request'}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedProvider(provider)}
                    className="px-3.5 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>View Packages</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
