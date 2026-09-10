import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  PackagePlus, 
  Edit3, 
  Trash2, 
  Clock, 
  Users, 
  Check, 
  ShieldCheck,
  Eye,
  Plus
} from 'lucide-react';

export const ListingsTab: React.FC = () => {
  const { 
    activeProviderId, 
    listings, 
    setEditingListing, 
    setIsNewListingModalOpen, 
    deleteListing,
    formatPrice
  } = useApp();

  const providerListings = listings.filter((l) => l.providerId === activeProviderId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#152019] p-6 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs transition-colors">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
            Package Catalog Management
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435] dark:text-[#EDF3EF]">
            Tour Packages & Itineraries ({providerListings.length})
          </h2>
          <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] mt-0.5">
            Configure published itineraries, durations, transparent inclusions, and TZS legal rates.
          </p>
        </div>

        <button
          onClick={() => setIsNewListingModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#284435] dark:bg-emerald-800 hover:bg-[#1E332A] dark:hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#E8B94A]" />
          <span>Add New Package</span>
        </button>
      </div>

      {providerListings.length === 0 ? (
        <div className="bg-white dark:bg-[#152019] rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] p-12 text-center max-w-md mx-auto space-y-3 transition-colors">
          <PackagePlus className="w-12 h-12 text-[#DED5C6] dark:text-[#23352A] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">No Packages Created Yet</h3>
          <p className="text-xs text-[#6B7A72] dark:text-[#8DA195]">
            Create your first safari, cultural walk, or mountain package to accept bookings from travelers.
          </p>
          <button
            onClick={() => setIsNewListingModalOpen(true)}
            className="px-4 py-2 bg-[#284435] dark:bg-emerald-800 hover:bg-[#1E332A] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Create Tour Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providerListings.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white dark:bg-[#152019] rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] p-6 flex flex-col justify-between shadow-xs hover:border-[#284435] dark:hover:border-emerald-600 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold bg-[#FAF7F2] dark:bg-[#101914] text-[#6B7A72] dark:text-[#8DA195] border border-[#E8DFC9] dark:border-[#23352A] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#D97843]" />
                    {pkg.duration}
                  </span>
                  {pkg.maxGroupSize && (
                    <span className="text-[11px] font-semibold bg-[#FAF7F2] dark:bg-[#101914] text-[#6B7A72] dark:text-[#8DA195] border border-[#E8DFC9] dark:border-[#23352A] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#284435] dark:text-emerald-400" />
                      Max {pkg.maxGroupSize}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF] leading-snug">
                    {pkg.title}
                  </h3>
                  <p className="text-xs text-[#4D5E55] dark:text-[#B5C5BC] mt-1 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>

                {/* Inclusions summary */}
                <div className="space-y-1 pt-2 border-t border-[#F0EBE0] dark:border-[#23352A]">
                  <span className="text-[10px] uppercase font-bold text-[#8A9790] dark:text-[#6B7A72] block">Inclusions:</span>
                  <div className="space-y-1 text-[11px] text-[#4D5E55] dark:text-[#A7B9B0]">
                    {pkg.inclusions.slice(0, 3).map((inc, i) => (
                      <div key={i} className="flex items-start gap-1.5 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                    {pkg.inclusions.length > 3 && (
                      <span className="text-[10px] text-[#6B7A72] dark:text-[#8DA195] font-semibold pl-5">
                        +{pkg.inclusions.length - 3} more items included
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Price & Actions */}
              <div className="pt-4 mt-4 border-t border-[#F0EBE0] dark:border-[#23352A] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-[#8A9790] dark:text-[#6B7A72] block">Standard Rate</span>
                  <div className="font-bold text-sm text-[#284435] dark:text-[#EDF3EF]">
                    {formatPrice(pkg.priceTZS)}
                  </div>
                  <span className="text-[10px] text-[#6B7A72] dark:text-[#8DA195]">{pkg.unit}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingListing(pkg)}
                    className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#101914] hover:bg-[#EDE5D5] dark:hover:bg-[#1C2C24] text-[#284435] dark:text-[#EDF3EF] border border-[#E8DFC9] dark:border-[#23352A] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Edit package"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => deleteListing(pkg.id)}
                    className="p-2 rounded-xl bg-white dark:bg-[#101914] hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-600 border border-[#E8DFC9] dark:border-[#23352A] cursor-pointer transition-colors"
                    title="Delete package"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
