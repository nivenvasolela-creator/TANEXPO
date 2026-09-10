import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Star, CheckCircle2, ShieldCheck, Send } from 'lucide-react';

export const WriteReviewModal: React.FC = () => {
  const { reviewingBooking, setReviewingBooking, addReview } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState(reviewingBooking?.touristName || '');

  if (!reviewingBooking) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    addReview({
      providerId: reviewingBooking.providerId,
      touristName: reviewerName || reviewingBooking.touristName,
      rating,
      comment: comment.trim(),
      tripPackage: reviewingBooking.listingTitle,
      bookingRef: reviewingBooking.referenceCode
    });

    setReviewingBooking(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-[#FAF7F2] dark:bg-[#0D1511] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] transition-colors">
        {/* Header */}
        <div className="p-6 bg-white dark:bg-[#152019] border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between gap-4 transition-colors">
          <div>
            <span className="text-xs font-bold text-[#D97843] uppercase tracking-wider block">
              Verified Traveler Review
            </span>
            <h3 className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
              Rate Your Trip with {reviewingBooking.providerName}
            </h3>
          </div>
          <button
            onClick={() => setReviewingBooking(null)}
            className="w-9 h-9 rounded-full bg-[#FAF7F2] dark:bg-[#1A2820] hover:bg-[#EDE5D5] dark:hover:bg-[#253A2E] text-[#1F2A24] dark:text-[#EDF3EF] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Booking Verification Pill */}
          <div className="bg-[#EAF3EC] dark:bg-emerald-950/40 p-3 rounded-2xl border border-[#CDE3D4] dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-[#284435] dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold block">Verified Booking Ref: {reviewingBooking.referenceCode}</span>
              <span className="text-[11px] text-[#4D5E55] dark:text-[#8DA195]">{reviewingBooking.listingTitle} ({reviewingBooking.date})</span>
            </div>
          </div>

          {/* Star Rating Selector */}
          <div className="space-y-1 text-center py-2 bg-white dark:bg-[#152019] p-4 rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] transition-colors">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] block mb-2">
              Overall Experience Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-300 dark:text-zinc-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-[#6B7A72] dark:text-[#8DA195] block mt-1">
              {rating === 5 ? 'Exceptional (5/5)' : rating === 4 ? 'Very Good (4/5)' : rating === 3 ? 'Average (3/5)' : 'Needs Improvement'}
            </span>
          </div>

          {/* Reviewer Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] block">Your Name</label>
            <input
              type="text"
              required
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500"
            />
          </div>

          {/* Feedback Text */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] block">
              Trip Highlights & Feedback
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the guide's knowledge, wildlife sightings, vehicle condition, or customer service..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500 leading-relaxed resize-none"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#284435] hover:bg-[#1E332A] dark:bg-[#1F3A2C] dark:hover:bg-[#284B38] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4 text-[#E8B94A]" />
            <span>Publish Verified Review</span>
          </button>
        </form>
      </div>
    </div>
  );
};
