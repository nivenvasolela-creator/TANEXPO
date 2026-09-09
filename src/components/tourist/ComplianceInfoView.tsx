import React from 'react';
import { ShieldCheck, Scale, Banknote, FileCheck, CheckCircle2 } from 'lucide-react';

export const ComplianceInfoView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 transition-colors">
      <div className="bg-white dark:bg-[#152019] p-6 sm:p-8 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#12281D] text-emerald-800 dark:text-[#A3E6C0] text-xs font-semibold border border-emerald-200 dark:border-[#1E4330] mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Regulatory Compliance Architecture</span>
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#284435] dark:text-[#EDF3EF] mb-2">
          Tanzania Legal & Currency Framework
        </h2>
        <p className="text-sm text-[#6B7A72] dark:text-[#8DA195] leading-relaxed">
          TANEXPO is built specifically around the legal, financial, and licensing requirements of the United Republic of Tanzania. Here is how our platform protects operators and travelers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency Directive Card */}
        <div className="bg-white dark:bg-[#152019] rounded-3xl p-6 border border-[#E8DFC9] dark:border-[#23352A] space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#0D1511] text-[#D97843] flex items-center justify-center border border-[#E8DFC9] dark:border-[#23352A]">
            <Banknote className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
            Bank of Tanzania (BOT) Currency Directive
          </h3>
          <p className="text-xs text-[#4D5E55] dark:text-[#B5C5BC] leading-relaxed">
            By Tanzanian financial regulations, it is illegal for domestic businesses to price, invoice, or demand payment exclusively in foreign currencies for local transactions. Tourism was explicitly named as a focal sector.
          </p>
          <div className="bg-[#FAF7F2] dark:bg-[#0D1511] p-4 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] text-xs space-y-2">
            <div className="flex items-start gap-2 text-[#284435] dark:text-[#EDF3EF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>All platform quotes, package rates, and settlement receipts are strictly TZS-denominated.</span>
            </div>
            <div className="flex items-start gap-2 text-[#284435] dark:text-[#EDF3EF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Indicative foreign currency amounts (e.g. USD) are provided purely as approximate reference helpers for international visitors.</span>
            </div>
          </div>
        </div>

        {/* Tourism Act & TALA Card */}
        <div className="bg-white dark:bg-[#152019] rounded-3xl p-6 border border-[#E8DFC9] dark:border-[#23352A] space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#0D1511] text-[#284435] dark:text-[#E8B94A] flex items-center justify-center border border-[#E8DFC9] dark:border-[#23352A]">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
            Tourism Act 2008 & TALA Licensing
          </h3>
          <p className="text-xs text-[#4D5E55] dark:text-[#B5C5BC] leading-relaxed">
            Under Tanzania Tourism Act (No. 29 of 2008), operating tourism services (safaris, mountain climbs, guided day tours) requires valid TALA (Tourism Agency Licensing Act) registration from the Ministry of Natural Resources and Tourism (MNRT).
          </p>
          <div className="bg-[#FAF7F2] dark:bg-[#0D1511] p-4 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] text-xs space-y-2">
            <div className="flex items-start gap-2 text-[#284435] dark:text-[#EDF3EF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Every operator listed on TANEXPO undergoes manual license verification with MNRT records.</span>
            </div>
            <div className="flex items-start gap-2 text-[#284435] dark:text-[#EDF3EF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Empowers local Tanzanian tour operators directly, preventing foreign shell middlemen.</span>
            </div>
          </div>
        </div>

        {/* Escrow Protection */}
        <div className="bg-white dark:bg-[#152019] rounded-3xl p-6 border border-[#E8DFC9] dark:border-[#23352A] space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#0D1511] text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-[#E8DFC9] dark:border-[#23352A]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
            Escrow & Digital Payout Guarantee
          </h3>
          <p className="text-xs text-[#4D5E55] dark:text-[#B5C5BC] leading-relaxed">
            Payment disputes frequently harm travelers and local operators in traditional phone/WhatsApp bookings. TANEXPO holds booking balances in secure escrow until departure conditions are confirmed.
          </p>
          <div className="bg-[#FAF7F2] dark:bg-[#0D1511] p-4 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] text-xs space-y-2">
            <div className="flex items-start gap-2 text-[#284435] dark:text-[#EDF3EF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Operators receive fast mobile money payouts (M-Pesa, Tigo Pesa, Airtel) or direct bank transfers.</span>
            </div>
            <div className="flex items-start gap-2 text-[#284435] dark:text-[#EDF3EF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Transparent 15% platform commission covers escrow guarantees, customer support, and system infrastructure.</span>
            </div>
          </div>
        </div>

        {/* Data Protection Act */}
        <div className="bg-white dark:bg-[#152019] rounded-3xl p-6 border border-[#E8DFC9] dark:border-[#23352A] space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] dark:bg-[#0D1511] text-amber-700 dark:text-amber-400 flex items-center justify-center border border-[#E8DFC9] dark:border-[#23352A]">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
            Personal Data Protection Act (PDPA 2022)
          </h3>
          <p className="text-xs text-[#4D5E55] dark:text-[#B5C5BC] leading-relaxed">
            Tanzania’s Personal Data Protection Commission (PDPC) mandates high standards of traveler and operator data confidentiality.
          </p>
          <div className="bg-[#FAF7F2] dark:bg-[#0D1511] p-4 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] text-xs space-y-2">
            <div className="flex items-start gap-2 text-[#284435] dark:text-[#EDF3EF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Traveler passport details and emergency contacts are shared strictly with the assigned licensed operator.</span>
            </div>
            <div className="flex items-start gap-2 text-[#284435] dark:text-[#EDF3EF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>No third-party data tracking or selling to foreign advertising networks.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
