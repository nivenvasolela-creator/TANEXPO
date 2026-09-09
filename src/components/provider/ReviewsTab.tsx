import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Star, MessageSquare, Send, CheckCircle2, CornerDownRight } from 'lucide-react';

export const ReviewsTab: React.FC = () => {
  const { activeProviderId, reviews, addReviewResponse } = useApp();

  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  const providerReviews = reviews.filter((r) => r.providerId === activeProviderId);

  const handleSendReply = (reviewId: number) => {
    if (!replyText.trim()) return;
    addReviewResponse(reviewId, replyText.trim());
    setActiveReplyId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DFC9] shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
            Reputation & Feedback
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435]">
            Traveler Reviews ({providerReviews.length})
          </h2>
          <p className="text-xs text-[#6B7A72] mt-0.5">
            Verified traveler feedback from completed safari, mountain, and ocean expeditions.
          </p>
        </div>
      </div>

      {providerReviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8DFC9] p-12 text-center max-w-md mx-auto space-y-3">
          <Star className="w-12 h-12 text-[#DED5C6] mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#284435]">No Reviews Yet</h3>
          <p className="text-xs text-[#6B7A72]">
            Reviews from travelers who complete trips with your guides will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {providerReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-[#E8DFC9] p-6 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#284435]">
                    {rev.touristName}
                  </h3>
                  <span className="text-xs text-[#8A9790] block">
                    Itinerary: {rev.tripPackage} • {rev.date}
                  </span>
                </div>
                <div className="flex text-[#E8B94A] text-sm">
                  {'★'.repeat(rev.rating)}
                </div>
              </div>

              <p className="text-xs text-[#4D5E55] italic leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFC9]">
                "{rev.comment}"
              </p>

              {/* Existing Response */}
              {rev.providerResponse && (
                <div className="ml-4 pl-4 border-l-2 border-[#D97843] text-xs text-[#284435] space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D97843]">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Your Official Operator Response:</span>
                  </div>
                  <p className="text-[#4D5E55]">{rev.providerResponse}</p>
                </div>
              )}

              {/* Reply Button or Reply Form */}
              {!rev.providerResponse && (
                <div className="pt-2">
                  {activeReplyId === rev.id ? (
                    <div className="space-y-2 pt-2 border-t border-[#F0EBE0]">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a professional response to thank the traveler or provide context..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-[#FAF7F2] focus:outline-hidden"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setActiveReplyId(null); setReplyText(''); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7A72] hover:bg-zinc-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendReply(rev.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publish Response</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setActiveReplyId(rev.id); setReplyText(''); }}
                      className="text-xs font-semibold text-[#284435] hover:text-[#D97843] flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Respond to review</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
