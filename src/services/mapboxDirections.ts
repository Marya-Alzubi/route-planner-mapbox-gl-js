import type { Stop, RouteData } from "../app/state/types";
import { buildMockRoute } from "../mocks/mockRoute";

const OFFLINE = import.meta.env.VITE_OFFLINE_MODE === "true";

/**
 * Real Mapbox Directions call (throws on failure)
 */
export async function fetchRoute(stops: Stop[]): Promise<RouteData> {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;
  if (!token) throw new Error("Missing VITE_MAPBOX_ACCESS_TOKEN");

  if (stops.length < 2) throw new Error("Need at least 2 stops");

  const coords = stops.map((s) => `${s.lngLat[0]},${s.lngLat[1]}`).join(";");

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?geometries=geojson&overview=full&steps=false&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions failed: ${res.status}`);

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route?.geometry) throw new Error("No route returned");

  return {
    geometry: route.geometry,
    distanceM: Number(route.distance ?? 0),
    durationS: Number(route.duration ?? 0),
  };
}

/**
 * Safe wrapper: uses mock route in offline mode or when Mapbox fails.
 * This satisfies the "Mock data fallback for offline development" deliverable.
 */
export async function fetchRouteWithFallback(stops: Stop[]): Promise<RouteData> {
  if (stops.length < 2) {
    return {
      geometry: { type: "LineString", coordinates: [] },
      distanceM: 0,
      durationS: 0,
    };
  }

  if (OFFLINE) return buildMockRoute(stops);

  try {
    return await fetchRoute(stops);
  } catch (err) {
    console.warn("[directions] falling back to mock route:", err);
    return buildMockRoute(stops);
  }
}
