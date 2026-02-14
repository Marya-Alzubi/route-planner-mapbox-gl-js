export const ROUTE_DONE_SOURCE_ID = "route-done-source";
export const ROUTE_TODO_SOURCE_ID = "route-todo-source";

export const ROUTE_DONE_LAYER_ID = "route-done-layer";
export const ROUTE_TODO_LAYER_ID = "route-todo-layer";

export const ROUTE_TODO_ARROWS_LAYER_ID = "route-todo-arrows-layer";
export const ROUTE_ARROW_ICON_ID = "route-arrow-icon";

export const OFFLINE = import.meta.env.VITE_OFFLINE_MODE === "true";

export const OFFLINE_RASTER_STYLE: mapboxgl.Style = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm-tiles-layer", type: "raster", source: "osm-tiles" }],
};
