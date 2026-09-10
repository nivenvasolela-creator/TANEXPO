import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QuoteExtraItem } from '../../types';
import { 
  X, 
  Send, 
  Plus, 
  Trash2, 
  Coins, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import { COMMISSION_RATE } from '../../data/initialData';

export const QuoteBuilderModal: React.FC = () => {
  const { 
    quoteBuilderLead, 
    setQuoteBuilderLead, 
    sendQuote, 
    listings,
    formatPrice
  } = useApp();

  const [basePrice, setBasePrice] = useState<number>(1500000);
  const [extras, setExtras] = useState<QuoteExtraItem[]>([
    { id: '1', title: 'Airport transfer from Kilimanjaro Int. Airport (JRO)', amount: 150000 }
  ]);
  const [newExtraTitle, setNewExtraTitle] = useState('');
  const [newExtraAmount, setNewExtraAmount] = useState<string>('');
  const [discount, setDiscount] = useState<number>(50000);
  const [validDays, setValidDays] = useState<number>(10);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (quoteBuilderLead) {
      const matchedListing = listings.find((l) => l.id === quoteBuilderLead.listingId);
      const calculatedBasePrice = matchedListing 
        ? matchedListing.priceTZS * (quoteBuilderLead.groupSize || 1)
        : 1500000;

      setBasePrice(calculatedBasePrice);
      setNote(
        `Habari ${quoteBuilderLead.touristName.split(' ')[0]}! We have verified availability for ${quoteBuilderLead.groupSize} guests on ${quoteBuilderLead.date}. Our private 4x4 Land Cruiser with pop-up roof and certified guide is reserved.`
      );
      setExtras([
        { id: '1', title: 'Airport transfer from Kilimanjaro Int. Airport (JRO)', amount: 150000 }
      ]);
      setDiscount(50000);
      setValidDays(10);
    }
  }, [quoteBuilderLead, listings]);

  if (!quoteBuilderLead) return null;

  const extrasTotal = extras.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const grandTotal = Math.max(0, basePrice + extrasTotal - (Number(discount) || 0));
  const estimatedCommission = Math.round(grandTotal * COMMISSION_RATE);
  const netOperatorPayout = grandTotal - estimatedCommission;

  const handleAddExtra = () => {
    if (!newExtraTitle) return;
    const amount = Number(newExtraAmount) || 0;
    setExtras(prev => [
      ...prev,
      { id: Date.now().toString(), title: newExtraTitle, amount }
    ]);
    setNewExtraTitle('');
    setNewExtraAmount('');
  };

  const handleRemoveExtra = (id: string) => {
    setExtras(prev => prev.filter(e => e.id !== id));
  };

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + validDays);

    sendQuote(quoteBuilderLead.id, {
      basePrice,
      extras,
      discount,
      total: grandTotal,
      validUntil: expiryDate.toISOString().split('T')[0],
      note,
      sentAt: new Date().toISOString()
    });

    setQuoteBuilderLead(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white dark:bg-[#0D1511] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] transition-colors">
        {/* Header */}
        <div className="bg-[#FAF7F2] dark:bg-[#152019] p-5 sm:p-6 border-b border-[#E8DFC9] dark:border-[#23352A] flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
              Lead ID: #{quoteBuilderLead.id}
            </span>
            <h3 className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
              Build Custom Quote for {quoteBuilderLead.touristName}
            </h3>
          </div>
          <button
            onClick={() => setQuoteBuilderLead(null)}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#1A2820] hover:bg-[#EDE5D5] dark:hover:bg-[#253A2E] text-[#6B7A72] dark:text-[#8DA195] flex items-center justify-center border border-[#E8DFC9] dark:border-[#2A3E31] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lead Context Summary */}
        <div className="bg-[#F6F2E9] dark:bg-[#121D16] px-6 py-3 border-b border-[#E8DFC9] dark:border-[#23352A] flex flex-wrap items-center justify-between gap-3 text-xs text-[#4D5E55] dark:text-[#BED0C5] transition-colors">
          <div>
            <span>Requested: <strong>{quoteBuilderLead.listingTitle}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span>Date: <strong>{quoteBuilderLead.date}</strong></span>
            <span>•</span>
            <span>Travelers: <strong>{quoteBuilderLead.groupSize} Guests</strong></span>
          </div>
        </div>

        {/* Quote Form */}
        <form onSubmit={handleSendQuote} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Base Package Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">
                Base Tour Package Rate (TZS) *
              </label>
              <span className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                For {quoteBuilderLead.groupSize} guests
              </span>
            </div>
            <input
              type="number"
              required
              min={10000}
              step={10000}
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#16221B] focus:outline-hidden focus:border-[#284435] dark:focus:border-[#E8B94A] font-semibold text-[#284435] dark:text-[#EDF3EF]"
            />
            <p className="text-[10px] text-[#6B7A72] dark:text-[#8DA195]">
              {formatPrice(basePrice)}
            </p>
          </div>

          {/* Add-on Extras & Concessions */}
          <div className="space-y-3 pt-3 border-t border-[#F0EBE0] dark:border-[#1F3025]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF] block">
                Custom Line Items & Add-Ons
              </span>
              <span className="text-[11px] text-[#6B7A72] dark:text-[#8DA195] font-medium">
                Subtotal: +{formatPrice(extrasTotal, false)}
              </span>
            </div>

            {/* List of current extras */}
            <div className="space-y-2">
              {extras.map((ex) => (
                <div 
                  key={ex.id}
                  className="flex items-center justify-between gap-3 p-2.5 bg-[#FAF7F2] dark:bg-[#16221B] rounded-xl border border-[#E8DFC9] dark:border-[#2A3E31] text-xs"
                >
                  <span className="font-medium text-[#284435] dark:text-[#EDF3EF] truncate">{ex.title}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-[#D97843]">
                      {ex.amount === 0 ? 'Free inclusion' : `+${formatPrice(ex.amount, false)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtra(ex.id)}
                      className="text-zinc-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Extra Input Row */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={newExtraTitle}
                onChange={(e) => setNewExtraTitle(e.target.value)}
                placeholder="e.g. Serengeti Balloon Safari, Airport pickup JRO..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#16221B] text-[#1F2A24] dark:text-[#EDF3EF] placeholder:text-[#8DA195] focus:outline-hidden"
              />
              <input
                type="number"
                step={5000}
                value={newExtraAmount}
                onChange={(e) => setNewExtraAmount(e.target.value)}
                placeholder="Amount TZS"
                className="w-full sm:w-32 px-3 py-1.5 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#16221B] text-[#1F2A24] dark:text-[#EDF3EF] placeholder:text-[#8DA195] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddExtra}
                className="px-3 py-1.5 bg-[#284435] dark:bg-[#1E332A] hover:bg-[#1E332A] dark:hover:bg-[#284435] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Discount / Concession */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#F0EBE0] dark:border-[#1F3025]">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">
                Special Concession / Discount (TZS)
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#16221B] focus:outline-hidden text-emerald-700 dark:text-emerald-400 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">
                Quote Validity Period
              </label>
              <select
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#16221B] focus:outline-hidden text-[#284435] dark:text-[#EDF3EF]"
              >
                <option value={5}>Valid for 5 Days</option>
                <option value={10}>Valid for 10 Days</option>
                <option value={14}>Valid for 14 Days</option>
                <option value={30}>Valid for 30 Days</option>
              </select>
            </div>
          </div>

          {/* Operator Message */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">
              Personalized Note to Traveler
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#16221B] focus:outline-hidden text-[#4D5E55] dark:text-[#BED0C5] resize-none"
            />
          </div>

          {/* Real-time Calculation Card */}
          <div className="bg-[#FAF7F2] dark:bg-[#16221B] p-4 rounded-2xl border border-[#E8DFC9] dark:border-[#2A3E31] space-y-2 text-xs">
            <div className="flex justify-between text-[#4D5E55] dark:text-[#BED0C5]">
              <span>Base Package + Custom Add-Ons:</span>
              <span className="font-semibold">{formatPrice(basePrice + extrasTotal, false)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Discount applied:</span>
                <span>-{formatPrice(discount, false)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#E8DFC9] dark:border-[#2A3E31] flex justify-between font-bold text-sm text-[#284435] dark:text-[#EDF3EF]">
              <span>Official Quote Total to Client:</span>
              <span className="text-[#D97843]">{formatPrice(grandTotal)}</span>
            </div>

            <div className="pt-2 border-t border-[#E8DFC9] dark:border-[#2A3E31] text-[11px] text-[#6B7A72] dark:text-[#8DA195] flex items-center justify-between">
              <span>TANEXPO 15% Platform Commission:</span>
              <span>{formatPrice(estimatedCommission, false)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <span>Your Projected Net Settlement (85%):</span>
              <span>{formatPrice(netOperatorPayout, false)}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#D97843] hover:bg-[#C26735] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Official Quote to {quoteBuilderLead.touristName}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
