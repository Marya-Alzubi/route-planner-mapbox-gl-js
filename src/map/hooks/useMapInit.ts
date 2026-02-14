import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { AppAction, Stop } from "../../app/state/types";
import { uid } from "../../utils/id";
import { snapToNearestRoad } from "../../services/snapToRoad";
import { ensureRouteLayers } from "../routeLayers";
import { OFFLINE, OFFLINE_RASTER_STYLE } from "../routeStyle";

export function useMapInit(params: {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<mapboxgl.Map | null>;
  stopsCountRef: React.RefObject<number>;
  dispatch: React.Dispatch<AppAction>;
  token?: string;
}) {
  const { mapContainerRef, mapRef, stopsCountRef, dispatch, token } = params;

  useEffect(() => {
    //Mapbox GL JS requires a token even if you use an OFFLINE raster style.
    const normalizedToken = token?.trim();

    if (!normalizedToken) {
      console.error(
        "Missing VITE_MAPBOX_ACCESS_TOKEN. Mapbox GL JS still requires a valid token even when VITE_OFFLINE_MODE=true."
      );
      return;
    }

    //Must be set BEFORE constructing the map
    mapboxgl.accessToken = normalizedToken;

    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: OFFLINE ? OFFLINE_RASTER_STYLE : "mapbox://styles/mapbox/streets-v12",
      center: [35.91, 31.95],
      zoom: 11,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    const onEnsure = () => ensureRouteLayers(map);
    map.on("load", onEnsure);
    map.on("idle", onEnsure);

    map.on("click", async (e) => {
      const count = stopsCountRef.current;
      if (count >= 25) return;

      const clicked = { lng: e.lngLat.lng, lat: e.lngLat.lat };

      try {
        const snapped = await snapToNearestRoad(clicked.lng, clicked.lat);

        const newStop: Stop = {
          id: uid("stop"),
          label: snapped.label ?? `Stop ${count + 1}`,
          lngLat: snapped.lngLat,
          source: "map",
        };

        dispatch({ type: "stop/add", payload: newStop });
      } catch {
        const newStop: Stop = {
          id: uid("stop"),
          label: `Stop ${count + 1}`,
          lngLat: [clicked.lng, clicked.lat],
          source: "map",
        };

        dispatch({ type: "stop/add", payload: newStop });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [dispatch, mapContainerRef, mapRef, stopsCountRef, token]);
}
