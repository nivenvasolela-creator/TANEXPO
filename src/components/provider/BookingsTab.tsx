import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  User, 
  Phone, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Truck,
  FileCheck,
  Check,
  Edit2
} from 'lucide-react';

export const BookingsTab: React.FC = () => {
  const { activeProviderId, bookings, setActiveVoucher, updateBookingStatus, formatPrice } = useApp();

  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [driverInput, setDriverInput] = useState('');
  const [vehicleInput, setVehicleInput] = useState('');

  const providerBookings = bookings.filter((b) => b.providerId === activeProviderId);

  const handleStartEdit = (b: any) => {
    setEditingBookingId(b.id);
    setDriverInput(b.assignedDriver || '');
    setVehicleInput(b.vehicleReg || '');
  };

  const handleSaveLogistics = (bookingId: number) => {
    updateBookingStatus(bookingId, 'Upcoming', driverInput, vehicleInput);
    setEditingBookingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
            Trip Logistics & Schedule
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435]">
            Confirmed Bookings ({providerBookings.length})
          </h2>
          <p className="text-xs text-[#6B7A72] mt-0.5">
            Confirmed traveler bookings, assigned vehicles, and escrow payout schedules.
          </p>
        </div>

        <div className="bg-[#FAF7F2] px-4 py-2 rounded-xl border border-[#E8DFC9] text-xs text-[#284435] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All trips backed by TANEXPO Escrow Protection</span>
        </div>
      </div>

      {providerBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8DFC9] p-12 text-center max-w-md mx-auto space-y-3">
          <Calendar className="w-12 h-12 text-[#DED5C6] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#284435]">No Bookings Yet</h3>
          <p className="text-xs text-[#6B7A72]">
            When you or a traveler accepts a custom quote, confirmed bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {providerBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-[#E8DFC9] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#284435] transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#D97843] bg-[#FAF7F2] border border-[#E8DFC9] px-2.5 py-0.5 rounded-md">
                    {b.referenceCode}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      b.status === 'Upcoming'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : b.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-300'
                    }`}
                  >
                    ● {b.status}
                  </span>
                  {b.paymentMethod && (
                    <span className="text-[10px] text-[#6B7A72] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DFC9]">
                      Paid via {b.paymentMethod}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-base font-bold text-[#284435]">
                  {b.listingTitle}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#4D5E55] pt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D97843]" />
                    <span>Traveler: <strong>{b.touristName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#6B7A72]" />
                    <span>{b.touristContact}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#284435]" />
                    <span>Date: <strong>{b.date}</strong></span>
                  </div>
                </div>

                {/* Logistics Allocation (Driver & Vehicle) */}
                <div className="pt-2 border-t border-[#F0EBE0] flex flex-wrap items-center gap-4 text-xs text-[#6B7A72]">
                  {editingBookingId === b.id ? (
                    <div className="flex flex-wrap items-center gap-2 w-full pt-1">
                      <input
                        type="text"
                        value={driverInput}
                        onChange={(e) => setDriverInput(e.target.value)}
                        placeholder="Assigned Guide / Driver"
                        className="px-2.5 py-1 text-xs rounded-lg border border-[#DED5C6] bg-[#FAF7F2]"
                      />
                      <input
                        type="text"
                        value={vehicleInput}
                        onChange={(e) => setVehicleInput(e.target.value)}
                        placeholder="Vehicle Reg (e.g. T 428 DZA Land Cruiser)"
                        className="px-2.5 py-1 text-xs rounded-lg border border-[#DED5C6] bg-[#FAF7F2]"
                      />
                      <button
                        onClick={() => handleSaveLogistics(b.id)}
                        className="px-3 py-1 bg-[#284435] text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#284435]" />
                        <span>Guide/Driver: <strong>{b.assignedDriver || 'Unassigned'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Vehicle: <strong>{b.vehicleReg || 'Standard 4x4 Safari Cruiser'}</strong></span>
                      </div>
                      <button
                        onClick={() => handleStartEdit(b)}
                        className="text-[11px] font-semibold text-[#D97843] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Logistics</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Financial Breakdown & Actions */}
              <div className="w-full md:w-auto bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFC9] flex flex-row md:flex-col justify-between items-center md:items-end gap-3 shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-[#6B7A72] block">Net Operator Payout (85%)</span>
                  <span className="font-bold text-sm text-emerald-800">
                    {formatPrice(b.netPayoutTZS, false)}
                  </span>
                  <span className="text-[10px] text-[#8A9790] block">
                    Gross: {formatPrice(b.amountTZS, false)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === 'Upcoming' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'Completed')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Mark as successfully completed after trip returns"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete Trip</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveVoucher(b)}
                    className="px-3 py-1.5 rounded-lg bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Ticket className="w-3.5 h-3.5 text-[#E8B94A]" />
                    <span>Voucher</span>
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
