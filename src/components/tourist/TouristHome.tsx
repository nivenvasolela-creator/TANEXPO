import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryId, Provider, ListingPackage } from '../../types';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Heart, 
  Clock, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Languages, 
  Calendar,
  Sparkles,
  Award,
  Truck,
  Compass,
  Coins,
  SlidersHorizontal,
  X,
  Map,
  LayoutGrid,
  Trophy,
  Plane
} from 'lucide-react';
import { TanzaniaMap } from '../map/TanzaniaMap';

export const TouristHome: React.FC = () => {
  const { 
    categories, 
    destinations,
    providers, 
    listings, 
    savedProviderIds, 
    toggleSaveProvider, 
    setSelectedProvider, 
    setSelectedDestination,
    comparedProviderIds,
    toggleCompareProvider,
    setIsCompareModalOpen,
    clearCompare,
    formatPrice,
    currentUser,
    isDomesticTourist,
    isInternationalTourist,
    isGuest,
    startOnboarding,
    setInquiryPackage,
    t
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [nearAfconOnly, setNearAfconOnly] = useState<boolean>(false);

  const handleRequestQuote = (provider: Provider) => {
    const providerListings = listings.filter((l) => l.providerId === provider.id && l.active);
    const listing = providerListings[0] || {
      id: 9900 + provider.id,
      providerId: provider.id,
      category: provider.category,
      title: `Custom Tour & Safari with ${provider.name}`,
      priceTZS: 1500000,
      duration: 'Tailored Itinerary',
      unit: 'per group',
      description: `Direct booking and itinerary request with verified operator ${provider.name}.`,
      inclusions: ['Licensed local driver guide', 'TALA license compliance', 'Transparent TZS quote settlement'],
      active: true,
      maxGroupSize: 6
    };
    setInquiryPackage({ provider, listing });
  };

  // Extract unique regions
  const regions = ['all', 'Arusha', 'Stone Town & Nungwi', 'Moshi', 'Ngorongoro Highlands', 'Dar es Salaam', 'Kilindoni, Mafia Island'];

  // Filter providers
  const filteredProviders = providers.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesRegion = selectedRegion === 'all' || p.location.toLowerCase().includes(selectedRegion.toLowerCase());
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.about.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesRegion && matchesSearch;
  });

  return (
    <div className="space-y-10 pb-24">
      {/* Hero Header with Adaptive Personalization */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1E332A] via-[#284435] to-[#15231C] text-white p-8 sm:p-12 shadow-md">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#D97843]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-[#E8B94A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {isDomesticTourist ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-400/30">
              <span className="text-base">🇹🇿</span>
              <span>Karibu Nyumbani • Tanzanian Resident Escapes</span>
            </div>
          ) : isInternationalTourist ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md text-[#E8B94A] text-xs font-semibold uppercase tracking-wider mb-4 border border-amber-400/30">
              <span className="text-base">🌍</span>
              <span>Welcome to Tanzania • Global Expeditions</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#E8B94A] text-xs font-semibold uppercase tracking-wider mb-4 border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('hero.badge', 'Direct from Licensed Tanzanian Operators')}</span>
            </div>
          )}

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight mb-4">
            {isDomesticTourist ? (
              `Karibu Nyumbani, ${currentUser?.name.split(' ')[0]}!`
            ) : isInternationalTourist ? (
              `Welcome to Tanzania, ${currentUser?.name.split(' ')[0]}!`
            ) : (
              t('hero.title', 'Discover Tanzania with verified local specialists.')
            )}
          </h1>

          <p className="text-[#D3DFD7] text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
            {isDomesticTourist ? (
              'Explore resident-tier park fees, weekend safari escapes, family coastal getaways, and local transport deals with official TZS transparent rates.'
            ) : isInternationalTourist ? (
              'Connect directly with TALA-registered safari guides, Kilimanjaro expedition leaders, and Zanzibar dhow captains with zero foreign markups and licensed payment partner settlement.'
            ) : (
              t('hero.subtitle', 'Connect directly with TALA-registered safari guides, Kilimanjaro leaders, and Zanzibar dhow captains. No foreign markups. Custom itineraries quoted directly in official Tanzanian Shillings.')
            )}
          </p>

          {/* Quick Filter Tag Buttons for Tourist Persona */}
          {isDomesticTourist ? (
            <div className="flex flex-wrap gap-2 mb-6 text-xs">
              <span className="text-zinc-400 self-center">Popular for Residents:</span>
              <button
                onClick={() => { setSearchQuery('Weekend'); setSelectedCategory('safari'); }}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium cursor-pointer transition-colors"
              >
                Weekend Escapes
              </button>
              <button
                onClick={() => { setSearchQuery('Family'); }}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium cursor-pointer transition-colors"
              >
                Family Getaways
              </button>
              <button
                onClick={() => { setSelectedRegion('Stone Town & Nungwi'); }}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium cursor-pointer transition-colors"
              >
                Zanzibar Ferries & Coast
              </button>
              <button
                onClick={() => { setSelectedCategory('culture'); }}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium cursor-pointer transition-colors"
              >
                Cultural Villages
              </button>
            </div>
          ) : isInternationalTourist ? (
            <div className="flex flex-wrap gap-2 mb-6 text-xs">
              <span className="text-zinc-400 self-center">Bucket List Highlights:</span>
              <button
                onClick={() => { setSearchQuery('Migration'); setSelectedCategory('safari'); }}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium cursor-pointer transition-colors"
              >
                Serengeti Migration
              </button>
              <button
                onClick={() => { setSelectedCategory('mountain'); }}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium cursor-pointer transition-colors"
              >
                Kilimanjaro Summits
              </button>
              <button
                onClick={() => { setSelectedCategory('beach'); }}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium cursor-pointer transition-colors"
              >
                Zanzibar Turquoise Dhows
              </button>
              <button
                onClick={() => { setSearchQuery('Big Five'); }}
                className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-medium cursor-pointer transition-colors"
              >
                Big Five Safaris
              </button>
            </div>
          ) : null}

          {/* Search & Filter Bar */}
          <div className="bg-white/95 backdrop-blur-lg p-2.5 sm:p-3 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch gap-2.5 text-[#1F2A24]">
            <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9]">
              <Search className="w-5 h-5 text-[#6B7A72]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder', 'Search Serengeti, Kilimanjaro, dhow cruise, walking safaris...')}
                className="w-full text-sm bg-transparent border-none focus:outline-hidden text-[#1F2A24] placeholder-[#8A9790]"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9] text-xs font-medium text-[#4D5E55]">
                <MapPin className="w-4 h-4 text-[#D97843]" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-transparent border-none focus:outline-hidden text-xs font-semibold cursor-pointer"
                >
                  <option value="all">{t('all.regions', 'All Regions')}</option>
                  {regions.filter(r => r !== 'all').map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedRegion('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 text-xs font-semibold text-[#6B7A72] hover:text-[#1F2A24] bg-white border border-[#E8DFC9] rounded-xl hover:bg-[#F3EFE6] transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Quick Interactive Map Switcher Banner in Hero */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
            <div className="flex items-center gap-2 text-xs text-white">
              <Map className="w-4 h-4 text-[#E8B94A] shrink-0" />
              <span>Explore Tanzania safari circuits, AFCON 2027 host stadiums, and operators on the live interactive map:</span>
            </div>
            <button
              onClick={() => {
                setViewMode('map');
                const elem = document.getElementById('operators-directory');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#E8B94A] hover:bg-[#D4A335] text-[#1E332A] text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <span>{viewMode === 'map' ? 'Map View Active' : 'Open Tanzania Map'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Legal Currency compliance reminder pill */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#BED0C5]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#E8B94A]" />
            <span>All quotes and payments legal TZS compliant (Bank of Tanzania Regulations 2025)</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Verified TALA Tourism Licenses & Licensed Payment Processing</span>
          </div>
        </div>
      </section>

      {/* Persona Callout Banner */}
      {isGuest ? (
        <section className="p-4 sm:p-5 bg-[#FAF0E9] dark:bg-[#1E1712] border border-[#EBD0BC] dark:border-[#382618] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#D97843] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#1C2C24] dark:text-[#F3EFEA]">Looking to save operators and request direct quotes?</h4>
              <p className="text-xs text-[#52645A] dark:text-[#A7B9B0]">Create a free traveler account to negotiate live quotes, save favorite itineraries, and receive personalized park rate estimates.</p>
            </div>
          </div>
          <button
            onClick={() => startOnboarding('role_select')}
            className="shrink-0 px-5 py-2.5 bg-[#284435] hover:bg-[#1E332A] dark:bg-[#D97843] dark:hover:bg-[#C26330] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Create Account / Sign In
          </button>
        </section>
      ) : isDomesticTourist ? (
        <section className="p-4 sm:p-5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 dark:bg-emerald-700 text-emerald-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-serif font-bold text-sm text-emerald-950 dark:text-emerald-200">Tanzanian Citizen & Resident Conservation Entry Guidance</h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/90">
                TANAPA national park permits offer subsidized entry for Tanzanian citizens (e.g. Serengeti ~TZS 11,800) vs foreign visitors ($82.60 USD). When requesting a quote, mention your resident status so operators factor in local rates!
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Experience Categories Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#284435]">{t('explore.by.exp', 'Explore by Experience')}</h2>
            <p className="text-sm text-[#6B7A72]">{t('explore.sub', 'Select a category to filter Tanzanian operators')}</p>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-[#D97843] hover:underline cursor-pointer"
            >
              Show all categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#284435] text-white border-[#284435] shadow-md'
                : 'bg-white text-[#1F2A24] border-[#E8DFC9] hover:border-[#284435] hover:bg-[#F8F5EE]'
            }`}
          >
            <span className="text-2xl block mb-2">🌍</span>
            <div className="font-bold text-sm leading-tight">{t('all.categories', 'All Types')}</div>
            <div className={`text-[11px] mt-1 ${selectedCategory === 'all' ? 'text-[#C7D9CF]' : 'text-[#6B7A72]'}`}>
              {providers.length} Providers
            </div>
          </button>

          {categories.map((cat) => {
            const count = providers.filter((p) => p.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#284435] text-white border-[#284435] shadow-md'
                    : 'bg-white text-[#1F2A24] border-[#E8DFC9] hover:border-[#284435] hover:bg-[#F8F5EE]'
                }`}
              >
                <span className="text-2xl block mb-2">{cat.emoji}</span>
                <div className="font-bold text-sm leading-tight">{cat.label}</div>
                <div className={`text-[11px] mt-1 truncate ${isSelected ? 'text-[#C7D9CF]' : 'text-[#6B7A72]'}`}>
                  {count} {count === 1 ? 'Operator' : 'Operators'}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Destination Place Guides Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#284435]">
              {t('destinations.title', 'Tanzania Destination Guides')}
            </h2>
            <p className="text-sm text-[#6B7A72]">
              {t('destinations.sub', 'Explore iconic national parks, mountain peaks, and marine reserves with typical costs')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => setSelectedDestination(dest)}
              className="bg-white rounded-2xl border border-[#E8DFC9] overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden">
                {dest.featuredImage ? (
                  <img 
                    src={dest.featuredImage} 
                    alt={dest.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : null}
                <div className={`absolute inset-0 bg-linear-to-t ${dest.heroGradient} opacity-85 group-hover:opacity-80 transition-opacity`} />
                <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between text-[11px] text-[#BED0C5]">
                    <span className="font-medium bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-white/15">
                      {dest.region}
                    </span>
                    <span className="text-[#E8B94A] font-semibold bg-black/40 px-2 py-0.5 rounded-md">Photo Guide</span>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold group-hover:text-[#E8B94A] transition-colors leading-snug">
                      {dest.name}
                    </h3>
                    <p className="text-xs text-[#E5EFE9] line-clamp-1 opacity-90 mt-0.5">
                      {dest.tagline}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#4D5E55]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#D97843]" />
                    <span className="text-[11px] truncate max-w-[170px]">{dest.bestTimeToVisit.split('(')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-[#284435]">
                    <Coins className="w-3.5 h-3.5 text-[#E8B94A]" />
                    <span className="text-[11px]">TZS Range</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F0EBE0] flex items-center justify-between">
                  <span className="text-[11px] text-[#6B7A72] font-medium">
                    {dest.highlights[0]}
                  </span>
                  <span className="text-xs font-bold text-[#284435] group-hover:text-[#D97843] flex items-center gap-1">
                    <span>Explore Guide</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Providers Section */}
      <section id="operators-directory" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#284435] flex items-center gap-2">
              <span>{t('verified.operators', 'Verified Local Operators')}</span>
              {viewMode === 'map' && (
                <span className="text-[10px] font-sans font-bold bg-[#D97843] text-white px-2 py-0.5 rounded-full uppercase">
                  Map View
                </span>
              )}
            </h2>
            <p className="text-sm text-[#6B7A72]">
              Showing {filteredProviders.length} licensed provider{filteredProviders.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' ? ` in ${categories.find(c => c.id === selectedCategory)?.label}` : ''}
              {viewMode === 'map' ? ' • Interactive spatial map of safari circuits, operators & AFCON 2027 host venues' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Switcher: Grid vs Interactive Map */}
            <div className="flex items-center bg-[#F3EFE6] p-1 rounded-xl border border-[#E8DFC9]">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#284435] shadow-2xs'
                    : 'text-[#6B7A72] hover:text-[#1F2A24]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Directory Grid</span>
              </button>

              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-[#284435] text-white shadow-2xs'
                    : 'text-[#6B7A72] hover:text-[#1F2A24]'
                }`}
              >
                <Map className="w-3.5 h-3.5 text-[#D97843]" />
                <span>Interactive Map</span>
                <span className="text-[10px] bg-[#D97843] text-white px-1.5 py-0.2 rounded-full font-bold">AFCON</span>
              </button>
            </div>

            {comparedProviderIds.length > 0 && (
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="text-xs font-bold text-[#284435] bg-[#FAF7F2] hover:bg-[#EAE2D2] px-3.5 py-1.5 rounded-xl border border-[#DED5C6] flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D97843]" />
                <span>Compare Selected ({comparedProviderIds.length}/3)</span>
              </button>
            )}
          </div>
        </div>

        {/* View Mode Condition: Map View vs Grid View */}
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <div className="bg-[#FAF0E9] p-4 rounded-2xl border border-[#EBD0BC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#284435]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D97843] shrink-0" />
                <span>
                  <strong>Interactive Tanzania Explorer:</strong> Click on any provider pin to view credentials and request direct quotes. Explore AFCON 2027 host stadiums with 35km transit buffers!
                </span>
              </div>
              <button
                onClick={() => setViewMode('grid')}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-[#E8DFC9] font-bold text-[#284435] hover:bg-[#FAF7F2] cursor-pointer flex items-center gap-1.5"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Switch to Grid View</span>
              </button>
            </div>

            <TanzaniaMap
              providers={filteredProviders}
              selectedCategory={selectedCategory}
              onSelectProvider={(p) => setSelectedProvider(p)}
              onRequestQuote={handleRequestQuote}
              nearAfconOnly={nearAfconOnly}
              onToggleNearAfcon={(near) => setNearAfconOnly(near)}
              className="h-[640px] w-full rounded-3xl shadow-lg border border-[#E8DFC9] overflow-hidden"
            />
          </div>
        ) : (
          <>
            {/* Interactive Map Teaser Banner in Grid View */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#284435] via-[#1E332A] to-[#17261F] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-[#2E4537]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#D97843]/20 border border-[#D97843]/40 flex items-center justify-center text-[#E8B94A] shrink-0">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                    <span>Tanzania Safari Circuit & AFCON 2027 Spatial Map</span>
                    <span className="text-[10px] font-sans font-bold bg-[#E8B94A] text-[#1E332A] px-1.5 py-0.2 rounded-full">Interactive</span>
                  </h4>
                  <p className="text-xs text-[#BED0C5] mt-0.5">
                    Explore operators plotted across Serengeti, Kilimanjaro, Zanzibar, and AFCON host stadiums with live route planning.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewMode('map')}
                className="shrink-0 px-4 py-2 bg-[#D97843] hover:bg-[#C26330] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>Launch Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

        {filteredProviders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8DFC9] p-12 text-center max-w-md mx-auto">
            <p className="text-3xl mb-3">🔍</p>
            <h3 className="font-serif text-lg font-bold text-[#284435] mb-1">No operators found</h3>
            <p className="text-sm text-[#6B7A72] mb-4">Try clearing your search query or picking another region.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedRegion('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-[#284435] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => {
              const providerListings = listings.filter((l) => l.providerId === provider.id && l.active);
              const minPrice = providerListings.length > 0 
                ? Math.min(...providerListings.map((l) => l.priceTZS)) 
                : 0;
              const isSaved = savedProviderIds.includes(provider.id);
              const isCompared = comparedProviderIds.includes(provider.id);

              return (
                <div
                  key={provider.id}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                    isCompared ? 'border-[#284435] ring-2 ring-[#284435]/20' : 'border-[#E8DFC9]'
                  }`}
                >
                  <div className="p-6">
                    {/* Header: Location, Wishlist & Compare Check */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-[#6B7A72]">
                        <MapPin className="w-3.5 h-3.5 text-[#D97843]" />
                        <span>{provider.location}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompareProvider(provider.id);
                          }}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                            isCompared
                              ? 'bg-[#284435] text-white border-[#284435]'
                              : 'bg-[#FAF7F2] text-[#6B7A72] border-[#E8DFC9] hover:bg-[#EDE5D5]'
                          }`}
                          title="Add to side-by-side comparison"
                        >
                          {isCompared ? '✓ Compared' : '+ Compare'}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveProvider(provider.id);
                          }}
                          className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F0EBE0] flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                          title={isSaved ? "Remove from saved" : "Save provider"}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Title & Verified badge */}
                    <div className="mb-2">
                      <h3 
                        onClick={() => setSelectedProvider(provider)}
                        className="font-serif text-xl font-bold text-[#284435] group-hover:text-[#D97843] transition-colors cursor-pointer leading-snug"
                      >
                        {provider.name}
                      </h3>
                      <p className="text-xs text-[#D97843] font-medium mt-0.5 line-clamp-1">
                        {provider.tagline}
                      </p>
                    </div>

                    {/* Verification & License */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {provider.verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>TALA Lic. {provider.talaLicense.split('/')[3] || 'Verified'}</span>
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{provider.rating.toFixed(1)}</span>
                        <span className="text-zinc-400 font-normal">({provider.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-[#4D5E55] line-clamp-3 leading-relaxed mb-4">
                      {provider.about}
                    </p>

                    {/* Operator Highlights / Equipment */}
                    {provider.fleetInfo && (
                      <div className="text-[11px] text-[#6B7A72] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EDE5D5] mb-4 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#284435] shrink-0" />
                        <span className="truncate">{provider.fleetInfo}</span>
                      </div>
                    )}

                    {/* Languages Spoken */}
                    <div className="flex items-center gap-1 text-[11px] text-[#6B7A72] mb-4">
                      <Languages className="w-3.5 h-3.5 text-[#8A9790]" />
                      <span className="truncate">{provider.languages.join(' • ')}</span>
                    </div>

                    {/* Package Previews */}
                    <div className="space-y-1.5 pt-3 border-t border-[#F0EBE0]">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A9790] block">
                        Popular Packages ({providerListings.length})
                      </span>
                      {providerListings.slice(0, 2).map((pkg) => (
                        <div 
                          key={pkg.id} 
                          onClick={() => setSelectedProvider(provider)}
                          className="text-xs text-[#284435] font-medium hover:text-[#D97843] flex items-center justify-between cursor-pointer py-0.5"
                        >
                          <span className="truncate max-w-[190px]">• {pkg.title}</span>
                          <span className="text-[11px] text-[#6B7A72] shrink-0 font-semibold">
                            {pkg.duration.split('/')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DFC9] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#8A9790] block">{t('starting.from', 'Starting from')}</span>
                      <div className="font-bold text-sm text-[#284435]">
                        {minPrice > 0 ? formatPrice(minPrice) : 'On Request'}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedProvider(provider)}
                      className="px-3.5 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <span>{t('view.quote', 'View & Quote')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </section>

      {/* Floating Compare Action Dock */}
      {comparedProviderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1C2C24] text-white px-5 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-4 h-4 text-[#E8B94A]" />
            <span>
              <strong>{comparedProviderIds.length}</strong> operator{comparedProviderIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="px-4 py-1.5 rounded-full bg-[#E8B94A] hover:bg-[#D4A335] text-[#1C2C24] text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            {t('compare.btn', 'Compare Side-by-Side')}
          </button>

          <button
            onClick={clearCompare}
            className="text-zinc-400 hover:text-white p-1"
            title="Clear comparison list"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
