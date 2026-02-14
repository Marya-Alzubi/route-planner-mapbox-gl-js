import {
  ROUTE_ARROW_ICON_ID,
  ROUTE_DONE_LAYER_ID,
  ROUTE_DONE_SOURCE_ID,
  ROUTE_TODO_ARROWS_LAYER_ID,
  ROUTE_TODO_LAYER_ID,
  ROUTE_TODO_SOURCE_ID,
} from "./routeStyle";

export function ensureArrowIcon(map: mapboxgl.Map) {
  if (map.hasImage(ROUTE_ARROW_ICON_ID)) return Promise.resolve();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 2 L22 12 L12 22 L12 15 L2 15 L2 9 L12 9 Z" fill="#111827"/>
    </svg>
  `.trim();

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        if (!map.hasImage(ROUTE_ARROW_ICON_ID)) map.addImage(ROUTE_ARROW_ICON_ID, img);
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Failed to decode arrow SVG"));
    img.src = dataUrl;
  });
}

export async function ensureRouteLayers(map: mapboxgl.Map) {
  if (!map.isStyleLoaded()) return;

  // sources
  if (!map.getSource(ROUTE_DONE_SOURCE_ID)) {
    map.addSource(ROUTE_DONE_SOURCE_ID, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
    });
  }

  if (!map.getSource(ROUTE_TODO_SOURCE_ID)) {
    map.addSource(ROUTE_TODO_SOURCE_ID, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
    });
  }

  // dashed (under)
  if (!map.getLayer(ROUTE_TODO_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_TODO_LAYER_ID,
      type: "line",
      source: ROUTE_TODO_SOURCE_ID,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-width": 5,
        "line-opacity": 0.55,
        "line-dasharray": [1.2, 1.2],
        "line-color": "#111827",
      },
    });
  }

  // solid (top)
  if (!map.getLayer(ROUTE_DONE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_DONE_LAYER_ID,
      type: "line",
      source: ROUTE_DONE_SOURCE_ID,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-width": 6,
        "line-opacity": 0.95,
        "line-color": "#111827",
      },
    });
  }

  // arrows on TODO only
  await ensureArrowIcon(map);

  if (!map.getLayer(ROUTE_TODO_ARROWS_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_TODO_ARROWS_LAYER_ID,
      type: "symbol",
      source: ROUTE_TODO_SOURCE_ID,
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 90,
        "icon-image": ROUTE_ARROW_ICON_ID,
        "icon-size": 0.6,
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: { "icon-opacity": 0.9 },
    });
  }
}
