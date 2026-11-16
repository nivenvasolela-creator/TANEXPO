import React from 'react';
import { useApp } from '../../context/AppContext';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  User, 
  Building2, 
  Printer, 
  QrCode
} from 'lucide-react';

export const BookingVoucherModal: React.FC = () => {
  const { activeVoucher, setActiveVoucher, providers, formatPrice } = useApp();
  const dialogRef = useModalAccessibility(Boolean(activeVoucher), () => setActiveVoucher(null));

  if (!activeVoucher) return null;

  const provider = providers.find((p) => p.id === activeVoucher.providerId);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Official Trip Voucher ${activeVoucher.referenceCode}`}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-white dark:bg-[#0D1511] rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] transition-colors focus:outline-hidden"
      >
        {/* Top Close */}
        <button
          type="button"
          onClick={() => setActiveVoucher(null)}
          aria-label="Close voucher"
          className="absolute top-4 right-4 z-20 min-h-[40px] min-w-[40px] rounded-full bg-black/25 hover:bg-black/45 text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Voucher Header */}
        <div className="bg-[#284435] dark:bg-[#16271E] text-white p-5 sm:p-8 pr-14 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#FAF7F2]">
                TAN<span className="text-[#D97843]">EXPO</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#E8B94A] text-[#1E332A]">
                Official Trip Voucher
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#D3DFD7] block">Voucher Reference</span>
              <span className="font-mono font-bold text-lg text-[#E8B94A] tracking-wider">
                {activeVoucher.referenceCode}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#D3DFD7]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">Status: Booking Confirmed & Verified</span>
            </div>
            <span>Issued: {activeVoucher.createdAt}</span>
          </div>
        </div>

        {/* Voucher Body */}
        <div className="p-5 sm:p-8 space-y-6 bg-[#FAF7F2] dark:bg-[#0D1511] overflow-y-auto flex-1">
          {/* Main Trip Card */}
          <div className="bg-white dark:bg-[#152019] rounded-2xl p-5 border border-[#E8DFC9] dark:border-[#23352A] space-y-4 shadow-xs transition-colors">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
                Itinerary Package
              </span>
              <h3 className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
                {activeVoucher.listingTitle}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-[#F0EBE0] dark:border-[#23352A]">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-[#D97843] mt-0.5" />
                <div>
                  <span className="font-bold text-[#284435] dark:text-[#EDF3EF] block">Trip Departure Date</span>
                  <span className="text-[#4D5E55] dark:text-[#A7B9B0]">{activeVoucher.date}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-[#D97843] mt-0.5" />
                <div>
                  <span className="font-bold text-[#284435] dark:text-[#EDF3EF] block">Lead Passenger</span>
                  <span className="text-[#4D5E55] dark:text-[#A7B9B0]">{activeVoucher.touristName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operator Information */}
          <div className="bg-white dark:bg-[#152019] rounded-2xl p-5 border border-[#E8DFC9] dark:border-[#23352A] space-y-3 shadow-xs transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7A72] dark:text-[#8DA195] block">
              Assigned Tour Operator Details
            </span>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#284435] dark:text-emerald-400" />
                <span className="font-bold text-sm text-[#284435] dark:text-[#EDF3EF]">{activeVoucher.providerName}</span>
              </div>
              {provider && (
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                  TALA Lic: {provider.talaLicense}
                </span>
              )}
            </div>

            {provider && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4D5E55] dark:text-[#A7B9B0] pt-2 border-t border-[#F0EBE0] dark:border-[#23352A]">
                <div>
                  <span className="font-medium text-[#284435] dark:text-[#EDF3EF]">Operations Center:</span> {provider.officeAddress}
                </div>
                <div>
                  <span className="font-medium text-[#284435] dark:text-[#EDF3EF]">Direct Guide Line:</span>{' '}
                  {provider.phone || 'Available after confirmed booking'}
                </div>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white dark:bg-[#152019] rounded-2xl p-5 border border-[#E8DFC9] dark:border-[#23352A] space-y-2 text-xs shadow-xs transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7A72] dark:text-[#8DA195] block mb-2">
              Payment & Compliance Summary
            </span>

            <div className="flex justify-between text-[#4D5E55] dark:text-[#A7B9B0]">
              <span>Gross Booking Total (Legal TZS):</span>
              <span className="font-bold text-[#284435] dark:text-[#EDF3EF]">{formatPrice(activeVoucher.amountTZS)}</span>
            </div>

            <div className="flex justify-between text-[#6B7A72] dark:text-[#8DA195]">
              <span>Payment Rails & Settlement:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Licensed Payment Rails / Verified</span>
            </div>

            <div className="pt-3 border-t border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between text-xs text-[#6B7A72] dark:text-[#8DA195]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#284435] dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Payment processed via licensed partner; operator settlement initiated.</span>
              </div>
              <QrCode className="w-8 h-8 text-[#284435]/40 dark:text-[#8DA195]/40" />
            </div>
          </div>
        </div>

        {/* Voucher Footer Action */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 bg-white dark:bg-[#152019] border-t border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-end gap-3 shrink-0 transition-colors">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2820] hover:bg-[#EDE5D5] dark:hover:bg-[#253A2E] text-[#284435] dark:text-[#EDF3EF] text-xs font-semibold border border-[#E8DFC9] dark:border-[#2A3E31] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveVoucher(null)}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] dark:bg-[#1F3A2C] dark:hover:bg-[#284B38] text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Close Voucher
          </button>
        </div>
      </div>
    </div>
  );
};
