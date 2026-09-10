import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Provider, CategoryId } from '../../types';
import {
  AFCON_2027_VENUES,
  TRAVEL_HUBS,
  PROVIDER_COORDINATES,
  MAP_PROVIDERS,
  MapTileProvider,
  AfconVenue,
  TravelHub
} from '../../data/mapData';
import {
  Compass,
  Layers,
  MapPin,
  Trophy,
  Plane,
  Eye,
  CheckCircle2,
  Filter,
  Maximize2,
  Navigation
} from 'lucide-react';

interface TanzaniaMapProps {
  providers: Provider[];
  selectedCategory?: CategoryId | 'all';
  onSelectProvider?: (provider: Provider) => void;
  onRequestQuote?: (provider: Provider) => void;
  nearAfconOnly?: boolean;
  onToggleNearAfcon?: (near: boolean) => void;
  className?: string;
}

export const TanzaniaMap: React.FC<TanzaniaMapProps> = ({
  providers,
  selectedCategory = 'all',
  onSelectProvider,
  onRequestQuote,
  nearAfconOnly = false,
  onToggleNearAfcon,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const afconCirclesLayerRef = useRef<L.LayerGroup | null>(null);

  const [currentProviderId, setCurrentProviderId] = useState<string>('carto_voyager');
  const [showHubs, setShowHubs] = useState<boolean>(true);
  const [showAfconVenues, setShowAfconVenues] = useState<boolean>(true);
  const [localNearAfcon, setLocalNearAfcon] = useState<boolean>(nearAfconOnly);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<string>('Ready');

  // Sync external nearAfcon prop
  useEffect(() => {
    setLocalNearAfcon(nearAfconOnly);
  }, [nearAfconOnly]);

  const toggleAfconFilter = (val: boolean) => {
    setLocalNearAfcon(val);
    if (onToggleNearAfcon) {
      onToggleNearAfcon(val);
    }
  };

  // Helper for category emoji
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'safari': return '🦁';
      case 'beach': return '🏝️';
      case 'mountain': return '🏔️';
      case 'culture': return '🛖';
      case 'city': return '🌆';
      case 'marine': return '🐬';
      default: return '📍';
    }
  };

  // Helper for category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safari': return '#284435';
      case 'beach': return '#0284C7';
      case 'mountain': return '#7C3AED';
      case 'culture': return '#D97843';
      case 'city': return '#0D9488';
      case 'marine': return '#0369A1';
      default: return '#374151';
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Tanzania: [-6.369, 34.888]
    const map = L.map(mapContainerRef.current, {
      center: [-6.1659, 36.5],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false
    });

    // Add zoom control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer
    const activeProvider = MAP_PROVIDERS.find(p => p.id === currentProviderId) || MAP_PROVIDERS[0];
    const tileLayer = L.tileLayer(activeProvider.url, {
      attribution: activeProvider.attribution,
      subdomains: activeProvider.subdomains || ['a', 'b', 'c'],
      maxZoom: activeProvider.maxZoom || 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    afconCirclesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Swappable Tile Provider Logic
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const provider = MAP_PROVIDERS.find(p => p.id === currentProviderId) || MAP_PROVIDERS[0];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || ['a', 'b', 'c'],
      maxZoom: provider.maxZoom || 19
    }).addTo(mapInstanceRef.current);

    // Ensure tile layer stays behind markers
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
    setMapStatus(`Layer: ${provider.label}`);
  }, [currentProviderId]);

  // 3. Render Markers & Layers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !afconCirclesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    afconCirclesLayerRef.current.clearLayers();

    // A. Render AFCON 2027 Venues
    if (showAfconVenues) {
      AFCON_2027_VENUES.forEach((venue: AfconVenue) => {
        // Venue Marker
        const iconHtml = `
          <div style="
            background: linear-gradient(135deg, #F59E0B, #D97843);
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(217, 120, 67, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: 18px;
            cursor: pointer;
            transition: transform 0.2s;
          " title="${venue.name} (AFCON 2027 Venue)">
            ⚽
          </div>
        `;

        const afconIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-afcon-pin',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -20]
        });

        const marker = L.marker(venue.coordinates, { icon: afconIcon });

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #FEF3C7; color: #92400E; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
                AFCON 2027 Host Venue
              </span>
              <span style="font-size: 10px; color: #6B7280;">${venue.status}</span>
            </div>
            <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 4px 0; color: #111827;">${venue.name}</h3>
            <p style="font-size: 11px; margin: 0 0 6px 0; color: #4B5563;">${venue.region}</p>
            <div style="font-size: 11px; margin-bottom: 6px; color: #1F2937; line-height: 1.4;">
              <strong>Capacity:</strong> ${venue.capacity.toLocaleString()} seats<br/>
              <em>${venue.notes}</em>
            </div>
            <div style="padding-top: 6px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #059669; font-weight: 600;">
              ✓ Licensed tour operators ready for matchday excursions
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(markersLayerRef.current!);

        // If localNearAfcon is active, draw a 35km buffer circle around stadiums
        if (localNearAfcon) {
          const circle = L.circle(venue.coordinates, {
            radius: 35000, // 35 km
            color: '#D97843',
            weight: 2,
            opacity: 0.7,
            fillColor: '#F59E0B',
            fillOpacity: 0.08,
            dashArray: '5, 8'
          });
          circle.addTo(afconCirclesLayerRef.current!);
        }
      });
    }

    // B. Render Travel Context Hubs
    if (showHubs) {
      TRAVEL_HUBS.forEach((hub: TravelHub) => {
        const hubHtml = `
          <div style="
            background: #1E293B;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: 2px solid #FFFFFF;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38BDF8;
            font-size: 14px;
            cursor: pointer;
          " title="${hub.name}">
            ✈️
          </div>
        `;

        const hubIcon = L.divIcon({
          html: hubHtml,
          className: 'custom-hub-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

        const marker = L.marker(hub.coordinates, { icon: hubIcon });
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 220px;">
            <span style="background: #E0F2FE; color: #0369A1; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              Travel & Logistics Hub
            </span>
            <h3 style="font-size: 13px; font-weight: 700; margin: 4px 0 2px 0; color: #0F172A;">${hub.name}</h3>
            <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0;">${hub.description}</p>
            <div style="font-size: 11px; background: #F8FAFC; padding: 6px; border-radius: 6px; border: 1px solid #E2E8F0; margin-bottom: 6px;">
              <strong>Airports:</strong> ${hub.airports.join(', ')}<br/>
              <strong>Transit:</strong> ${hub.connections}
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        marker.addTo(markersLayerRef.current!);
      });
    }

    // C. Render Tour Providers
    let filteredProviders = providers;

    // Filter by category
    if (selectedCategory !== 'all') {
      filteredProviders = filteredProviders.filter(p => p.category === selectedCategory);
    }

    // Filter by Near AFCON
    if (localNearAfcon) {
      filteredProviders = filteredProviders.filter(p => {
        const coordInfo = PROVIDER_COORDINATES[p.id];
        if (coordInfo && coordInfo.nearAfcon) return true;
        // Also check location string for host cities: Arusha, Dar es Salaam, Zanzibar
        const loc = (p.location + ' ' + p.region).toLowerCase();
        return loc.includes('arusha') || loc.includes('dar es salaam') || loc.includes('zanzibar') || loc.includes('stone town');
      });
    }

    filteredProviders.forEach(provider => {
      const coordInfo = PROVIDER_COORDINATES[provider.id] || {
        coordinates: [-6.369 + (Math.random() * 2 - 1), 34.888 + (Math.random() * 2 - 1)] as [number, number],
        city: provider.location,
        nearAfcon: false,
        nearestVenue: 'Regional Transfer'
      };

      const color = getCategoryColor(provider.category);
      const emoji = getCategoryEmoji(provider.category);

      const providerIconHtml = `
        <div style="
          background: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: 16px;
          cursor: pointer;
          position: relative;
        ">
          ${emoji}
          ${provider.verified ? `
            <span style="
              position: absolute;
              bottom: -2px;
              right: -2px;
              background: #10B981;
              color: white;
              width: 13px;
              height: 13px;
              border-radius: 50%;
              border: 1.5px solid white;
              font-size: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">✓</span>
          ` : ''}
        </div>
      `;

      const providerIcon = L.divIcon({
        html: providerIconHtml,
        className: 'custom-provider-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker(coordInfo.coordinates, { icon: providerIcon });

      const popupHtml = document.createElement('div');
      popupHtml.style.fontFamily = 'system-ui, sans-serif';
      popupHtml.style.minWidth = '240px';
      popupHtml.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="background: ${color}20; color: ${color}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
            ${emoji} ${provider.category}
          </span>
          <span style="font-size: 11px; font-weight: 700; color: #D97843;">
            ★ ${provider.rating} (${provider.reviewsCount})
          </span>
        </div>
        <h3 style="font-size: 14px; font-weight: 700; margin: 2px 0; color: #111827;">${provider.name}</h3>
        <p style="font-size: 11px; color: #4B5563; margin: 0 0 6px 0;">${provider.location} • ${provider.officeAddress || provider.region}</p>
        <div style="font-size: 11px; background: #F3F4F6; padding: 5px 8px; border-radius: 6px; margin-bottom: 8px; color: #1F2937;">
          <div style="font-size: 10px; color: #4B5563; margin-bottom: 2px;">TALA LICENSE</div>
          <div style="font-weight: 600; font-family: monospace; font-size: 10px;">${provider.talaLicense}</div>
          ${coordInfo.nearAfcon ? `
            <div style="margin-top: 4px; color: #B45309; font-size: 10px; font-weight: 600;">
              ⚽ Near AFCON: ${coordInfo.nearestVenue}
            </div>
          ` : ''}
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="view-provider-${provider.id}" style="
            flex: 1;
            padding: 6px 8px;
            background: #284435;
            color: #FFFFFF;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">View Details</button>
          <button id="quote-provider-${provider.id}" style="
            padding: 6px 10px;
            background: #D97843;
            color: #FFFFFF;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">Quote</button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const viewBtn = document.getElementById(`view-provider-${provider.id}`);
        const quoteBtn = document.getElementById(`quote-provider-${provider.id}`);
        if (viewBtn && onSelectProvider) {
          viewBtn.onclick = () => onSelectProvider(provider);
        }
        if (quoteBtn && onRequestQuote) {
          quoteBtn.onclick = () => onRequestQuote(provider);
        }
      });

      marker.addTo(markersLayerRef.current!);
    });

  }, [providers, selectedCategory, localNearAfcon, showAfconVenues, showHubs, onSelectProvider, onRequestQuote]);

  // Jump to specific region/venue
  const flyToVenue = (venue: AfconVenue) => {
    setSelectedVenue(venue.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(venue.coordinates, 12, { duration: 1.2 });
    }
  };

  const flyToHub = (hub: TravelHub) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(hub.coordinates, 11, { duration: 1.2 });
    }
  };

  const resetTanzaniaView = () => {
    setSelectedVenue(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-6.1659, 36.5], 6, { duration: 1 });
    }
  };

  return (
    <div className={`relative flex flex-col rounded-2xl overflow-hidden border border-[#D9CEBF] dark:border-[#284435] bg-white dark:bg-[#152019] shadow-lg ${className}`}>
      
      {/* Top Map Control Bar */}
      <div className="p-3 sm:p-4 bg-[#FAF7F2] dark:bg-[#121B15] border-b border-[#E7DFD3] dark:border-[#23352A] flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Hub Quick Selectors & Title */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#1C2C24] dark:text-white font-serif text-sm mr-1">
            <Compass className="w-4 h-4 text-[#284435] dark:text-emerald-400" />
            <span>Tanzania Map</span>
          </div>

          <button
            onClick={resetTanzaniaView}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F2C24] border border-[#D9CEBF] dark:border-[#284435] text-zinc-700 dark:text-zinc-200 hover:border-[#284435] cursor-pointer transition-colors"
          >
            🇹🇿 All Tanzania
          </button>

          {TRAVEL_HUBS.map(hub => (
            <button
              key={hub.id}
              onClick={() => flyToHub(hub)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F2C24] border border-[#D9CEBF] dark:border-[#284435] text-zinc-700 dark:text-zinc-200 hover:border-[#284435] cursor-pointer transition-colors"
            >
              📍 {hub.city}
            </button>
          ))}
        </div>

        {/* Right: Map Layer Switcher & AFCON Toggle */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* AFCON 2027 Filter Button */}
          <button
            onClick={() => toggleAfconFilter(!localNearAfcon)}
            className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              localNearAfcon
                ? 'bg-[#D97843] text-white shadow-sm border border-[#C26532]'
                : 'bg-white dark:bg-[#1F2C24] text-zinc-700 dark:text-zinc-200 border border-[#D9CEBF] dark:border-[#284435] hover:border-[#D97843]'
            }`}
            title="Filter to providers operating near AFCON 2027 venues"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Near AFCON 2027</span>
            {localNearAfcon && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* Map Layer Provider Dropdown (Swappable Map Architecture) */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1F2C24] px-2.5 py-1 rounded-xl border border-[#D9CEBF] dark:border-[#284435]">
            <Layers className="w-3.5 h-3.5 text-[#284435] dark:text-emerald-400" />
            <select
              value={currentProviderId}
              onChange={(e) => setCurrentProviderId(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:outline-hidden cursor-pointer"
            >
              {MAP_PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id} className="text-zinc-900 bg-white">
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AFCON 2027 Stadium Quick Jump Bar (when filter active or toggled) */}
      <div className="px-3 sm:px-4 py-2 bg-amber-50/80 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/30 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-semibold">
          <Trophy className="w-3.5 h-3.5 text-[#D97843]" />
          <span>AFCON 2027 Stadiums:</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {AFCON_2027_VENUES.map(v => (
            <button
              key={v.id}
              onClick={() => flyToVenue(v)}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                selectedVenue === v.id
                  ? 'bg-[#D97843] text-white font-bold'
                  : 'bg-white/80 dark:bg-[#1A251E] text-amber-950 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800'
              }`}
            >
              ⚽ {v.name.replace('Stadium', '').replace('Complex', '').trim()} ({v.city})
            </button>
          ))}
        </div>

        {localNearAfcon && (
          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
            Showing operators within ~35km buffer of host stadiums
          </span>
        )}
      </div>

      {/* Map Canvas Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[420px] sm:h-[500px] z-10"
        style={{ minHeight: '380px' }}
      />

      {/* Map Bottom Legend / TALA Regulatory Verification Strip */}
      <div className="p-2.5 sm:p-3 bg-[#FAF7F2] dark:bg-[#121B15] border-t border-[#E7DFD3] dark:border-[#23352A] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#52645A] dark:text-zinc-400">
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#284435]" />
            <span>🦁 Safari</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
            <span>🏝️ Beach</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            <span>🏔️ Mountain</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97843]" />
            <span>🛖 Culture</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
            <span>🌆 City</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0369A1]" />
            <span>🐬 Marine</span>
          </div>
          <div className="flex items-center gap-1 ml-2 font-medium text-amber-600 dark:text-amber-400">
            <span>⚽ AFCON 2027 Stadium</span>
          </div>
          <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
            <span>✈️ Logistics Hub</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>All map pins link to licensed TALA tour operators</span>
        </div>
      </div>
    </div>
  );
};
