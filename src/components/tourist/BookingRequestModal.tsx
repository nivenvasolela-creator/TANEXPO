import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  Sparkles,
  ArrowRight
} from 'lucide-react';

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

  const [name, setName] = useState(currentUser?.name || '');
  const [contact, setContact] = useState(currentUser?.email || currentUser?.phone || '');
  const [date, setDate] = useState('');
  const [groupSize, setGroupSize] = useState(2);
  const [budgetTZS, setBudgetTZS] = useState('');
  const [message, setMessage] = useState('');
  const [submittedLeadId, setSubmittedLeadId] = useState<number | null>(null);

  // Sync if user logs in while modal is open
  React.useEffect(() => {
    if (currentUser && !name) {
      setName(currentUser.name);
      setContact(currentUser.email || currentUser.phone || '');
    }
  }, [currentUser]);

  if (!inquiryPackage) return null;

  const { provider, listing } = inquiryPackage;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    if (!currentUser || isGuest) {
      requireAuth({
        type: 'request_quote',
        data: {
          providerId: provider.id,
          listingId: listing.id,
          date,
          groupSize,
          budgetTZS,
          message
        }
      });
      return;
    }

    if (!name || !contact) return;

    const newLead = submitInquiry({
      providerId: provider.id,
      providerName: provider.name,
      listingId: listing.id,
      listingTitle: listing.title,
      touristName: name,
      touristContact: contact,
      date,
      groupSize: Number(groupSize),
      budgetTZS: budgetTZS ? `${budgetTZS} TZS` : undefined,
      message: message || undefined
    });

    setSubmittedLeadId(newLead.id);
  };

  const handleFinishAndTrack = () => {
    setInquiryPackage(null);
    setSelectedProvider(null);
    setTouristTab('requests');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white dark:bg-[#0D1511] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] transition-colors">
        {/* Header */}
        <div className="bg-[#FAF7F2] dark:bg-[#152019] p-5 sm:p-6 border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
              Direct Tour Request
            </span>
            <h3 className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
              Request Quote from {provider.name}
            </h3>
          </div>
          <button
            onClick={() => setInquiryPackage(null)}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#1A2820] hover:bg-[#EDE5D5] dark:hover:bg-[#253A2E] text-[#6B7A72] dark:text-[#8DA195] flex items-center justify-center border border-[#E8DFC9] dark:border-[#2A3E31] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedLeadId ? (
          /* Confirmation Success State */
          <div className="p-8 text-center space-y-5">
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Selected Package summary pill */}
            <div className="bg-[#FAF7F2] dark:bg-[#152019] p-3 rounded-xl border border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#8A9790] dark:text-[#8DA195] block text-[10px] uppercase font-bold">Inquiring for:</span>
                <span className="font-bold text-[#284435] dark:text-[#EDF3EF]">{listing.title}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#D97843]">{formatPrice(listing.priceTZS)}</span>
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
                <span>Estimated Target Budget in TZS (Optional)</span>
              </label>
              <input
                type="text"
                value={budgetTZS}
                onChange={(e) => setBudgetTZS(e.target.value)}
                placeholder="e.g. 3,500,000 TZS"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
              />
              <p className="text-[10px] text-[#6B7A72] dark:text-[#8DA195]">Helps the operator customize vehicles, lodges, or private route concessions.</p>
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
                placeholder="e.g. Celebrating an anniversary, need airport pickup at JRO, vegetarian meals, interested in photography pop-up roof..."
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
