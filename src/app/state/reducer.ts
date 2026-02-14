import type { AppAction, AppState } from "./types";

function arrayMove<T>(arr: T[], from: number, to: number) {
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export const initialState: AppState = {
  stops: [],
  route: null,
  routeStatus: "idle",
  routeError: null,
  simulation: { isPlaying: false, t: 0, speed: 1 },

};


export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "stop/add":
      return { ...state, stops: [...state.stops, action.payload] };

    case "stop/updateCoords":
      return {
        ...state,
        stops: state.stops.map((s) =>
          s.id === action.payload.id ? { ...s, lngLat: action.payload.lngLat } : s
        ),
      };
    case "stops/reorder": {
      const { activeId, overId } = action.payload;
      if (activeId === overId) return state;

      const from = state.stops.findIndex((s) => s.id === activeId);
      const to = state.stops.findIndex((s) => s.id === overId);
      if (from === -1 || to === -1) return state;

      return {
        ...state,
        stops: arrayMove(state.stops, from, to),
        simulation: { ...state.simulation, isPlaying: false, t: 0 },
      };


    }
    case "route/request":
      return { ...state, routeStatus: "loading", routeError: null };

    case "route/success":
    return {
        ...state,
        routeStatus: "idle",
        route: action.payload,
        routeError: null,
        simulation: { ...state.simulation, isPlaying: false, t: 0 }, // ✅ reset on new route
    };

    case "route/error":
      return { ...state, routeStatus: "error", routeError: action.payload };

    case "route/clear":
      return { ...state, route: null, routeStatus: "idle", routeError: null };

    case "stops/setAll":
    return {
        ...state,
        stops: action.payload,
        simulation: { ...state.simulation, isPlaying: false, t: 0 },
    };

    case "sim/play": {
    // If we were already at the end, restart from the beginning
        const t = state.simulation.t >= 1 ? 0 : state.simulation.t;
        return { ...state, simulation: { ...state.simulation, isPlaying: true, t } };
    }


    case "sim/pause":
      return { ...state, simulation: { ...state.simulation, isPlaying: false } };

    case "sim/reset":
      return { ...state, simulation: { ...state.simulation, isPlaying: false, t: 0 } };

    case "sim/setSpeed":
      return {
        ...state,
        simulation: { ...state.simulation, speed: Math.min(5, Math.max(0.25, action.payload)) },
      };

    case "sim/setT":
      return {
        ...state,
        simulation: { ...state.simulation, t: Math.min(1, Math.max(0, action.payload)) },
      };

    case "stop/remove": 
        const nextStops = state.stops.filter((s) => s.id !== action.payload.id);
        return {
            ...state,
            stops: nextStops,
            simulation: { ...state.simulation, isPlaying: false, t: 0 },
        };
  
    default:
      return state;
  }
}
