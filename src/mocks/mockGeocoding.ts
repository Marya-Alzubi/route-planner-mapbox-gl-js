import type { GeocodeSuggestion } from "../services/mapboxGeocoding";

const MOCK_PLACES: GeocodeSuggestion[] = [
  {
    id: "mock-1",
    place_name: "Amman, Jordan",
    center: [35.9106, 31.9539],
  },
  {
    id: "mock-2",
    place_name: "Queen Alia International Airport (AMM)",
    center: [35.9932, 31.7226],
  },
  {
    id: "mock-3",
    place_name: "Jerash, Jordan",
    center: [35.8993, 32.2747],
  },
  {
    id: "mock-4",
    place_name: "Madaba, Jordan",
    center: [35.7935, 31.7197],
  },
  {
    id: "mock-5",
    place_name: "Dead Sea, Jordan",
    center: [35.5000, 31.5000],
  },
];

export function mockGeocodeAutocomplete(query: string): GeocodeSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];

  return MOCK_PLACES.filter((p) => p.place_name.toLowerCase().includes(q)).slice(0, 5);
}
