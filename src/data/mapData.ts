export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AfconVenue {
  id: string;
  name: string;
  city: string;
  region: string;
  capacity: number;
  coordinates: [number, number]; // [lat, lng]
  status: 'Existing Renovated' | 'New Build for 2027' | 'Modernized';
  notes: string;
  nearbyHubId: string;
}

export interface TravelHub {
  id: string;
  name: string;
  city: string;
  category: 'safari_gateway' | 'coastal_metro' | 'island_archipelago';
  coordinates: [number, number]; // [lat, lng]
  airports: string[];
  connections: string;
  description: string;
}

export interface ProviderLocation {
  providerId: number;
  coordinates: [number, number];
  city: string;
  nearestAfconVenueId?: string;
  distanceToAfconKm?: number;
}

// AFCON 2027 Venues in Tanzania (East Africa "Pamoja Bid" Host Nation)
export const AFCON_2027_VENUES: AfconVenue[] = [
  {
    id: 'mkapa-dar',
    name: 'Benjamin Mkapa National Stadium',
    city: 'Dar es Salaam',
    region: 'Temeke District, Dar es Salaam',
    capacity: 60000,
    status: 'Modernized',
    coordinates: [-6.8578, 39.2789],
    notes: 'Primary national arena hosting marquee AFCON 2027 fixtures, opening rounds, and knockout matches.',
    nearbyHubId: 'dar-es-salaam'
  },
  {
    id: 'samia-arusha',
    name: 'Samia Suluhu Hassan Stadium',
    city: 'Arusha',
    region: 'Olmotonyi, Arusha',
    capacity: 30000,
    status: 'New Build for 2027',
    coordinates: [-3.3731, 36.6508],
    notes: 'State-of-the-art northern stadium built specifically for AFCON 2027, positioned at the gateway to the Serengeti & Kilimanjaro.',
    nearbyHubId: 'arusha'
  },
  {
    id: 'amaan-zanzibar',
    name: 'Amaan Memorial Stadium',
    city: 'Stone Town',
    region: 'Amaan, Urban/West Region, Zanzibar',
    capacity: 15000,
    status: 'Existing Renovated',
    coordinates: [-6.1738, 39.2155],
    notes: 'Historic Zanzibar sports sanctuary with synthetic pitch, floodlights, and direct access to Stone Town historic hub.',
    nearbyHubId: 'zanzibar'
  },
  {
    id: 'chamazi-dar',
    name: 'Chamazi Complex (Azam Complex)',
    city: 'Dar es Salaam',
    region: 'Chamazi, Mbagala, Dar es Salaam',
    capacity: 10000,
    status: 'Existing Renovated',
    coordinates: [-6.9385, 39.2312],
    notes: 'Modern stadium and tournament training base for participating AFCON national teams.',
    nearbyHubId: 'dar-es-salaam'
  }
];

// Major Travel & Transport Hubs in Tanzania
export const TRAVEL_HUBS: TravelHub[] = [
  {
    id: 'arusha',
    name: 'Arusha Northern Safari Hub',
    city: 'Arusha',
    category: 'safari_gateway',
    coordinates: [-3.3869, 36.6830],
    airports: ['Kilimanjaro Intl (JRO)', 'Arusha Airport (ARK)'],
    connections: 'Direct safari road link to Serengeti, Ngorongoro Crater, Lake Manyara, and Tarangire.',
    description: 'The undisputed safari capital of East Africa and basecamp for all Northern Circuit 4x4 Land Cruiser expeditions.'
  },
  {
    id: 'dar-es-salaam',
    name: 'Dar es Salaam Coastal Hub',
    city: 'Dar es Salaam',
    category: 'coastal_metro',
    coordinates: [-6.8235, 39.2895],
    airports: ['Julius Nyerere Intl (DAR)'],
    connections: 'Azam Marine high-speed ferry to Zanzibar (1h 45m), SGR electric rail to Dodoma, coastal flights.',
    description: 'Commercial heart of Tanzania, Swahili cultural epicenter, and departure port for offshore island ferries.'
  },
  {
    id: 'zanzibar',
    name: 'Stone Town & Zanzibar Hub',
    city: 'Stone Town',
    category: 'island_archipelago',
    coordinates: [-6.1620, 39.1880],
    airports: ['Abeid Amani Karume Intl (ZNZ)'],
    connections: 'Daily ferries to Dar es Salaam & Pemba; island minibuses to Nungwi, Paje, and Matemwe.',
    description: 'UNESCO World Heritage waterfront hub, dhow sailing center, and spice route island capital.'
  },
  {
    id: 'moshi',
    name: 'Moshi Mountain Base Hub',
    city: 'Moshi',
    category: 'safari_gateway',
    coordinates: [-3.3500, 37.3333],
    airports: ['Kilimanjaro Intl (JRO) - 45 mins'],
    connections: 'Trailhead access gates: Machame, Marangu, Lemosho, and Rongai on Mount Kilimanjaro.',
    description: 'The mountain town beneath the snows of Kibo peak, center for high-altitude trekking guides and porters.'
  }
];

// Predefined provider locations matching initial seed data
export const PROVIDER_COORDINATES: Record<number, { coordinates: [number, number]; city: string; nearAfcon: boolean; nearestVenue: string }> = {
  1: {
    // Kilimanjaro Wild Safaris
    coordinates: [-3.3725, 36.6950],
    city: 'Arusha',
    nearAfcon: true,
    nearestVenue: 'Samia Suluhu Hassan Stadium (~4.8 km)'
  },
  2: {
    // Zanzibar Dhow Adventures
    coordinates: [-6.1610, 39.1890],
    city: 'Stone Town, Zanzibar',
    nearAfcon: true,
    nearestVenue: 'Amaan Memorial Stadium (~3.2 km)'
  },
  3: {
    // Kili Summit Guides
    coordinates: [-3.3500, 37.3333],
    city: 'Moshi',
    nearAfcon: false,
    nearestVenue: 'Samia Suluhu Hassan Stadium, Arusha (~78 km)'
  },
  4: {
    // Maasai Cultural Trails
    coordinates: [-3.1667, 35.5833],
    city: 'Ngorongoro Highlands',
    nearAfcon: false,
    nearestVenue: 'Samia Suluhu Hassan Stadium, Arusha (~145 km)'
  },
  5: {
    // Dar City Walks & Swahili Kitchen
    coordinates: [-6.8160, 39.2890],
    city: 'Dar es Salaam',
    nearAfcon: true,
    nearestVenue: 'Benjamin Mkapa National Stadium (~5.5 km)'
  },
  6: {
    // Mafia Deep Blue & Whale Shark Expeditions
    coordinates: [-7.9130, 39.6630],
    city: 'Mafia Island',
    nearAfcon: false,
    nearestVenue: 'Benjamin Mkapa Stadium, Dar (~130 km flight)'
  }
};

// Map Tile Providers for Swappable Architecture
export interface MapTileProvider {
  id: string;
  name: string;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom?: number;
}

export const MAP_PROVIDERS: MapTileProvider[] = [
  {
    id: 'carto_voyager',
    name: 'CartoDB Voyager',
    label: 'Safari Explorer (Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19
  },
  {
    id: 'osm_standard',
    name: 'OpenStreetMap',
    label: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  {
    id: 'carto_light',
    name: 'CartoDB Positron',
    label: 'Clean Minimalist (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19
  },
  {
    id: 'carto_dark',
    name: 'CartoDB Dark Matter',
    label: 'Night Safari (Dark)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19
  }
];
