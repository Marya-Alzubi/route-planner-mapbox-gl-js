import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { AppAction, Stop } from "../../app/state/types";

export function useStopMarkers(params: {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  markersRef: React.RefObject<Map<string, mapboxgl.Marker>>;
  stops: Stop[];
  dispatch: React.Dispatch<AppAction>;
}) {
  const { mapRef, markersRef, stops, dispatch } = params;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = markersRef.current;

    // remove deleted
    for (const [id, marker] of markers.entries()) {
      if (!stops.some((s) => s.id === id)) {
        marker.remove();
        markers.delete(id);
      }
    }

    // add/update
    for (const stop of stops) {
      const existing = markers.get(stop.id);

      if (!existing) {
        const el = document.createElement("div");
        el.className =
          "h-7 w-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shadow";
        el.textContent = String(stops.findIndex((s) => s.id === stop.id) + 1);

        const marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat(stop.lngLat)
          .addTo(map);

        marker.on("dragend", () => {
          const ll = marker.getLngLat();
          dispatch({
            type: "stop/updateCoords",
            payload: { id: stop.id, lngLat: [ll.lng, ll.lat] },
          });
        });

        markers.set(stop.id, marker);
      } else {
        existing.setLngLat(stop.lngLat);
        existing.getElement().textContent = String(stops.findIndex((s) => s.id === stop.id) + 1);
      }
    }
  }, [stops, dispatch, mapRef, markersRef]);
}
