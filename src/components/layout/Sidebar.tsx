import { useMemo, useState } from "react";
import type { AppAction, Stop, RouteData } from "../../app/state/types";
import type { AppState } from "../../app/state/types";
import StopsList from "../stops/StopsList";
import StopSearch from "../stops/StopSearch";
import { uid } from "../../utils/id";
import type { GeocodeSuggestion } from "../../services/mapboxGeocoding";
import { estimateDistanceMeters, optimizeStops } from "../../utils/optimize/optimizeStops";
import { exportRouteJson } from "../../utils/exportRoute";

function formatKm(meters: number) {
  return (meters / 1000).toFixed(2);
}

function formatMin(seconds: number) {
  return Math.round(seconds / 60);
}

function computeNextStopIndex(args: {
  stopsLen: number;
  t: number;
  routeDistanceM?: number;
  legs?: Array<{ distance?: number }>;
}) {
  const { stopsLen, t, routeDistanceM, legs } = args;
  if (stopsLen < 2) return undefined;

  const clampedT = Math.max(0, Math.min(1, t));
  if (clampedT >= 1) return undefined;

  // Best: use legs (each leg corresponds to stop[i] -> stop[i+1])
  if (legs && legs.length === stopsLen - 1 && routeDistanceM && routeDistanceM > 0) {
    const targetDist = clampedT * routeDistanceM;

    let acc = 0;
    for (let i = 0; i < legs.length; i++) {
      const d = legs[i]?.distance ?? 0;
      if (acc + d >= targetDist) {
        return Math.min(stopsLen - 1, i + 1);
      }
      acc += d;
    }
    return stopsLen - 1;
  }

  // Fallback: proportional to number of legs
  const legsCount = stopsLen - 1;
  const currentLeg = Math.floor(clampedT * legsCount); // 0..legsCount-1
  return Math.min(stopsLen - 1, currentLeg + 1);
}

export default function Sidebar({
  stops,
  dispatch,
  route,
  routeStatus,
  routeError,
  simulation,
}: {
  stops: Stop[];
  dispatch: React.Dispatch<AppAction>;
  route: RouteData | null;
  routeStatus: "idle" | "loading" | "error";
  routeError: string | null;
  simulation: AppState["simulation"];
}) {
  const maxReached = stops.length >= 25;

  const [showOptimizedPreview, setShowOptimizedPreview] = useState(false);

  const optimizationPreview = useMemo(() => {
    if (stops.length < 3) return null;

    const original = estimateDistanceMeters(stops);
    const optimizedStops = optimizeStops(stops);
    const optimized = estimateDistanceMeters(optimizedStops);

    const improvementPct = original > 0 ? ((original - optimized) / original) * 100 : 0;

    return { optimizedStops, original, optimized, improvementPct };
  }, [stops]);

  function addFromSearch(s: GeocodeSuggestion) {
    const newStop: Stop = {
      id: uid("stop"),
      label: s.place_name,
      lngLat: [s.center[0], s.center[1]],
      source: "search",
    };

    dispatch({ type: "stop/add", payload: newStop });
  }

  const nextStopIndex = useMemo(() => {
    if (!route || stops.length < 2) return undefined;
    if (!simulation.isPlaying) return undefined;

    const legs = (route as any).legs as Array<{ distance?: number }> | undefined;

    return computeNextStopIndex({
      stopsLen: stops.length,
      t: simulation.t,
      routeDistanceM: route.distanceM,
      legs,
    });
  }, [route, stops.length, simulation.isPlaying, simulation.t]);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Route Planning Tool</h1>
        <p className="text-sm text-gray-600">
          Stops: <span className="font-medium">{stops.length}</span>/25
        </p>
      </div>

      {/* Route summary */}
      <div className="mb-4 rounded-lg border bg-white p-3">
        <div className="text-sm font-semibold text-gray-800">Route</div>

        {stops.length < 2 && (
          <div className="mt-1 text-xs text-gray-600">
            Add at least 2 stops to calculate the route.
          </div>
        )}

        {routeStatus === "loading" && (
          <div className="mt-2 text-sm text-gray-600">Calculating…</div>
        )}

        {routeStatus === "error" && (
          <div className="mt-2 text-sm text-red-600">{routeError ?? "Route error"}</div>
        )}

        {route && routeStatus !== "loading" && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-gray-50 p-2">
              <div className="text-xs text-gray-500">Distance</div>
              <div className="font-semibold">{formatKm(route.distanceM)} km</div>
            </div>
            <div className="rounded-md bg-gray-50 p-2">
              <div className="text-xs text-gray-500">ETA</div>
              <div className="font-semibold">{formatMin(route.durationS)} min</div>
            </div>
          </div>
        )}

        {/* Export */}
        <button
          type="button"
          disabled={!route || routeStatus === "loading"}
          onClick={() => exportRouteJson(stops, route)}
          className="mt-3 w-full rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          Export JSON
        </button>
        <p className="mt-1 text-xs text-gray-500">
          Downloads stops + route geometry as JSON.
        </p>
      </div>

      <div className="mb-4">
        <StopSearch onSelect={addFromSearch} disabled={maxReached} />
      </div>

      {/* Optimization */}
      <div className="mb-4 rounded-lg border bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">Optimization</div>

          <button
            type="button"
            disabled={!optimizationPreview}
            onClick={() => setShowOptimizedPreview((v) => !v)}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {showOptimizedPreview ? "Hide" : "Optimize"}
          </button>
        </div>

        {!optimizationPreview && (
          <div className="mt-2 text-xs text-gray-600">
            Add at least 3 stops to optimize.
          </div>
        )}

        {optimizationPreview && showOptimizedPreview && (
          <div className="mt-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-gray-50 p-2">
                <div className="text-xs text-gray-500">Estimated (original)</div>
                <div className="font-semibold">
                  {(optimizationPreview.original / 1000).toFixed(2)} km
                </div>
              </div>
              <div className="rounded-md bg-gray-50 p-2">
                <div className="text-xs text-gray-500">Estimated (optimized)</div>
                <div className="font-semibold">
                  {(optimizationPreview.optimized / 1000).toFixed(2)} km
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-600">
              Improvement:{" "}
              <span className="font-semibold">
                {optimizationPreview.improvementPct.toFixed(1)}%
              </span>{" "}
              (Haversine estimate)
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "stops/setAll", payload: optimizationPreview.optimizedStops });
                  setShowOptimizedPreview(false);
                }}
                className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Apply optimized order
              </button>

              <button
                type="button"
                onClick={() => setShowOptimizedPreview(false)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simulation */}
      <div className="mb-4 rounded-lg border bg-white p-3">
        <div className="text-sm font-semibold text-gray-800">Simulation</div>

        {!route && (
          <div className="mt-1 text-xs text-gray-600">
            Calculate a route first to enable simulation.
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={!route}
            onClick={() => dispatch({ type: simulation.isPlaying ? "sim/pause" : "sim/play" })}
            className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {simulation.isPlaying ? "Pause" : "Play"}
          </button>

          <button
            type="button"
            disabled={!route}
            onClick={() => dispatch({ type: "sim/reset" })}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Speed</span>
            <span className="font-semibold">{simulation.speed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={5}
            step={0.25}
            value={simulation.speed}
            disabled={!route}
            onChange={(e) => dispatch({ type: "sim/setSpeed", payload: Number(e.target.value) })}
            className="mt-2 w-full disabled:opacity-50"
          />
        </div>
      </div>

      <StopsList
        stops={stops}
        nextStopIndex={nextStopIndex}
        onRemove={(id) => dispatch({ type: "stop/remove", payload: { id } })}
        onReorder={(activeId, overId) =>
          dispatch({ type: "stops/reorder", payload: { activeId, overId } })
        }
      />
    </div>
  );
}
