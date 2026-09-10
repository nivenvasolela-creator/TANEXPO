export type CategoryId = 'safari' | 'beach' | 'mountain' | 'culture' | 'city' | 'marine';
export type Language = 'en' | 'sw';

export type UserRole = 'guest' | 'tourist' | 'provider' | 'admin';
export type TouristType = 'domestic' | 'international';
export type VerificationStatus = 'application_submitted' | 'under_review' | 'tanexpo_verified' | 'incomplete';

export type OnboardingStep = 
  | 'intro_1' 
  | 'intro_2' 
  | 'intro_3' 
  | 'role_select' 
  | 'tourist_type' 
  | 'tourist_auth' 
  | 'provider_type' 
  | 'provider_basics' 
  | 'provider_service' 
  | 'provider_verification' 
  | 'completed';

export interface TouristProfile {
  touristType: TouristType;
  homeCountry: string;
  preferredCurrency: 'TZS' | 'USD';
  preferredLanguage: Language;
  travelParty?: 'solo' | 'couple' | 'family' | 'group';
  interests: string[];
  budgetPreference?: 'budget' | 'midrange' | 'luxury';
}

export interface ProviderProfile {
  businessName: string;
  legalName?: string;
  providerTypes: string[];
  primaryCategory: CategoryId;
  location: string;
  region: string;
  phone: string;
  email: string;
  talaLicense?: string;
  verificationStatus: VerificationStatus;
  setupCompleteness: number; // percentage (0 - 100)
  about: string;
  fleetInfo?: string;
  languages: string[];
  providerId: number; // links to catalog provider
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  touristProfile?: TouristProfile;
  providerProfile?: ProviderProfile;
}

export interface GuestPendingAction {
  type: 'request_quote' | 'view_requests' | 'write_review' | 'compare' | 'save_provider';
  data?: any;
}

export interface Category {
  id: CategoryId;
  label: string;
  labelSw?: string;
  emoji: string;
  sub: string;
  description: string;
  popularDestinations: string[];
}

export interface DestinationPlace {
  id: string;
  name: string;
  region: string;
  categoryId: CategoryId;
  tagline: string;
  description: string;
  bestTimeToVisit: string;
  typicalCostRangeTZS: string;
  highlights: string[];
  travelTips: string[];
  heroGradient: string;
  popularPackageHint: string;
  featuredImage?: string;
  images?: { url: string; caption: string; tag?: string }[];
  parkFees?: {
    authority: string;
    conservationFeePerDay: string;
    concessionOrCampFee?: string;
    vehicleOrDescentPermit?: string;
    vatApplicable: string;
    currencyNote: string;
    lastVerified?: string;
  };
  logisticsInfo?: {
    accessRoute: string;
    nearestAirport: string;
    driveTimeFromHub: string;
    requiredVehicles: string;
    healthAndSafety: string[];
    mandatoryRegulations: string[];
    recommendedGear: string[];
  };
}

export interface Provider {
  id: number;
  category: CategoryId;
  name: string;
  tagline: string;
  location: string;
  region: string;
  rating: number;
  reviewsCount: number;
  tripsCompleted: number;
  verified: boolean;
  talaLicense: string;
  languages: string[];
  about: string;
  phone: string;
  email: string;
  establishedYear: number;
  fleetInfo?: string;
  badges: string[];
  officeAddress: string;
}

export interface ListingPackage {
  id: number;
  providerId: number;
  title: string;
  priceTZS: number;
  duration: string;
  unit: string;
  description: string;
  inclusions: string[];
  exclusions?: string[];
  category: CategoryId;
  active: boolean;
  maxGroupSize?: number;
}

export type LeadStatus = 'New' | 'Contacted' | 'Negotiating' | 'Booked' | 'Lost';

export interface QuoteExtraItem {
  id: string;
  title: string;
  amount: number;
}

export interface Quote {
  basePrice: number;
  extras: QuoteExtraItem[];
  discount: number;
  total: number;
  validUntil: string;
  note?: string;
  sentAt: string;
}

export interface LeadMessage {
  id: string;
  sender: 'tourist' | 'provider';
  text: string;
  timestamp: string;
}

export interface Lead {
  id: number;
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
  status: LeadStatus;
  quote?: Quote | null;
  createdAt: string;
  lastUpdated?: string;
  messages?: LeadMessage[];
}

export interface Booking {
  id: number;
  leadId?: number;
  providerId: number;
  providerName: string;
  touristName: string;
  touristContact: string;
  listingTitle: string;
  date: string;
  amountTZS: number;
  commissionTZS: number;
  netPayoutTZS: number;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  referenceCode: string;
  createdAt: string;
  assignedDriver?: string;
  vehicleReg?: string;
  specialRequests?: string;
  paymentMethod?: string;
  hasReview?: boolean;
}

export interface Review {
  id: number;
  providerId: number;
  touristName: string;
  rating: number;
  comment: string;
  date: string;
  tripPackage: string;
  providerResponse?: string;
  bookingRef?: string;
}

export interface Transaction {
  id: string;
  bookingId: number;
  providerId: number;
  touristName: string;
  grossTZS: number;
  platformFeeTZS: number;
  netTZS: number;
  paymentRail: 'M-Pesa' | 'Tigo Pesa' | 'Airtel Money' | 'CRDB Bank' | 'NMB Bank';
  status: 'Paid' | 'Processing';
  payoutRef: string;
  date: string;
}
