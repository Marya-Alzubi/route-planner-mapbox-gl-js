import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { RouteData } from "../../app/state/types";
import { pointAtT } from "../../utils/geo/lineProgress";
import { bearingDegrees } from "../../utils/geo/bearing";
import vehicleSvgUrl from "../../assets/vehicle.svg";

export function useVehicleMarker(params: {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  vehicleMarkerRef: React.RefObject<mapboxgl.Marker | null>;
  route: RouteData | null;
  simulation: { isPlaying: boolean; t: number; speed: number };
}) {
  const { mapRef, vehicleMarkerRef, route, simulation } = params;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const coords = route?.geometry?.coordinates as [number, number][] | undefined;
    if (!coords || coords.length < 2) {
      vehicleMarkerRef.current?.remove();
      vehicleMarkerRef.current = null;
      return;
    }

    const p = pointAtT(coords, simulation.t);
    if (!p) return;

    const EPS = 0.01;
    const t2 = Math.min(1, simulation.t + EPS);
    const p2 = pointAtT(coords, t2) ?? p;
    const heading = bearingDegrees(p, p2);
    const OFFSET = -90;

    if (!vehicleMarkerRef.current) {
      const el = document.createElement("div");
      el.title = "Vehicle";
      el.style.zIndex = "9999";
      el.style.width = "50px";
      el.style.height = "50px";
      el.style.display = "grid";
      el.style.placeItems = "center";
      el.style.borderRadius = "9999px";
      el.style.boxShadow = "0 6px 16px rgba(0,0,0,0.25)";
      el.style.border = "1px solid rgba(0,0,0,0.12)";

      const img = document.createElement("img");
      img.src = vehicleSvgUrl;
      img.alt = "Vehicle";
      img.width = 50;
      img.height = 50;
      img.style.display = "block";
      img.dataset.vehicleImg = "true";
      img.style.transformOrigin = "50% 50%";
      img.style.willChange = "transform";
      el.appendChild(img);

      vehicleMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(p)
        .addTo(map);
    } else {
      vehicleMarkerRef.current.setLngLat(p);
    }

    const root = vehicleMarkerRef.current.getElement();
    const img = root.querySelector('img[data-vehicle-img="true"]') as HTMLImageElement | null;
    if (img) img.style.transform = `rotate(${heading + OFFSET}deg)`;
  }, [mapRef, route, simulation.t, vehicleMarkerRef]);
}
