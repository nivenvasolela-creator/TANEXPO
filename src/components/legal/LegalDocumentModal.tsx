import React from 'react';
import { X, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

export const LegalDocumentModal: React.FC = () => {
  const { activeLegalDoc, closeLegalDoc, openLegalDoc } = useApp();
  const dialogRef = useModalAccessibility(Boolean(activeLegalDoc), closeLegalDoc);

  if (!activeLegalDoc) return null;

  const isPrivacy = activeLegalDoc === 'privacy';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={isPrivacy ? 'Privacy Policy (Draft)' : 'Terms of Service (Draft)'}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-[#FAF7F2] dark:bg-[#0D1511] rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] focus:outline-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white dark:bg-[#152019] border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#284435] text-[#E8B94A] flex items-center justify-center shrink-0">
              {isPrivacy ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  DRAFT — Legal Review Required
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#284435] dark:text-[#EDF3EF] mt-0.5">
                {isPrivacy ? 'TANEXPO Privacy Policy' : 'TANEXPO Terms of Service'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLegalDoc}
            className="w-9 h-9 rounded-full bg-[#FAF7F2] dark:bg-[#1A2820] hover:bg-[#EDE5D5] dark:hover:bg-[#253A2E] text-[#1F2A24] dark:text-[#EDF3EF] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close legal document"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switcher tabs */}
        <div className="px-6 py-2.5 bg-[#FAF7F2] dark:bg-[#101914] border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center gap-2 text-xs shrink-0">
          <button
            type="button"
            onClick={() => openLegalDoc('privacy')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              isPrivacy
                ? 'bg-[#284435] text-white'
                : 'bg-white dark:bg-[#152019] text-[#52645A] dark:text-[#A7B9B0] border border-[#E8DFC9] dark:border-[#23352A]'
            }`}
          >
            Privacy Policy (/privacy)
          </button>
          <button
            type="button"
            onClick={() => openLegalDoc('terms')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              !isPrivacy
                ? 'bg-[#284435] text-white'
                : 'bg-white dark:bg-[#152019] text-[#52645A] dark:text-[#A7B9B0] border border-[#E8DFC9] dark:border-[#23352A]'
            }`}
          >
            Terms of Service (/terms)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-[#4D5E55] dark:text-[#B5C5BC] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-950 dark:text-amber-200 flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Draft Notice:</strong> This policy template is provided for pre-launch compliance readiness and must be reviewed and customized by qualified Tanzanian legal counsel before processing live commercial bookings or customer funds.
            </p>
          </div>

          {isPrivacy ? (
            <>
              <section className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                  1. Data Controller & Tanzania PDPA (2022) Commitment
                </h3>
                <p>
                  TANEXPO collects and processes personal information in accordance with the United Republic of Tanzania Personal Data Protection Act, 2022 (PDPA) and its regulations. We collect only the minimum data needed to connect travelers with licensed Tanzanian tour operators, mountain guides, and hospitality hosts.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                  2. Information We Collect
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account & Identity Data:</strong> Full name, normalized email or mobile phone number (+255 / E.164), travel preferences, and encrypted password hashes (scrypt).</li>
                  <li><strong>Operator Credentials:</strong> Business trading name, legal name, TALA license number, headquarters city, and optional public dispatch contact details.</li>
                  <li><strong>Trip Inquiries & Booking Records:</strong> Travel dates, group size, clarification messages, quoted amounts in TZS, and voucher reference codes.</li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                  3. Contact Privacy & Purpose Limitation
                </h3>
                <p>
                  Operator login credentials are never published in the public catalog. Where contact privacy is enabled, direct operator phone numbers and emails are disclosed to a traveler only after a confirmed booking exists. Session tokens are hashed before storage and logs exclude passwords, tokens, and full phone numbers.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                  4. Your PDPA Rights & Account Deletion
                </h3>
                <p>
                  You have the right to access, correct, or erase your personal data. You can permanently delete your account at any time from the account menu (<strong>Delete My Account</strong>), which removes your credentials, active sessions, saved list, and unbooked inquiries, and anonymizes historical booking records required for statutory accounting.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                  1. Marketplace Role
                </h3>
                <p>
                  TANEXPO operates a digital marketplace connecting travelers with independent Tanzanian tour operators, mountain guides, cultural hosts, and marine providers. Unless explicitly stated otherwise, travel packages are delivered directly by the named operator.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                  2. Tourism Act (No. 29 of 2008) & TALA Licensing
                </h3>
                <p>
                  Operators offering commercial tours on TANEXPO represent that they hold valid Tanzania Tourism Licensing (TALA) registrations and required TANAPA/NCAA/ZCT permits. Verified badges are granted only after manual registry review by TANEXPO administrators.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                  3. Bank of Tanzania (BOT) TZS Currency Rules & Payments
                </h3>
                <p>
                  All quotes, invoices, and booking settlements are denominated in Tanzanian Shillings (TZS) in compliance with Bank of Tanzania directives. USD figures shown in the interface are informational estimates only. When the platform runs in simulated mode, no real money is debited or disbursed.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                  4. Quotes, Cancellations & Acceptable Use
                </h3>
                <p>
                  Quotes issued by operators remain valid until their stated expiration date. Users must not create fraudulent inquiries, attempt unauthorized access, or bypass platform security controls.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 bg-white dark:bg-[#152019] border-t border-[#E8DFC9] dark:border-[#23352A] flex justify-end shrink-0">
          <button
            type="button"
            onClick={closeLegalDoc}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
