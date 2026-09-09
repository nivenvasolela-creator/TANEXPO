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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
            Package Catalog Management
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435]">
            Tour Packages & Itineraries ({providerListings.length})
          </h2>
          <p className="text-xs text-[#6B7A72] mt-0.5">
            Configure published itineraries, durations, transparent inclusions, and TZS legal rates.
          </p>
        </div>

        <button
          onClick={() => setIsNewListingModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#E8B94A]" />
          <span>Add New Package</span>
        </button>
      </div>

      {providerListings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8DFC9] p-12 text-center max-w-md mx-auto space-y-3">
          <PackagePlus className="w-12 h-12 text-[#DED5C6] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#284435]">No Packages Created Yet</h3>
          <p className="text-xs text-[#6B7A72]">
            Create your first safari, cultural walk, or mountain package to accept bookings from travelers.
          </p>
          <button
            onClick={() => setIsNewListingModalOpen(true)}
            className="px-4 py-2 bg-[#284435] text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Create Tour Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providerListings.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-[#E8DFC9] p-6 flex flex-col justify-between shadow-xs hover:border-[#284435] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold bg-[#FAF7F2] text-[#6B7A72] border border-[#E8DFC9] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#D97843]" />
                    {pkg.duration}
                  </span>
                  {pkg.maxGroupSize && (
                    <span className="text-[11px] font-semibold bg-[#FAF7F2] text-[#6B7A72] border border-[#E8DFC9] px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#284435]" />
                      Max {pkg.maxGroupSize}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-[#284435] leading-snug">
                    {pkg.title}
                  </h3>
                  <p className="text-xs text-[#4D5E55] mt-1 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>

                {/* Inclusions summary */}
                <div className="space-y-1 pt-2 border-t border-[#F0EBE0]">
                  <span className="text-[10px] uppercase font-bold text-[#8A9790] block">Inclusions:</span>
                  <div className="space-y-1 text-[11px] text-[#4D5E55]">
                    {pkg.inclusions.slice(0, 3).map((inc, i) => (
                      <div key={i} className="flex items-start gap-1.5 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                    {pkg.inclusions.length > 3 && (
                      <span className="text-[10px] text-[#6B7A72] font-semibold pl-5">
                        +{pkg.inclusions.length - 3} more items included
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Price & Actions */}
              <div className="pt-4 mt-4 border-t border-[#F0EBE0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-[#8A9790] block">Standard Rate</span>
                  <div className="font-bold text-sm text-[#284435]">
                    {formatPrice(pkg.priceTZS)}
                  </div>
                  <span className="text-[10px] text-[#6B7A72]">{pkg.unit}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingListing(pkg)}
                    className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE5D5] text-[#284435] border border-[#E8DFC9] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Edit package"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => deleteListing(pkg.id)}
                    className="p-2 rounded-xl bg-white hover:bg-red-50 text-zinc-400 hover:text-red-600 border border-[#E8DFC9] cursor-pointer transition-colors"
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
