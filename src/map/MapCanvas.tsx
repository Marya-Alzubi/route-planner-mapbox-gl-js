import { useEffect, useMemo, useRef } from "react";
import type { AppAction, Stop, RouteData } from "../app/state/types";

import { useMapInit } from "./hooks/useMapInit";
import { useStopMarkers } from "./hooks/useStopMarkers";
import { useRouteProgress } from "./hooks/useRouteProgress";
import { useVehicleMarker } from "./hooks/useVehicleMarker";

type Props = {
  stops: Stop[];
  dispatch: React.Dispatch<AppAction>;
  route: RouteData | null;
  simulation: { isPlaying: boolean; t: number; speed: number };
};

export default function MapCanvas({ stops, dispatch, route, simulation }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const stopsCountRef = useRef(0);
  useEffect(() => {
    stopsCountRef.current = stops.length;
  }, [stops.length]);

  const token = useMemo(
    () => import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined,
    []
  );

  useMapInit({ mapContainerRef, mapRef, stopsCountRef, dispatch, token });
  useStopMarkers({ mapRef, markersRef, stops, dispatch });
  useRouteProgress({ mapRef, route, simulation });
  useVehicleMarker({ mapRef, vehicleMarkerRef, route, simulation });

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
