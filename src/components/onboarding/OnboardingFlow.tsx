import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Compass, 
  Briefcase, 
  User as UserIcon, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Globe2, 
  MapPin, 
  Building2, 
  Plane, 
  Camera, 
  Layers, 
  FileText, 
  Coins, 
  Languages, 
  X,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { CategoryId, TouristType, Language, OnboardingStep } from '../../types';

export const OnboardingFlow: React.FC = () => {
  const {
    isOnboardingOpen,
    closeOnboarding,
    onboardingStep,
    setOnboardingStep,
    continueAsGuest,
    registerTourist,
    registerProvider,
    login,
    categories,
    guestPendingAction,
    t
  } = useApp();

  // Tourist state
  const [touristType, setTouristType] = useState<TouristType>('international');
  const [touristAuthMode, setTouristAuthMode] = useState<'signup' | 'signin'>('signup');
  const [touristName, setTouristName] = useState('');
  const [touristEmailOrPhone, setTouristEmailOrPhone] = useState('');
  const [touristPassword, setTouristPassword] = useState('');
  const [touristCountry, setTouristCountry] = useState('United States');
  const [touristCurrency, setTouristCurrency] = useState<'TZS' | 'USD'>('USD');
  const [touristLang, setTouristLang] = useState<Language>('en');
  const [touristParty, setTouristParty] = useState<'solo' | 'couple' | 'family' | 'group'>('couple');
  const [touristInterests, setTouristInterests] = useState<string[]>(['safari', 'beach']);

  // Provider state
  const [selectedProviderTypes, setSelectedProviderTypes] = useState<string[]>(['Tour operator', 'Safari company']);
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<CategoryId>('safari');
  const [businessLocation, setBusinessLocation] = useState('Arusha');
  const [businessRegion, setBusinessRegion] = useState('Northern Circuit');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('+255 7');
  const [talaLicense, setTalaLicense] = useState('TALA/2025/0842');
  const [aboutBusiness, setAboutBusiness] = useState('');

  // Provider first service
  const [serviceTitle, setServiceTitle] = useState('4-Day Northern Circuit Wildlife Safari');
  const [servicePriceTZS, setServicePriceTZS] = useState(2850000);
  const [serviceDuration, setServiceDuration] = useState('4 Days / 3 Nights');
  const [serviceInclusions, setServiceInclusions] = useState('4x4 Safari Land Cruiser, Licensed TANAPA guide, All National Park fees, Full board tented camp');

  const [formError, setFormError] = useState('');

  if (!isOnboardingOpen) return null;

  // Handle Tourist Submit
  const handleTouristSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (touristAuthMode === 'signin') {
      if (!touristEmailOrPhone) {
        setFormError('Please enter your email or phone number.');
        return;
      }
      login(touristEmailOrPhone, 'tourist');
      return;
    }

    if (!touristName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!touristEmailOrPhone.trim()) {
      setFormError('Please enter your email or phone number.');
      return;
    }

    registerTourist({
      name: touristName.trim(),
      email: touristEmailOrPhone.trim(),
      touristType,
      homeCountry: touristType === 'domestic' ? 'Tanzania' : touristCountry,
      currency: touristCurrency,
      language: touristLang,
      travelParty: touristParty,
      interests: touristInterests
    });
  };

  // Handle Provider Submit
  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!businessName.trim()) {
      setFormError('Please enter your business trading name.');
      return;
    }
    if (!businessEmail.trim() || !businessPhone.trim()) {
      setFormError('Please provide both business email and official phone.');
      return;
    }

    registerProvider({
      businessName: businessName.trim(),
      legalName: legalName.trim() || `${businessName.trim()} Limited`,
      providerTypes: selectedProviderTypes,
      primaryCategory: businessCategory,
      location: businessLocation,
      region: businessRegion,
      phone: businessPhone.trim(),
      email: businessEmail.trim(),
      talaLicense: talaLicense.trim() || undefined,
      about: aboutBusiness.trim(),
      firstPackage: {
        title: serviceTitle.trim() || `${businessCategory.toUpperCase()} Signature Trip`,
        priceTZS: Number(servicePriceTZS) || 2000000,
        duration: serviceDuration.trim() || '3 Days',
        inclusions: serviceInclusions.split(',').map(s => s.trim()).filter(Boolean)
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#FAF7F2] text-[#1F2A24] rounded-2xl shadow-2xl border border-[#D9CEBF] overflow-hidden my-auto">
        
        {/* Top Header Bar */}
        <div className="bg-[#1C2C24] text-white px-6 py-4 flex items-center justify-between border-b border-[#284435]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#284435] border border-[#3E6551] flex items-center justify-center text-[#E8B94A]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-white">
                TAN<span className="text-[#D97843]">EXPO</span>
              </span>
              <span className="text-[10px] text-emerald-300 ml-2 font-medium tracking-wide uppercase">
                Tanzania National Tourism OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onboardingStep !== 'intro_1' && (
              <button
                onClick={() => continueAsGuest()}
                className="text-xs text-zinc-300 hover:text-white underline cursor-pointer"
              >
                Browse as Guest
              </button>
            )}
            <button
              onClick={closeOnboarding}
              className="text-zinc-400 hover:text-white p-1 rounded-md cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Screen Content */}
        <div className="p-6 sm:p-8">

          {/* SCREEN 1: WELCOME */}
          {onboardingStep === 'intro_1' && (
            <div className="space-y-6 text-center max-w-lg mx-auto py-2">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#284435] to-[#172B21] flex items-center justify-center text-[#E8B94A] shadow-md border border-[#3A5F4B]">
                <Compass className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D97843]">
                  National Tourism Network
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C2C24] tracking-tight">
                  Welcome to TANEXPO
                </h1>
                <p className="text-base text-[#52645A] leading-relaxed">
                  Discover Tanzania beyond the ordinary. Direct connection to verified Tanzanian safari operators, mountain guides, cultural custodians, and marine expeditions.
                </p>
              </div>

              {/* Visual highlights pill group */}
              <div className="grid grid-cols-3 gap-2 text-xs py-3 border-y border-[#E7DFD3]">
                <div className="p-2 bg-white/70 rounded-lg border border-[#E7DFD3]">
                  <p className="font-bold text-[#284435]">Serengeti & Crater</p>
                  <p className="text-[10px] text-zinc-500">Big Five Safaris</p>
                </div>
                <div className="p-2 bg-white/70 rounded-lg border border-[#E7DFD3]">
                  <p className="font-bold text-[#284435]">Mt. Kilimanjaro</p>
                  <p className="text-[10px] text-zinc-500">Trek Roof of Africa</p>
                </div>
                <div className="p-2 bg-white/70 rounded-lg border border-[#E7DFD3]">
                  <p className="font-bold text-[#284435]">Zanzibar Coast</p>
                  <p className="text-[10px] text-zinc-500">Dhows & Swahili Reefs</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setOnboardingStep('role_select')}
                  className="text-xs font-semibold text-[#52645A] hover:text-[#1C2C24] cursor-pointer"
                >
                  Skip Intro
                </button>
                <button
                  onClick={() => setOnboardingStep('intro_2')}
                  className="bg-[#284435] hover:bg-[#1E332A] text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <span>Next: From Safaris to the Sea</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: SAFARIS TO THE SEA */}
          {onboardingStep === 'intro_2' && (
            <div className="space-y-6 text-center max-w-lg mx-auto py-2">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#D97843] to-[#B85C2B] flex items-center justify-center text-white shadow-md">
                <Globe2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#284435]">
                  Authentic Biodiversity & Culture
                </span>
                <h2 className="font-serif text-3xl font-bold text-[#1C2C24] tracking-tight">
                  From Safaris to the Sea
                </h2>
                <p className="text-base text-[#52645A] leading-relaxed">
                  Explore wildlife migrations, alpine summits, living Hadzabe & Maasai culture, turquoise Spice Island coastlines, and thriving city life across mainland Tanzania and Zanzibar.
                </p>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-left flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <p className="font-bold text-emerald-950">Bank of Tanzania & TALA Compliance</p>
                  <p>All operators adhere to Tanzania Tourism Act regulations, holding verified TALA licenses and publishing transparent official prices in Tanzanian Shillings (TZS).</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setOnboardingStep('intro_1')}
                  className="text-xs font-semibold text-[#52645A] hover:text-[#1C2C24] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={() => setOnboardingStep('intro_3')}
                  className="bg-[#284435] hover:bg-[#1E332A] text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <span>Next: Your Tanzania, Your Way</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: YOUR TANZANIA YOUR WAY */}
          {onboardingStep === 'intro_3' && (
            <div className="space-y-6 text-center max-w-lg mx-auto py-2">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#E8B94A] to-[#C99C35] flex items-center justify-center text-[#1C2C24] shadow-md">
                <Sparkles className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D97843]">
                  Personalized Tourism Intelligence
                </span>
                <h2 className="font-serif text-3xl font-bold text-[#1C2C24] tracking-tight">
                  Your Tanzania. Your Way.
                </h2>
                <p className="text-base text-[#52645A] leading-relaxed">
                  Find experiences tailored to your travel style, party size, timeline, and budget. Directly compare provider quotes, clarify logistics in direct message threads, and travel with total trust.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-[#E7DFD3] text-left text-xs space-y-1.5">
                <p className="font-bold text-[#1C2C24]">What will you find inside?</p>
                <div className="grid grid-cols-2 gap-2 text-zinc-600 pt-1">
                  <div>✓ Verified Operator Comparison</div>
                  <div>✓ Direct Real-Time Quotes</div>
                  <div>✓ Resident & Foreigner Rates</div>
                  <div>✓ Escrow-Protected Bookings</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setOnboardingStep('intro_2')}
                  className="text-xs font-semibold text-[#52645A] hover:text-[#1C2C24] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={() => setOnboardingStep('role_select')}
                  className="bg-[#D97843] hover:bg-[#C26532] text-white px-7 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <span>Get Started: Choose Your Role</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: ROLE SELECTION */}
          {onboardingStep === 'role_select' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#284435]">
                  Step 1 of 2
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2C24]">
                  What brings you to TANEXPO?
                </h2>
                <p className="text-sm text-[#52645A]">
                  Select how you will participate in the national tourism marketplace.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* TOURIST CARD */}
                <div 
                  onClick={() => setOnboardingStep('tourist_type')}
                  className="group relative p-5 bg-white rounded-2xl border-2 border-[#E7DFD3] hover:border-[#284435] hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[#EAF3EC] text-[#284435] flex items-center justify-center group-hover:bg-[#284435] group-hover:text-[#E8B94A] transition-colors">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1C2C24] group-hover:text-[#284435]">
                        I'm a Tourist
                      </h3>
                      <p className="text-xs text-[#52645A] mt-1 leading-relaxed">
                        Discover safari destinations, compare licensed tour packages, request custom quotes, and book trips safely.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs font-bold text-[#284435] border-t border-[#F2ECE1] mt-4">
                    <span>Continue as Tourist</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* SERVICE PROVIDER CARD */}
                <div 
                  onClick={() => setOnboardingStep('provider_type')}
                  className="group relative p-5 bg-white rounded-2xl border-2 border-[#E7DFD3] hover:border-[#D97843] hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF0E9] text-[#D97843] flex items-center justify-center group-hover:bg-[#D97843] group-hover:text-white transition-colors">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1C2C24] group-hover:text-[#D97843]">
                        I'm a Service Provider
                      </h3>
                      <p className="text-xs text-[#52645A] mt-1 leading-relaxed">
                        Promote safari packages, manage incoming customer leads in a live CRM, send dynamic quotes, and track bookings.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs font-bold text-[#D97843] border-t border-[#F2ECE1] mt-4">
                    <span>Continue as Provider</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* GUEST OPTION */}
              <div className="p-4 bg-white/70 rounded-xl border border-[#E7DFD3] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#1C2C24]">Just exploring for now?</p>
                  <p className="text-xs text-zinc-500">You can browse destinations, view packages, and compare operators without an account.</p>
                </div>
                <button
                  onClick={() => continueAsGuest()}
                  className="shrink-0 px-4 py-2 bg-white hover:bg-zinc-100 border border-[#D9CEBF] text-xs font-semibold rounded-lg text-[#1C2C24] cursor-pointer transition-colors"
                >
                  Continue as Guest
                </button>
              </div>

              {/* Existing user login link */}
              <div className="text-center pt-2">
                <span className="text-xs text-zinc-500">Already have an account? </span>
                <button
                  onClick={() => {
                    setTouristAuthMode('signin');
                    setOnboardingStep('tourist_auth');
                  }}
                  className="text-xs font-bold text-[#284435] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 5: TOURIST TYPE (DOMESTIC VS INTERNATIONAL) */}
          {onboardingStep === 'tourist_type' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#284435]">
                  Personalize Your Exploration
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C2C24]">
                  How will you be travelling?
                </h2>
                <p className="text-sm text-[#52645A]">
                  This customizes recommendations, currency presentation, and park fee estimates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DOMESTIC */}
                <div
                  onClick={() => {
                    setTouristType('domestic');
                    setTouristCurrency('TZS');
                    setTouristCountry('Tanzania');
                    setOnboardingStep('tourist_auth');
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    touristType === 'domestic' ? 'border-[#284435] bg-emerald-50/50' : 'border-[#E7DFD3] bg-white hover:border-zinc-400'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      🇹🇿
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#1C2C24]">
                        Domestic Tourist
                      </h3>
                      <p className="text-xs text-[#52645A] mt-1 leading-relaxed">
                        I reside or work within Tanzania. Looking for weekend escapes, resident park rates, local transport, and group family getaways.
                      </p>
                    </div>
                    <div className="pt-2 text-[11px] text-emerald-800 font-medium">
                      ✓ Resident park fee tiers • TZS direct settlement • Local day trips
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs font-bold text-[#284435] border-t border-[#E7DFD3] mt-4">
                    <span>Select Domestic</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* INTERNATIONAL */}
                <div
                  onClick={() => {
                    setTouristType('international');
                    setTouristCurrency('USD');
                    setOnboardingStep('tourist_auth');
                  }}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    touristType === 'international' ? 'border-[#284435] bg-emerald-50/50' : 'border-[#E7DFD3] bg-white hover:border-zinc-400'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      🌍
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#1C2C24]">
                        International Tourist
                      </h3>
                      <p className="text-xs text-[#52645A] mt-1 leading-relaxed">
                        I am visiting Tanzania from abroad. Planning multi-day Serengeti Great Migration safaris, Kilimanjaro climbs, and Zanzibar arrivals.
                      </p>
                    </div>
                    <div className="pt-2 text-[11px] text-blue-800 font-medium">
                      ✓ Non-resident fee clarity • Multi-day logistics • Airport transfer assistance
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs font-bold text-[#284435] border-t border-[#E7DFD3] mt-4">
                    <span>Select International</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setOnboardingStep('role_select')}
                  className="text-xs text-[#52645A] hover:text-[#1C2C24] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={() => continueAsGuest()}
                  className="text-xs text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                >
                  Skip and browse as Guest
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 6: TOURIST ACCOUNT CREATION / SIGN IN */}
          {onboardingStep === 'tourist_auth' && (
            <form onSubmit={handleTouristSubmit} className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="font-serif text-2xl font-bold text-[#1C2C24]">
                  {touristAuthMode === 'signup' ? 'Create Your TANEXPO Account' : 'Sign in to TANEXPO'}
                </h2>
                <p className="text-xs text-[#52645A]">
                  {touristAuthMode === 'signup' 
                    ? `Personalized for ${touristType === 'domestic' ? 'Domestic Tanzanian Resident' : 'International Traveler'}`
                    : 'Access your saved trips, inquiries, and booking vouchers'}
                </p>
              </div>

              {/* Guest Context Retention Notice */}
              {guestPendingAction && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Your pending action ({guestPendingAction.type.replace('_', ' ')}) will automatically resume once signed in.</span>
                </div>
              )}

              {/* Tab selector */}
              <div className="flex rounded-xl bg-zinc-200/70 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTouristAuthMode('signup')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    touristAuthMode === 'signup' ? 'bg-white text-[#1C2C24] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setTouristAuthMode('signin')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    touristAuthMode === 'signin' ? 'bg-white text-[#1C2C24] shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {touristAuthMode === 'signup' ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={touristName}
                      onChange={e => setTouristName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins or Juma Bakari"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#284435]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#1C2C24] mb-1">Email or Phone *</label>
                      <input
                        type="text"
                        value={touristEmailOrPhone}
                        onChange={e => setTouristEmailOrPhone(e.target.value)}
                        placeholder="sarah@example.com or +255 7..."
                        className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#284435]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#1C2C24] mb-1">Password</label>
                      <input
                        type="password"
                        value={touristPassword}
                        onChange={e => setTouristPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#284435]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-[#1C2C24] mb-1">Home Country</label>
                      <input
                        type="text"
                        value={touristCountry}
                        onChange={e => setTouristCountry(e.target.value)}
                        disabled={touristType === 'domestic'}
                        className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg disabled:bg-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#1C2C24] mb-1">Display Currency</label>
                      <select
                        value={touristCurrency}
                        onChange={e => setTouristCurrency(e.target.value as 'TZS' | 'USD')}
                        className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                      >
                        <option value="USD">USD ($) Approx</option>
                        <option value="TZS">TZS (Shilingi)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#1C2C24] mb-1">Language</label>
                      <select
                        value={touristLang}
                        onChange={e => setTouristLang(e.target.value as Language)}
                        className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                      >
                        <option value="en">English</option>
                        <option value="sw">Kiswahili</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Travel Party</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['solo', 'couple', 'family', 'group'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTouristParty(p)}
                          className={`py-1.5 px-2 rounded-lg border text-center capitalize cursor-pointer transition-colors ${
                            touristParty === p ? 'bg-[#284435] text-white border-[#284435]' : 'bg-white border-[#D9CEBF] text-zinc-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Email or Phone</label>
                    <input
                      type="text"
                      value={touristEmailOrPhone}
                      onChange={e => setTouristEmailOrPhone(e.target.value)}
                      placeholder="e.g. traveler@example.com"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Password</label>
                    <input
                      type="password"
                      value={touristPassword}
                      onChange={e => setTouristPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardingStep('tourist_type')}
                  className="text-xs text-[#52645A] hover:text-[#1C2C24] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="submit"
                  className="bg-[#284435] hover:bg-[#1E332A] text-white px-6 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <span>{touristAuthMode === 'signup' ? 'Complete Registration' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* SCREEN 7: PROVIDER TYPE */}
          {onboardingStep === 'provider_type' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D97843]">
                  Provider Onboarding • Step 1 of 4
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#1C2C24]">
                  What kind of service do you provide?
                </h2>
                <p className="text-xs text-[#52645A]">
                  Select all service disciplines applicable to your Tanzanian tourism business.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  'Tour operator',
                  'Safari company',
                  'Mountain/Kilimanjaro operator',
                  'Licensed TANAPA Guide',
                  'Accommodation / Lodge',
                  'Transport / 4x4 Fleet',
                  'Boat & Marine Tour provider',
                  'Cultural Experience Host',
                  'Adventure & Balloon Safari'
                ].map(type => {
                  const isSelected = selectedProviderTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedProviderTypes(prev =>
                          isSelected ? prev.filter(t => t !== type) : [...prev, type]
                        );
                      }}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#D97843] bg-[#FAF0E9] text-[#1C2C24] font-semibold' 
                          : 'border-[#E7DFD3] bg-white text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      <span>{type}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D97843] shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2C24] mb-1">Primary Marketplace Category *</label>
                <select
                  value={businessCategory}
                  onChange={e => setBusinessCategory(e.target.value as CategoryId)}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label} ({c.sub})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardingStep('role_select')}
                  className="text-xs text-[#52645A] hover:text-[#1C2C24] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardingStep('provider_basics')}
                  className="bg-[#D97843] hover:bg-[#C26532] text-white px-6 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <span>Next: Business Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 8: PROVIDER BASICS */}
          {onboardingStep === 'provider_basics' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D97843]">
                  Provider Onboarding • Step 2 of 4
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#1C2C24]">
                  Business Profile & Operating Base
                </h2>
                <p className="text-xs text-[#52645A]">
                  Establish your commercial identity on the TANEXPO network.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Trading / Brand Name *</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Serengeti Horizons Expeditions"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Legal Entity Name</label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={e => setLegalName(e.target.value)}
                      placeholder="e.g. Horizons Tanzania Co. Ltd"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Official Business Email *</label>
                    <input
                      type="email"
                      value={businessEmail}
                      onChange={e => setBusinessEmail(e.target.value)}
                      placeholder="info@horizons.co.tz"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Business Phone / WhatsApp *</label>
                    <input
                      type="text"
                      value={businessPhone}
                      onChange={e => setBusinessPhone(e.target.value)}
                      placeholder="+255 754 000 000"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Headquarters City / Town</label>
                    <input
                      type="text"
                      value={businessLocation}
                      onChange={e => setBusinessLocation(e.target.value)}
                      placeholder="Arusha, Moshi, Stone Town, or Dar"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Circuit / Region</label>
                    <select
                      value={businessRegion}
                      onChange={e => setBusinessRegion(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                    >
                      <option value="Northern Circuit">Northern Safari Circuit (Arusha/Serengeti)</option>
                      <option value="Zanzibar Archipelago">Zanzibar Archipelago (Unguja/Pemba)</option>
                      <option value="Kilimanjaro & Meru">Kilimanjaro & Mount Meru Highlands</option>
                      <option value="Southern Circuit">Southern Wilds (Nyerere/Ruaha)</option>
                      <option value="Coastal & Marine">Dar es Salaam & Mafia Island</option>
                      <option value="Western Circuit">Western Chimps (Gombe/Mahale)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C2C24] mb-1">About Your Tourism Operations</label>
                  <textarea
                    rows={2}
                    value={aboutBusiness}
                    onChange={e => setAboutBusiness(e.target.value)}
                    placeholder="Describe your expertise, guide credentials, and specializations..."
                    className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardingStep('provider_type')}
                  className="text-xs text-[#52645A] hover:text-[#1C2C24] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardingStep('provider_service')}
                  className="bg-[#D97843] hover:bg-[#C26532] text-white px-6 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <span>Next: First Listing & Pricing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 9: PROVIDER FIRST SERVICE */}
          {onboardingStep === 'provider_service' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D97843]">
                  Provider Onboarding • Step 3 of 4
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#1C2C24]">
                  Add Your First Signature Listing
                </h2>
                <p className="text-xs text-[#52645A]">
                  Publish an introductory package to immediately receive qualified tourist inquiries.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#1C2C24] mb-1">Package / Experience Title *</label>
                  <input
                    type="text"
                    value={serviceTitle}
                    onChange={e => setServiceTitle(e.target.value)}
                    placeholder="e.g. 3-Day Serengeti Great Migration & Ngorongoro"
                    className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Base Price in TZS (Official Legal Tender) *</label>
                    <input
                      type="number"
                      step={50000}
                      value={servicePriceTZS}
                      onChange={e => setServicePriceTZS(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg font-mono font-bold text-[#284435]"
                      required
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Bank of Tanzania standard: approx ~${Math.round(servicePriceTZS / 2620).toLocaleString()} USD
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1C2C24] mb-1">Duration *</label>
                    <input
                      type="text"
                      value={serviceDuration}
                      onChange={e => setServiceDuration(e.target.value)}
                      placeholder="e.g. 3 Days / 2 Nights"
                      className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C2C24] mb-1">Inclusions (Separated by comma)</label>
                  <textarea
                    rows={2}
                    value={serviceInclusions}
                    onChange={e => setServiceInclusions(e.target.value)}
                    placeholder="4x4 Pop-up Land Cruiser, TANAPA Park fees, Professional guide, Meals..."
                    className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardingStep('provider_basics')}
                  className="text-xs text-[#52645A] hover:text-[#1C2C24] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardingStep('provider_verification')}
                  className="bg-[#D97843] hover:bg-[#C26532] text-white px-6 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <span>Next: Regulatory Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 10: PROVIDER VERIFICATION */}
          {onboardingStep === 'provider_verification' && (
            <form onSubmit={handleProviderSubmit} className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                  Final Step • Regulatory Verification
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#1C2C24]">
                  Tanzania Tourism Act Compliance
                </h2>
                <p className="text-xs text-[#52645A]">
                  TANEXPO requires verified credentials under Ministry of Natural Resources and Tourism (MNRT) guidelines.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#1C2C24] mb-1">TALA License Number</label>
                  <input
                    type="text"
                    value={talaLicense}
                    onChange={e => setTalaLicense(e.target.value)}
                    placeholder="TALA/YYYY/XXXX"
                    className="w-full px-3 py-2 bg-white border border-[#D9CEBF] rounded-lg font-mono font-semibold"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    If pending renewal, enter your temporary submission reference.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Auditable Compliance Status
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Your profile will initially launch as <strong>Application Submitted</strong> and undergo TANEXPO registry cross-checking before gaining the full <strong>TANEXPO Verified</strong> seal.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardingStep('provider_service')}
                  className="text-xs text-[#52645A] hover:text-[#1C2C24] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="submit"
                  className="bg-[#284435] hover:bg-[#1E332A] text-white px-7 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <span>Launch Provider Control OS</span>
                  <CheckCircle2 className="w-4 h-4 text-[#E8B94A]" />
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
