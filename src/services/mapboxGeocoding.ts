import { mockGeocodeAutocomplete } from "../mocks/mockGeocoding";

export type GeocodeSuggestion = {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
};

const OFFLINE = import.meta.env.VITE_OFFLINE_MODE === "true";

export async function fetchGeocodeSuggestions(query: string, limit = 5): Promise<GeocodeSuggestion[]> {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;
  if (!token) throw new Error("Missing VITE_MAPBOX_ACCESS_TOKEN");

  const qRaw = query.trim();
  if (qRaw.length < 3) return [];

  const q = encodeURIComponent(qRaw);
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json` +
    `?autocomplete=true&limit=${limit}&language=en&types=place,address,poi&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const data = await res.json();

  const features: GeocodeSuggestion[] = (data.features ?? [])
    .map((f: any) => ({
      id: String(f.id ?? f.place_name ?? Math.random()),
      place_name: String(f.place_name ?? "Unknown place"),
      center: Array.isArray(f.center)
        ? ([Number(f.center[0]), Number(f.center[1])] as [number, number])
        : ([0, 0] as [number, number]),
    }))
    .filter((s: GeocodeSuggestion) => Number.isFinite(s.center[0]) && Number.isFinite(s.center[1]));

  return features.slice(0, limit);
}

/**
 * Offline-safe wrapper:
 * - Uses mock suggestions when VITE_OFFLINE_MODE=true
 * - Falls back to mock suggestions if Mapbox fails / token missing
 */
export async function fetchGeocodeSuggestionsWithFallback(
  query: string,
  limit = 5
): Promise<GeocodeSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  if (OFFLINE) return mockGeocodeAutocomplete(q).slice(0, limit);

  try {
    return await fetchGeocodeSuggestions(q, limit);
  } catch (err) {
    console.warn("[geocoding] falling back to mock suggestions:", err);
    return mockGeocodeAutocomplete(q).slice(0, limit);
  }
}
