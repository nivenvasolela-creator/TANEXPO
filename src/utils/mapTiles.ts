/**
 * Street-map tiles. With a Geoapify key (set GEOAPIFY_API_KEY on the server; it reaches the app
 * through /api/config, never the bundle) the maps use Geoapify's hosted tiles, whose free plan
 * allows commercial use with attribution. Without one they fall back to OpenStreetMap's tiles,
 * which are fine for demos but not meant for heavy production traffic.
 */
export interface StreetTiles {
  url: string;
  attribution: string;
  maxZoom: number;
}

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function streetTiles(geoapifyKey: string | null): StreetTiles {
  if (geoapifyKey) {
    const retina = typeof window !== 'undefined' && window.devicePixelRatio > 1.5 ? '@2x' : '';
    return {
      url: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}${retina}.png?apiKey=${encodeURIComponent(geoapifyKey)}`,
      attribution:
        'Powered by <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> ' +
        OSM_ATTRIBUTION,
      maxZoom: 20
    };
  }
  return { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: OSM_ATTRIBUTION, maxZoom: 19 };
}
