import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Category,
  Provider,
  ListingPackage,
  Lead,
  Booking,
  Review,
  Transaction,
  LeadStatus,
  Quote,
  Language,
  DestinationPlace,
  LeadMessage,
  User,
  UserRole,
  TouristType,
  TouristProfile,
  ProviderProfile,
  OnboardingStep,
  GuestPendingAction,
  CategoryId
} from '../types';
import {
  categories,
  initialProviders,
  initialListings,
  initialLeads,
  initialBookings,
  initialReviews,
  initialTransactions,
  COMMISSION_RATE,
  TZS_TO_USD_RATE
} from '../data/initialData';
import { initialDestinations } from '../data/destinationsData';
import { translations } from '../data/translations';

interface AppContextType {
  // Localization & Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;

  // Identity, Session & Roles
  currentUser: User | null;
  isOnboardingOpen: boolean;
  onboardingStep: OnboardingStep;
  guestPendingAction: GuestPendingAction | null;
  startOnboarding: (step?: OnboardingStep) => void;
  closeOnboarding: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  registerTourist: (data: {
    name: string;
    email: string;
    phone?: string;
    touristType: TouristType;
    homeCountry: string;
    currency: 'TZS' | 'USD';
    language: Language;
    travelParty?: 'solo' | 'couple' | 'family' | 'group';
    interests?: string[];
  }) => User;
  registerProvider: (data: {
    businessName: string;
    legalName?: string;
    providerTypes: string[];
    primaryCategory: CategoryId;
    location: string;
    region: string;
    phone: string;
    email: string;
    talaLicense?: string;
    about: string;
    firstPackage?: {
      title: string;
      priceTZS: number;
      duration: string;
      inclusions: string[];
    };
  }) => User;
  login: (emailOrPhone: string, role: UserRole) => boolean;
  continueAsGuest: () => void;
  logout: () => void;
  updateTouristProfile: (profile: Partial<TouristProfile>) => void;
  updateProviderBusinessProfile: (profile: Partial<ProviderProfile>) => void;
  requireAuth: (action: GuestPendingAction) => boolean;
  clearGuestPendingAction: () => void;
  isDomesticTourist: boolean;
  isInternationalTourist: boolean;
  isGuest: boolean;
  isProvider: boolean;

  // State
  categories: Category[];
  destinations: DestinationPlace[];
  providers: Provider[];
  listings: ListingPackage[];
  leads: Lead[];
  bookings: Booking[];
  reviews: Review[];
  transactions: Transaction[];
  savedProviderIds: number[];
  comparedProviderIds: number[];
  
  // Navigation & View State
  currentView: 'tourist' | 'provider';
  setCurrentView: (view: 'tourist' | 'provider') => void;
  touristTab: 'explore' | 'requests' | 'saved' | 'compliance';
  setTouristTab: (tab: 'explore' | 'requests' | 'saved' | 'compliance') => void;
  providerTab: 'overview' | 'leads' | 'listings' | 'bookings' | 'financials' | 'reviews' | 'profile';
  setProviderTab: (tab: 'overview' | 'leads' | 'listings' | 'bookings' | 'financials' | 'reviews' | 'profile') => void;
  activeProviderId: number;
  setActiveProviderId: (id: number) => void;
  showUSDApprox: boolean;
  setShowUSDApprox: (show: boolean) => void;
  
  // Modal / Selection State
  selectedProvider: Provider | null;
  setSelectedProvider: (p: Provider | null) => void;
  selectedDestination: DestinationPlace | null;
  setSelectedDestination: (d: DestinationPlace | null) => void;
  inquiryPackage: { provider: Provider; listing: ListingPackage } | null;
  setInquiryPackage: (item: { provider: Provider; listing: ListingPackage } | null) => void;
  activeVoucher: Booking | null;
  setActiveVoucher: (b: Booking | null) => void;
  quoteBuilderLead: Lead | null;
  setQuoteBuilderLead: (l: Lead | null) => void;
  editingListing: ListingPackage | null;
  setEditingListing: (l: ListingPackage | null) => void;
  isNewListingModalOpen: boolean;
  setIsNewListingModalOpen: (open: boolean) => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  checkoutLead: Lead | null;
  setCheckoutLead: (l: Lead | null) => void;
  reviewingBooking: Booking | null;
  setReviewingBooking: (b: Booking | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Comparison actions
  toggleCompareProvider: (providerId: number) => void;
  clearCompare: () => void;

  // Actions
  submitInquiry: (data: {
    providerId: number;
    providerName: string;
    listingId: number;
    listingTitle: string;
    touristName: string;
    touristContact: string;
    date: string;
    groupSize: number;
    budgetTZS?: string;
    message?: string;
  }) => Lead;
  updateLeadStatus: (leadId: number, status: LeadStatus) => void;
  sendQuote: (leadId: number, quote: Quote) => void;
  acceptQuote: (leadId: number) => Booking | null;
  declineQuote: (leadId: number) => void;
  markLeadBookedDirect: (leadId: number) => Booking | null;
  sendMessageOnLead: (leadId: number, text: string, sender: 'tourist' | 'provider') => void;
  processPaymentConfirmation: (leadId: number, paymentRail: Transaction['paymentRail'], accountOrPhone: string) => Booking | null;
  saveListing: (listingData: Omit<ListingPackage, 'id'> & { id?: number }) => void;
  deleteListing: (listingId: number) => void;
  addReviewResponse: (reviewId: number, response: string) => void;
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  updateBookingStatus: (bookingId: number, status: 'Upcoming' | 'Completed' | 'Cancelled', driver?: string, vehicle?: string) => void;
  updateProviderProfile: (updated: Provider) => void;
  toggleSaveProvider: (providerId: number) => void;
  resetAllData: () => void;
  formatPrice: (amountTZS: number, includeUSD?: boolean) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANGUAGE: 'tanexpo_language_v2',
  PROVIDERS: 'tanexpo_providers_v2',
  LISTINGS: 'tanexpo_listings_v2',
  LEADS: 'tanexpo_leads_v2',
  BOOKINGS: 'tanexpo_bookings_v2',
  REVIEWS: 'tanexpo_reviews_v2',
  TRANSACTIONS: 'tanexpo_transactions_v2',
  SAVED: 'tanexpo_saved_v2',
  USER_SESSION: 'tanexpo_user_session_v3',
  INTRO_SEEN: 'tanexpo_intro_seen_v3'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return (saved === 'sw' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const enDict = translations['en'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  // Static collections
  const destinations = initialDestinations;

  // Load from local storage or defaults
  const [providers, setProviders] = useState<Provider[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROVIDERS);
    return saved ? JSON.parse(saved) : initialProviders;
  });

  const [listings, setListings] = useState<ListingPackage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LISTINGS);
    return saved ? JSON.parse(saved) : initialListings;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
    return saved ? JSON.parse(saved) : initialLeads;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return saved ? JSON.parse(saved) : initialBookings;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return saved ? JSON.parse(saved) : initialReviews;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [savedProviderIds, setSavedProviderIds] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED);
    return saved ? JSON.parse(saved) : [1, 2];
  });

  const [comparedProviderIds, setComparedProviderIds] = useState<number[]>([]);

  // Identity, User Session & Onboarding
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    const seen = localStorage.getItem(STORAGE_KEYS.INTRO_SEEN);
    const session = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return !seen && !session;
  });

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('intro_1');
  const [guestPendingAction, setGuestPendingAction] = useState<GuestPendingAction | null>(null);

  // UI state
  const [currentView, setCurrentView] = useState<'tourist' | 'provider'>(() => {
    const savedSession = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (savedSession) {
      try {
        const u = JSON.parse(savedSession);
        if (u.role === 'provider') return 'provider';
      } catch (e) {}
    }
    return 'tourist';
  });

  const [touristTab, setTouristTab] = useState<'explore' | 'requests' | 'saved' | 'compliance'>('explore');
  const [providerTab, setProviderTab] = useState<'overview' | 'leads' | 'listings' | 'bookings' | 'financials' | 'reviews' | 'profile'>('overview');
  const [activeProviderId, setActiveProviderId] = useState<number>(() => {
    if (currentUser?.providerProfile?.providerId) {
      return currentUser.providerProfile.providerId;
    }
    return 1;
  });
  const [showUSDApprox, setShowUSDApprox] = useState<boolean>(true);

  // Modals / active selections
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<DestinationPlace | null>(null);
  const [inquiryPackage, setInquiryPackage] = useState<{ provider: Provider; listing: ListingPackage } | null>(null);
  const [activeVoucher, setActiveVoucher] = useState<Booking | null>(null);
  const [quoteBuilderLead, setQuoteBuilderLead] = useState<Lead | null>(null);
  const [editingListing, setEditingListing] = useState<ListingPackage | null>(null);
  const [isNewListingModalOpen, setIsNewListingModalOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [checkoutLead, setCheckoutLead] = useState<Lead | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tanexpo_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('tanexpo_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedProviderIds));
  }, [savedProviderIds]);

  // Session & Onboarding Methods
  const startOnboarding = (step: OnboardingStep = 'role_select') => {
    setOnboardingStep(step);
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
    localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, 'true');
  };

  const continueAsGuest = () => {
    const guestUser: User = {
      id: `guest-${Date.now()}`,
      role: 'guest',
      name: 'Guest Traveler',
      email: '',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(guestUser);
    setCurrentView('tourist');
    closeOnboarding();
  };

  const registerTourist = (data: {
    name: string;
    email: string;
    phone?: string;
    touristType: TouristType;
    homeCountry: string;
    currency: 'TZS' | 'USD';
    language: Language;
    travelParty?: 'solo' | 'couple' | 'family' | 'group';
    interests?: string[];
  }): User => {
    const newUser: User = {
      id: `tourist-${Date.now()}`,
      role: 'tourist',
      name: data.name,
      email: data.email,
      phone: data.phone,
      createdAt: new Date().toISOString(),
      touristProfile: {
        touristType: data.touristType,
        homeCountry: data.homeCountry,
        preferredCurrency: data.currency,
        preferredLanguage: data.language,
        travelParty: data.travelParty || 'couple',
        interests: data.interests || ['wildlife', 'scenery']
      }
    };

    setCurrentUser(newUser);
    setCurrentView('tourist');
    setLanguage(data.language);
    setShowUSDApprox(data.currency === 'USD' || data.touristType === 'international');
    closeOnboarding();

    // If guest had a pending action, resume it
    if (guestPendingAction) {
      handleResumePendingAction(guestPendingAction);
      setGuestPendingAction(null);
    }

    return newUser;
  };

  const registerProvider = (data: {
    businessName: string;
    legalName?: string;
    providerTypes: string[];
    primaryCategory: CategoryId;
    location: string;
    region: string;
    phone: string;
    email: string;
    talaLicense?: string;
    about: string;
    firstPackage?: {
      title: string;
      priceTZS: number;
      duration: string;
      inclusions: string[];
    };
  }): User => {
    const newProviderId = Date.now();
    
    // Create new Catalog Provider
    const catalogProvider: Provider = {
      id: newProviderId,
      category: data.primaryCategory,
      name: data.businessName,
      tagline: `Licensed ${data.primaryCategory.toUpperCase()} specialists in ${data.location}`,
      location: data.location,
      region: data.region,
      rating: 5.0,
      reviewsCount: 0,
      tripsCompleted: 0,
      verified: !!data.talaLicense,
      talaLicense: data.talaLicense || 'TALA-PENDING-REVIEW',
      languages: ['English', 'Swahili'],
      about: data.about || `Welcome to ${data.businessName}. We specialize in memorable Tanzanian experiences with certified guides and legal operations.`,
      phone: data.phone,
      email: data.email,
      establishedYear: new Date().getFullYear(),
      badges: ['Newly Registered', ...(data.talaLicense ? ['TALA Licensed'] : ['Verification Pending'])],
      officeAddress: `${data.location}, ${data.region}, Tanzania`
    };

    setProviders(prev => [catalogProvider, ...prev]);

    // Create first package if provided
    if (data.firstPackage) {
      const newPkg: ListingPackage = {
        id: Date.now() + 1,
        providerId: newProviderId,
        title: data.firstPackage.title,
        priceTZS: data.firstPackage.priceTZS,
        duration: data.firstPackage.duration,
        unit: 'per person',
        description: `Signature itinerary offered directly by ${data.businessName}.`,
        inclusions: data.firstPackage.inclusions.length > 0 ? data.firstPackage.inclusions : ['Professional Guide', 'Park Fees', 'Transport'],
        category: data.primaryCategory,
        active: true
      };
      setListings(prev => [newPkg, ...prev]);
    }

    const newUser: User = {
      id: `prov-usr-${Date.now()}`,
      role: 'provider',
      name: data.businessName,
      email: data.email,
      phone: data.phone,
      createdAt: new Date().toISOString(),
      providerProfile: {
        businessName: data.businessName,
        legalName: data.legalName,
        providerTypes: data.providerTypes,
        primaryCategory: data.primaryCategory,
        location: data.location,
        region: data.region,
        phone: data.phone,
        email: data.email,
        talaLicense: data.talaLicense,
        verificationStatus: data.talaLicense ? 'application_submitted' : 'incomplete',
        setupCompleteness: data.talaLicense && data.firstPackage ? 85 : 65,
        about: data.about,
        languages: ['English', 'Swahili'],
        providerId: newProviderId
      }
    };

    setCurrentUser(newUser);
    setActiveProviderId(newProviderId);
    setCurrentView('provider');
    setProviderTab('overview');
    closeOnboarding();

    return newUser;
  };

  const login = (emailOrPhone: string, role: UserRole): boolean => {
    if (role === 'provider') {
      const existingP = providers[0];
      const provUser: User = {
        id: `prov-usr-${existingP.id}`,
        role: 'provider',
        name: existingP.name,
        email: emailOrPhone || existingP.email,
        phone: existingP.phone,
        createdAt: new Date().toISOString(),
        providerProfile: {
          businessName: existingP.name,
          legalName: `${existingP.name} Ltd.`,
          providerTypes: ['Tour operator', 'Safari company'],
          primaryCategory: existingP.category,
          location: existingP.location,
          region: existingP.region,
          phone: existingP.phone,
          email: existingP.email,
          talaLicense: existingP.talaLicense,
          verificationStatus: 'tanexpo_verified',
          setupCompleteness: 95,
          about: existingP.about,
          languages: existingP.languages,
          providerId: existingP.id
        }
      };
      setCurrentUser(provUser);
      setActiveProviderId(existingP.id);
      setCurrentView('provider');
      closeOnboarding();
      return true;
    } else {
      const touristUser: User = {
        id: `tourist-${Date.now()}`,
        role: 'tourist',
        name: emailOrPhone.split('@')[0] || 'Traveler',
        email: emailOrPhone,
        createdAt: new Date().toISOString(),
        touristProfile: {
          touristType: 'international',
          homeCountry: 'United Kingdom',
          preferredCurrency: 'USD',
          preferredLanguage: language,
          travelParty: 'couple',
          interests: ['safari', 'beach', 'mountain']
        }
      };
      setCurrentUser(touristUser);
      setCurrentView('tourist');
      closeOnboarding();

      if (guestPendingAction) {
        handleResumePendingAction(guestPendingAction);
        setGuestPendingAction(null);
      }
      return true;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    setCurrentView('tourist');
    setTouristTab('explore');
  };

  const updateTouristProfile = (profileUpdate: Partial<TouristProfile>) => {
    if (!currentUser || !currentUser.touristProfile) return;
    const updated: User = {
      ...currentUser,
      touristProfile: {
        ...currentUser.touristProfile,
        ...profileUpdate
      }
    };
    setCurrentUser(updated);
  };

  const updateProviderBusinessProfile = (profileUpdate: Partial<ProviderProfile>) => {
    if (!currentUser || !currentUser.providerProfile) return;
    const updatedProfile = {
      ...currentUser.providerProfile,
      ...profileUpdate
    };
    const updatedUser: User = {
      ...currentUser,
      name: updatedProfile.businessName,
      providerProfile: updatedProfile
    };
    setCurrentUser(updatedUser);

    // Also sync catalog provider
    setProviders(prev =>
      prev.map(p => {
        if (p.id === updatedProfile.providerId) {
          return {
            ...p,
            name: updatedProfile.businessName,
            location: updatedProfile.location,
            region: updatedProfile.region,
            phone: updatedProfile.phone,
            email: updatedProfile.email,
            about: updatedProfile.about,
            talaLicense: updatedProfile.talaLicense || p.talaLicense
          };
        }
        return p;
      })
    );
  };

  const requireAuth = (action: GuestPendingAction): boolean => {
    if (currentUser && currentUser.role !== 'guest') {
      return true;
    }
    // Save pending action to resume right after auth
    setGuestPendingAction(action);
    startOnboarding('tourist_auth');
    return false;
  };

  const clearGuestPendingAction = () => {
    setGuestPendingAction(null);
  };

  const handleResumePendingAction = (action: GuestPendingAction) => {
    if (action.type === 'request_quote' && action.data) {
      setInquiryPackage(action.data);
    } else if (action.type === 'view_requests') {
      setTouristTab('requests');
    } else if (action.type === 'compare') {
      setIsCompareModalOpen(true);
    }
  };

  const isDomesticTourist = currentUser?.touristProfile?.touristType === 'domestic';
  const isInternationalTourist = currentUser?.touristProfile?.touristType === 'international';
  const isGuest = !currentUser || currentUser.role === 'guest';
  const isProvider = currentUser?.role === 'provider';

  const formatPrice = (amountTZS: number, includeUSD = true): string => {
    const formattedTZS = `TZS ${amountTZS.toLocaleString('en-US')}`;
    if (!includeUSD || !showUSDApprox) {
      return formattedTZS;
    }
    const approxUSD = Math.round(amountTZS / TZS_TO_USD_RATE);
    return `${formattedTZS} (~$${approxUSD.toLocaleString('en-US')} USD)`;
  };

  const toggleCompareProvider = (providerId: number) => {
    setComparedProviderIds(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      }
      if (prev.length >= 3) {
        // limit to 3 providers
        return [prev[1], prev[2], providerId];
      }
      return [...prev, providerId];
    });
  };

  const clearCompare = () => {
    setComparedProviderIds([]);
    setIsCompareModalOpen(false);
  };

  const submitInquiry = (data: {
    providerId: number;
    providerName: string;
    listingId: number;
    listingTitle: string;
    touristName: string;
    touristContact: string;
    date: string;
    groupSize: number;
    budgetTZS?: string;
    message?: string;
  }): Lead => {
    const initialMsg: LeadMessage[] = data.message ? [{
      id: `msg-${Date.now()}`,
      sender: 'tourist',
      text: data.message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }] : [];

    const newLead: Lead = {
      id: Date.now(),
      ...data,
      status: 'New',
      createdAt: new Date().toISOString(),
      messages: initialMsg
    };
    setLeads(prev => [newLead, ...prev]);
    return newLead;
  };

  const updateLeadStatus = (leadId: number, status: LeadStatus) => {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, status, lastUpdated: new Date().toISOString() } : l))
    );
  };

  const sendQuote = (leadId: number, quote: Quote) => {
    setLeads(prev =>
      prev.map(l => {
        if (l.id !== leadId) return l;
        const autoMsg: LeadMessage = {
          id: `msg-${Date.now()}`,
          sender: 'provider',
          text: `Official Custom Quote generated: TZS ${quote.total.toLocaleString()} (Valid until ${quote.validUntil}). ${quote.note || ''}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...l,
          quote,
          status: 'Negotiating',
          lastUpdated: new Date().toISOString(),
          messages: [...(l.messages || []), autoMsg]
        };
      })
    );
  };

  const sendMessageOnLead = (leadId: number, text: string, sender: 'tourist' | 'provider') => {
    if (!text.trim()) return;
    const newMsg: LeadMessage = {
      id: `msg-${Date.now()}`,
      sender,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLeads(prev =>
      prev.map(l =>
        l.id === leadId
          ? {
              ...l,
              messages: [...(l.messages || []), newMsg],
              lastUpdated: new Date().toISOString()
            }
          : l
      )
    );
  };

  const processPaymentConfirmation = (
    leadId: number, 
    paymentRail: Transaction['paymentRail'], 
    accountOrPhone: string
  ): Booking | null => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return null;

    const matchedListing = listings.find(l => l.id === lead.listingId);
    const basePrice = matchedListing ? matchedListing.priceTZS * (lead.groupSize || 1) : 1200000;
    const amount = lead.quote ? lead.quote.total : basePrice;
    const commission = Math.round(amount * COMMISSION_RATE);
    const netPayout = amount - commission;
    const ref = `TNX-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Booking = {
      id: Date.now(),
      leadId: lead.id,
      providerId: lead.providerId,
      providerName: lead.providerName,
      touristName: lead.touristName,
      touristContact: lead.touristContact,
      listingTitle: lead.listingTitle,
      date: lead.date,
      amountTZS: amount,
      commissionTZS: commission,
      netPayoutTZS: netPayout,
      status: 'Upcoming',
      referenceCode: ref,
      createdAt: new Date().toISOString().split('T')[0],
      paymentMethod: paymentRail,
      assignedDriver: 'Assigned on departure (TALA guide)',
      vehicleReg: 'TZS 4x4 Land Cruiser',
      specialRequests: lead.message
    };

    const newTransaction: Transaction = {
      id: `TX-${Math.floor(10000 + Math.random() * 90000)}`,
      bookingId: newBooking.id,
      providerId: lead.providerId,
      touristName: lead.touristName,
      grossTZS: amount,
      platformFeeTZS: commission,
      netTZS: netPayout,
      paymentRail,
      status: 'Paid',
      payoutRef: `ESCROW-${ref}`,
      date: new Date().toISOString().split('T')[0]
    };

    setBookings(prev => [newBooking, ...prev]);
    setTransactions(prev => [newTransaction, ...prev]);
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, status: 'Booked', lastUpdated: new Date().toISOString() } : l))
    );

    return newBooking;
  };

  const acceptQuote = (leadId: number): Booking | null => {
    return processPaymentConfirmation(leadId, 'M-Pesa', '+255 754 000 000');
  };

  const declineQuote = (leadId: number) => {
    updateLeadStatus(leadId, 'Lost');
  };

  const markLeadBookedDirect = (leadId: number): Booking | null => {
    return processPaymentConfirmation(leadId, 'CRDB Bank', 'Direct Provider Confirmation');
  };

  const saveListing = (listingData: Omit<ListingPackage, 'id'> & { id?: number }) => {
    if (listingData.id) {
      setListings(prev =>
        prev.map(l => (l.id === listingData.id ? ({ ...l, ...listingData } as ListingPackage) : l))
      );
    } else {
      const newListing: ListingPackage = {
        ...(listingData as Omit<ListingPackage, 'id'>),
        id: Date.now()
      };
      setListings(prev => [newListing, ...prev]);
    }
  };

  const deleteListing = (listingId: number) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
  };

  const addReviewResponse = (reviewId: number, response: string) => {
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, providerResponse: response } : r))
    );
  };

  const addReview = (reviewData: Omit<Review, 'id' | 'date'>) => {
    const newRev: Review = {
      ...reviewData,
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setReviews(prev => [newRev, ...prev]);

    // Recalculate provider rating
    setProviders(prev =>
      prev.map(p => {
        if (p.id !== reviewData.providerId) return p;
        const allPReviews = [...reviews.filter(r => r.providerId === p.id), newRev];
        const newAvg = Number((allPReviews.reduce((sum, r) => sum + r.rating, 0) / allPReviews.length).toFixed(1));
        return {
          ...p,
          rating: newAvg,
          reviewsCount: p.reviewsCount + 1
        };
      })
    );

    // Mark booking as reviewed if bookingRef exists
    if (reviewData.bookingRef) {
      setBookings(prev =>
        prev.map(b => (b.referenceCode === reviewData.bookingRef ? { ...b, hasReview: true } : b))
      );
    }
  };

  const updateBookingStatus = (
    bookingId: number, 
    status: 'Upcoming' | 'Completed' | 'Cancelled',
    driver?: string,
    vehicle?: string
  ) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status,
          ...(driver ? { assignedDriver: driver } : {}),
          ...(vehicle ? { vehicleReg: vehicle } : {})
        };
      })
    );
  };

  const updateProviderProfile = (updated: Provider) => {
    setProviders(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const toggleSaveProvider = (providerId: number) => {
    setSavedProviderIds(prev =>
      prev.includes(providerId) ? prev.filter(id => id !== providerId) : [...prev, providerId]
    );
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.PROVIDERS);
    localStorage.removeItem(STORAGE_KEYS.LISTINGS);
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SAVED);
    localStorage.removeItem(STORAGE_KEYS.LANGUAGE);
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    localStorage.removeItem(STORAGE_KEYS.INTRO_SEEN);

    setLanguageState('en');
    setCurrentUser(null);
    setIsOnboardingOpen(true);
    setOnboardingStep('intro_1');
    setProviders(initialProviders);
    setListings(initialListings);
    setLeads(initialLeads);
    setBookings(initialBookings);
    setReviews(initialReviews);
    setTransactions(initialTransactions);
    setSavedProviderIds([1, 2]);
    setComparedProviderIds([]);
    setSelectedProvider(null);
    setSelectedDestination(null);
    setInquiryPackage(null);
    setCheckoutLead(null);
    setReviewingBooking(null);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        isOnboardingOpen,
        onboardingStep,
        guestPendingAction,
        startOnboarding,
        closeOnboarding,
        setOnboardingStep,
        registerTourist,
        registerProvider,
        login,
        continueAsGuest,
        logout,
        updateTouristProfile,
        updateProviderBusinessProfile,
        requireAuth,
        clearGuestPendingAction,
        isDomesticTourist,
        isInternationalTourist,
        isGuest,
        isProvider,
        categories,
        destinations,
        providers,
        listings,
        leads,
        bookings,
        reviews,
        transactions,
        savedProviderIds,
        comparedProviderIds,
        currentView,
        setCurrentView,
        touristTab,
        setTouristTab,
        providerTab,
        setProviderTab,
        activeProviderId,
        setActiveProviderId,
        showUSDApprox,
        setShowUSDApprox,
        selectedProvider,
        setSelectedProvider,
        selectedDestination,
        setSelectedDestination,
        inquiryPackage,
        setInquiryPackage,
        activeVoucher,
        setActiveVoucher,
        quoteBuilderLead,
        setQuoteBuilderLead,
        editingListing,
        setEditingListing,
        isNewListingModalOpen,
        setIsNewListingModalOpen,
        isCompareModalOpen,
        setIsCompareModalOpen,
        checkoutLead,
        setCheckoutLead,
        reviewingBooking,
        setReviewingBooking,
        theme,
        toggleTheme,
        toggleCompareProvider,
        clearCompare,
        submitInquiry,
        updateLeadStatus,
        sendQuote,
        acceptQuote,
        declineQuote,
        markLeadBookedDirect,
        sendMessageOnLead,
        processPaymentConfirmation,
        saveListing,
        deleteListing,
        addReviewResponse,
        addReview,
        updateBookingStatus,
        updateProviderProfile,
        toggleSaveProvider,
        resetAllData,
        formatPrice
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
