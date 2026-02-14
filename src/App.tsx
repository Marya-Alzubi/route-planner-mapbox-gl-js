import { useEffect, useMemo, useReducer, useRef } from "react";
import MapCanvas from "./map/MapCanvas";
import { appReducer, initialState } from "./app/state/reducer";
import AppShell from "./components/layout/AppShell";
import Sidebar from "./components/layout/Sidebar";
import { fetchRouteWithFallback } from "./services/mapboxDirections";
import { debounce } from "./utils/debounce";

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Prevent race conditions (stale responses)
  const requestIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const simRef = useRef(state.simulation);
  const routeRef = useRef(state.route);

  useEffect(() => {
    simRef.current = state.simulation;
  }, [state.simulation]);

  useEffect(() => {
    routeRef.current = state.route;
  }, [state.route]);


  const debouncedRecompute = useMemo(() => {
    return debounce(async (stopsSnapshot: typeof state.stops) => {
      const reqId = ++requestIdRef.current;

      if (stopsSnapshot.length < 2) {
        dispatch({ type: "route/clear" });
        return;
      }

      dispatch({ type: "route/request" });

      try {
        const route = await fetchRouteWithFallback(stopsSnapshot);
        // Ignore stale responses
        if (reqId !== requestIdRef.current) return;
        dispatch({ type: "route/success", payload: route });
      } catch (e: any) {
        if (reqId !== requestIdRef.current) return;
        dispatch({ type: "route/error", payload: e?.message ?? "Failed to fetch route" });
      }
    }, 400);
  }, [dispatch]);

  useEffect(() => {
    debouncedRecompute(state.stops);
  }, [state.stops, debouncedRecompute]);

  useEffect(() => {
    const hasRouteCoords =
      !!state.route?.geometry?.coordinates && state.route.geometry.coordinates.length >= 2;

    if (!state.simulation.isPlaying || !hasRouteCoords) {
      // cleanup if paused / no route
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }

    const T_PER_SECOND_AT_1X = 0.12; // 0->1 

    const tick = (ts: number) => {
      const last = lastTsRef.current ?? ts;
      lastTsRef.current = ts;

      const dtSec = (ts - last) / 1000;
      const { t, speed, isPlaying } = simRef.current;

      // if paused during a frame
      if (!isPlaying) return;

      const nextT = t + dtSec * T_PER_SECOND_AT_1X * speed;

      if (nextT >= 1) {
        dispatch({ type: "sim/setT", payload: 1 });
        dispatch({ type: "sim/pause" });
        rafRef.current = null;
        lastTsRef.current = null;
        return;
      }

      dispatch({ type: "sim/setT", payload: nextT });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [state.simulation.isPlaying, state.route, dispatch]);


  return (
    <AppShell
      sidebar={
        <Sidebar
          stops={state.stops}
          dispatch={dispatch}
          route={state.route}
          routeStatus={state.routeStatus}
          routeError={state.routeError}
          simulation={state.simulation}
        />
}
      main={<MapCanvas stops={state.stops} dispatch={dispatch} route={state.route} simulation={state.simulation} />}
    />
  );
}
