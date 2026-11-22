# Maps

The tourist **Map** tab (`src/components/tourist/TouristMapView.tsx`) uses Leaflet, which was already in the app, with free tile servers. No API key, no account, no billing.

| Style | Tiles | Terms to respect |
| :--- | :--- | :--- |
| Map | OpenStreetMap (`tile.openstreetmap.org`) | Free for light use with attribution. The [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) forbids heavy or bulk use. The server sends a domain-only referer, as the policy asks. |
| Satellite | Esri World Imagery (`server.arcgisonline.com`) | Attribution shown. Esri's terms limit unregistered commercial use: check them, or register a free ArcGIS developer account, before launch at scale. |
| Terrain | OpenTopoMap (`{a,b,c}.tile.opentopomap.org`) | Free, CC-BY-SA, attribution shown. Volunteer-run and can be slow. |

When traffic grows past a demo, switch the `BASEMAPS` URLs in `TouristMapView.tsx` to a provider with a free tier and an API key (for example MapTiler or Stadia Maps) so usage is covered by an agreement. It is a one-line change per style.

## What the map shows

- **Destinations**: photo pins at the coordinates in `src/data/placeCoordinates.ts` (`DESTINATION_COORDINATES`).
- **Operators**: coloured pins. Saved coordinates come from `PROVIDER_COORDINATES` in `src/data/mapData.ts`; otherwise the operator's town (location or region text) is looked up in `placeCoordinates.ts`. An operator whose town is unknown is not pinned rather than pinned in a wrong place. Add towns to `TOWN_COORDINATES` as operators join.
- **Directions**: opens Google Maps directions to the place (the Maps app on phones). No key needed.

## Location ("Near me")

- Asked for only when the visitor taps **Near me**, and only works on `https` (or `localhost`).
- The position is used in the browser to draw the blue dot and sort the list by distance. It is never sent to the TANEXPO server.
- Distances are straight-line, not road distance.

## Production tiles: Geoapify (optional)

OpenStreetMap's public tile server is fine for demos but its usage policy rules out heavy
production traffic. For launch, set `GEOAPIFY_API_KEY` on the server:

1. Sign up at https://myprojects.geoapify.com (no credit card) and create a project.
2. Copy its API key. Under the key's settings, restrict it to your site's domain (for example
   `tanexpo.onrender.com`). Map keys are public by design: every tile URL the browser loads shows it.
3. Set `GEOAPIFY_API_KEY` in Render (the service's Environment tab), then redeploy.

Both maps then use Geoapify's "OSM Bright" street map (sharper tiles on high-density phone
screens) with the required "Powered by Geoapify" credit. Satellite and Terrain stay as they are.
The free plan is 3,000 credits a day; check Geoapify's pricing page for how map tiles count against credits.

Why not MapLibre GL (vector maps) yet: it needs WebGL and adds roughly 800 KB of JavaScript, which
is slow on the cheap Android phones most users have. Leaflet with raster tiles stays fast. Revisit
when custom map styling matters more than load time. Address search (Nominatim, about 1 request a
second, no autocomplete) and routing (OSRM or GraphHopper) are separate services; "Directions"
currently opens Google Maps, which already handles routing on the phone.
