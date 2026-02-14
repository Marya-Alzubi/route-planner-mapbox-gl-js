import type { Stop, RouteData } from "../app/state/types";

// Simple polyline: connect stops directly (not road-accurate, but good fallback)
export function buildMockRoute(stops: Stop[]): RouteData {
  const coords = stops.map((s) => s.lngLat) as [number, number][];

  // Rough Haversine distance sum (meters) + ETA assumption
  const distanceM = estimateDistanceMeters(coords);
  const avgSpeedMps = 13.9; // ~50 km/h
  const durationS = distanceM / avgSpeedMps;

  return {
    distanceM,
    durationS,
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
  };
}

// Minimal haversine over coordinate array
function estimateDistanceMeters(coords: [number, number][]) {
  if (coords.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1], coords[i]);
  }
  return total;
}

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const [lng1, lat1] = a;
  const [lng2, lat2] = b;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const sLat1 = toRad(lat1);
  const sLat2 = toRad(lat2);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}
