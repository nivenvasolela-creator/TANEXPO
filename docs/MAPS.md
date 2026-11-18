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
