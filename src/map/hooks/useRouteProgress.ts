import { useEffect } from "react";
import type { RouteData } from "../../app/state/types";
import { splitLineAtT } from "../routeSplit";
import { ROUTE_DONE_SOURCE_ID, ROUTE_TODO_SOURCE_ID } from "../routeStyle";

export function useRouteProgress(params: {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  route: RouteData | null;
  simulation: { isPlaying: boolean; t: number; speed: number };
}) {
  const { mapRef, route, simulation } = params;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let raf: number | null = null;

    const sync = () => {
      const doneSrc = map.getSource(ROUTE_DONE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      const todoSrc = map.getSource(ROUTE_TODO_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

      if (!doneSrc || !todoSrc) {
        raf = requestAnimationFrame(sync);
        return;
      }

      const coords = (route?.geometry?.coordinates ?? []) as [number, number][];
      if (coords.length < 2) {
        doneSrc.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
        todoSrc.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
        return;
      }

      const t = Math.min(1, Math.max(0, simulation.t));
      const playing = simulation.isPlaying;

      // finished -> full solid
      if (t >= 1) {
        doneSrc.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
        todoSrc.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
        return;
      }

      // before play -> full dashed
      if (!playing) {
        doneSrc.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } });
        todoSrc.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
        return;
      }

      // playing -> split by distance
      const { done, remain } = splitLineAtT(coords, t);

      doneSrc.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: done } });
      todoSrc.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: remain } });
    };

    sync();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mapRef, route, simulation.isPlaying, simulation.t]);
}
