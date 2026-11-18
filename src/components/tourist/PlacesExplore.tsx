import React, { useMemo, useState } from 'react';
import { CalendarCheck, MapPin, Map as MapIcon, Users, Wallet, ArrowRight, LocateFixed, Loader2, Scale } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { CategoryId, DestinationPlace } from '../../types';
import { DESTINATION_COORDINATES, LatLng, distanceKm, formatDistance } from '../../data/placeCoordinates';
import { photoProps } from '../../utils/images';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** True if the guide's "best time to visit" text covers this month (0-11). Understands "Year-round" and "June to October" / "November - May" ranges. */
export function goodInMonth(bestTime: string, month: number): boolean {
  const text = bestTime.toLowerCase();
  if (/year[\s-]*round/.test(text)) return true;
  const re = new RegExp(`(${MONTHS.join('|')})\\s*(?:to|-|–|—|through|until)\\s*(?:late |early |mid[- ])?(${MONTHS.join('|')})`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const a = MONTHS.indexOf(m[1]);
    const b = MONTHS.indexOf(m[2]);
    if (a <= b ? month >= a && month <= b : month >= a || month <= b) return true;
  }
  return false;
}

export const PlacesExplore: React.FC = () => {
  const { destinations, categories, providers, setSelectedDestination, setTouristTab, setHomeCategory, setMapFocus } = useApp();
  const month = new Date().getMonth();
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [onlyNow, setOnlyNow] = useState(false);
  const [me, setMe] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const places = useMemo(() => {
    const list = destinations
      .filter((d) => category === 'all' || d.categoryId === category)
      .map((d) => {
        const coords = DESTINATION_COORDINATES[d.id];
        return {
          d,
          now: goodInMonth(d.bestTimeToVisit, month),
          km: me && coords ? distanceKm(me, coords) : null,
          operators: providers.filter((p) => p.category === d.categoryId).length
        };
      })
      .filter((x) => !onlyNow || x.now);
    // Good-to-visit-now first; with a location, nearest first.
    return list.sort((a, b) => (me ? (a.km ?? 1e9) - (b.km ?? 1e9) : Number(b.now) - Number(a.now)));
  }, [destinations, category, onlyNow, me, providers, month]);

  const nowCount = destinations.filter((d) => goodInMonth(d.bestTimeToVisit, month)).length;

  const locate = () => {
    setLocError('');
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setLocError('Location is not available on this connection.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocError(err.code === err.PERMISSION_DENIED ? 'Location is blocked for this site in your browser settings.' : 'Your location is not available right now.');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  };

  const findOperators = (d: DestinationPlace) => {
    setHomeCategory(d.categoryId);
    setTouristTab('explore');
  };
  const showOnMap = (d: DestinationPlace) => {
    setMapFocus(`destination:${d.id}`);
    setTouristTab('map');
  };

  return (
    <div className="space-y-6 pb-6">
      <header className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[#D97843]">Where to go</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#284435] dark:text-[#EDF3EF]">Places to visit in Tanzania</h1>
        <p className="text-sm text-[#6B7A72] dark:text-[#8DA195]">
          {nowCount} of {destinations.length} places are at their best in {MONTH_NAMES[month]}.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:none]">
          {[{ id: 'all' as const, label: 'All places' }, ...categories.map((c) => ({ id: c.id, label: c.label }))].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`shrink-0 min-h-[40px] px-4 rounded-full text-xs font-bold border cursor-pointer ${
                category === c.id
                  ? 'bg-[#284435] text-white border-[#284435]'
                  : 'bg-white dark:bg-[#152019] text-[#284435] dark:text-[#EDF3EF] border-[#E8DFC9] dark:border-[#23352A]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={onlyNow}
          onClick={() => setOnlyNow((v) => !v)}
          className={`min-h-[40px] px-4 rounded-full text-xs font-bold border cursor-pointer flex items-center gap-1.5 ${
            onlyNow
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-white dark:bg-[#152019] text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Best in {MONTH_NAMES[month]}
        </button>
        <button
          type="button"
          onClick={locate}
          className="min-h-[40px] px-4 rounded-full text-xs font-bold border cursor-pointer flex items-center gap-1.5 bg-white dark:bg-[#152019] text-[#2563EB] border-blue-200 dark:border-blue-900"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          {me ? 'Sorted by distance' : 'Nearest to me'}
        </button>
      </div>
      {locError && <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-300">{locError}</p>}

      {/* Place suggestions */}
      {places.length === 0 ? (
        <p className="p-6 rounded-2xl bg-white dark:bg-[#152019] border border-[#E8DFC9] dark:border-[#23352A] text-sm text-[#6B7A72] dark:text-[#8DA195]">
          No places match. Try another filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {places.map(({ d, now, km, operators }) => (
            <article
              key={d.id}
              className="group bg-white dark:bg-[#152019] rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] overflow-hidden shadow-xs hover:shadow-lg transition-shadow flex flex-col"
            >
              <button type="button" onClick={() => setSelectedDestination(d)} className="relative h-56 overflow-hidden bg-[#284435] text-left cursor-pointer">
                {d.featuredImage && (
                  <img
                    {...photoProps(d.featuredImage, '(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw')}
                    alt={d.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent" />
                <span className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                  {now && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-bold shadow-sm">
                      Great in {MONTH_NAMES[month]}
                    </span>
                  )}
                  {km !== null && (
                    <span className="px-2.5 py-1 rounded-full bg-white/90 text-[#1C2C24] text-[11px] font-bold shadow-sm">{formatDistance(km)} away</span>
                  )}
                </span>
                <span className="absolute left-4 right-4 bottom-4 text-white">
                  <span className="block text-[11px] font-semibold text-white/80 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {d.region}
                  </span>
                  <span className="block font-serif text-2xl font-bold leading-tight">{d.name}</span>
                </span>
              </button>

              <div className="p-5 flex-1 flex flex-col gap-3">
                <p className="text-sm text-[#4D5E55] dark:text-[#B5C5BC]">{d.tagline}</p>
                <dl className="grid gap-2 text-xs">
                  <div className="flex gap-2">
                    <dt className="sr-only">Best time</dt>
                    <CalendarCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <dd className="text-[#1F2A24] dark:text-[#EDF3EF] line-clamp-2">{d.bestTimeToVisit}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="sr-only">Typical cost</dt>
                    <Wallet className="w-4 h-4 text-[#D97843] shrink-0" />
                    <dd className="text-[#1F2A24] dark:text-[#EDF3EF]">{d.typicalCostRangeTZS}</dd>
                  </div>
                </dl>
                {d.highlights.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {d.highlights.slice(0, 3).map((h) => (
                      <li key={h} className="px-2 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#101914] text-[11px] text-[#4D5E55] dark:text-[#A7B9B0] line-clamp-1 max-w-full">
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => findOperators(d)}
                    className="col-span-2 min-h-[44px] rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    {operators > 0 ? `See ${operators} operator${operators === 1 ? '' : 's'}` : 'Find operators'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDestination(d)}
                    className="min-h-[44px] rounded-xl border border-[#E8DFC9] dark:border-[#23352A] text-[#284435] dark:text-[#EDF3EF] text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] cursor-pointer"
                  >
                    Guide <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showOnMap(d)}
                    className="min-h-[44px] rounded-xl border border-[#E8DFC9] dark:border-[#23352A] text-[#284435] dark:text-[#EDF3EF] text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] cursor-pointer"
                  >
                    <MapIcon className="w-4 h-4" /> Map
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* The rules that used to be their own tab */}
      <button
        type="button"
        onClick={() => setTouristTab('compliance')}
        className="w-full text-left p-5 rounded-3xl bg-white dark:bg-[#152019] border border-[#E8DFC9] dark:border-[#23352A] flex items-center gap-4 hover:border-[#284435] dark:hover:border-[#3A5644] cursor-pointer"
      >
        <span className="w-11 h-11 rounded-2xl bg-[#FAF7F2] dark:bg-[#101914] flex items-center justify-center shrink-0">
          <Scale className="w-5 h-5 text-[#284435] dark:text-[#EDF3EF]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-[#284435] dark:text-[#EDF3EF]">Before you travel</span>
          <span className="block text-xs text-[#6B7A72] dark:text-[#8DA195]">Paying in TZS, licensed operators, park rules and your data rights</span>
        </span>
        <ArrowRight className="w-5 h-5 text-[#6B7A72] shrink-0" />
      </button>
    </div>
  );
};
