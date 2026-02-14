import type { Stop, RouteData } from "../app/state/types";

export function exportRouteJson(stops: Stop[], route: RouteData | null) {
  const payload = {
    exportedAt: new Date().toISOString(),
    stops: stops.map((s, idx) => ({
      order: idx + 1,
      id: s.id,
      label: s.label,
      lngLat: s.lngLat,
      source: s.source,
    })),
    route: route
      ? {
          distance: {
            meters: (route as any).distanceM ?? (route as any).distanceMeters ?? null,
          },
          duration: {
            seconds: (route as any).durationS ?? (route as any).durationSeconds ?? null,
          },
          geometry: route.geometry, // LineString (GeoJSON geometry)
        }
      : null,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `route-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
