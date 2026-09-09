import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Banknote, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ArrowDownRight,
  ExternalLink
} from 'lucide-react';
import { COMMISSION_RATE } from '../../data/initialData';

export const FinancialsTab: React.FC = () => {
  const { activeProviderId, transactions, bookings, formatPrice } = useApp();

  const [selectedDisbursementRail, setSelectedDisbursementRail] = useState<string>('M-Pesa');
  const [phoneNumber, setPhoneNumber] = useState('+255 754 882 109');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const pTransactions = transactions.filter((t) => t.providerId === activeProviderId);
  const pBookings = bookings.filter((b) => b.providerId === activeProviderId);

  const grossRevenue = pBookings.reduce((sum, b) => sum + b.amountTZS, 0);
  const totalCommission = Math.round(grossRevenue * COMMISSION_RATE);
  const totalNet = grossRevenue - totalCommission;

  const handleSavePayoutSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
            Tanzanian Shilling (TZS) Settlement Engine
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435]">
            Financials, Escrow & Payouts
          </h2>
          <p className="text-xs text-[#6B7A72] mt-0.5">
            Transparent revenue splits, platform commission tracking, and direct mobile money disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#EAF3EC] px-3.5 py-1.5 rounded-xl border border-[#CDE3D4] text-xs font-semibold text-[#284435]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>BOT 100% TZS Mandate Compliant</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-1">
          <span className="text-xs text-[#6B7A72] font-semibold uppercase tracking-wider block">
            Total Gross Bookings
          </span>
          <span className="font-serif text-2xl font-bold text-[#284435] block truncate">
            {formatPrice(grossRevenue, false)}
          </span>
          <span className="text-[11px] text-[#6B7A72]">
            Total value of client trips
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-1">
          <span className="text-xs text-[#6B7A72] font-semibold uppercase tracking-wider block">
            TANEXPO Fee (15%)
          </span>
          <span className="font-serif text-2xl font-bold text-[#D97843] block truncate">
            {formatPrice(totalCommission, false)}
          </span>
          <span className="text-[11px] text-[#6B7A72]">
            Escrow, platform & marketing support
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs space-y-1">
          <span className="text-xs text-[#6B7A72] font-semibold uppercase tracking-wider block">
            Total Net Operator Payouts (85%)
          </span>
          <span className="font-serif text-2xl font-bold text-emerald-800 block truncate">
            {formatPrice(totalNet, false)}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            Disbursed upon trip departure
          </span>
        </div>
      </div>

      {/* Payout Rail Setup */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#284435]">
              Disbursement Settlement Channel
            </h3>
            <p className="text-xs text-[#6B7A72]">
              Choose how you want your funds disbursed once traveler departure is confirmed.
            </p>
          </div>
          {isSavedNotice && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ✓ Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSavePayoutSettings} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435]">Payment Rail</label>
            <select
              value={selectedDisbursementRail}
              onChange={(e) => setSelectedDisbursementRail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden"
            >
              <option value="M-Pesa">Vodacom M-Pesa (Instant Mobile Money)</option>
              <option value="Tigo Pesa">Tigo Pesa (Instant Mobile Money)</option>
              <option value="Airtel Money">Airtel Money (Instant)</option>
              <option value="CRDB Bank">CRDB Bank (Direct Bank Transfer)</option>
              <option value="NMB Bank">NMB Bank (Direct Bank Transfer)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435]">Account / Phone Number</label>
            <input
              type="text"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+255 7XX XXX XXX or Account Number"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Update Settlement Rails
            </button>
          </div>
        </form>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white rounded-3xl border border-[#E8DFC9] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#F0EBE0] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#284435]">
              Disbursement & Escrow Ledger
            </h3>
            <p className="text-xs text-[#6B7A72]">
              Itemized record of client bookings, 15% platform commissions, and net payouts
            </p>
          </div>
          <span className="text-xs text-[#6B7A72] font-semibold">
            {pTransactions.length} Transactions
          </span>
        </div>

        {pTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B7A72]">
            No settled transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] text-[#6B7A72] uppercase font-bold text-[10px] tracking-wider border-b border-[#E8DFC9]">
                  <th className="py-3 px-4">Ref / Tx ID</th>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">Platform Fee (15%)</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Rail</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE0] text-[#1F2A24]">
                {pTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#284435]">
                      {tx.id}
                      <span className="block text-[10px] text-[#8A9790] font-normal">{tx.payoutRef}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {tx.touristName}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#284435]">
                      {formatPrice(tx.grossTZS, false)}
                    </td>
                    <td className="py-3 px-4 text-[#D97843] font-semibold">
                      -{formatPrice(tx.platformFeeTZS, false)}
                    </td>
                    <td className="py-3 px-4 text-emerald-800 font-bold">
                      {formatPrice(tx.netTZS, false)}
                    </td>
                    <td className="py-3 px-4 text-[#4D5E55]">
                      {tx.paymentRail}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          tx.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {tx.status === 'Paid' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{tx.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6B7A72]">
                      {tx.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
