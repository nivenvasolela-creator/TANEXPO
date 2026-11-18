import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  COMMISSION_RATE,
  TZS_TO_USD_RATE
} from '../data/initialData';
import { initialDestinations } from '../data/destinationsData';
import { translations } from '../data/translations';

export interface AuthActionResult {
  ok: boolean;
  error?: string;
  user?: User;
}

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
    email?: string;
    phone?: string;
    password: string;
    touristType: TouristType;
    homeCountry: string;
    currency: 'TZS' | 'USD';
    language: Language;
    travelParty?: 'solo' | 'couple' | 'family' | 'group';
    interests?: string[];
    acceptedLegalTerms?: boolean;
  }) => Promise<AuthActionResult>;
  registerProvider: (data: {
    businessName: string;
    legalName?: string;
    providerTypes: string[];
    primaryCategory: CategoryId;
    location: string;
    region: string;
    phone: string;
    email: string;
    publicPhone?: string;
    publicEmail?: string;
    showContactAfterBooking?: boolean;
    password: string;
    talaLicense?: string;
    about: string;
    acceptedLegalTerms?: boolean;
    firstPackage?: {
      title: string;
      priceTZS: number;
      duration: string;
      inclusions: string[];
    };
  }) => Promise<AuthActionResult>;
  login: (emailOrPhone: string, role: UserRole, password: string) => Promise<AuthActionResult>;
  continueAsGuest: () => void;
  logout: () => void;
  deleteAccount: (password: string) => Promise<{ ok: boolean; error?: string }>;
  activeLegalDoc: 'privacy' | 'terms' | null;
  openLegalDoc: (doc: 'privacy' | 'terms') => void;
  closeLegalDoc: () => void;
  updateTouristProfile: (profile: Partial<TouristProfile>) => void;
  updateProviderBusinessProfile: (profile: Partial<ProviderProfile>) => void;
  requireAuth: (action: GuestPendingAction) => boolean;
  clearGuestPendingAction: () => void;
  isDomesticTourist: boolean;
  isInternationalTourist: boolean;
  isGuest: boolean;
  isProvider: boolean;

  // Runtime Config & Loading State
  catalogLoaded: boolean;
  /** Category filter on the Home operator list (set from Explore's "See operators"). */
  homeCategory: CategoryId | 'all';
  setHomeCategory: (c: CategoryId | 'all') => void;
  /** Item the Map tab should open on, e.g. "destination:serengeti". */
  mapFocus: string | null;
  setMapFocus: (key: string | null) => void;
  /** True when the operator list could not be loaded (shown to the user with a Retry button). */
  catalogError: boolean;
  retryCatalog: () => Promise<void>;
  refreshData: () => Promise<void>;
  paymentsMode: 'simulated' | 'live';
  seedDemoCatalog: boolean;

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
  touristTab: 'explore' | 'places' | 'map' | 'requests' | 'saved' | 'compliance';
  setTouristTab: (tab: 'explore' | 'places' | 'map' | 'requests' | 'saved' | 'compliance') => void;
  providerTab: 'overview' | 'leads' | 'listings' | 'bookings' | 'financials' | 'reviews' | 'profile' | 'whatsapp';
  setProviderTab: (tab: 'overview' | 'leads' | 'listings' | 'bookings' | 'financials' | 'reviews' | 'profile' | 'whatsapp') => void;
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
  }) => Promise<Lead | null>;
  updateLeadStatus: (leadId: number, status: LeadStatus) => void;
  sendQuote: (leadId: number, quote: Quote) => void;
  acceptQuote: (leadId: number) => Promise<Booking | null>;
  declineQuote: (leadId: number) => void;
  markLeadBookedDirect: (leadId: number) => Promise<Booking | null>;
  sendMessageOnLead: (leadId: number, text: string, sender: 'tourist' | 'provider') => void;
  processPaymentConfirmation: (
    leadId: number,
    paymentRail: Transaction['paymentRail'],
    accountOrPhone: string
  ) => Promise<Booking | null>;
  saveListing: (listingData: Omit<ListingPackage, 'id'> & { id?: number }) => Promise<ListingPackage | null>;
  /** Put an updated package (for example after a photo upload) into the local list. */
  replaceListing: (listing: ListingPackage) => void;
  deleteListing: (listingId: number) => void;
  addReviewResponse: (reviewId: number, response: string) => void;
  addReview: (review: Omit<Review, 'id' | 'date'>) => Promise<{ ok: boolean; error?: string }>;
  updateBookingStatus: (
    bookingId: number,
    status: 'Upcoming' | 'Completed' | 'Cancelled',
    driver?: string,
    vehicle?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updateProviderProfile: (updated: Provider) => void;
  toggleSaveProvider: (providerId: number) => void;
  resetAllData: () => void;
  formatPrice: (amountTZS: number, includeUSD?: boolean) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LANGUAGE: 'tanexpo_language_v2',
  USER_SESSION: 'tanexpo_user_session_v3',
  INTRO_SEEN: 'tanexpo_intro_seen_v3',
  AUTH_TOKEN: 'tanexpo_auth_token'
};

/**
 * The service worker keeps the last catalog response for offline use. A signed-in traveler's
 * catalog can include contact details of operators they booked, so the copy is dropped
 * whenever the signed-in user changes.
 */
function clearCachedCatalog(): void {
  try {
    if (typeof caches !== 'undefined') {
      void caches.delete('tanexpo-public-catalog').catch(() => {});
    }
  } catch {
    // Cache Storage unavailable (private mode, old browser): nothing to clear.
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return saved === 'sw' || saved === 'en' ? saved : 'en';
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

  const destinations = initialDestinations;

  // Public catalog state (available to guests & authenticated users)
  const [providers, setProviders] = useState<Provider[]>([]);
  const [listings, setListings] = useState<ListingPackage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState<boolean>(false);
  const [paymentsMode, setPaymentsMode] = useState<'simulated' | 'live'>('simulated');
  const [seedDemoCatalog, setSeedDemoCatalog] = useState<boolean>(false);

  // Private role-scoped state (populated only after authenticated fetches)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savedProviderIds, setSavedProviderIds] = useState<number[]>([]);
  const [comparedProviderIds, setComparedProviderIds] = useState<number[]>([]);

  // Identity, User Session & Onboarding
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeLegalDoc, setActiveLegalDoc] = useState<'privacy' | 'terms' | null>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/privacy') return 'privacy';
      if (window.location.pathname === '/terms') return 'terms';
    }
    return null;
  });

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === '/privacy') setActiveLegalDoc('privacy');
      else if (window.location.pathname === '/terms') setActiveLegalDoc('terms');
      else setActiveLegalDoc(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openLegalDoc = (doc: 'privacy' | 'terms') => {
    setActiveLegalDoc(doc);
    if (typeof window !== 'undefined') {
      const target = doc === 'privacy' ? '/privacy' : '/terms';
      if (window.location.pathname !== target) {
        window.history.pushState({}, '', target);
      }
    }
  };

  const closeLegalDoc = () => {
    setActiveLegalDoc(null);
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname === '/privacy' || window.location.pathname === '/terms')
    ) {
      window.history.pushState({}, '', '/');
    }
  };

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname === '/privacy' || window.location.pathname === '/terms')
    ) {
      return false;
    }
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
      } catch {}
    }
    return 'tourist';
  });

  const [touristTab, setTouristTab] = useState<'explore' | 'places' | 'map' | 'requests' | 'saved' | 'compliance'>('explore');
  const [providerTab, setProviderTab] = useState<
    'overview' | 'leads' | 'listings' | 'bookings' | 'financials' | 'reviews' | 'profile' | 'whatsapp'
  >('overview');
  const [activeProviderId, setActiveProviderId] = useState<number>(() => {
    if (currentUser?.providerProfile?.providerId) {
      return currentUser.providerProfile.providerId;
    }
    return 1;
  });
  const [showUSDApprox, setShowUSDApprox] = useState<boolean>(true);

  // Modals / active selections
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [homeCategory, setHomeCategory] = useState<CategoryId | 'all'>('all');
  const [mapFocus, setMapFocus] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState(false);
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

  // Sync user session to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    }
  }, [currentUser]);

  const clearPrivateState = useCallback(() => {
    setLeads([]);
    setBookings([]);
    setTransactions([]);
    setSavedProviderIds([]);
  }, []);

  const handleUnauthorized = useCallback(
    (redirectToLogin = true) => {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      clearCachedCatalog();
      setCurrentUser(null);
      clearPrivateState();
      setCurrentView('tourist');
      if (redirectToLogin) {
        setOnboardingStep('tourist_auth');
        setIsOnboardingOpen(true);
      }
    },
    [clearPrivateState]
  );

  // Centralized fetch helper that attaches Bearer token and handles 401
  const apiFetch = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      { redirectOn401 = true }: { redirectOn401?: boolean } = {}
    ): Promise<Response> => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const headers = new Headers(options.headers || {});
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(url, { ...options, headers });
      if (res.status === 401 && !url.startsWith('/api/auth/login') && !url.startsWith('/api/auth/register')) {
        handleUnauthorized(redirectOn401);
      }
      return res;
    },
    [handleUnauthorized]
  );

  // Public config fetch
  const syncConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) return;
      const data = await res.json();
      if (data.paymentsMode === 'live' || data.paymentsMode === 'simulated') {
        setPaymentsMode(data.paymentsMode);
      }
      if (typeof data.seedDemoCatalog === 'boolean') {
        setSeedDemoCatalog(data.seedDemoCatalog);
      }
    } catch {
      // ignore non-fatal config error
    }
  }, []);

  // Public catalog fetch (safe for guests)
  const syncCatalog = useCallback(async () => {
    try {
      let res = await apiFetch('/api/catalog', {}, { redirectOn401: false });
      if (!res.ok) {
        // One quick retry: a slow tunnel or mobile network often fails the first attempt.
        await new Promise((r) => setTimeout(r, 1500));
        res = await apiFetch('/api/catalog', {}, { redirectOn401: false });
      }
      if (!res.ok) {
        setCatalogError(true);
        setCatalogLoaded(true);
        return;
      }
      const data = await res.json();
      setCatalogError(false);
      if (Array.isArray(data.providers)) setProviders(data.providers);
      if (Array.isArray(data.listings)) setListings(data.listings);
      if (Array.isArray(data.reviews)) setReviews(data.reviews);
      setCatalogLoaded(true);
    } catch (err) {
      console.warn('Catalog fetch error:', err);
      setCatalogError(true);
      setCatalogLoaded(true);
    }
  }, [apiFetch]);

  // Role-scoped authenticated data fetch
  const syncAuthenticatedData = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      clearPrivateState();
      return;
    }

    try {
      const [leadsRes, bookingsRes, txRes, savedRes] = await Promise.all([
        apiFetch('/api/leads', {}, { redirectOn401: false }),
        apiFetch('/api/bookings', {}, { redirectOn401: false }),
        apiFetch('/api/transactions', {}, { redirectOn401: false }),
        apiFetch('/api/saved', {}, { redirectOn401: false })
      ]);

      if (leadsRes.ok) {
        const d = await leadsRes.json();
        if (Array.isArray(d.leads)) setLeads(d.leads);
      }
      if (bookingsRes.ok) {
        const d = await bookingsRes.json();
        if (Array.isArray(d.bookings)) setBookings(d.bookings);
      }
      if (txRes.ok) {
        const d = await txRes.json();
        if (Array.isArray(d.transactions)) setTransactions(d.transactions);
      }
      if (savedRes.ok) {
        const d = await savedRes.json();
        if (Array.isArray(d.savedProviderIds)) setSavedProviderIds(d.savedProviderIds);
      }
    } catch (err) {
      console.warn('Authenticated sync error:', err);
    }
  }, [apiFetch, clearPrivateState]);

  const syncAll = useCallback(async () => {
    await syncCatalog();
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      await syncAuthenticatedData();
    }
  }, [syncCatalog, syncAuthenticatedData]);

  useEffect(() => {
    syncConfig();
    syncCatalog();

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      apiFetch('/api/auth/me', {}, { redirectOn401: false })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) {
            setCurrentUser(data.user);
            if (data.user.role === 'provider' && data.user.providerProfile?.providerId) {
              setActiveProviderId(data.user.providerProfile.providerId);
              setCurrentView('provider');
            }
            syncAuthenticatedData();
          } else {
            // Token invalid/expired: fall back to guest cleanly
            clearPrivateState();
          }
        })
        .catch(() => {});
    } else if (currentUser && currentUser.role !== 'guest') {
      // Stale session without token cannot access private endpoints
      setCurrentUser(null);
      clearPrivateState();
    }

    const intervalId = setInterval(() => {
      syncAll();
    }, 10000);

    const handleFocus = () => {
      syncAll();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncConfig, syncCatalog, syncAuthenticatedData, syncAll, apiFetch, clearPrivateState]);

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
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    clearPrivateState();
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

  const registerTourist = async (data: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    touristType: TouristType;
    homeCountry: string;
    currency: 'TZS' | 'USD';
    language: Language;
    travelParty?: 'solo' | 'couple' | 'family' | 'group';
    interests?: string[];
    acceptedLegalTerms?: boolean;
  }): Promise<AuthActionResult> => {
    try {
      const touristProfile: TouristProfile = {
        touristType: data.touristType,
        homeCountry: data.homeCountry,
        preferredCurrency: data.currency,
        preferredLanguage: data.language,
        travelParty: data.travelParty || 'couple',
        interests: data.interests || ['wildlife', 'scenery']
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(data.email ? { email: data.email } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          name: data.name,
          role: 'tourist',
          touristProfile,
          password: data.password,
          acceptedLegalTerms: Boolean(data.acceptedLegalTerms)
        })
      });

      const result = await res.json();
      if (!res.ok) {
        return { ok: false, error: result.error || 'Registration failed' };
      }

      if (result.token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
      }
      setCurrentUser(result.user);
      setCurrentView('tourist');
      setLanguage(data.language);
      setShowUSDApprox(data.currency === 'USD' || data.touristType === 'international');
      closeOnboarding();
      await syncAuthenticatedData();

      if (guestPendingAction) {
        handleResumePendingAction(guestPendingAction);
        setGuestPendingAction(null);
      }

      return { ok: true, user: result.user };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error during registration' };
    }
  };

  const registerProvider = async (data: {
    businessName: string;
    legalName?: string;
    providerTypes: string[];
    primaryCategory: CategoryId;
    location: string;
    region: string;
    phone: string;
    email: string;
    publicPhone?: string;
    publicEmail?: string;
    showContactAfterBooking?: boolean;
    password: string;
    talaLicense?: string;
    about: string;
    acceptedLegalTerms?: boolean;
    firstPackage?: {
      title: string;
      priceTZS: number;
      duration: string;
      inclusions: string[];
    };
  }): Promise<AuthActionResult> => {
    try {
      const providerProfilePayload = {
        businessName: data.businessName,
        legalName: data.legalName,
        providerTypes: data.providerTypes,
        primaryCategory: data.primaryCategory,
        location: data.location,
        region: data.region,
        publicPhone: data.publicPhone || '',
        publicEmail: data.publicEmail || '',
        showContactAfterBooking: data.showContactAfterBooking !== false,
        talaLicense: data.talaLicense,
        about: data.about,
        languages: ['English', 'Swahili']
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          name: data.businessName,
          role: 'provider',
          providerProfile: providerProfilePayload,
          password: data.password,
          acceptedLegalTerms: Boolean(data.acceptedLegalTerms)
        })
      });

      const result = await res.json();
      if (!res.ok) {
        return { ok: false, error: result.error || 'Provider registration failed' };
      }

      if (result.token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
      }
      const serverUser: User = result.user;
      const serverProviderId = serverUser.providerProfile?.providerId;

      if (data.firstPackage && serverProviderId) {
        await apiFetch('/api/listings', {
          method: 'POST',
          body: JSON.stringify({
            providerId: serverProviderId,
            title: data.firstPackage.title,
            priceTZS: data.firstPackage.priceTZS,
            duration: data.firstPackage.duration,
            unit: 'per person',
            description: `Signature itinerary offered directly by ${data.businessName}.`,
            inclusions:
              data.firstPackage.inclusions.length > 0
                ? data.firstPackage.inclusions
                : ['Professional Guide', 'Park Fees', 'Transport'],
            category: data.primaryCategory,
            active: true
          })
        });
      }

      setCurrentUser(serverUser);
      if (serverProviderId) {
        setActiveProviderId(serverProviderId);
      }
      setCurrentView('provider');
      setProviderTab('overview');
      closeOnboarding();
      await syncAll();

      return { ok: true, user: serverUser };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error during provider registration' };
    }
  };

  const login = async (
    emailOrPhone: string,
    _role: UserRole,
    password: string
  ): Promise<AuthActionResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password })
      });

      const data = await res.json();
      if (!res.ok || !data.token || !data.user) {
        return { ok: false, error: data.error || 'Invalid credentials' };
      }

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      setCurrentUser(data.user);

      if (data.user.role === 'provider') {
        if (data.user.providerProfile?.providerId) {
          setActiveProviderId(data.user.providerProfile.providerId);
        }
        setCurrentView('provider');
      } else {
        setCurrentView('tourist');
      }

      closeOnboarding();
      await syncAll();

      if (data.user.role === 'tourist' && guestPendingAction) {
        handleResumePendingAction(guestPendingAction);
        setGuestPendingAction(null);
      }

      return { ok: true, user: data.user };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error during login' };
    }
  };

  const logout = () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    clearCachedCatalog();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    clearPrivateState();
    setCurrentView('tourist');
    setTouristTab('explore');
  };

  const deleteAccount = async (password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await apiFetch('/api/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: result.error || 'Could not delete account' };
      }
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      setCurrentUser(null);
      clearPrivateState();
      setCurrentView('tourist');
      setTouristTab('explore');
      await syncCatalog();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error while deleting account' };
    }
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

    apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ touristProfile: updated.touristProfile })
    }).catch((e) => console.warn('Backend update profile error:', e));
  };

  const updateProviderBusinessProfile = (profileUpdate: Partial<ProviderProfile>) => {
    if (!currentUser || !currentUser.providerProfile) return;
    const updatedProfile: ProviderProfile = {
      ...currentUser.providerProfile,
      ...profileUpdate,
      providerId: currentUser.providerProfile.providerId,
      verificationStatus: currentUser.providerProfile.verificationStatus
    };
    const updatedUser: User = {
      ...currentUser,
      name: updatedProfile.businessName,
      providerProfile: updatedProfile
    };
    setCurrentUser(updatedUser);

    apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ providerProfile: updatedProfile })
    }).catch((e) => console.warn('Backend update profile error:', e));

    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === updatedProfile.providerId) {
          const updatedP = {
            ...p,
            name: updatedProfile.businessName,
            location: updatedProfile.location,
            region: updatedProfile.region,
            phone: updatedProfile.phone,
            email: updatedProfile.email,
            about: updatedProfile.about,
            talaLicense: updatedProfile.talaLicense || p.talaLicense
          };
          apiFetch(`/api/providers/${p.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedP)
          }).catch(() => {});
          return updatedP;
        }
        return p;
      })
    );
  };

  const requireAuth = (action: GuestPendingAction): boolean => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (currentUser && currentUser.role !== 'guest' && token) {
      return true;
    }
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
    setComparedProviderIds((prev) => {
      if (prev.includes(providerId)) {
        return prev.filter((id) => id !== providerId);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], providerId];
      }
      return [...prev, providerId];
    });
  };

  const clearCompare = () => {
    setComparedProviderIds([]);
    setIsCompareModalOpen(false);
  };

  const submitInquiry = async (data: {
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
  }): Promise<Lead | null> => {
    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      const result = await res.json();
      if (result.lead) {
        setLeads((prev) => [result.lead, ...prev]);
        return result.lead;
      }
      return null;
    } catch (e) {
      console.warn('Backend create lead error:', e);
      return null;
    }
  };

  const updateLeadStatus = (leadId: number, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status, lastUpdated: new Date().toISOString() } : l))
    );

    apiFetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }).catch((e) => console.warn('Backend update lead error:', e));
  };

  const sendQuote = (leadId: number, quote: Quote) => {
    apiFetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Negotiating',
        quote,
        newMessage: `Official Custom Quote generated: TZS ${quote.total.toLocaleString()} (Valid until ${quote.validUntil}). ${quote.note || ''}`
      })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.lead) {
          setLeads((prev) => prev.map((l) => (l.id === leadId ? result.lead : l)));
        }
      })
      .catch((e) => console.warn('Backend send quote error:', e));
  };

  const sendMessageOnLead = (leadId: number, text: string, _sender: 'tourist' | 'provider') => {
    if (!text.trim()) return;
    apiFetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify({ newMessage: text.trim() })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.lead) {
          setLeads((prev) => prev.map((l) => (l.id === leadId ? result.lead : l)));
        }
      })
      .catch((e) => console.warn('Backend send message error:', e));
  };

  const processPaymentConfirmation = async (
    leadId: number,
    paymentRail: Transaction['paymentRail'],
    _accountOrPhone: string
  ): Promise<Booking | null> => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;

    try {
      const bookingRes = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          leadId: lead.id,
          listingId: lead.listingId,
          groupSize: lead.groupSize,
          date: lead.date,
          touristName: lead.touristName,
          touristContact: lead.touristContact,
          paymentMethod: paymentRail,
          specialRequests: lead.message
        })
      });

      if (!bookingRes.ok) return null;
      const bookingData = await bookingRes.json();
      const createdBooking: Booking = bookingData.booking;

      const txRes = await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: createdBooking.id,
          paymentRail
        })
      });

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.transaction) {
          setTransactions((prev) => [txData.transaction, ...prev]);
        }
      }

      setBookings((prev) => [createdBooking, ...prev]);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: 'Booked', lastUpdated: new Date().toISOString() } : l
        )
      );

      return createdBooking;
    } catch (e) {
      console.warn('Backend booking/payment error:', e);
      return null;
    }
  };

  const acceptQuote = async (leadId: number): Promise<Booking | null> => {
    return processPaymentConfirmation(leadId, 'M-Pesa', '+255 754 000 000');
  };

  const declineQuote = (leadId: number) => {
    updateLeadStatus(leadId, 'Lost');
  };

  const markLeadBookedDirect = async (leadId: number): Promise<Booking | null> => {
    return processPaymentConfirmation(leadId, 'CRDB Bank', 'Direct Provider Confirmation');
  };

  const replaceListing = useCallback((saved: ListingPackage) => {
    setListings((prev) => {
      const exists = prev.some((l) => l.id === saved.id);
      return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev];
    });
  }, []);

  const saveListing = async (
    listingData: Omit<ListingPackage, 'id'> & { id?: number }
  ): Promise<ListingPackage | null> => {
    try {
      const res = await apiFetch('/api/listings', {
        method: 'POST',
        body: JSON.stringify(listingData)
      });
      const result = res.ok ? await res.json() : null;
      if (result?.listing) {
        replaceListing(result.listing);
        return result.listing as ListingPackage;
      }
      return null;
    } catch (e) {
      console.warn('Backend save listing error:', e);
      return null;
    }
  };

  const deleteListing = (listingId: number) => {
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    apiFetch(`/api/listings/${listingId}`, {
      method: 'DELETE'
    }).catch((e) => console.warn('Backend delete listing error:', e));
  };

  const addReviewResponse = (reviewId: number, response: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, providerResponse: response } : r))
    );

    apiFetch(`/api/reviews/${reviewId}/response`, {
      method: 'POST',
      body: JSON.stringify({ responseText: response })
    }).catch((e) => console.warn('Backend add review response error:', e));
  };

  const addReview = async (
    reviewData: Omit<Review, 'id' | 'date'>
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData)
      });
      const result = await res.json();
      if (!res.ok) {
        return { ok: false, error: result.error || 'Failed to submit review' };
      }

      const savedRev: Review = result.review;
      setReviews((prev) => [savedRev, ...prev]);
      if (reviewData.bookingRef) {
        setBookings((prev) =>
          prev.map((b) =>
            b.referenceCode === reviewData.bookingRef ? { ...b, hasReview: true } : b
          )
        );
      }
      await syncCatalog();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error submitting review' };
    }
  };

  const updateBookingStatus = async (
    bookingId: number,
    status: 'Upcoming' | 'Completed' | 'Cancelled',
    driver?: string,
    vehicle?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const previousBookings = bookings;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status,
          ...(driver ? { assignedDriver: driver } : {}),
          ...(vehicle ? { vehicleReg: vehicle } : {})
        };
      })
    );

    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          ...(driver ? { assignedDriver: driver } : {}),
          ...(vehicle ? { vehicleReg: vehicle } : {})
        })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBookings(previousBookings);
        return { ok: false, error: result.error || 'Failed to update booking status' };
      }
      if (result.booking) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? result.booking : b)));
      }
      return { ok: true };
    } catch (e: any) {
      setBookings(previousBookings);
      return { ok: false, error: e?.message || 'Network error updating booking' };
    }
  };

  const updateProviderProfile = (updated: Provider) => {
    apiFetch(`/api/providers/${updated.id}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.provider) {
          setProviders((prev) =>
            prev.map((p) => (p.id === result.provider.id ? result.provider : p))
          );
        }
      })
      .catch((e) => console.warn('Backend update provider profile error:', e));
  };

  const toggleSaveProvider = (providerId: number) => {
    if (!requireAuth({ type: 'save_provider', data: providerId })) {
      return;
    }

    setSavedProviderIds((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );

    apiFetch('/api/saved', {
      method: 'POST',
      body: JSON.stringify({ providerId })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.savedProviderIds)) {
          setSavedProviderIds(data.savedProviderIds);
        }
      })
      .catch((e) => console.warn('Backend toggle save error:', e));
  };

  const resetAllData = () => {
    apiFetch('/api/reset', { method: 'POST' })
      .then((res) => (res.ok ? res.json() : null))
      .then(() => syncAll())
      .catch((e) => console.warn('Backend reset error:', e));
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
        deleteAccount,
        activeLegalDoc,
        openLegalDoc,
        closeLegalDoc,
        updateTouristProfile,
        updateProviderBusinessProfile,
        requireAuth,
        clearGuestPendingAction,
        isDomesticTourist,
        isInternationalTourist,
        isGuest,
        isProvider,
        catalogLoaded,
        paymentsMode,
        seedDemoCatalog,
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
        refreshData: syncAll,
        catalogError,
        homeCategory,
        setHomeCategory,
        mapFocus,
        setMapFocus,
        retryCatalog: syncCatalog,
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
        replaceListing,
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
