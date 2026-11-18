import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import { 
  X, 
  Send, 
  Calendar, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Phone, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  RotateCcw
} from 'lucide-react';

/** Common pickup points, offered as suggestions. Travelers can type anything. */
const PICKUP_SUGGESTIONS = [
  'Kilimanjaro International Airport (JRO)',
  'Arusha Airport (ARK)',
  'My hotel in Arusha',
  'My hotel in Moshi',
  'Julius Nyerere International Airport, Dar es Salaam (DAR)',
  'My hotel in Dar es Salaam',
  'Abeid Amani Karume Airport, Zanzibar (ZNZ)',
  'My hotel in Zanzibar'
];

/**
 * Estimated trip cost from the package's listed price and pricing unit. It is only a starting
 * point for the traveler's budget: the operator still sends the real quote and the server decides money.
 */
export function estimateTripTZS(priceTZS: number, unit: string, travelers: number): number {
  const n = Math.max(1, Math.floor(travelers) || 1);
  const u = unit.toLowerCase();
  if (u.includes('vehicle')) {
    const seats = Number(u.match(/up to (\d+)/)?.[1]) || 6;
    return priceTZS * Math.ceil(n / seats);
  }
  if (u.includes('couple')) return priceTZS * Math.ceil(n / 2);
  if (u.includes('person') || u.includes('pax') || u.includes('traveler')) return priceTZS * n;
  return priceTZS; // per group / per trip
}

const formatTZS = (n: number) => n.toLocaleString('en-US');

export const BookingRequestModal: React.FC = () => {
  const { 
    inquiryPackage, 
    setInquiryPackage, 
    submitInquiry, 
    setTouristTab, 
    setSelectedProvider,
    formatPrice,
    currentUser,
    requireAuth,
    isGuest
  } = useApp();

  // A guest's placeholder profile ("Guest Traveler") must not end up on the operator's lead.
  const realUser = currentUser && currentUser.role !== 'guest' ? currentUser : null;
  const [name, setName] = useState(realUser?.name || '');
  const [contact, setContact] = useState(realUser?.email || realUser?.phone || '');
  const [date, setDate] = useState('');
  const [groupSize, setGroupSize] = useState(2);
  const [budgetTZS, setBudgetTZS] = useState('');
  // Until the traveler types their own budget, it follows the package price x group size.
  const [budgetEdited, setBudgetEdited] = useState(false);
  const [pickup, setPickup] = useState('');
  const [message, setMessage] = useState('');
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);

  const dialogRef = useModalAccessibility(Boolean(inquiryPackage), () => setInquiryPackage(null));

  // Fill in the account's name and contact when the traveler signs in while the form is open,
  // without overwriting anything they typed themselves.
  React.useEffect(() => {
    if (!realUser) return;
    if (!name.trim()) setName(realUser.name);
    if (!contact.trim()) setContact(realUser.email || realUser.phone || '');
  }, [realUser?.id]);

  const listingForEstimate = inquiryPackage?.listing;
  const estimate = listingForEstimate
    ? estimateTripTZS(Number(listingForEstimate.priceTZS) || 0, String(listingForEstimate.unit || ''), groupSize)
    : 0;

  React.useEffect(() => {
    if (!budgetEdited) setBudgetTZS(estimate > 0 ? formatTZS(estimate) : '');
  }, [estimate, budgetEdited]);

  if (!inquiryPackage?.provider || !inquiryPackage?.listing) return null;

  const { provider, listing } = inquiryPackage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    if (!currentUser || isGuest) {
      requireAuth({
        type: 'request_quote',
        // The form reopens with this package after sign-in; its typed values stay in this component.
        data: { provider, listing }
      });
      return;
    }

    if (!name || !contact) return;

    const newLead = await submitInquiry({
      providerId: provider.id,
      providerName: provider.name,
      listingId: listing.id,
      listingTitle: listing.title,
      touristName: name,
      touristContact: contact,
      date,
      groupSize: Number(groupSize),
      budgetTZS: budgetTZS.trim() ? `${budgetTZS.trim().replace(/\s*TZS$/i, '')} TZS` : undefined,
      pickupLocation: pickup.trim() || undefined,
      message: message || undefined
    });

    if (newLead) {
      setSubmittedLeadId(newLead.id);
    }
  };

  const handleFinishAndTrack = () => {
    setInquiryPackage(null);
    setSelectedProvider(null);
    setTouristTab('requests');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Request Quote from ${provider.name}`}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-white dark:bg-[#0D1511] rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] transition-colors focus:outline-hidden"
      >
        {/* Header */}
        <div className="bg-[#FAF7F2] dark:bg-[#152019] p-5 sm:p-6 border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
              Direct Tour Request
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#284435] dark:text-[#EDF3EF] truncate">
              Request Quote from {provider.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setInquiryPackage(null)}
            aria-label="Close quote request modal"
            className="min-h-[40px] min-w-[40px] rounded-full bg-white dark:bg-[#1A2820] hover:bg-[#EDE5D5] dark:hover:bg-[#253A2E] text-[#6B7A72] dark:text-[#8DA195] flex items-center justify-center border border-[#E8DFC9] dark:border-[#2A3E31] cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedLeadId ? (
          /* Confirmation Success State */
          <div className="p-6 sm:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-8 overflow-y-auto text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#EAF3EC] dark:bg-emerald-950/50 text-[#284435] flex items-center justify-center mx-auto text-2xl border border-[#CDE3D4] dark:border-emerald-800/80">
              <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <h4 className="font-serif text-2xl font-bold text-[#284435] dark:text-[#EDF3EF] mb-2">
                Inquiry Sent Directly to {provider.name}
              </h4>
              <p className="text-sm text-[#6B7A72] dark:text-[#8DA195] max-w-md mx-auto leading-relaxed">
                Your request has been dispatched in real-time to {provider.name}'s TANEXPO operating dashboard. They will review your dates, group size, and send an official TZS quote.
              </p>
            </div>

            <div className="bg-[#FAF7F2] dark:bg-[#152019] p-4 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between py-1 border-b border-[#E8DFC9]/60 dark:border-[#23352A]">
                <span className="text-[#6B7A72] dark:text-[#8DA195]">Selected Package:</span>
                <span className="font-semibold text-[#284435] dark:text-[#EDF3EF]">{listing.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8DFC9]/60 dark:border-[#23352A]">
                <span className="text-[#6B7A72] dark:text-[#8DA195]">Estimated Travel Date:</span>
                <span className="font-semibold text-[#284435] dark:text-[#EDF3EF]">{date}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#6B7A72] dark:text-[#8DA195]">Travelers:</span>
                <span className="font-semibold text-[#284435] dark:text-[#EDF3EF]">{groupSize} Guests</span>
              </div>
              {pickup.trim() && (
                <div className="flex justify-between gap-3 py-1 border-t border-[#E8DFC9]/60 dark:border-[#23352A]">
                  <span className="text-[#6B7A72] dark:text-[#8DA195] shrink-0">Pickup:</span>
                  <span className="font-semibold text-[#284435] dark:text-[#EDF3EF] text-right">{pickup.trim()}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleFinishAndTrack}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#284435] hover:bg-[#1E332A] dark:bg-[#1F3A2C] dark:hover:bg-[#284B38] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span>Track in "My Requests"</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setInquiryPackage(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#FAF7F2] dark:bg-[#152019] hover:bg-[#EDE5D5] dark:hover:bg-[#1A2820] text-[#284435] dark:text-[#EDF3EF] text-xs font-semibold border border-[#E8DFC9] dark:border-[#23352A] cursor-pointer transition-colors"
              >
                Browse More Experiences
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 overflow-y-auto space-y-4">
            {/* Selected Package summary pill */}
            <div className="bg-[#FAF7F2] dark:bg-[#152019] p-3 rounded-xl border border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="text-[#8A9790] dark:text-[#8DA195] block text-[10px] uppercase font-bold">Inquiring for:</span>
                <span className="font-bold text-[#284435] dark:text-[#EDF3EF]">{listing.title}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-[#D97843] whitespace-nowrap">{formatPrice(listing.priceTZS, false)}</span>
                <span className="text-[10px] text-[#6B7A72] dark:text-[#8DA195] block">{listing.unit}</span>
              </div>
            </div>

            {/* Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#D97843]" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#D97843]" />
                  <span>WhatsApp / Phone or Email *</span>
                </label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+255 7XX XXX XXX or name@mail.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Date & Group Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D97843]" />
                  <span>Preferred Travel Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#D97843]" />
                  <span>Group Size (Travelers) *</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Target Budget in TZS */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#D97843]" />
                <span>Your budget in TZS</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetTZS}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 12);
                    setBudgetTZS(digits ? formatTZS(Number(digits)) : '');
                    setBudgetEdited(true);
                  }}
                  placeholder="e.g. 3,500,000"
                  aria-describedby="budget-hint"
                  className="w-full pl-3 pr-12 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8A9790]">TZS</span>
              </div>
              <p id="budget-hint" className="text-[10px] text-[#6B7A72] dark:text-[#8DA195] flex flex-wrap items-center gap-x-2">
                {estimate > 0 ? (
                  <span>
                    Package estimate: TZS {formatTZS(listing.priceTZS)} {listing.unit}
                    {estimate !== listing.priceTZS ? ` × ${groupSize} traveler${groupSize === 1 ? '' : 's'} ≈ TZS ${formatTZS(estimate)}` : ''}. Change it if your budget is different.
                  </span>
                ) : (
                  <span>Helps the operator choose vehicles and lodges for you.</span>
                )}
                {budgetEdited && estimate > 0 && (
                  <button
                    type="button"
                    onClick={() => setBudgetEdited(false)}
                    className="inline-flex items-center gap-1 font-bold text-[#284435] dark:text-emerald-400 underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Use estimate
                  </button>
                )}
              </p>
            </div>

            {/* Pickup location */}
            <div className="space-y-1">
              <label htmlFor="pickup-location" className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#D97843]" />
                <span>Pickup location</span>
              </label>
              <input
                id="pickup-location"
                type="text"
                list="pickup-suggestions"
                maxLength={160}
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="e.g. Kilimanjaro Airport (JRO) or your hotel name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
              />
              <datalist id="pickup-suggestions">
                {PICKUP_SUGGESTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <p className="text-[10px] text-[#6B7A72] dark:text-[#8DA195]">Airport, hotel or address where the operator should collect you.</p>
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#D97843]" />
                <span>Special Requests or Itinerary Details</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Celebrating an anniversary, vegetarian meals, flight lands at 14:30, interested in photography pop-up roof..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Protection Notice */}
            <div className="p-3 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/40 border border-[#CDE3D4] dark:border-emerald-800/60 flex items-center gap-2 text-[11px] text-[#284435] dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>You pay nothing upfront. The operator will review availability and send you an official transparent quote.</span>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#284435] hover:bg-[#1E332A] dark:bg-[#1F3A2C] dark:hover:bg-[#284B38] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Request to {provider.name}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
