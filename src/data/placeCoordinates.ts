import type { Provider } from '../types';
import { PROVIDER_COORDINATES } from './mapData';

export type LatLng = [number, number];

/** Map position of each destination guide (park HQ, summit or main town). */
export const DESTINATION_COORDINATES: Record<string, LatLng> = {
  serengeti: [-2.4536, 34.8236], // Seronera, central Serengeti
  ngorongoro: [-3.1611, 35.5878], // Ngorongoro Crater
  kilimanjaro: [-3.0674, 37.3556], // Uhuru Peak
  zanzibar: [-6.1659, 39.2026], // Stone Town
  eyasi: [-3.5893, 35.0521], // Lake Eyasi
  mafia: [-7.9167, 39.6667] // Kilindoni, Mafia Island
};

/** Towns operators commonly list as their base. Matched against an operator's location and region. */
const TOWN_COORDINATES: Array<[RegExp, LatLng]> = [
  [/stone town|zanzibar|unguja|nungwi|paje|kendwa/i, [-6.1659, 39.2026]],
  [/mafia|kilindoni/i, [-7.9167, 39.6667]],
  [/dar es salaam|dar\b|kariakoo|mbezi|kinondoni/i, [-6.8161, 39.2803]],
  [/karatu|ngorongoro/i, [-3.3417, 35.6731]],
  [/mto wa mbu|manyara/i, [-3.3667, 35.85]],
  [/moshi|marangu|machame|kilimanjaro/i, [-3.3349, 37.3404]],
  [/arusha|usa river|tengeru/i, [-3.3869, 36.683]],
  [/mwanza/i, [-2.5164, 32.9175]],
  [/dodoma/i, [-6.163, 35.7516]],
  [/iringa|ruaha/i, [-7.7703, 35.6932]],
  [/mbeya/i, [-8.9094, 33.4608]],
  [/tanga|pangani/i, [-5.0689, 39.0988]],
  [/bagamoyo/i, [-6.4422, 38.9049]],
  [/morogoro|mikumi/i, [-6.8278, 37.6591]],
  [/kigoma|gombe|mahale/i, [-4.8769, 29.6267]],
  [/mtwara/i, [-10.2667, 40.1833]],
  [/lindi|kilwa/i, [-8.9554, 39.5167]],
  [/pemba/i, [-5.2333, 39.7667]],
  [/serengeti|seronera/i, [-2.4536, 34.8236]]
];

/**
 * Where to pin an operator: their saved coordinates if we have them, otherwise their town.
 * A small offset (stable per operator) keeps operators in the same town from stacking on one spot.
 * Returns null when the town is unknown, so the operator is listed but not pinned in a wrong place.
 */
export function providerCoordinates(provider: Provider): LatLng | null {
  const known = PROVIDER_COORDINATES[provider.id];
  if (known) return known.coordinates;
  const text = `${provider.location || ''} ${provider.region || ''}`;
  const town = TOWN_COORDINATES.find(([pattern]) => pattern.test(text));
  if (!town) return null;
  const angle = (provider.id * 137.5 * Math.PI) / 180;
  const radius = 0.012 + (provider.id % 5) * 0.004;
  return [town[1][0] + Math.sin(angle) * radius, town[1][1] + Math.cos(angle) * radius];
}

/** Straight-line distance in kilometres (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('en-US')} km`;
}

/** Opens turn-by-turn directions in Google Maps (the app on phones), no API key needed. */
export function directionsUrl([lat, lng]: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(5)},${lng.toFixed(5)}`;
}
