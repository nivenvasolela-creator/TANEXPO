import { photoProps, PHOTO_SIZES } from '../../utils/images';
import React, { useState, Suspense, lazy } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryId, Provider } from '../../types';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  CheckCircle2, 
  Languages, 
  Calendar,
  Sparkles,
  Truck,
  Coins,
  SlidersHorizontal,
  X,
  Map,
  LayoutGrid
} from 'lucide-react';

const TanzaniaMap = lazy(() =>
  import('../map/TanzaniaMap').then((m) => ({ default: m.TanzaniaMap }))
);

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
    catalogLoaded,
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
    <div className="space-y-10 pb-10">
      {/* Hero Header with Adaptive Personalization */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1E332A] via-[#284435] to-[#15231C] text-white p-6 sm:p-12 shadow-md">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#D97843]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-[#E8B94A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Photo tiles fill the open side of the hero on wide screens */}
        <div className="hidden xl:grid absolute z-10 right-12 top-12 bottom-32 w-[330px] 2xl:w-[400px] grid-cols-2 grid-rows-2 gap-3">
          {destinations.filter((d) => d.featuredImage).slice(0, 3).map((dest, idx) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => setSelectedDestination(dest)}
              className={`group relative overflow-hidden rounded-2xl border border-white/15 shadow-lg cursor-pointer text-left bg-linear-to-br ${dest.heroGradient} ${idx === 0 ? 'row-span-2' : ''}`}
            >
              <img
                {...photoProps(dest.featuredImage!, PHOTO_SIZES.heroTile, [400, 800])}
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute left-3 right-3 bottom-3 font-serif text-sm font-bold text-white leading-tight">
                {dest.name}
              </span>
            </button>
          ))}
        </div>

        <div className="relative z-10 max-w-3xl xl:max-w-[60%]">
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
              'Connect directly with TALA-registered safari guides, Kilimanjaro expedition leaders, and Zanzibar dhow captains with zero foreign markups.'
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 min-h-[44px] px-3 py-2 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9] text-xs font-medium text-[#4D5E55]">
                <MapPin className="w-4 h-4 text-[#D97843] shrink-0" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  aria-label={t('all.regions', 'All Regions')}
                  className="w-full bg-transparent border-none focus:outline-hidden text-xs font-semibold cursor-pointer"
                >
                  <option value="all">{t('all.regions', 'All Regions')}</option>
                  {regions.filter(r => r !== 'all').map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedRegion('all');
                  setSearchQuery('');
                }}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#6B7A72] hover:text-[#1F2A24] bg-white border border-[#E8DFC9] rounded-xl hover:bg-[#F3EFE6] transition-colors cursor-pointer"
              >
                {t('common.reset', 'Reset')}
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
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#E8B94A] hover:bg-[#D4A335] text-[#1E332A] text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
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
            <span>Operators show as verified only after their TALA licence is checked</span>
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

        {!catalogLoaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="Loading destination guides">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#152019] rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] overflow-hidden shadow-xs"
              >
                <div className="h-44 bg-[#EDE5D5] dark:bg-[#1A2820]" />
                <div className="p-4 space-y-3">
                  <div className="h-3.5 w-2/3 rounded bg-[#F3EFE6] dark:bg-[#1A2820]" />
                  <div className="h-3 w-1/2 rounded bg-[#FAF7F2] dark:bg-[#101914]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                    {...photoProps(dest.featuredImage, PHOTO_SIZES.card)}
                    alt={dest.name} 
                    loading="lazy"
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
        )}
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

            <Suspense
              fallback={
                <div className="h-[460px] sm:h-[640px] w-full rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] bg-white dark:bg-[#152019] flex flex-col items-center justify-center gap-2 text-xs text-[#6B7A72] dark:text-[#8DA195]">
                  <Map className="w-7 h-7 text-[#D97843]" />
                  <span>Loading interactive Tanzania map...</span>
                </div>
              }
            >
              <TanzaniaMap
                providers={filteredProviders}
                selectedCategory={selectedCategory}
                onSelectProvider={(p) => setSelectedProvider(p)}
                onRequestQuote={handleRequestQuote}
                nearAfconOnly={nearAfconOnly}
                onToggleNearAfcon={(near) => setNearAfconOnly(near)}
                className="h-[480px] sm:h-[640px] w-full rounded-3xl shadow-lg border border-[#E8DFC9] overflow-hidden"
              />
            </Suspense>
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

        {!catalogLoaded ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading verified operators">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#152019] rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-28 rounded bg-[#F3EFE6] dark:bg-[#1A2820]" />
                  <div className="h-7 w-20 rounded-lg bg-[#FAF7F2] dark:bg-[#101914]" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-3/4 rounded bg-[#EDE5D5] dark:bg-[#1A2820]" />
                  <div className="h-3 w-1/2 rounded bg-[#F3EFE6] dark:bg-[#1A2820]" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full rounded bg-[#FAF7F2] dark:bg-[#101914]" />
                  <div className="h-3 w-5/6 rounded bg-[#FAF7F2] dark:bg-[#101914]" />
                </div>
                <div className="pt-4 border-t border-[#F0EBE0] dark:border-[#23352A] flex items-center justify-between">
                  <div className="h-4 w-24 rounded bg-[#EDE5D5] dark:bg-[#1A2820]" />
                  <div className="h-9 w-28 rounded-xl bg-[#F3EFE6] dark:bg-[#1A2820]" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white dark:bg-[#152019] rounded-2xl border border-[#E8DFC9] dark:border-[#23352A] p-12 text-center max-w-md mx-auto space-y-3">
            <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">No operators listed yet</h3>
            <p className="text-sm text-[#6B7A72] dark:text-[#8DA195]">
              Are you a licensed Tanzanian tour operator, mountain guide, or coastal host? Be the first to publish packages on TANEXPO.
            </p>
            <button
              type="button"
              onClick={() => startOnboarding('provider_type')}
              className="px-5 py-2.5 bg-[#D97843] hover:bg-[#C26532] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Join as an Operator
            </button>
          </div>
        ) : filteredProviders.length === 0 ? (
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompareProvider(provider.id);
                          }}
                          aria-label={isCompared ? `Remove ${provider.name} from comparison` : `Compare ${provider.name}`}
                          className={`min-h-[36px] text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isCompared
                              ? 'bg-[#284435] text-white border-[#284435]'
                              : 'bg-[#FAF7F2] text-[#6B7A72] border-[#E8DFC9] hover:bg-[#EDE5D5]'
                          }`}
                          title="Add to side-by-side comparison"
                        >
                          {isCompared ? '✓ Compared' : '+ Compare'}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveProvider(provider.id);
                          }}
                          aria-label={isSaved ? `Remove ${provider.name} from saved` : `Save ${provider.name}`}
                          className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#F0EBE0] flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
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
                        {provider.reviewsCount > 0 ? (
                          <>
                            <span>{provider.rating.toFixed(1)}</span>
                            <span className="text-zinc-400 font-normal">({provider.reviewsCount})</span>
                          </>
                        ) : (
                          <span>New</span>
                        )}
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
                      type="button"
                      onClick={() => setSelectedProvider(provider)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
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
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)] bg-[#1C2C24]/95 glass text-white px-4 sm:px-5 py-2.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-[#E8B94A]" />
            <span>
              <strong>{comparedProviderIds.length}</strong> selected
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCompareModalOpen(true)}
            className="min-h-[36px] px-3.5 sm:px-4 py-1.5 rounded-full bg-[#E8B94A] hover:bg-[#D4A335] text-[#1C2C24] text-xs font-bold transition-colors cursor-pointer shadow-sm shrink-0"
          >
            {t('compare.btn', 'Compare')}
          </button>

          <button
            type="button"
            onClick={clearCompare}
            aria-label="Clear comparison list"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-300 hover:text-white rounded-full cursor-pointer"
            title="Clear comparison list"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
