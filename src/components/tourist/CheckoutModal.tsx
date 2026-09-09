import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  Copy, 
  Check, 
  QrCode, 
  Ticket, 
  RefreshCw,
  Building2,
  PhoneCall,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Transaction } from '../../types';

export const CheckoutModal: React.FC = () => {
  const { 
    checkoutLead, 
    setCheckoutLead, 
    processPaymentConfirmation, 
    setActiveVoucher, 
    formatPrice,
    listings,
    currentUser,
    t
  } = useApp();

  const [paymentRail, setPaymentRail] = useState<Transaction['paymentRail']>('M-Pesa');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '+255 754 012 345');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || 'Jane Doe');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('312');
  const [paymentStep, setPaymentStep] = useState<'details' | 'control_number' | 'success'>('details');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [controlNumber, setControlNumber] = useState('9942 0184 3920');
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  useEffect(() => {
    if (checkoutLead) {
      // Generate realistic 12-digit Tanzanian Control Number based on lead
      const numericSeed = Math.abs(checkoutLead.id).toString().padStart(4, '0');
      setControlNumber(`99${numericSeed.slice(0, 2)} 0184 ${numericSeed.slice(2, 4)}92`);
    }
  }, [checkoutLead]);

  if (!checkoutLead) return null;

  const matchedListing = listings.find((l) => l.id === checkoutLead.listingId);
  const basePrice = matchedListing ? matchedListing.priceTZS * (checkoutLead.groupSize || 1) : 1200000;
  const totalAmountTZS = checkoutLead.quote ? checkoutLead.quote.total : basePrice;

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentRail === 'CRDB Bank') {
      // Bank card processing
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        const booking = processPaymentConfirmation(checkoutLead.id, paymentRail, cardNumber);
        setConfirmedBooking(booking);
        setPaymentStep('success');
      }, 1200);
    } else {
      // Mobile money dispatch: Go to official Control Number screen
      setPaymentStep('control_number');
    }
  };

  const handleCopyControlNumber = () => {
    const rawNumber = controlNumber.replace(/\s+/g, '');
    navigator.clipboard.writeText(rawNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerifyHandsetPayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const booking = processPaymentConfirmation(checkoutLead.id, paymentRail, phoneNumber);
      setConfirmedBooking(booking);
      setPaymentStep('success');
    }, 1500);
  };

  const handleViewVoucherAndClose = () => {
    if (confirmedBooking) {
      setActiveVoucher(confirmedBooking);
    }
    setCheckoutLead(null);
    setPaymentStep('details');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-[#FAF7F2] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E8DFC9]">
        {/* Top Header */}
        <div className="p-6 bg-white border-b border-[#E8DFC9] flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#D97843] uppercase tracking-wider block">
              Secure Escrow Checkout
            </span>
            <h3 className="font-serif text-xl font-bold text-[#284435]">
              Confirm & Book Expedition
            </h3>
          </div>
          <button
            onClick={() => { setCheckoutLead(null); setPaymentStep('details'); }}
            className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#EDE5D5] text-[#1F2A24] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Payment Method & Details */}
        {paymentStep === 'details' && (
          <form onSubmit={handleStartPayment} className="p-6 space-y-5">
            {/* Itinerary Summary */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#284435]">
                    {checkoutLead.listingTitle}
                  </h4>
                  <p className="text-xs text-[#6B7A72]">
                    Operator: <strong>{checkoutLead.providerName}</strong> • {checkoutLead.groupSize} Guests
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#F0EBE0]">
                <span className="text-xs text-[#6B7A72]">Total Payable (Escrow Hold):</span>
                <span className="font-serif font-bold text-base text-[#284435]">
                  {formatPrice(totalAmountTZS)}
                </span>
              </div>
            </div>

            {/* BOT Compliance Notice */}
            <div className="bg-[#EAF3EC] p-3.5 rounded-2xl border border-[#CDE3D4] text-xs text-[#284435] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Bank of Tanzania (BOT) Escrow Protocol:</strong>
                <span className="text-[11px] text-[#4D5E55] leading-relaxed">
                  Invoiced in lawful Tanzanian Shillings (TZS). Your payment is held securely in the national escrow reserve and released to the verified operator upon confirmed departure.
                </span>
              </div>
            </div>

            {/* Payment Rail Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#284435] block">
                Select Tanzanian Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { rail: 'M-Pesa' as const, name: 'Vodacom M-Pesa', icon: Smartphone, color: 'text-red-600' },
                  { rail: 'Tigo Pesa' as const, name: 'Tigo Pesa', icon: Smartphone, color: 'text-blue-600' },
                  { rail: 'Airtel Money' as const, name: 'Airtel Money', icon: Smartphone, color: 'text-red-500' },
                  { rail: 'CRDB Bank' as const, name: 'CRDB / Visa / MC', icon: CreditCard, color: 'text-emerald-700' }
                ].map((item) => (
                  <button
                    key={item.rail}
                    type="button"
                    onClick={() => setPaymentRail(item.rail)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentRail === item.rail
                        ? 'bg-white border-[#284435] ring-2 ring-[#284435]/15 shadow-xs'
                        : 'bg-white/60 border-[#DED5C6] hover:bg-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs font-bold text-[#1F2A24]">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Rail Input */}
            {paymentRail !== 'CRDB Bank' ? (
              <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-[#E8DFC9]">
                <label className="text-xs font-bold text-[#284435] flex items-center justify-between">
                  <span>Mobile Money Subscriber Number</span>
                  <span className="text-[10px] text-[#D97843] font-semibold">Tanzanian SIM (+255)</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#6B7A72] absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+255 754 012 345"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden font-medium"
                  />
                </div>
                <p className="text-[11px] text-[#6B7A72] pt-1">
                  We will dispatch an automated prompt to your phone and generate an official Control Number for payment.
                </p>
              </div>
            ) : (
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E8DFC9]">
                <label className="text-xs font-bold text-[#284435] block">
                  Card Payment Details
                </label>
                <div>
                  <label className="text-[10px] text-[#6B7A72] block mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A72] block mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-[#6B7A72] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#6B7A72] block mb-1">Expiry Date</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A72] block mb-1">CVC / CVV</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="312"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action CTA */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing Card Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {paymentRail === 'CRDB Bank'
                      ? `Pay ${formatPrice(totalAmountTZS, false)} with Card`
                      : `Generate Control Number & Push Prompt`}
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Professional Payment Reference & Control Number Screen */}
        {paymentStep === 'control_number' && (
          <div className="p-6 space-y-5">
            {/* Control Number Card */}
            <div className="bg-white rounded-2xl border border-[#E8DFC9] p-5 space-y-4 shadow-sm text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>BOT Escrow Payment Reference</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] uppercase font-bold text-[#6B7A72] tracking-wider block">
                  Payment Control Number
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-[#284435] tracking-widest">
                    {controlNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyControlNumber}
                    className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE2D2] text-[#284435] border border-[#E8DFC9] transition-colors cursor-pointer"
                    title="Copy control number"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#6B7A72]" />
                    )}
                  </button>
                </div>
                {copied && (
                  <span className="text-[11px] text-emerald-700 font-bold block animate-fade-in">
                    Copied control number!
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-[#F0EBE0] grid grid-cols-2 gap-2 text-left text-xs">
                <div>
                  <span className="text-[10px] text-[#6B7A72] block">Amount Due:</span>
                  <strong className="text-[#284435] font-serif text-sm">
                    {formatPrice(totalAmountTZS, false)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7A72] block">Account Name:</span>
                  <strong className="text-[#284435] truncate block">TANEXPO ESCROW</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7A72] block">Phone Prompt Dispatched To:</span>
                  <strong className="text-[#284435] font-mono text-[11px]">{phoneNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7A72] block">Gateway:</span>
                  <strong className="text-[#284435]">{paymentRail}</strong>
                </div>
              </div>
            </div>

            {/* Handset Push Notification Banner */}
            <div className="bg-[#FAF0E9] p-4 rounded-2xl border border-[#EBD0BC] flex items-start gap-3">
              <PhoneCall className="w-5 h-5 text-[#D97843] shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs space-y-1">
                <strong className="text-[#284435] block">
                  Prompt Dispatched to Your Device
                </strong>
                <p className="text-[#4D5E55] leading-relaxed text-[11px]">
                  An authorization prompt has been sent automatically to <strong>{phoneNumber}</strong>. Please enter your mobile money PIN on your handset to authorize the escrow payment.
                </p>
              </div>
            </div>

            {/* Manual Instructions Accordion */}
            <div className="bg-white rounded-2xl border border-[#E8DFC9] overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowManualSteps(!showManualSteps)}
                className="w-full p-3.5 flex items-center justify-between text-left font-bold text-[#284435] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                <span>Or pay manually via USSD / Banking App</span>
                {showManualSteps ? <ChevronUp className="w-4 h-4 text-[#6B7A72]" /> : <ChevronDown className="w-4 h-4 text-[#6B7A72]" />}
              </button>

              {showManualSteps && (
                <div className="p-4 pt-0 space-y-2 text-[#4D5E55] border-t border-[#F0EBE0] bg-[#FAF7F2]">
                  {paymentRail === 'M-Pesa' && (
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>Dial <strong>*150*00#</strong> on your phone</li>
                      <li>Select <strong>4. Lipa kwa M-Pesa</strong></li>
                      <li>Select <strong>4. Weka Namba ya Kampuni / Pay Bill</strong></li>
                      <li>Enter Control Number: <strong className="font-mono">{controlNumber.replace(/\s+/g, '')}</strong></li>
                      <li>Enter Amount: <strong>{totalAmountTZS}</strong> and enter your PIN</li>
                    </ol>
                  )}
                  {paymentRail === 'Tigo Pesa' && (
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>Dial <strong>*150*01#</strong> on your phone</li>
                      <li>Select <strong>4. Lipa Bili / Pay Bill</strong></li>
                      <li>Select <strong>3. Weka Namba ya Kumbukumbu</strong></li>
                      <li>Enter Control Number: <strong className="font-mono">{controlNumber.replace(/\s+/g, '')}</strong></li>
                      <li>Confirm amount and authorize with your Tigo Pesa PIN</li>
                    </ol>
                  )}
                  {paymentRail === 'Airtel Money' && (
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>Dial <strong>*150*60#</strong> on your phone</li>
                      <li>Select <strong>5. Lipa Bili</strong></li>
                      <li>Enter Control Number: <strong className="font-mono">{controlNumber.replace(/\s+/g, '')}</strong></li>
                      <li>Confirm amount and enter PIN to finalize</li>
                    </ol>
                  )}
                </div>
              )}
            </div>

            {/* Verification Status & Confirm Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleVerifyHandsetPayment}
                disabled={isVerifying}
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Handset Payment from {paymentRail} Gateway...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Authorized on My Handset / Verify Payment</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentStep('details')}
                className="w-full text-center text-xs text-[#6B7A72] hover:text-[#1F2A24] cursor-pointer py-1"
              >
                Back to change payment rail
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Success Screen */}
        {paymentStep === 'success' && confirmedBooking && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif text-2xl font-bold text-[#284435]">
                Malipo Yamekamilika!
              </h4>
              <p className="text-xs text-[#6B7A72]">
                Booking Reference: <strong className="text-[#284435] font-mono">{confirmedBooking.referenceCode}</strong>
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8DFC9] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B7A72]">Expedition:</span>
                <span className="font-bold text-[#284435]">{confirmedBooking.tripTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7A72]">Operator:</span>
                <span className="font-bold text-[#284435]">{confirmedBooking.providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7A72]">Amount Escrowed:</span>
                <span className="font-bold text-[#284435]">{formatPrice(confirmedBooking.totalAmountTZS, false)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7A72]">Payment Rail:</span>
                <span className="font-bold text-[#284435]">{confirmedBooking.paymentRail}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleViewVoucherAndClose}
                className="w-full py-3.5 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Ticket className="w-4 h-4 text-[#E8B94A]" />
                <span>View Official Expedition Voucher</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
