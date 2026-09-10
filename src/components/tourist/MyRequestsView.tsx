import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Users, 
  Check, 
  X, 
  ArrowRight, 
  Briefcase, 
  Sparkles, 
  ShieldCheck, 
  MessageSquareQuote,
  Ticket,
  ExternalLink,
  Send,
  MessageCircle,
  Star,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const MyRequestsView: React.FC = () => {
  const { 
    leads, 
    bookings, 
    setActiveVoucher, 
    setCheckoutLead,
    setReviewingBooking,
    sendMessageOnLead,
    formatPrice,
    declineQuote,
    t
  } = useApp();

  const [activeChatLeadId, setActiveChatLeadId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState<Record<number, string>>({});

  const handleSendChat = (leadId: number) => {
    const text = chatInput[leadId];
    if (!text || !text.trim()) return;
    sendMessageOnLead(leadId, text.trim(), 'tourist');
    setChatInput((prev) => ({ ...prev, [leadId]: '' }));
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#152019] p-6 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs transition-colors">
        <div>
          <span className="text-xs font-bold text-[#D97843] uppercase tracking-wider block mb-1">
            Traveler Inquiries, Live Quotes & Secure Bookings
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435] dark:text-[#EDF3EF]">
            {t('trip.requests', 'My Trip Requests')} ({leads.length})
          </h2>
          <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] mt-0.5">
            Track operator responses, negotiate details, review custom TZS quotes, and pay via M-Pesa / Tigo Pesa / Airtel Money.
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white dark:bg-[#152019] rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] p-12 text-center max-w-md mx-auto space-y-4 transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#FAF7F2] dark:bg-[#1A2820] text-[#6B7A72] dark:text-[#8DA195] flex items-center justify-center mx-auto text-xl border border-[#E8DFC9] dark:border-[#2A3E31]">
            <FileText className="w-6 h-6 text-[#284435] dark:text-emerald-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">No Inquiries Sent Yet</h3>
          <p className="text-xs text-[#6B7A72] dark:text-[#8DA195]">
            Browse verified local operators and request a custom quote for a safari, Zanzibar sailing, or Kilimanjaro climb.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {leads.map((lead) => {
            const confirmedBooking = bookings.find((b) => b.leadId === lead.id);
            const isChatOpen = activeChatLeadId === lead.id;

            return (
              <div
                key={lead.id}
                className={`bg-white dark:bg-[#152019] rounded-3xl border transition-all overflow-hidden shadow-xs ${
                  lead.status === 'Negotiating'
                    ? 'border-[#D97843] ring-2 ring-[#D97843]/20'
                    : lead.status === 'Booked'
                    ? 'border-emerald-500/60 bg-emerald-50/10 dark:border-emerald-700/60 dark:bg-emerald-950/20'
                    : 'border-[#E8DFC9] dark:border-[#23352A]'
                }`}
              >
                {/* Lead Header */}
                <div className="p-6 border-b border-[#F0EBE0] dark:border-[#23352A] flex flex-wrap items-center justify-between gap-4 bg-[#FAF7F2] dark:bg-[#101914] transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">
                        {lead.listingTitle}
                      </span>
                      {lead.status === 'Negotiating' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D97843] text-white px-2 py-0.5 rounded-full animate-pulse">
                          {t('quote.ready', 'Quote Ready!')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7A72] dark:text-[#8DA195]">
                      <span>Operator: <strong className="text-[#284435] dark:text-[#EDF3EF]">{lead.providerName}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#D97843]" />
                        {lead.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#284435] dark:text-emerald-400" />
                        {lead.groupSize} Guests
                      </span>
                    </div>
                  </div>

                  {/* Status Pill & OS Bridge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        lead.status === 'New'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : lead.status === 'Contacted'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : lead.status === 'Negotiating'
                          ? 'bg-[#D97843]/15 text-[#D97843] border-[#D97843]/40'
                          : lead.status === 'Booked'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      ● {lead.status === 'Negotiating' ? 'Quote Ready' : lead.status}
                    </span>
                  </div>
                </div>

                {/* Lead Body Details */}
                <div className="p-6 space-y-4">
                  {lead.message && (
                    <div className="text-xs text-[#4D5E55] dark:text-[#A7B9B0] bg-[#FAF7F2] dark:bg-[#101914] p-3 rounded-xl border border-[#E8DFC9] dark:border-[#23352A]">
                      <strong className="text-[#284435] dark:text-[#EDF3EF]">Your special note:</strong> "{lead.message}"
                    </div>
                  )}

                  {/* Quote Section if provider sent quote */}
                  {lead.quote && (
                    <div className="rounded-2xl border border-[#D97843]/30 bg-linear-to-b from-[#FFFBF7] to-[#FAF6EE] dark:from-[#1A251E] dark:to-[#131D17] p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between border-b border-[#E8DFC9] dark:border-[#23352A] pb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquareQuote className="w-5 h-5 text-[#D97843]" />
                          <div>
                            <h4 className="font-serif text-base font-bold text-[#284435] dark:text-[#EDF3EF]">
                              Official Quote from {lead.providerName}
                            </h4>
                            <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                              Valid until {lead.quote.validUntil} • Legal TZS Denominated (Bank of Tanzania)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-[#8A9790] dark:text-[#8DA195] block">Quote Total</span>
                          <span className="font-bold text-lg text-[#284435] dark:text-[#EDF3EF]">
                            {formatPrice(lead.quote.total)}
                          </span>
                        </div>
                      </div>

                      {/* Itemized Line Items */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-[#4D5E55] dark:text-[#A7B9B0]">
                          <span>Base Tour Package Rate ({lead.groupSize} guests)</span>
                          <span className="font-semibold">{formatPrice(lead.quote.basePrice, false)}</span>
                        </div>

                        {lead.quote.extras.map((ex) => (
                          <div key={ex.id} className="flex justify-between text-[#4D5E55] dark:text-[#A7B9B0]">
                            <span>+ {ex.title}</span>
                            <span className="font-semibold">
                              {ex.amount === 0 ? 'Complimentary' : formatPrice(ex.amount, false)}
                            </span>
                          </div>
                        ))}

                        {lead.quote.discount > 0 && (
                          <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                            <span>- Operator Concession / Discount</span>
                            <span>-{formatPrice(lead.quote.discount, false)}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#E8DFC9] dark:border-[#23352A] flex justify-between font-bold text-sm text-[#284435] dark:text-[#EDF3EF]">
                          <span>Final Payable Amount:</span>
                          <span className="text-[#D97843]">{formatPrice(lead.quote.total)}</span>
                        </div>
                      </div>

                      {/* Operator Note */}
                      {lead.quote.note && (
                        <div className="p-3 bg-white dark:bg-[#152019] rounded-xl border border-[#E8DFC9] dark:border-[#23352A] text-xs text-[#284435] dark:text-[#EDF3EF]">
                          <span className="font-bold text-[11px] text-[#D97843] block mb-0.5">Message from Operator:</span>
                          <p className="italic text-[#4D5E55] dark:text-[#A7B9B0]">"{lead.quote.note}"</p>
                        </div>
                      )}

                      {/* Acceptance Actions -> Triggers Checkout Modal! */}
                      {lead.status === 'Negotiating' && (
                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => setCheckoutLead(lead)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                          >
                            <Lock className="w-4 h-4 text-[#E8B94A]" />
                            <span>{t('accept.pay', 'Accept Quote & Pay Securely')}</span>
                          </button>
                          <button
                            onClick={() => declineQuote(lead.id)}
                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#152019] hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 inline mr-1" />
                            <span>{t('decline', 'Decline')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirmed Booking details if Booked */}
                  {lead.status === 'Booked' && confirmedBooking && (
                    <div className="bg-[#EAF3EC] dark:bg-emerald-950/40 p-4 rounded-2xl border border-[#CDE3D4] dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <span className="font-bold text-xs text-[#284435] dark:text-[#EDF3EF] block">
                            Trip Confirmed & Secured via Licensed Partner (Ref: {confirmedBooking.referenceCode})
                          </span>
                          <span className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                            Paid via {confirmedBooking.paymentMethod || 'Mobile Money'}. TALA licensed transport allocated.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveVoucher(confirmedBooking)}
                          className="px-3.5 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] dark:bg-[#1F3A2C] dark:hover:bg-[#284B38] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Ticket className="w-3.5 h-3.5 text-[#E8B94A]" />
                          <span>View Voucher</span>
                        </button>

                        {!confirmedBooking.hasReview && (
                          <button
                            onClick={() => setReviewingBooking(confirmedBooking)}
                            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#101914] hover:bg-[#EDE5D5] dark:hover:bg-[#1A2820] text-[#284435] dark:text-[#EDF3EF] text-xs font-bold border border-[#CDE3D4] dark:border-emerald-800/60 flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Star className="w-3.5 h-3.5 text-[#E8B94A]" />
                            <span>Write Review</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interactive Chat & Clarification Flow */}
                  <div className="pt-2 border-t border-[#F0EBE0] dark:border-[#23352A]">
                    <button
                      type="button"
                      onClick={() => setActiveChatLeadId(isChatOpen ? null : lead.id)}
                      className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] hover:text-[#D97843] flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-[#D97843]" />
                      <span>
                        Clarification Thread & Messages ({lead.messages?.length || 0})
                      </span>
                      {isChatOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isChatOpen && (
                      <div className="mt-3 bg-[#FAF7F2] dark:bg-[#101914] p-4 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] space-y-3">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(!lead.messages || lead.messages.length === 0) ? (
                            <p className="text-xs text-[#8A9790] dark:text-[#8DA195] italic">
                              No messages yet. Send a note below to discuss dietary needs, pickup location, or custom dates.
                            </p>
                          ) : (
                            lead.messages.map((m) => (
                              <div
                                key={m.id}
                                className={`p-2.5 rounded-xl text-xs max-w-sm ${
                                  m.sender === 'tourist'
                                    ? 'bg-[#284435] dark:bg-emerald-800 text-white ml-auto'
                                    : 'bg-white dark:bg-[#152019] text-[#1F2A24] dark:text-[#EDF3EF] border border-[#E8DFC9] dark:border-[#23352A] mr-auto'
                                }`}
                              >
                                <div className="flex justify-between items-center text-[10px] opacity-75 mb-1 gap-3">
                                  <span>{m.sender === 'tourist' ? 'You' : lead.providerName}</span>
                                  <span>{m.timestamp}</span>
                                </div>
                                <p className="leading-relaxed">{m.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Input row */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#E8DFC9] dark:border-[#23352A]">
                          <input
                            type="text"
                            value={chatInput[lead.id] || ''}
                            onChange={(e) => setChatInput({ ...chatInput, [lead.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendChat(lead.id);
                            }}
                            placeholder={t('send.message', 'Send message to operator...')}
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#152019] text-[#1F2A24] dark:text-[#EDF3EF] border border-[#DED5C6] dark:border-[#2A3E31] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendChat(lead.id)}
                            className="px-3 py-2 bg-[#284435] hover:bg-[#1E332A] dark:bg-[#1F3A2C] dark:hover:bg-[#284B38] text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
