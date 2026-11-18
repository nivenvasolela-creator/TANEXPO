import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Navigation, Layers, X, MapPin, ShieldCheck, Star, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { CategoryId, DestinationPlace, Provider } from '../../types';
import {
  DESTINATION_COORDINATES,
  LatLng,
  directionsUrl,
  distanceKm,
  formatDistance,
  providerCoordinates
} from '../../data/placeCoordinates';
import { photoProps } from '../../utils/images';

/*
 * Tourist map. Free tiles, no API key:
 *   Map       OpenStreetMap (OSM Foundation tile servers, attribution required)
 *   Satellite Esri World Imagery (attribution required)
 *   Terrain   OpenTopoMap (CC-BY-SA)
 * "Near me" uses the browser's location only after the visitor taps it. The position stays in
 * this browser: it is never sent to the TANEXPO server.
 */

const BASEMAPS = {
  map: {
    label: 'Map',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 16
  }
} as const;
type BasemapId = keyof typeof BASEMAPS;

const TANZANIA_CENTER: LatLng = [-6.2, 35.3];
const TANZANIA_BOUNDS = L.latLngBounds([-12.2, 28.8], [-0.6, 41.0]);

type Item =
  | { kind: 'destination'; id: string; name: string; sub: string; coords: LatLng; photo?: string; categoryId: CategoryId; dest: DestinationPlace }
  | { kind: 'operator'; id: string; name: string; sub: string; coords: LatLng; categoryId: CategoryId; provider: Provider };

type LocState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ok'; coords: LatLng; accuracy: number }
  | { status: 'error'; message: string };

const CATEGORY_COLORS: Record<string, string> = {
  safari: '#B7791F',
  beach: '#0E7490',
  mountain: '#4B5563',
  culture: '#B45309',
  city: '#6D28D9',
  marine: '#1D4ED8'
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function destinationIcon(item: Extract<Item, { kind: 'destination' }>, selected: boolean): L.DivIcon {
  const size = selected ? 58 : 46;
  const img = item.photo
    ? `<img src="${item.photo}-640.webp" alt="" style="width:100%;height:100%;object-fit:cover;display:block" />`
    : '';
  return L.divIcon({
    className: 'tx-pin',
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="width:${size}px;height:${size}px;border-radius:9999px;overflow:hidden;border:3px solid ${selected ? '#E8B94A' : '#fff'};box-shadow:0 4px 14px rgba(0,0,0,.35);background:#284435">${img}</div>
      <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${selected ? '#E8B94A' : '#fff'};margin-top:-2px"></div>
    </div>`
  });
}

function operatorIcon(item: Extract<Item, { kind: 'operator' }>, selected: boolean): L.DivIcon {
  const color = CATEGORY_COLORS[item.categoryId] || '#284435';
  const size = selected ? 34 : 28;
  const initial = escapeHtml(item.name.trim().charAt(0).toUpperCase() || '?');
  return L.divIcon({
    className: 'tx-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};color:#fff;font:700 ${selected ? 15 : 13}px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;border:2.5px solid ${selected ? '#E8B94A' : '#fff'};box-shadow:0 3px 10px rgba(0,0,0,.35)">${initial}</div>`
  });
}

export const TouristMapView: React.FC = () => {
  const { destinations, providers, categories, setSelectedDestination, setSelectedProvider, catalogLoaded, mapFocus, setMapFocus } = useApp();

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.LayerGroup | null>(null);
  const watchRef = useRef<number | null>(null);
  const flewToMe = useRef(false);
  const fittedToPins = useRef(false);

  const [basemap, setBasemap] = useState<BasemapId>('map');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [show, setShow] = useState<'all' | 'destination' | 'operator'>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loc, setLoc] = useState<LocState>({ status: 'idle' });
  const [listOpen, setListOpen] = useState(false);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const d of destinations) {
      const coords = DESTINATION_COORDINATES[d.id];
      if (!coords) continue;
      out.push({ kind: 'destination', id: d.id, name: d.name, sub: d.region, coords, photo: d.featuredImage, categoryId: d.categoryId, dest: d });
    }
    for (const p of providers) {
      const coords = providerCoordinates(p);
      if (!coords) continue;
      out.push({ kind: 'operator', id: String(p.id), name: p.name, sub: p.location, coords, categoryId: p.category, provider: p });
    }
    return out;
  }, [destinations, providers]);

  const visible = useMemo(
    () =>
      items.filter(
        (i) => (category === 'all' || i.categoryId === category) && (show === 'all' || i.kind === show)
      ),
    [items, category, show]
  );

  const myCoords = loc.status === 'ok' ? loc.coords : null;
  const sorted = useMemo(() => {
    const withDist = visible.map((i) => ({ item: i, km: myCoords ? distanceKm(myCoords, i.coords) : null }));
    if (myCoords) withDist.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
    return withDist;
  }, [visible, myCoords]);

  const keyOf = (i: Item) => `${i.kind}:${i.id}`;
  const selected = useMemo(() => items.find((i) => keyOf(i) === selectedKey) || null, [items, selectedKey]);

  // Create the map once.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, {
      center: TANZANIA_CENTER,
      zoom: 6,
      minZoom: 5,
      maxBounds: TANZANIA_BOUNDS.pad(0.6),
      zoomControl: false,
      worldCopyJump: false
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.attributionControl.setPrefix(false);
    markersRef.current = L.layerGroup().addTo(map);
    meRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // The container can change size after first paint (tab switch, rotation).
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapEl.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const b = BASEMAPS[basemap];
    tileRef.current = L.tileLayer(b.url, {
      attribution: b.attribution,
      maxZoom: b.maxZoom,
      subdomains: 'abc'
    }).addTo(map);
    tileRef.current.bringToBack();
  }, [basemap]);

  // First time pins are available, zoom to them (northern circuit + coast) instead of the whole region.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || fittedToPins.current || !catalogLoaded || items.length < 2) return;
    // Wait until the map has its real on-screen size, or the fit uses a zero-size box.
    const raf = requestAnimationFrame(() => {
      fittedToPins.current = true;
      map.invalidateSize();
      // Opened from Explore's "Map" button: start on that place, selected.
      const focusItem = mapFocus ? items.find((i) => `${i.kind}:${i.id}` === mapFocus) : null;
      if (focusItem) {
        setMapFocus(null);
        setSelectedKey(`${focusItem.kind}:${focusItem.id}`);
        map.setView(focusItem.coords, 9, { animate: false });
        return;
      }
      map.fitBounds(L.latLngBounds(items.map((i) => i.coords)), { paddingTopLeft: [20, 105], paddingBottomRight: [20, 40], maxZoom: 8, animate: false });
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, catalogLoaded]);

  // Markers
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;
    group.clearLayers();
    // Operators first so destination photo pins sit on top.
    const ordered = [...visible].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'operator' ? -1 : 1));
    for (const item of ordered) {
      const isSel = keyOf(item) === selectedKey;
      const icon = item.kind === 'destination' ? destinationIcon(item, isSel) : operatorIcon(item, isSel);
      const marker = L.marker(item.coords, {
        icon,
        title: item.name,
        alt: item.name,
        keyboard: true,
        riseOnHover: true,
        zIndexOffset: isSel ? 1000 : item.kind === 'destination' ? 100 : 0
      });
      marker.on('click', () => setSelectedKey(keyOf(item)));
      group.addLayer(marker);
    }
  }, [visible, selectedKey]);

  const focus = useCallback((item: Item) => {
    setSelectedKey(keyOf(item));
    setListOpen(false);
    mapRef.current?.flyTo(item.coords, Math.max(mapRef.current.getZoom(), item.kind === 'destination' ? 9 : 12), { duration: 0.9 });
  }, []);

  // Live position: one fix to start, then follow movement while the map is open.
  const stopWatching = () => {
    if (watchRef.current !== null && 'geolocation' in navigator) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  };
  useEffect(() => stopWatching, []);

  const drawMe = (coords: LatLng, accuracy: number) => {
    const g = meRef.current;
    if (!g) return;
    g.clearLayers();
    L.circle(coords, { radius: Math.min(accuracy, 5000), color: '#2563EB', weight: 1, fillColor: '#3B82F6', fillOpacity: 0.15, interactive: false }).addTo(g);
    L.circleMarker(coords, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 })
      .bindTooltip('You are here', { direction: 'top' })
      .addTo(g);
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLoc({ status: 'error', message: 'This browser cannot share its location.' });
      return;
    }
    if (!window.isSecureContext) {
      setLoc({ status: 'error', message: 'Location only works on a secure (https) link.' });
      return;
    }
    stopWatching();
    flewToMe.current = false;
    setLoc({ status: 'locating' });
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: LatLng = [pos.coords.latitude, pos.coords.longitude];
        setLoc({ status: 'ok', coords, accuracy: pos.coords.accuracy });
        drawMe(coords, pos.coords.accuracy);
        if (!flewToMe.current && mapRef.current) {
          flewToMe.current = true;
          mapRef.current.flyTo(coords, Math.max(mapRef.current.getZoom(), 9), { duration: 1 });
          setListOpen(true);
        }
      },
      (err) => {
        stopWatching();
        setLoc({
          status: 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Location is blocked. Allow it for this site in your browser settings, then try again.'
              : err.code === err.TIMEOUT
              ? 'Finding your location took too long. Move to open sky or try again.'
              : 'Your location is not available right now.'
        });
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );
  };

  const selectedDistance = selected && myCoords ? distanceKm(myCoords, selected.coords) : null;

  // `isolate` keeps the map and its controls (z 400-600) from drawing over dialogs (z-50).
  return (
    <section aria-label="Map of Tanzania" className="relative isolate -mx-3 sm:mx-0">
      <div className="relative h-[calc(100dvh-150px)] md:h-[calc(100dvh-210px)] min-h-[440px] sm:rounded-3xl overflow-hidden border-y sm:border border-[#E8DFC9] dark:border-[#23352A] bg-[#DCE6DF]">
        <div ref={mapEl} className="absolute inset-0 z-0" />

        {/* Top controls */}
        <div className="absolute top-3 inset-x-3 z-[500] flex flex-col gap-2 pointer-events-none">
          <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto [scrollbar-width:none]">
            {[{ id: 'all' as const, label: 'All' }, ...categories.map((c) => ({ id: c.id, label: c.label }))].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 min-h-[40px] px-3.5 rounded-full text-xs font-bold shadow-md cursor-pointer border ${
                  category === c.id
                    ? 'bg-[#284435] text-white border-[#284435]'
                    : 'glass text-[#1F2A24] dark:text-[#EDF3EF] border-white/60 dark:border-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="glass flex rounded-full p-1 shadow-md border border-white/60 dark:border-white/10" role="group" aria-label="What to show">
              {([
                ['all', 'Everything'],
                ['destination', 'Places'],
                ['operator', 'Operators']
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={show === id}
                  onClick={() => setShow(id)}
                  className={`min-h-[36px] px-3 rounded-full text-xs font-bold cursor-pointer ${
                    show === id ? 'bg-white dark:bg-[#284435] text-[#284435] dark:text-white shadow-sm' : 'text-[#284435] dark:text-[#EDF3EF]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right-side buttons */}
        <div className="absolute right-3 top-[112px] z-[500] flex flex-col gap-2">
          <button
            type="button"
            onClick={locate}
            aria-label="Show my location"
            title="Near me"
            className="glass min-h-[44px] min-w-[44px] px-3 rounded-full shadow-md border border-white/60 dark:border-white/10 flex items-center justify-center gap-1.5 text-xs font-bold text-[#284435] dark:text-[#EDF3EF] cursor-pointer"
          >
            {loc.status === 'locating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className={`w-4 h-4 ${loc.status === 'ok' ? 'text-[#2563EB]' : ''}`} />}
            <span>Near me</span>
          </button>
          <div className="glass rounded-2xl shadow-md border border-white/60 dark:border-white/10 overflow-hidden flex flex-col" role="group" aria-label="Map style">
            <span className="sr-only">Map style</span>
            {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={basemap === id}
                onClick={() => setBasemap(id)}
                className={`min-h-[40px] px-3 text-[11px] font-bold cursor-pointer flex items-center gap-1 ${
                  basemap === id ? 'bg-[#284435] text-white' : 'text-[#284435] dark:text-[#EDF3EF]'
                }`}
              >
                {id === 'map' && <Layers className="w-3.5 h-3.5" />}
                {BASEMAPS[id].label}
              </button>
            ))}
          </div>
        </div>

        {loc.status === 'error' && (
          <div role="alert" className="absolute left-3 right-16 top-[112px] z-[500] glass rounded-2xl p-3 text-xs font-semibold text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 shadow-md">
            {loc.message}
          </div>
        )}

        {!catalogLoaded && (
          <div className="absolute inset-x-0 top-[112px] z-[400] flex justify-center pointer-events-none">
            <span className="glass rounded-full px-3 py-1.5 text-xs font-semibold text-[#284435] dark:text-[#EDF3EF] shadow-md">Loading operators…</span>
          </div>
        )}

        {/* Selected place card */}
        {selected && (
          <div className="absolute inset-x-3 bottom-3 z-[600] sm:left-auto sm:w-[380px] bg-white dark:bg-[#152019] rounded-3xl shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] overflow-hidden">
            {selected.kind === 'destination' && selected.photo && (
              <div className="relative h-32 bg-[#284435]">
                <img {...photoProps(selected.photo, '380px')} alt={selected.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#D97843]">
                    {selected.kind === 'destination' ? 'Destination' : 'Tour operator'}
                    {selectedDistance !== null && <span className="text-[#2563EB]"> · {formatDistance(selectedDistance)} away</span>}
                  </p>
                  <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF] leading-tight">{selected.name}</h3>
                  <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {selected.sub}
                  </p>
                  {selected.kind === 'operator' && (
                    <p className="text-xs mt-1 flex items-center gap-2 text-[#4D5E55] dark:text-[#A7B9B0]">
                      {selected.provider.verified && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {selected.provider.reviewsCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {selected.provider.rating.toFixed(1)} ({selected.provider.reviewsCount})
                        </span>
                      ) : (
                        <span>New on TANEXPO</span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedKey(null)}
                  aria-label="Close"
                  className="min-h-[40px] min-w-[40px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-[#6B7A72] hover:bg-[#F3EEE4] dark:hover:bg-[#1A2820] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    selected.kind === 'destination' ? setSelectedDestination(selected.dest) : setSelectedProvider(selected.provider)
                  }
                  className="flex-1 min-h-[44px] rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-sm font-bold cursor-pointer"
                >
                  {selected.kind === 'destination' ? 'Open guide' : 'View & request quote'}
                </button>
                <a
                  href={directionsUrl(selected.coords)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 rounded-xl border border-[#E8DFC9] dark:border-[#23352A] text-[#284435] dark:text-[#EDF3EF] text-sm font-bold flex items-center gap-1.5 hover:bg-[#F3EEE4] dark:hover:bg-[#1A2820]"
                >
                  <Navigation className="w-4 h-4" />
                  Directions
                </a>
              </div>
            </div>
          </div>
        )}

        {/* List toggle */}
        {!selected && (
          <button
            type="button"
            onClick={() => setListOpen((v) => !v)}
            aria-expanded={listOpen}
            className="absolute left-3 bottom-3 z-[500] min-h-[44px] px-4 rounded-full bg-[#284435] text-white text-sm font-bold shadow-lg cursor-pointer"
          >
            {listOpen ? 'Hide list' : myCoords ? `Nearest to you (${visible.length})` : `List (${visible.length})`}
          </button>
        )}

        {listOpen && !selected && (
          <div className="absolute inset-x-3 bottom-16 z-[550] sm:right-auto sm:w-[380px] max-h-[55%] overflow-y-auto bg-white dark:bg-[#152019] rounded-3xl shadow-2xl border border-[#E8DFC9] dark:border-[#23352A]">
            <ul className="divide-y divide-[#F0EBE0] dark:divide-[#23352A]">
              {sorted.length === 0 && (
                <li className="p-4 text-sm text-[#6B7A72] dark:text-[#8DA195]">Nothing here for this filter yet.</li>
              )}
              {sorted.map(({ item, km }) => (
                <li key={keyOf(item)}>
                  <button
                    type="button"
                    onClick={() => focus(item)}
                    className="w-full min-h-[56px] px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] cursor-pointer"
                  >
                    {item.kind === 'destination' && item.photo ? (
                      <img {...photoProps(item.photo, '48px', [640])} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-[#284435]" loading="lazy" />
                    ) : (
                      <span
                        className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white font-bold"
                        style={{ background: CATEGORY_COLORS[item.categoryId] || '#284435' }}
                      >
                        {item.name.charAt(0)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[#1F2A24] dark:text-[#EDF3EF] truncate">{item.name}</span>
                      <span className="block text-xs text-[#6B7A72] dark:text-[#8DA195] truncate">
                        {item.kind === 'destination' ? 'Destination' : 'Operator'} · {item.sub}
                      </span>
                    </span>
                    {km !== null && <span className="text-xs font-bold text-[#2563EB] shrink-0">{formatDistance(km)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="mt-2 px-3 sm:px-0 text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
        "Near me" uses your location only on this device; it is never sent to TANEXPO. Distances are straight-line, not road distance.
      </p>
    </section>
  );
};
