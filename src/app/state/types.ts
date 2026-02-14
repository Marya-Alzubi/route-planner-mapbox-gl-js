export type LngLat = [number, number];

export type StopSource = "map" | "search";

export type Stop = {
  id: string;
  label: string;
  lngLat: LngLat;
  source: StopSource;
};

export type AppState = {
  stops: Stop[];
  route: RouteData | null;
  routeStatus: "idle" | "loading" | "error";
  routeError: string | null;
  simulation: {
    isPlaying: boolean;
    t: number; // 0..1
    speed: number; // multiplier
  };

};


export type AppAction =
  | { type: "stop/add"; payload: Stop }
  | { type: "stop/updateCoords"; payload: { id: string; lngLat: LngLat } }
  | { type: "stops/reorder"; payload: { activeId: string; overId: string } }
  | { type: "route/request" }
  | { type: "route/success"; payload: RouteData }
  | { type: "route/error"; payload: string }
  | { type: "route/clear" }
  | { type: "stops/setAll"; payload: Stop[] }
  | { type: "sim/play" }
  | { type: "sim/pause" }
  | { type: "sim/reset" }
  | { type: "sim/setSpeed"; payload: number }
  | { type: "sim/setT"; payload: number }
  | { type: "stop/remove"; payload: { id: string } }





export type RouteData = {
  geometry: GeoJSON.LineString;
  distanceM: number;
  durationS: number;
};


