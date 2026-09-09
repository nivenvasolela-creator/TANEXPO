import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lead, LeadStatus } from '../../types';
import { 
  Users, 
  Calendar, 
  Phone, 
  MessageSquare, 
  DollarSign, 
  ArrowRight, 
  Check, 
  X, 
  Send, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const LeadsPipelineTab: React.FC = () => {
  const { 
    activeProviderId, 
    leads, 
    updateLeadStatus, 
    setQuoteBuilderLead, 
    markLeadBookedDirect,
    sendMessageOnLead,
    formatPrice
  } = useApp();

  const [filterSearch, setFilterSearch] = useState('');
  const [openChatLeadId, setOpenChatLeadId] = useState<number | null>(null);
  const [operatorReply, setOperatorReply] = useState<Record<number, string>>({});

  const pLeads = leads.filter((l) => l.providerId === activeProviderId);

  const columns: { status: LeadStatus; label: string; color: string; desc: string }[] = [
    { status: 'New', label: 'New Inquiries', color: 'border-blue-300 bg-blue-50/40 text-blue-900', desc: 'Awaiting operator review' },
    { status: 'Contacted', label: 'Contacted', color: 'border-amber-300 bg-amber-50/40 text-amber-900', desc: 'Outreach made / Dates checked' },
    { status: 'Negotiating', label: 'Quote Sent', color: 'border-[#D97843]/50 bg-[#D97843]/5 text-[#D97843]', desc: 'Custom TZS quote sent' },
    { status: 'Booked', label: 'Confirmed Booked', color: 'border-emerald-400 bg-emerald-50/40 text-emerald-900', desc: 'Deposit confirmed & secured' },
    { status: 'Lost', label: 'Lost / Closed', color: 'border-zinc-300 bg-zinc-50/60 text-zinc-700', desc: 'Declined or expired' }
  ];

  const filteredLeads = pLeads.filter((l) => {
    if (!filterSearch) return true;
    return (
      l.touristName.toLowerCase().includes(filterSearch.toLowerCase()) ||
      l.listingTitle.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (l.message && l.message.toLowerCase().includes(filterSearch.toLowerCase()))
    );
  });

  const handleSendOperatorReply = (leadId: number) => {
    const text = operatorReply[leadId];
    if (!text || !text.trim()) return;
    sendMessageOnLead(leadId, text.trim(), 'provider');
    setOperatorReply((prev) => ({ ...prev, [leadId]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* CRM Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E8DFC9] shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
            Lead CRM Pipeline
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435]">
            Booking Funnel & Inquiries ({pLeads.length})
          </h2>
          <p className="text-xs text-[#6B7A72] mt-0.5">
            Manage tourist inquiries, advance pipeline stages, chat to clarify requirements, and send official custom TZS quotes.
          </p>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search traveler or tour..."
            className="px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-[#FAF7F2] focus:outline-hidden w-full sm:w-64"
          />
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto min-h-[600px] items-start">
        {columns.map((col) => {
          const colLeads = filteredLeads.filter((l) => l.status === col.status);

          return (
            <div
              key={col.status}
              className={`rounded-2xl border ${col.color} p-3 flex flex-col gap-3 min-h-[500px] shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <div>
                  <h4 className="font-serif font-bold text-xs">{col.label}</h4>
                  <span className="text-[10px] opacity-75 block">{col.desc}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white shadow-xs">
                  {colLeads.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1">
                {colLeads.length === 0 ? (
                  <div className="p-6 text-center text-xs opacity-50 italic">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const isChatOpen = openChatLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl p-3.5 border border-[#E8DFC9] shadow-xs space-y-2.5 text-xs text-[#1F2A24] hover:border-[#284435] transition-all"
                      >
                        {/* Lead Title & Traveler */}
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-serif font-bold text-sm text-[#284435] truncate">
                              {lead.touristName}
                            </span>
                            {lead.status === 'New' && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-[#D97843] truncate">
                            {lead.listingTitle}
                          </p>
                        </div>

                        {/* Details row: Date, Travelers, Budget */}
                        <div className="space-y-1 text-[11px] text-[#4D5E55] bg-[#FAF7F2] p-2 rounded-lg border border-[#F0EBE0]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[#D97843]" />
                            <span>Date: <strong>{lead.date}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-[#284435]" />
                            <span>Group: <strong>{lead.groupSize} Guests</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#6B7A72]" />
                            <span className="truncate">{lead.touristContact}</span>
                          </div>
                          {lead.budgetTZS && (
                            <div className="flex items-center gap-1.5 text-emerald-800">
                              <DollarSign className="w-3 h-3 text-emerald-700" />
                              <span>Target: <strong>{lead.budgetTZS}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Custom note from traveler */}
                        {lead.message && (
                          <p className="text-[11px] text-[#4D5E55] italic line-clamp-2 bg-white/70">
                            "{lead.message}"
                          </p>
                        )}

                        {/* Quote indicator if exists */}
                        {lead.quote && (
                          <div className="p-2 bg-[#FFF9F3] border border-[#D97843]/30 rounded-lg text-[11px] space-y-0.5">
                            <span className="font-bold text-[#284435] block">
                              Quote Sent: {formatPrice(lead.quote.total, false)}
                            </span>
                            <span className="text-[10px] text-[#6B7A72]">
                              Expires {lead.quote.validUntil}
                            </span>
                          </div>
                        )}

                        {/* Chat Messages Drawer Trigger */}
                        <div className="pt-1 border-t border-[#F0EBE0]">
                          <button
                            type="button"
                            onClick={() => setOpenChatLeadId(isChatOpen ? null : lead.id)}
                            className="w-full flex items-center justify-between text-[11px] font-bold text-[#284435] hover:text-[#D97843] py-1 cursor-pointer"
                          >
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-[#D97843]" />
                              <span>Clarify / Chat ({lead.messages?.length || 0})</span>
                            </span>
                            {isChatOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isChatOpen && (
                            <div className="mt-2 p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9] space-y-2">
                              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {(!lead.messages || lead.messages.length === 0) ? (
                                  <p className="text-[10px] text-[#8A9790] italic">
                                    No messages yet. Send a greeting or date confirmation.
                                  </p>
                                ) : (
                                  lead.messages.map((m) => (
                                    <div
                                      key={m.id}
                                      className={`p-1.5 rounded-lg text-[10px] ${
                                        m.sender === 'provider'
                                          ? 'bg-[#284435] text-white ml-auto max-w-[85%]'
                                          : 'bg-white text-[#1F2A24] border border-[#E8DFC9] mr-auto max-w-[85%]'
                                      }`}
                                    >
                                      <div className="flex justify-between items-center opacity-70 mb-0.5">
                                        <span>{m.sender === 'provider' ? 'You' : lead.touristName}</span>
                                        <span>{m.timestamp}</span>
                                      </div>
                                      <p>{m.text}</p>
                                    </div>
                                  ))
                                )}
                              </div>

                              <div className="flex items-center gap-1 pt-1 border-t border-[#E8DFC9]">
                                <input
                                  type="text"
                                  value={operatorReply[lead.id] || ''}
                                  onChange={(e) => setOperatorReply({ ...operatorReply, [lead.id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSendOperatorReply(lead.id);
                                  }}
                                  placeholder="Reply to traveler..."
                                  className="flex-1 px-2 py-1 text-[11px] bg-white rounded-lg border border-[#DED5C6] focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendOperatorReply(lead.id)}
                                  className="p-1.5 bg-[#284435] hover:bg-[#1E332A] text-white rounded-lg text-[11px] cursor-pointer"
                                  title="Send reply"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Controls */}
                        <div className="pt-2 border-t border-[#F0EBE0] flex flex-wrap items-center gap-1.5">
                          {lead.status === 'New' && (
                            <button
                              onClick={() => updateLeadStatus(lead.id, 'Contacted')}
                              className="flex-1 py-1.5 px-2 bg-[#284435] hover:bg-[#1E332A] text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>Mark Contacted</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {(lead.status === 'New' || lead.status === 'Contacted' || lead.status === 'Negotiating') && (
                            <button
                              onClick={() => setQuoteBuilderLead(lead)}
                              className="flex-1 py-1.5 px-2 bg-[#D97843] hover:bg-[#C26735] text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>{lead.quote ? 'Revise Quote' : 'Build Quote'}</span>
                            </button>
                          )}

                          {lead.status !== 'Booked' && lead.status !== 'Lost' && (
                            <button
                              onClick={() => markLeadBookedDirect(lead.id)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 cursor-pointer"
                              title="Mark as Booked & Confirmed"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {lead.status !== 'Lost' && lead.status !== 'Booked' && (
                            <button
                              onClick={() => updateLeadStatus(lead.id, 'Lost')}
                              className="p-1.5 bg-zinc-50 hover:bg-red-50 text-zinc-500 hover:text-red-600 rounded-lg border border-zinc-200 cursor-pointer"
                              title="Mark as Lost / Cancelled"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
