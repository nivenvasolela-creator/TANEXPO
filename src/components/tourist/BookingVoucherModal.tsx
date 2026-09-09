import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Ticket, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  User, 
  Phone, 
  Building2, 
  Printer, 
  Download,
  QrCode
} from 'lucide-react';

export const BookingVoucherModal: React.FC = () => {
  const { activeVoucher, setActiveVoucher, providers, formatPrice } = useApp();

  if (!activeVoucher) return null;

  const provider = providers.find((p) => p.id === activeVoucher.providerId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8DFC9]">
        {/* Top Close */}
        <button
          onClick={() => setActiveVoucher(null)}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-[#1F2A24] flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Voucher Header */}
        <div className="bg-[#284435] text-white p-6 sm:p-8">
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
              <span className="font-semibold text-white">Status: Confirmed & Escrow Secured</span>
            </div>
            <span>Issued: {activeVoucher.createdAt}</span>
          </div>
        </div>

        {/* Voucher Body */}
        <div className="p-6 sm:p-8 space-y-6 bg-[#FAF7F2]">
          {/* Main Trip Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] space-y-4 shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
                Itinerary Package
              </span>
              <h3 className="font-serif text-xl font-bold text-[#284435]">
                {activeVoucher.listingTitle}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-[#F0EBE0]">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-[#D97843] mt-0.5" />
                <div>
                  <span className="font-bold text-[#284435] block">Trip Departure Date</span>
                  <span className="text-[#4D5E55]">{activeVoucher.date}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-[#D97843] mt-0.5" />
                <div>
                  <span className="font-bold text-[#284435] block">Lead Passenger</span>
                  <span className="text-[#4D5E55]">{activeVoucher.touristName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operator Information */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] space-y-3 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7A72] block">
              Assigned Tour Operator Details
            </span>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#284435]" />
                <span className="font-bold text-sm text-[#284435]">{activeVoucher.providerName}</span>
              </div>
              {provider && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  TALA Lic: {provider.talaLicense}
                </span>
              )}
            </div>

            {provider && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4D5E55] pt-2 border-t border-[#F0EBE0]">
                <div>
                  <span className="font-medium">Operations Center:</span> {provider.officeAddress}
                </div>
                <div>
                  <span className="font-medium">Direct Guide Line:</span> {provider.phone}
                </div>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DFC9] space-y-2 text-xs shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7A72] block mb-2">
              Payment & Compliance Summary
            </span>

            <div className="flex justify-between text-[#4D5E55]">
              <span>Gross Booking Total (Legal TZS):</span>
              <span className="font-bold text-[#284435]">{formatPrice(activeVoucher.amountTZS)}</span>
            </div>

            <div className="flex justify-between text-[#6B7A72]">
              <span>Payment Rails & Settlement:</span>
              <span className="font-semibold text-emerald-700">M-Pesa / Escrow Vault Verified</span>
            </div>

            <div className="pt-3 border-t border-[#E8DFC9] flex items-center justify-between text-xs text-[#6B7A72]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#284435]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Funds held in TANEXPO legal escrow until departure clearance.</span>
              </div>
              <QrCode className="w-8 h-8 text-[#284435]/40" />
            </div>
          </div>
        </div>

        {/* Voucher Footer Action */}
        <div className="p-4 bg-white border-t border-[#E8DFC9] flex items-center justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE5D5] text-[#284435] text-xs font-semibold border border-[#E8DFC9] flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={() => setActiveVoucher(null)}
            className="px-5 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold cursor-pointer"
          >
            Close Voucher
          </button>
        </div>
      </div>
    </div>
  );
};
